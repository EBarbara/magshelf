import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { articles, issues, magazines } from '@/db/schema';
import { eq } from 'drizzle-orm';

// GET: Fetch article details
export async function GET(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    const articleId = parseInt(params.id);
    if (isNaN(articleId)) {
        return NextResponse.json({ error: 'Invalid article ID' }, { status: 400 });
    }

    try {
        const result = await db
            .select({
                article: articles,
                issue: issues,
                magazine: magazines,
            })
            .from(articles)
            .leftJoin(issues, eq(articles.issueId, issues.id))
            .leftJoin(magazines, eq(issues.magazineId, magazines.id))
            .where(eq(articles.id, articleId))
            .get();

        if (!result) {
            return NextResponse.json({ error: 'Article not found' }, { status: 404 });
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error fetching article:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// PUT: Update article metadata
export async function PUT(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    const articleId = parseInt(params.id);
    if (isNaN(articleId)) {
        return NextResponse.json({ error: 'Invalid article ID' }, { status: 400 });
    }

    try {
        const body = await request.json();
        const { title, content, startPage, endPage } = body;

        // Perform update
        const updatedArticle = await db
            .update(articles)
            .set({
                title,
                content,
                startPage: parseInt(startPage),
                endPage: endPage ? parseInt(endPage) : null,
            })
            .where(eq(articles.id, articleId))
            .returning()
            .get();

        if (!updatedArticle) {
            return NextResponse.json({ error: 'Article not found' }, { status: 404 });
        }

        return NextResponse.json(updatedArticle);
    } catch (error) {
        console.error('Error updating article:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// DELETE: Remove article from DB
export async function DELETE(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    const articleId = parseInt(params.id);
    if (isNaN(articleId)) {
        return NextResponse.json({ error: 'Invalid article ID' }, { status: 400 });
    }

    try {
        const deletedArticle = await db
            .delete(articles)
            .where(eq(articles.id, articleId))
            .returning()
            .get();

        if (!deletedArticle) {
            return NextResponse.json({ error: 'Article not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Article deleted successfully', article: deletedArticle });
    } catch (error) {
        console.error('Error deleting article:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
