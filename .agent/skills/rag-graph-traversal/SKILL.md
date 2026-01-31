name: "rag-graph-traversal"
description: "Supabase RPCを用いて、知恵のコンテキスト（タグ、コメント、派生関係）を一括取得するロジックを実装する。"
version: "2.1.0"
author: "OWLight Development Team"
tags: ["rag", "graph", "rpc", "sql"]
triggers:
  - "グラフ探索実装"
  - "コンテキスト取得"
  - "get_wisdom_full_context"
---

## 概要

フロントエンドからの1回のリクエストで、特定の知恵に関するすべての周辺情報（Tags, References, Cases, Comments）を取得する PostgreSQL関数 (`get_wisdom_full_context`) を実装します。
GraphRAGのような「文脈検索」を低レイテンシで実現します。

## 実装内容

### SQL Function Definition
ファイル: `supabase/migrations/005_rpc_functions.sql`

```sql
CREATE OR REPLACE FUNCTION get_wisdom_full_context(p_wisdom_id INT)
RETURNS JSON AS $$
DECLARE
  v_wisdom JSON;
  v_tags JSON;
  v_references JSON;
  v_cases JSON;
  v_comments JSON;
BEGIN
  -- 1. Wisdom本体
  SELECT row_to_json(w) INTO v_wisdom FROM wisdoms w WHERE id = p_wisdom_id;
  
  -- 存在しない場合はNULLを返して終了
  IF v_wisdom IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- 2. Tags (Approved only)
  SELECT json_agg(t) INTO v_tags 
  FROM (
    SELECT t.*, wt.confidence_score 
    FROM tags t JOIN wisdom_tags wt ON t.id = wt.tag_id 
    WHERE wt.wisdom_id = p_wisdom_id AND wt.is_approved = TRUE
  ) t;

  -- 3. References
  SELECT json_agg(r) INTO v_references FROM wisdom_references r WHERE wisdom_id = p_wisdom_id;

  -- 4. Cases
  SELECT json_agg(c) INTO v_cases FROM wisdom_cases c WHERE wisdom_id = p_wisdom_id;

  -- 5. Comments (Recent 5, not reflected yet)
  SELECT json_agg(cm) INTO v_comments 
  FROM (
    SELECT * FROM wisdom_comments 
    WHERE wisdom_id = p_wisdom_id AND is_reflected = FALSE 
    ORDER BY helpful_count DESC LIMIT 5
  ) cm;

  -- 6. Derived History は別関数 get_wisdom_lineage で実装予定のためここでは除外
  
  RETURN json_build_object(
    'wisdom', v_wisdom,
    'tags', COALESCE(v_tags, '[]'::json),
    'references', COALESCE(v_references, '[]'::json),
    'cases', COALESCE(v_cases, '[]'::json),
    'comments', COALESCE(v_comments, '[]'::json)
  );
END;
$$ LANGUAGE plpgsql;
```

### Client Side Usage (TypeScript)
ファイル: `lib/api/wisdom.ts`

```typescript
import { supabase } from '@/lib/supabase/client';

export interface WisdomContext {
  wisdom: Wisdom;
  tags: Tag[];
  references: Reference[];
  cases: Case[];
  comments: Comment[];
  // derived_from は get_wisdom_lineage 実装時に追加予定
}

export async function getWisdomContext(id: number): Promise<WisdomContext | null> {
  const { data, error } = await supabase.rpc('get_wisdom_full_context', {
    p_wisdom_id: id
  });
  
  if (error) {
    console.error('Error fetching wisdom context:', error);
    return null; // エラーハンドリングは呼び出し元で行う
  }
  
  // RPCがNULLを返した場合（IDが存在しない場合）もnullになる
  return data as WisdomContext | null;
}
```

### チェックリスト
- [ ] RPC関数がエラーなくデプロイされているか
- [ ] 存在しないIDを渡した時に null が返るか
- [ ] 存在する場合、tags などが空でも [] が返るか（null になっていないか）
- [ ] TypeScriptの型定義と返り値の構造が一致しているか
