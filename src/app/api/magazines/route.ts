import { NextResponse } from 'next/server';
import { db, magazines, issues } from '@/db';
import { desc, eq, sql } from 'drizzle-orm';

export async function GET() {
    // Get magazines with issue count
    const allMagazines = await db.select({
        id: magazines.id,
        series: magazines.series,
        lastUpdated: magazines.lastUpdated,
        issueCount: sql<number>`count(${issues.id})`,
        coverIssueId: sql<number>`min(${issues.id})`
    })
        .from(magazines)
        .leftJoin(issues, eq(magazines.id, issues.magazineId))
        .groupBy(magazines.id)
        .orderBy(desc(magazines.lastUpdated))
        .all();

    return NextResponse.json(allMagazines);
}
