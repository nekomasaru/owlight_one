import { NextResponse } from 'next/server';
import { listDocuments } from '@/lib/vertex-search';

export async function GET() {
    const docs = await listDocuments();
    // Return the raw objects to inspect structure
    return NextResponse.json({
        count: docs.length,
        documents: docs
    });
}
