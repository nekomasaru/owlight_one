import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { searchVertexAI } from '@/lib/vertex-search';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    console.log(`[API] Search request received: "${query}"`);

    if (!query) {
        return NextResponse.json({ hits: [] });
    }

    try {
        // 1. Vertex AI Search
        const aiResults = await searchVertexAI(query);
        console.log(`[API] AI returned ${aiResults.length} raw results`);

        // Use a 0.0 threshold for debugging to ensure results are not filtered out
        const filteredResults = aiResults.filter(r => (r.score ?? 0) >= 0.0);
        const aiIds = filteredResults.map(r => r.id);

        if (aiIds.length === 0) {
            console.log(`[API] No results after filtering (ids: ${aiResults.length})`);
            return NextResponse.json({ hits: [] });
        }

        // 2. Supabase Content Retrieval
        const supabase = await createClient();
        const { data: knowledges, error } = await supabase
            .from('knowledges')
            .select('*')
            .in('id', aiIds);

        if (error) {
            console.error('[API] Supabase Error:', error);
            return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }

        console.log(`[API] Supabase found ${knowledges?.length || 0} matching records`);

        // 3. Merge, Sort and Map to strict interface
        // We preserve the order from Vertex AI
        const hits = aiIds.map(id => {
            const item = knowledges?.find(k => k.id === id);
            if (!item) return null;

            // Strict mapping to SearchResult interface
            return {
                id: item.id,
                title: item.title || 'Untitled',
                content: item.content || '',
                tags: Array.isArray(item.tags) ? item.tags : [],
                evaluation_score: item.evaluation_score ?? 0,
                created_at: item.created_at
            };
        }).filter(h => h !== null);

        console.log(`[API] Returning ${hits.length} mapped hits`);

        return NextResponse.json({
            hits,
            meta: {
                total: hits.length,
                query: query,
                server_time: new Date().toISOString()
            }
        });
    } catch (err: any) {
        console.error('[API] Unexpected Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
