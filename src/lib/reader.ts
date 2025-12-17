import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';
import { db, issues } from '@/db';
import { eq } from 'drizzle-orm';
import mime from 'mime-types';

const EXTENSIONS = {
    IMAGE: ['.jpg', '.jpeg', '.png', '.webp', '.gif']
};

export async function getImageData(issueId: number, pageIndex: number) {
    const issue = await db.select().from(issues).where(eq(issues.id, issueId)).get();
    if (!issue) return null;

    // Custom cover handling for page 0
    if (pageIndex === 0 && issue.cover) {
        try {
            const buffer = fs.readFileSync(issue.cover);
            const contentType = mime.lookup(issue.cover) || 'application/octet-stream';
            return { buffer, contentType };
        } catch (e) {
            console.error('Failed to read custom cover', e);
            // Fallback to default
        }
    }

    // Determine if archive or folder
    const isArchive = fs.statSync(issue.filePath).isFile();

    if (isArchive) {
        return getArchiveImage(issue.filePath, pageIndex);
    } else {
        return getFolderImage(issue.filePath, pageIndex);
    }
}

function getArchiveImage(filePath: string, pageIndex: number) {
    try {
        const zip = new AdmZip(filePath);
        const entries = zip.getEntries();
        // Filter and sort images to ensure consistent order
        const imageEntries = entries
            .filter(e => !e.isDirectory && EXTENSIONS.IMAGE.includes(path.extname(e.name).toLowerCase()))
            .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

        if (pageIndex < 0 || pageIndex >= imageEntries.length) return null;

        const entry = imageEntries[pageIndex];
        const buffer = zip.readFile(entry);
        const contentType = mime.lookup(entry.name) || 'application/octet-stream';

        return { buffer, contentType };
    } catch (e) {
        console.error('Error reading archive image', e);
        return null;
    }
}

function getFolderImage(folderPath: string, pageIndex: number) {
    try {
        const files = fs.readdirSync(folderPath);
        const imageFiles = files
            .filter(f => EXTENSIONS.IMAGE.includes(path.extname(f).toLowerCase()))
            .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

        if (pageIndex < 0 || pageIndex >= imageFiles.length) return null;

        const fileName = imageFiles[pageIndex];
        const fullPath = path.join(folderPath, fileName);
        const buffer = fs.readFileSync(fullPath);
        const contentType = mime.lookup(fileName) || 'application/octet-stream';

        return { buffer, contentType };
    } catch (e) {
        console.error('Error reading folder image', e);
        return null;
    }
}
