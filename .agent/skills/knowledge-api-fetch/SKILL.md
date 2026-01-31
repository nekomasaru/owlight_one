name: "knowledge-api-fetch"
description: "知恵（Wisdom）の詳細情報（構造化データ含む）をID指定で取得し、関連する知恵も同時に提案するAPIを実装する。"
version: "2.0.0"
author: "OWLight Development Team"
tags: ["feature", "wisdom", "api"]
triggers:
  - "知恵取得"
  - "詳細API"
  - "関連ドキュメント"
---

## 概要

フロントエンドで知恵（Wisdom）の詳細画面を表示するためのデータを取得するAPIを実装します。

`wisdoms` テーブルから指定されたIDの知恵を取得します。パフォーマンスと整合性のため、関連する Tags, References, Cases, Comments を一括で取得する Supabase RPC (`get_wisdom_full_context`) を積極的に活用します。

## このスキルが前提とするもの

- `infra-supabase-schema` および `rag-graph-traversal` が実装済みであること
- `wisdoms` データが（テストデータ含め）存在すること
- 認証基盤（`auth-api-session`）が存在すること

## 実装内容

### API 設計

**GET /api/v1/wisdom/:id**

- 説明：指定されたIDの知恵詳細を取得
- リクエスト：パスパラメータ `id` (SERIAL/int)
- 内部処理：`supabase.rpc('get_wisdom_full_context', { p_wisdom_id: id })` を呼び出す。
- レスポンス成功：
  ```json
  {
    "success": true,
    "data": {
      "wisdom": { "id": 123, "title": "...", "content": "..." },
      "tags": [...],
      "references": [...],
      "cases": [...],
      "comments": [...]
    }
  }
  ```

認証：Required（参照権限チェック：RLSにより自動制御）

### ロジック詳細

1. **RPC活用**: 詳細画面では複数のテーブルのデータが必要なため、個別の取得ではなく `get_wisdom_full_context` RPCを使用して1回のラウンドトリップで取得します。
2. **型定義**: フロントエンドとバックエンド間で `WisdomContext` 型を共有し、データの整合性を保ちます。

### チェックリスト
- [ ] `id` が整数（SERIAL型）として処理されているか
- [ ] `get_wisdom_full_context` RPC が正しく呼び出されているか
- [ ] 存在しないIDを指定した場合に null または 404 エラーが返ること
- [ ] 認証ヘッダーがない場合に 401 エラーを返すこと
