import { NextResponse } from 'next/server';
import { db, magazines, issues } from '@/db';
import { desc, eq, sql } from 'drizzle-orm';

export async function GET() {
    // Get magazines with issue count
    const allMagazines = await db.select({
        id: magazines.id,
        title: magazines.title,
        lastUpdated: magazines.lastUpdated,
        issueCount: sql<number>`count(${issues.id})`
    })
        .from(magazines)
        .leftJoin(issues, eq(magazines.id, issues.magazineId))
        .groupBy(magazines.id)
        .orderBy(desc(magazines.lastUpdated))
        .all();

    return NextResponse.json(allMagazines);
}
