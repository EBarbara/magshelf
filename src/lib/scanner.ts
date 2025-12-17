import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';
import { db, magazines, issues } from '@/db';
import { eq, and } from 'drizzle-orm';
import { parseComicInfo } from './comicinfo';

const EXTENSIONS = {
    ARCHIVE: ['.zip', '.cbz'],
    IMAGE: ['.jpg', '.jpeg', '.png', '.webp', '.gif']
};

export async function scanLibrary(libraryRoot: string) {
    if (!fs.existsSync(libraryRoot)) {
        console.error(`Library root not found: ${libraryRoot}`);
        return;
    }

    const entries = fs.readdirSync(libraryRoot, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(libraryRoot, entry.name);

        if (entry.isDirectory()) {
            // Recursive scan
            // We treat the current directory as a potential "Magazine" context for its children
            await processMagazineFolder(fullPath, entry.name);
        } else if (entry.isFile()) {
            const ext = path.extname(entry.name).toLowerCase();
            if (EXTENSIONS.ARCHIVE.includes(ext)) {
                // Standalone Archive Issue (e.g. "Playboy #01.cbz" in root)
                await processArchiveAsIssueRoot(fullPath, entry.name);
            }
        }
    }
}

function parseFilename(fileName: string): { series: string; issueNumber?: string; volume?: number } {
    // Regex strategies
    // 1. "Name #Number"
    // 2. "Name - vVol - Issue"
    // 3. "Name Issue"
    const nameWithoutExt = path.basename(fileName, path.extname(fileName));

    // Pattern: Series Name #01...
    const hashMatch = nameWithoutExt.match(/^(.+?)\s*#(\d+)(.*)$/);
    if (hashMatch) {
        return {
            series: hashMatch[1].trim(),
            issueNumber: hashMatch[2],
            volume: 1
        };
    }

    // Pattern: Series Name 01 (simple number at end)
    const endNumMatch = nameWithoutExt.match(/^(.+?)\s+(\d+)$/);
    if (endNumMatch) {
        return {
            series: endNumMatch[1].trim(),
            issueNumber: endNumMatch[2],
            volume: 1
        };
    }

    // Default: Whole filename is series, issue 0 or 1
    return { series: nameWithoutExt, issueNumber: '1', volume: 1 };
}

async function processArchiveAsIssueRoot(filePath: string, fileName: string) {
    const { series, issueNumber, volume } = parseFilename(fileName);

    // Check for ComicInfo.xml inside the archive to get Series name if possible
    let finalSeriesName = series;
    try {
        const zip = new AdmZip(filePath);
        const entries = zip.getEntries();
        const comicInfoEntry = entries.find(e => e.entryName === 'ComicInfo.xml');
        if (comicInfoEntry) {
            const xmlContent = comicInfoEntry.getData().toString('utf8');
            const comicInfo = parseComicInfo(xmlContent);
            if (comicInfo && comicInfo.Series) {
                finalSeriesName = comicInfo.Series;
            }
        }
    } catch (e) {
        // Ignore failure here, fallback to filename series
    }

    // path = /data/SeriesName (using the final series name might be tricky if we want to group by folder, 
    // but usually magazine grouping is by FOLDER path. 
    // If we change the series name based on XML, we might have multiple series in same folder? 
    // For now, let's keep the folder path as the unique key, but update the display title/series if it's new.
    // actually, if we want to group by Series from XML, we might need to change how we look up the magazine.
    // The current schema uses `path` as unique. 
    // If we have "Playboy #1.cbz" (Folder: /data), series="Playboy".
    // If we have XML series="Playboy Magazine", we might want to use that.
    // But `magazines` are tied to a folder path usually in this scanner logic.
    // PROPOSAL: We stick to folder-based grouping for "Magazine/Series" record to avoid chaos. 
    // `processArchiveAsIssueRoot` uses `path.dirname(filePath)` + `series` (filename derived) as the "Path".
    // This implies we are creating "Virtual" magazines for root files?
    // Let's stick to simple rename for now, but update the text if it's a new insert.

    const seriesPath = path.join(path.dirname(filePath), finalSeriesName); // This technically changes the "path" ID if series name changes.

    // Check or create Magazine in DB
    let magazineId: number;
    // We check by PATH. If XML changes series name, we get a different path, so different magazine entry.
    // This is acceptable behavior: "X-Men" files go to one "shelf", "Uncanny X-Men" files go to another.
    const existingMag = await db.select().from(magazines).where(eq(magazines.path, seriesPath)).get();

    if (existingMag) {
        magazineId = existingMag.id;
    } else {
        const result = await db.insert(magazines).values({
            series: finalSeriesName,
            path: seriesPath
        }).returning();
        magazineId = result[0].id;
        console.log(`Created Magazine Series: ${finalSeriesName}`);
    }

    // Process the file as an issue for this magazine
    // Check if exists
    const existing = await db.select().from(issues).where(eq(issues.filePath, filePath)).get();
    if (existing) return;

    let title = fileName;
    let finalIssueNumber = issueNumber;
    let finalVolume = volume;
    let finalPageCount = 0;

    // Check for ComicInfo.xml inside the archive
    try {
        const zip = new AdmZip(filePath);
        const entries = zip.getEntries();
        finalPageCount = entries.filter(e => !e.isDirectory && EXTENSIONS.IMAGE.includes(path.extname(e.name).toLowerCase())).length;

        const comicInfoEntry = entries.find(e => e.entryName === 'ComicInfo.xml');
        if (comicInfoEntry) {
            const xmlContent = comicInfoEntry.getData().toString('utf8');
            const comicInfo = parseComicInfo(xmlContent);
            if (comicInfo) {
                if (comicInfo.Title) title = comicInfo.Title;
                if (comicInfo.Number) finalIssueNumber = comicInfo.Number;
                if (comicInfo.Volume) finalVolume = comicInfo.Volume;
            }
        }
    } catch (e) {
        console.error(`Failed to read archive ${filePath}`, e);
    }

    await db.insert(issues).values({
        magazineId,
        fileName,
        filePath,
        title: title,
        issueNumber: finalIssueNumber,
        volume: finalVolume,
        pageCount: finalPageCount
    });
    console.log(`Added archive issue to ${series}: ${fileName}`);
}

async function processMagazineFolder(folderPath: string, magazineName: string) {
    // Check or create Magazine in DB
    let magazineId: number;
    const existingMag = await db.select().from(magazines).where(eq(magazines.path, folderPath)).get();

    if (existingMag) {
        magazineId = existingMag.id;
    } else {
        const result = await db.insert(magazines).values({
            series: magazineName,
            path: folderPath
        }).returning();
        magazineId = result[0].id;
    }

    const items = fs.readdirSync(folderPath, { withFileTypes: true });

    for (const item of items) {
        const itemPath = path.join(folderPath, item.name);
        const ext = path.extname(item.name).toLowerCase();

        if (item.isFile() && EXTENSIONS.ARCHIVE.includes(ext)) {
            // It's a CBZ/ZIP Issue
            await processArchiveIssue(magazineId, itemPath, item.name);
        } else if (item.isDirectory()) {
            // Could be a folder issue or a sub-magazine?
            // Let's assume nested folders are sub-series or just ignored for now to keep it simple.
            // OR: If it contains images, treat as Folder Issue.
            if (isImageFolder(itemPath)) {
                await processFolderIssue(magazineId, itemPath, item.name);
            }
        }
    }
}

function isImageFolder(folderPath: string): boolean {
    const files = fs.readdirSync(folderPath);
    const imageCount = files.filter(f => EXTENSIONS.IMAGE.includes(path.extname(f).toLowerCase())).length;
    return imageCount > 0; // Simple heuristic
}

async function processArchiveIssue(magazineId: number, filePath: string, fileName: string) {
    // Check if exists
    const existing = await db.select().from(issues).where(eq(issues.filePath, filePath)).get();
    if (existing) return;

    let title = fileName;
    let issueNumber: string | undefined = undefined;
    let volume: number | undefined = undefined;
    let pageCount = 0;

    try {
        const zip = new AdmZip(filePath);
        const entries = zip.getEntries();
        pageCount = entries.filter(e => !e.isDirectory && EXTENSIONS.IMAGE.includes(path.extname(e.name).toLowerCase())).length;

        const comicInfoEntry = entries.find(e => e.entryName === 'ComicInfo.xml');
        if (comicInfoEntry) {
            const xmlContent = comicInfoEntry.getData().toString('utf8');
            const comicInfo = parseComicInfo(xmlContent);
            if (comicInfo) {
                if (comicInfo.Title) title = comicInfo.Title;
                if (comicInfo.Number) issueNumber = comicInfo.Number;
                if (comicInfo.Volume) volume = comicInfo.Volume;
            }
        }
    } catch (e) {
        console.error(`Failed to read archive ${filePath}`, e);
    }

    await db.insert(issues).values({
        magazineId,
        fileName,
        filePath,
        title,
        issueNumber,
        volume,
        pageCount
    });
    console.log(`Added archive: ${fileName}`);
}

async function processFolderIssue(magazineId: number, folderPath: string, folderName: string) {
    // Check if exists
    const existing = await db.select().from(issues).where(eq(issues.filePath, folderPath)).get();
    if (existing) return;

    let title = folderName;
    let issueNumber: string | undefined = undefined;
    let volume: number | undefined = undefined;

    const files = fs.readdirSync(folderPath);
    const pageCount = files.filter(f => EXTENSIONS.IMAGE.includes(path.extname(f).toLowerCase())).length;

    // Check for ComicInfo.xml
    const comicInfoPath = path.join(folderPath, 'ComicInfo.xml');
    if (fs.existsSync(comicInfoPath)) {
        try {
            const xmlContent = fs.readFileSync(comicInfoPath, 'utf8');
            const comicInfo = parseComicInfo(xmlContent);
            if (comicInfo) {
                if (comicInfo.Title) title = comicInfo.Title;
                if (comicInfo.Number) issueNumber = comicInfo.Number;
                if (comicInfo.Volume) volume = comicInfo.Volume;
            }
        } catch (e) {
            console.error(`Failed to read ComicInfo.xml in ${folderPath}`, e);
        }
    }

    await db.insert(issues).values({
        magazineId,
        fileName: folderName,
        filePath: folderPath,
        title,
        issueNumber,
        volume,
        pageCount
    });
    console.log(`Added folder issue: ${folderName}`);
}
