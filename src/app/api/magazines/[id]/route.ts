
import { NextResponse } from 'next/server';
import { db, magazines, issues, readingProgress } from '@/db';
import { eq, asc, desc, and, or } from 'drizzle-orm';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const magazineId = parseInt(id);

    if (isNaN(magazineId)) {
        return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const magazine = await db.query.magazines.findFirst({
        where: eq(magazines.id, magazineId),
    });

    if (!magazine) {
        return NextResponse.json({ error: 'Magazine not found' }, { status: 404 });
    }

    const magazineIssues = await db.select({
        id: issues.id,
        title: issues.title,
        volume: issues.volume,
        issueNumber: issues.issueNumber,
        fileName: issues.fileName,
        pageCount: issues.pageCount,
        cover: issues.cover,
        addedAt: issues.addedAt,
        updatedAt: issues.updatedAt,
        readingProgress: {
            currentPage: readingProgress.currentPage,
            isFinished: readingProgress.isFinished,
            lastRead: readingProgress.lastRead,
        }
    })
        .from(issues)
        .leftJoin(readingProgress, eq(issues.id, readingProgress.issueId))
        .where(eq(issues.magazineId, magazineId))
        .orderBy(asc(issues.volume), asc(issues.issueNumber));

    return NextResponse.json({
        ...magazine,
        issues: magazineIssues
    });
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const magazineId = parseInt(id);
    const body = await request.json();

    if (isNaN(magazineId)) {
        return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const updated = await db.update(magazines)
        .set({
            series: body.series,
            lastUpdated: new Date(),
        })
        .where(eq(magazines.id, magazineId))
        .returning();

    return NextResponse.json(updated[0]);
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const magazineId = parseInt(id);

    if (isNaN(magazineId)) {
        return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    // Cascade delete handles issues and reading progress
    await db.delete(magazines).where(eq(magazines.id, magazineId));

    return NextResponse.json({ success: true });
}
