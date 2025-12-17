import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { articles } from '@/db/schema';

// POST: Create a new article
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { issueId, title, content, startPage, endPage } = body;

        if (!issueId || !title || startPage === undefined) {
             return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const newArticle = await db
            .insert(articles)
            .values({
                issueId: parseInt(issueId),
                title,
                content,
                startPage: parseInt(startPage),
                endPage: endPage ? parseInt(endPage) : null,
            })
            .returning()
            .get();

        return NextResponse.json(newArticle);
    } catch (error) {
        console.error('Error creating article:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
