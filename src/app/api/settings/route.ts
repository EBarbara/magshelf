import { NextResponse } from 'next/server';
import { db, settings } from '@/db';
import { eq } from 'drizzle-orm';

export async function GET() {
    try {
        const allSettings = await db.select().from(settings);
        const settingsMap = allSettings.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {} as Record<string, string>);

        return NextResponse.json(settingsMap);
    } catch (error) {
        console.error('Failed to fetch settings', error);
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { key, value } = body;

        if (!key || value === undefined) {
            return NextResponse.json({ error: 'Missing key or value' }, { status: 400 });
        }

        await db.insert(settings)
            .values({ key, value })
            .onConflictDoUpdate({ target: settings.key, set: { value } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to save setting', error);
        return NextResponse.json({ error: 'Failed to save setting' }, { status: 500 });
    }
}
