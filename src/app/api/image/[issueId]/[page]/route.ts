import { NextResponse } from 'next/server';
import { getImageData } from '@/lib/reader';

export async function GET(
    request: any,
    context: any
) {
    const params = await context.params;
    const issueId = parseInt(params.issueId);
    const pageIndex = parseInt(params.page);

    if (isNaN(issueId) || isNaN(pageIndex)) {
        return new NextResponse('Invalid parameters', { status: 400 });
    }

    const imageData = await getImageData(issueId, pageIndex);

    if (!imageData) {
        return new NextResponse('Image not found', { status: 404 });
    }

    if (!imageData.buffer) {
        return new NextResponse('Image buffer is empty', { status: 500 });
    }

    return new NextResponse(new Uint8Array(imageData.buffer), {
        headers: {
            'Content-Type': imageData.contentType,
            'Cache-Control': 'public, max-age=31536000, immutable',
        },
    });
}
