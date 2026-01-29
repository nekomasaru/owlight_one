import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { searchVertexAI } from '@/lib/vertex-search';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query) {
        return NextResponse.json({ hits: [] });
    }

    // 1. Vertex AI Search (Ranking)
    // 検索キーワードに関連するドキュメントIDを、関連度順に取得する
    const aiResults = await searchVertexAI(query);
    const aiIds = aiResults.map(r => r.id);

    if (aiIds.length === 0) {
        return NextResponse.json({ hits: [] });
    }

    // 2. Supabase (Content Retrieval)
    // 取得したIDに基づいて、詳細なコンテンツデータをDBから引く
    const supabase = await createClient();
    const { data: knowledges, error } = await supabase
        .from('knowledges')
        .select('*')
        .in('id', aiIds);

    if (error) {
        console.error('Supabase Error:', error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!knowledges) {
        return NextResponse.json({ hits: [] });
    }

    // 3. Merge & Sort
    // Supabaseの結果はID順にはなっていないため、Vertex AIの順序に合わせて並べ替える
    const sortedHits = aiIds.map(id => {
        return knowledges.find(k => k.id === id);
    }).filter(item => item !== undefined); // DBに存在しないデータ（同期遅れなど）は除外

    return NextResponse.json({
        hits: sortedHits,
        meta: {
            total: sortedHits.length,
            query: query
        }
    });
}
