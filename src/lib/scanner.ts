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
            // But we also need to check if this directory IS an issue (folder of images)
            // For simplicity v1: We assume structure Library/Magazine/Issue

            await processMagazineFolder(fullPath, entry.name);
        }
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
