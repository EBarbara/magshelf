import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { issues, magazines, articles } from '@/db/schema';
import { eq } from 'drizzle-orm';

// GET: Fetch issue details
export async function GET(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    const issueId = parseInt(params.id);
    if (isNaN(issueId)) {
        return NextResponse.json({ error: 'Invalid issue ID' }, { status: 400 });
    }

    try {
        const result = await db
            .select({
                issue: issues,
                magazine: magazines,
            })
            .from(issues)
            .leftJoin(magazines, eq(issues.magazineId, magazines.id))
            .where(eq(issues.id, issueId))
            .get();

        const issueArticles = await db
            .select()
            .from(articles)
            .where(eq(articles.issueId, issueId))
            .orderBy(articles.startPage);

        if (!result) {
            return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
        }

        return NextResponse.json({ ...result, articles: issueArticles });
    } catch (error) {
        console.error('Error fetching issue:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// PUT: Update issue metadata
export async function PUT(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    const issueId = parseInt(params.id);
    if (isNaN(issueId)) {
        return NextResponse.json({ error: 'Invalid issue ID' }, { status: 400 });
    }

    try {
        const body = await request.json();
        const { title, issueNumber, cover } = body;

        // Perform update
        const updatedIssue = await db
            .update(issues)
            .set({
                title,
                issueNumber,
                cover,
                updatedAt: new Date(),
            })
            .where(eq(issues.id, issueId))
            .returning()
            .get();

        if (!updatedIssue) {
            return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
        }

        return NextResponse.json(updatedIssue);
    } catch (error) {
        console.error('Error updating issue:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// DELETE: Remove issue from DB only
export async function DELETE(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    const issueId = parseInt(params.id);
    if (isNaN(issueId)) {
        return NextResponse.json({ error: 'Invalid issue ID' }, { status: 400 });
    }

    try {
        const deletedIssue = await db
            .delete(issues)
            .where(eq(issues.id, issueId))
            .returning()
            .get();

        if (!deletedIssue) {
            return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Issue deleted successfully' });
    } catch (error) {
        console.error('Error deleting issue:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
