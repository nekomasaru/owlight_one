name: "search-api-unified"

description: "ナレッジ（DB記事）とファイル（GCS/PDF等）を横断的に検索し、統合された結果を返却するハイブリッド検索APIを実装する。"

version: "1.0.0"

author: "OWLight Development Team"

tags: ["feature", "search", "api", "hybrid"]

triggers:
  - "統合検索"
  - "ユニオン検索"
  - "全文検索"

---

## 概要

OWLight の主要な情報の入り口として、Supabase（即時性・タグ検索）と Vertex AI Search（セマンティック検索）を組み合わせた統合検索APIを実装します。

## アーキテクチャ

本検索システムは、検索の「意図」に応じて2つのパスを使い分けます。

### Case A: クエリなし（初期表示・タグフィルタのみ）
- **ソース**: Supabase (`knowledge_base` と `files` テーブル)
- **理由**: 最新の投稿を即座に反映させるため。また、タグによる完全一致フィルタリングが高速なため。
- **処理**: 両テーブルからデータを取得し、`created_at` でソートしてマージします。

### Case B: キーワード検索
- **ソース**: Vertex AI Search (Grounding API)
- **理由**: 表記揺れや意味的な類似性を考慮した高度な検索を行うため。
- **処理**: 
  1. Vertex AI Search を実行。
  2. 返却された ID を元に、Supabase のマスタテーブルから詳細（タグ、既読、お気に入り状態）を補完。
  3. ナレッジ記事かファイルかを `type` フィールドで識別。

## 実装仕様

### API エンドポイント
**GET /api/search**

- **クエリパラメータ**:
  - `q`: 検索文字列（任意）
  - `tags`: カンマ区切りのタグ（任意）
  - `userId`: ユーザーID（お気に入り状態の取得に使用）

- **レスポンス形式**:
  ```json
  {
    "query": "...",
    "results": [
      {
        "id": "...",
        "type": "knowledge" | "file",
        "title": "...",
        "content": "...",
        "tags": ["..."],
        "isFavorite": boolean,
        "viewCount": number,
        "trustTier": 1 | 2 | 3,
        "mimeType": "application/pdf" (if file),
        "uri": "gs://..." (if file)
      }
    ]
  }
  ```

## チェックリスト

実装完了時に、以下をすべて確認：

- [ ] `q` が空の場合、Supabase から記事とファイルの両方が取得されていること
- [ ] `q` がある場合、Vertex AI Search の結果が返却され、メタデータが正しく補完されていること
- [ ] 検索結果に `type` フィールドが含まれ、フロントエンドで正しく判別できること
- [ ] タグフィルタが記事とファイルの双方に適用されること
- [ ] リポジトリ経由でお気に入り状態が正しく取得できていること

## Best Practices (推奨事項)

- **データ整合性の厳守 (Strict Consistency)**:
  - 検索結果に表示するデータは、**必ずデータベース (Supabase) に存在するレコード**に基づかなければなりません。
  - Vertex AI にインデックスが残っていても、DBから削除されている場合、その結果は表示してはいけません（Ghost Fileの禁止）。

- **ハイブリッド・ルックアップ (Hybrid Lookup)**:
  - Vertex AI と DB 間で ID 形式が異なる場合（例: DBはUUID, VertexはHash）に備え、以下の2段階ルックアップを実装します。
    1. **ID検索**: `vertex_result.id` で DB を検索。
    2. **URI検索 (Fallback)**: IDで見つからない場合、`vertex_result.uri` (GCS Path) に基づいて DB を検索。
  - これにより、システム間のID不整合を吸収しつつ、DBの正規データを保証できます。

## Anti-Patterns (避けるべきこと)

- **ゴーストファイルの表示**:
  - DBに見つからないナレッジ/ファイルを、Vertex AI のメタデータのみを使って「仮」で表示すること。これはユーザーに「存在する」と誤認させ、クリック時のエラーや古い情報の拡散につながります。
  
- **IDのみへの依存**:
  - 外部システム (GCS auto-indexing等) が絡む場合、IDの一貫性を盲信しないこと。必ず一意な代替キー（URIなど）をバックアップとして用意してください。

## 補足・注意事項

- **メタデータ補完の効率化**: Vertex から大量の結果が返る場合、ループ内での個別クエリは N+1 問題を引き起こします。可能な限り `in` 句によるバルク取得を検討してください。
- **検索ブースティング**: `trust_tier` が高い（Gold/Silver）ナレッジを上位に表示するよう、Vertex AI の `boostSpec` を活用してください。
