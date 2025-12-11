import { NextResponse } from 'next/server';
import { db, magazines } from '@/db';
import { eq } from 'drizzle-orm';

export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { id, title } = body;

        await db.update(magazines)
            .set({ title })
            .where(eq(magazines.id, id));

        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ success: false }, { status: 500 });
    }
}
