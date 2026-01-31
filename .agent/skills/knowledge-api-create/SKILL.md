name: "knowledge-api-create"
description: "構造化された知恵（Wisdom）データを検証・保存し、検索エンジン同期用のキュー処理をトリガーするAPIを実装する。"
version: "2.0.0"
author: "OWLight Development Team"
tags: ["feature", "wisdom", "api"]
triggers:
  - "知恵作成"
  - "同期キュー"
  - "知恵保存"
---

## 概要

知恵（Wisdom）の作成・保存の中核となるAPIを実装します。

フロントエンドまたはAIエージェントから送信された構造化データを受け取り、`wisdoms` テーブルおよび関連テーブル（references, cases）へ保存します。保存成功後は、**Vertex AI Search API を直接呼び出し (`indexDocument`)、リアルタイムにインデックス登録** を行います。

## このスキルが前提とするもの

- `infra-supabase-schema` が適用済みであること（`wisdoms` テーブル等が作成済み）
- `users` テーブルおよび認証基盤（`auth-api-session`）が存在すること
- バリデーションライブラリ（Zod等）が利用可能であること

## 実装内容

### API 設計

**POST /api/v1/wisdom**

- 説明：新規の「知恵」を作成し、検索インデックス同期の準備を行う
- リクエスト本文：
  ```json
  {
    "title": "文書管理規定の解釈について",
    "content": "文書保存期間の例外措置に関する...",
    "summary": "監査での指摘事項を受けて...",
    "tags": ["文書管理", "監査対応"],
    "references": [
      { "title": "公文書管理法 第5条", "reference_type": "law" }
    ],
    "cases": [
      { "title": "ケースA", "situation": "...", "case_type": "success" }
    ]
  }
  ```

レスポンス成功：`{ success: true, data: { id: 123, ... } }`

認証：Required（JWT Bearer Token）

バリデーション：
- title: 必須、1-100文字
- content: 必須、1文字以上
- tags: 正規化された `tags` テーブルとの紐付け（`wisdom_tags`）

### PUT /api/v1/wisdom/:id

- 説明：既存の知恵の更新（作成者のみ）
- リクエスト：作成時と同様（差分更新）
- 処理：更新時に `synced_to_vertex` フラグ（内部管理）を false にリセットし、再同期対象とする

### 内部ロジック（トランザクション）

1. **DB保存**: `wisdoms` へ INSERT/UPDATE。IDは `SERIAL` (int)。
2. **関連データ保存**: `wisdom_references`, `wisdom_cases` 等へ保存。
3. **同期フラグ管理**: Vertex AI への同期が必要な状態を記録。

### チェックリスト
- [ ] `wisdoms` テーブル（SERIAL ID）への保存が正しく行われるか
- [ ] 関連する `references`, `cases` も同一トランザクション内で保存されるか
- [ ] 入力バリデーション（Zod等）が適用されていること
- [ ] 他人の知恵を更新しようとした場合に 403 を返すこと
