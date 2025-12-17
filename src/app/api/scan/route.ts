import { NextResponse } from 'next/server';
import { scanLibrary } from '@/lib/scanner';
import path from 'path';
import { db, settings } from '@/db';
import { eq } from 'drizzle-orm';

export async function GET() {
    try {
        // 1. Check DB Setting
        const setting = await db.select().from(settings).where(eq(settings.key, 'LIBRARY_PATH')).get();
        let dataDir = setting?.value;

        // 2. Check Environment Variable
        if (!dataDir) {
            dataDir = process.env.MAGSHELF_LIBRARY_PATH;
        }

        // 3. Default
        if (!dataDir) {
            dataDir = path.resolve(process.cwd(), 'data');
        }

        console.log(`Starting scan in ${dataDir}`);
        await scanLibrary(dataDir);
        return NextResponse.json({ success: true, message: 'Scan completed' });
    } catch (error) {
        console.error('Scan failed', error);
        return NextResponse.json({ success: false, error: 'Scan failed' }, { status: 500 });
    }
}
