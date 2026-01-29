import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { indexDocument } from '@/lib/vertex-search';

export async function POST() {
    const supabase = await createClient();

    // 1. テストデータ定義
    const testKnowledges = [
        {
            title: "OWLight プロジェクト概要",
            content: "OWLightは、暗黙知を集合知に変えるためのナレッジエコシステムです。フクロウをモチーフにし、Teal色(#218F8D)をテーマカラーとしています。",
            tags: ["owlight", "vision"],
            evaluation_score: 100,
            is_public: true
        },
        {
            title: "Next.js App Router の特徴",
            content: "App Routerは、React Server Components (RSC) をベースとした新しいルーティングシステムです。layout.tsx や page.tsx を組み合わせて画面を構成します。",
            tags: ["tech", "nextjs"],
            evaluation_score: 80,
            is_public: true
        },
        {
            title: "Vertex AI Search の設定方法",
            content: "Google Cloud コンソールからデータストアを作成し、非構造化データを選択します。IDを環境変数に設定することでAPIからアクセス可能になります。",
            tags: ["tech", "gcp", "vertex-ai"],
            evaluation_score: 90,
            is_public: true
        }
    ];

    const results = [];

    // 2. 登録ループ
    for (const k of testKnowledges) {
        // A. Supabase に登録
        // まずユーザーIDが必要ですが、今回は簡略化のため、既存のユーザー（もし入れば）を使うか、
        // createClient (service role不使用) なので、ログイン済みユーザーのコンテキストが必要です。
        // テスト用APIなので、認証チェックをスキップして無理やり入れるか、
        // ログイン状態でブラウザから叩いてもらう前提にします。

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized. Please login first." }, { status: 401 });
        }

        const { data: inserted, error } = await supabase
            .from('knowledges')
            .insert({ ...k, author_id: user.id })
            .select()
            .single();

        if (error) {
            console.error("Supabase Insert Error:", error);
            results.push({ title: k.title, status: 'failed', error: error.message });
            continue;
        }

        // B. Vertex AI に登録 (Sync)
        if (inserted) {
            await indexDocument(inserted.id, inserted.title, inserted.content, '', inserted.tags);
            results.push({ title: k.title, status: 'success', id: inserted.id });
        }
    }

    return NextResponse.json({ message: "Seed processing completed", results });
}
