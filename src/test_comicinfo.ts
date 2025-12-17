import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';
import { scanLibrary } from './lib/scanner';
import { db, issues } from './db';
import { eq } from 'drizzle-orm';

async function testComicInfo() {
    const testDir = path.resolve(process.cwd(), 'data_test_comicinfo');
    if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true, force: true });
    }
    fs.mkdirSync(testDir);

    const seriesDir = path.join(testDir, 'Test Series');
    fs.mkdirSync(seriesDir);

    // 1. Create a dummy image
    const imagePath = path.join(seriesDir, 'page1.jpg');
    fs.writeFileSync(imagePath, 'fake image content');

    // 2. Create ComicInfo.xml
    const comicInfoContent = `<?xml version="1.0"?>
<ComicInfo xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <Title>The XML Title</Title>
  <Series>Test Series</Series>
  <Number>100</Number>
  <Volume>5</Volume>
</ComicInfo>`;

    // 3. Create CBZ with ComicInfo.xml
    const zip = new AdmZip();
    zip.addFile('ComicInfo.xml', Buffer.from(comicInfoContent, 'utf8'));
    zip.addLocalFile(imagePath);
    zip.writeZip(path.join(seriesDir, 'Test Series #100.cbz'));

    // 4. Create Folder Issue with ComicInfo.xml
    const folderIssueDir = path.join(seriesDir, 'Folder Issue 200');
    fs.mkdirSync(folderIssueDir);
    fs.writeFileSync(path.join(folderIssueDir, 'ComicInfo.xml'), comicInfoContent.replace('<Title>The XML Title</Title>', '<Title>Folder XML Title</Title>').replace('<Number>100</Number>', '<Number>200</Number>'));
    fs.writeFileSync(path.join(folderIssueDir, 'page1.jpg'), 'fake image content');

    // Clean up dummy image in root
    fs.unlinkSync(imagePath);

    console.log('Running scan...');
    await scanLibrary(testDir);

    console.log('Verifying DB...');
    const dbIssues = await db.select().from(issues);

    const cbzIssue = dbIssues.find(i => i.fileName.includes('#100.cbz'));
    if (cbzIssue) {
        if (cbzIssue.title === 'The XML Title' && cbzIssue.issueNumber === '100' && cbzIssue.volume === 5) {
            console.log('SUCCESS: CBZ Issue metadata read correctly.');
        } else {
            console.error('FAILURE: CBZ Issue metadata mismatch.', cbzIssue);
        }
    } else {
        console.error('FAILURE: CBZ Issue not found in DB.');
    }

    const folderIssue = dbIssues.find(i => i.fileName.includes('Folder Issue 200'));
    if (folderIssue) {
        if (folderIssue.title === 'Folder XML Title' && folderIssue.issueNumber === '200') {
            console.log('SUCCESS: Folder Issue metadata read correctly.');
        } else {
            console.error('FAILURE: Folder Issue metadata mismatch.', folderIssue);
        }
    } else {
        console.error('FAILURE: Folder Issue not found in DB.');
    }
}

testComicInfo().catch(console.error);
