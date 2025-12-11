import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';
import { db, magazines, issues } from '@/db';
import { eq, and } from 'drizzle-orm';

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

    // We use a "virtual" path for the Magazine Series in root to group them
    // path = /data/SeriesName
    const seriesPath = path.join(path.dirname(filePath), series);

    // Check or create Magazine in DB
    let magazineId: number;
    const existingMag = await db.select().from(magazines).where(eq(magazines.path, seriesPath)).get();

    if (existingMag) {
        magazineId = existingMag.id;
    } else {
        const result = await db.insert(magazines).values({
            title: series,
            path: seriesPath
        }).returning();
        magazineId = result[0].id;
        console.log(`Created Magazine Series: ${series}`);
    }

    // Process the file as an issue for this magazine
    // Check if exists
    const existing = await db.select().from(issues).where(eq(issues.filePath, filePath)).get();
    if (existing) return;

    await db.insert(issues).values({
        magazineId,
        fileName,
        filePath,
        title: fileName,
        issueNumber: issueNumber,
        volume: volume,
        pageCount: 0 // Will be updated if we read the zip
    });
    console.log(`Added archive issue to ${series}: ${fileName}`);

    // Calculate page count async to not block too much? Or just do it here.
    try {
        const zip = new AdmZip(filePath);
        const entries = zip.getEntries();
        const pageCount = entries.filter(e => !e.isDirectory && EXTENSIONS.IMAGE.includes(path.extname(e.name).toLowerCase())).length;

        await db.update(issues).set({ pageCount }).where(eq(issues.filePath, filePath));
    } catch (e) {
        console.error(`Failed to read archive page count ${filePath}`);
    }
}

async function processMagazineFolder(folderPath: string, magazineName: string) {
    // Check or create Magazine in DB
    let magazineId: number;
    const existingMag = await db.select().from(magazines).where(eq(magazines.path, folderPath)).get();

    if (existingMag) {
        magazineId = existingMag.id;
    } else {
        const result = await db.insert(magazines).values({
            title: magazineName,
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

    // Get metadata from filename (simple regex for #num) or file headers
    // Example: "Magazine - v01 - 045.cbz"
    // Using simple defaults for now

    let pageCount = 0;
    try {
        const zip = new AdmZip(filePath);
        const entries = zip.getEntries();
        pageCount = entries.filter(e => !e.isDirectory && EXTENSIONS.IMAGE.includes(path.extname(e.name).toLowerCase())).length;
    } catch (e) {
        console.error(`Failed to read archive ${filePath}`, e);
    }

    await db.insert(issues).values({
        magazineId,
        fileName,
        filePath,
        title: fileName, // fallback
        pageCount
    });
    console.log(`Added archive: ${fileName}`);
}

async function processFolderIssue(magazineId: number, folderPath: string, folderName: string) {
    // Check if exists
    const existing = await db.select().from(issues).where(eq(issues.filePath, folderPath)).get();
    if (existing) return;

    const files = fs.readdirSync(folderPath);
    const pageCount = files.filter(f => EXTENSIONS.IMAGE.includes(path.extname(f).toLowerCase())).length;

    await db.insert(issues).values({
        magazineId,
        fileName: folderName,
        filePath: folderPath,
        title: folderName,
        pageCount
    });
    console.log(`Added folder issue: ${folderName}`);
}
