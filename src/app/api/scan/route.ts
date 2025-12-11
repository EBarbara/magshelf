import { NextResponse } from 'next/server';
import { scanLibrary } from '@/lib/scanner';
import path from 'path';

export async function GET() {
    try {
        const dataDir = path.resolve(process.cwd(), 'data');
        console.log(`Starting scan in ${dataDir}`);
        await scanLibrary(dataDir);
        return NextResponse.json({ success: true, message: 'Scan completed' });
    } catch (error) {
        console.error('Scan failed', error);
        return NextResponse.json({ success: false, error: 'Scan failed' }, { status: 500 });
    }
}
