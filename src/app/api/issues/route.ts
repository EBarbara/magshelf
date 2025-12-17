import { NextResponse } from 'next/server';
import { db, issues, magazines } from '@/db';
import { desc, eq } from 'drizzle-orm';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    const recentIssues = await db.select({
        id: issues.id,
        title: issues.title,
        volume: issues.volume,
        issueNumber: issues.issueNumber,
        fileName: issues.fileName,
        pageCount: issues.pageCount,
        addedAt: issues.addedAt,
        magazineTitle: magazines.series
    })
        .from(issues)
        .innerJoin(magazines, eq(issues.magazineId, magazines.id))
        .orderBy(desc(issues.addedAt))
        .limit(limit)
        .all();

    return NextResponse.json(recentIssues);
}
