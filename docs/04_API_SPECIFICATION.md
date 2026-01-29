# 04_API_SPECIFICATION.md

## 概要

OWLightのバックエンドAPI仕様です。
Next.jsの Route Handlers (`app/api/...`) で実装され、認証には Supabase Auth (JWT) を使用します。

* **Base URL**: `/api/v1`
* **Content-Type**: `application/json`
* **Authentication**: Authorization Header (`Bearer <supabase_access_token>`)

## 1. Auth & User Module

### GET /api/v1/auth/me

現在のセッションユーザーのプロフィール情報を取得します。

* **Response**:
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "display_name": "Owl Keeper",
  "role": "manager",
  "avatar_url": "https://...",
  "role_model": { "key": "innovator", "name": "革新的な開拓者" }
}

```



### PUT /api/v1/users/me

プロフィール情報（表示名、Bio、アバター）を更新します。

* **Request**: `{ "display_name": "...", "bio": "...", "avatar_url": "..." }`
* **Response**: Updated User Object

## 2. Search Module (Vertex AI + Supabase Integration)

### GET /api/v1/search

統合検索を実行します。
Vertex AI の検索能力で「順序（IDリスト）」を決定し、Supabase のデータで「表示内容」を構築します。

* **Query Params**:
* `q`: 検索キーワード (必須)
* `tags`: タグフィルタ (カンマ区切り, オプション)
* `page`: ページ番号 (Default: 1)


* **Logic**:
1. **Vertex AI Search (Ranking)**:
* キーワード `q` を送信。
* 事前に連携されている `evaluation_score` (評価スコア) をブースト要因として利用し、重要度の高い記事を上位にランク付けする。
* **戻り値**: ランク順にソートされたドキュメントIDのリスト。


2. **Supabase (Content Retrieval)**:
* Vertex AI から返却された IDリスト を条件に `knowledges` テーブルを検索 (`WHERE id IN (...)`)。
* タイトル、本文スニペット、著者、評価スコア、タグなどの表示用データを取得。


3. **Merge & Response**:
* Supabase のデータを Vertex AI の ID順序通りに並べ替えてレスポンスを作成。




* **Response**:
```json
{
  "meta": { "total": 120, "page": 1, "query": "React" },
  "ai_answer": "ReactはUI構築ライブラリです...", // Vertex AI Summary (Optional)
  "hits": [
    {
      "id": "uuid", // Supabase ID
      "title": "React Hooks入門", // From Supabase
      "snippet": "useStateは...", // From Supabase (contentの一部)
      "author": { "name": "Taro", "avatar_url": "..." }, // From Supabase
      "tags": ["frontend", "react"], // From Supabase
      "evaluation_score": 150, // From Supabase (この値が高いほど上位に来やすい)
      "created_at": "2023-10-01T..." // From Supabase
    }
  ]
}

```



### GET /api/v1/search/suggest

検索バーのオートコンプリート用候補を取得します。

* **Query Params**: `q` (入力中の文字)
* **Source**: Vertex AI Search (Autocomplete API)
* **Response**: `{ "suggestions": ["React Hooks", "React Performance", ...] }`

## 3. Knowledge Module

### POST /api/v1/knowledge

ナレッジを新規作成します。

* **Request**:
```json
{
  "title": "...",
  "content": "Markdown text...",
  "tags": ["tag1", "tag2"],
  "is_public": true
}

```


* **Side Effect**:
* Supabase にデータを保存 (`evaluation_score` 初期値 0)。
* 非同期ジョブで Vertex AI のインデックスにデータを連携（ID, Title, Content, Score=0）。



### GET /api/v1/knowledge/:id

ナレッジの詳細（Supabase データ）を取得します。

### PUT /api/v1/knowledge/:id

ナレッジを更新します。Supabase 更新後、Vertex AI へ再同期を行います。

### DELETE /api/v1/knowledge/:id

ナレッジを削除します。

## 4. Role Model Module

### POST /api/v1/role/diagnose

ユーザーの回答を分析し、適性ロールを診断します。

* **Request**: `{ "answers": [{ "q_id": 1, "text": "..." }, ...] }`
* **Logic**: Vertex AI (Gemini) に回答を入力し、最適なロールIDと理由を生成。
* **Response**:
```json
{
  "role_key": "innovator",
  "name": "革新的な開拓者",
  "reason": "あなたは未知の課題に対して..."
}

```



## 5. Growth & Evaluation Module

### GET /api/v1/growth/timeline

成長グラフ描画用の時系列データを Supabase から取得します。

* **Query Params**: `period` (1m, 3m, 6m, 1y)
* **Response**:
```json
{
  "user_data": [{ "date": "2023-01", "points": 100 }, ...],
  "peer_avg": [{ "date": "2023-01", "points": 85 }, ...] // 同期平均
}

```



### POST /api/v1/evaluation/peer-rewards

ピアボーナス（称賛）を送信し、関連するスコアを更新します。

* **Request**: `{ "receiver_id": "uuid", "target_knowledge_id": "uuid", "points": 10, "message": "Thanks!" }`
* **Logic**:
1. `peer_rewards` テーブルに記録。
2. 受信ユーザーの合計ポイントを更新。
3. **対象ナレッジがある場合、その `evaluation_score` を加算更新 (Supabase)。**
4. **更新されたスコアを Vertex AI のメタデータとして同期 (検索順位への反映)。**


* **Response**: `{ "success": true }`

## 6. Safety (Sanctuary) Module

### POST /api/v1/safety/sos

SOSアラートを送信します。

* **Request**: `{ "is_anonymous": true, "message": "..." }`
* **Process**: `notifications` テーブルに管理者宛てのレコードを作成。

### POST /api/v1/chat/ephemeral

隠れ家ウィジェット用のチャットAPI。

* **Request**: `{ "message": "..." }`
* **Logic**: DB保存なし。Vertex AI (Gemini) に「共感的カウンセラー」としてのプロンプトで応答生成を依頼。

## 7. Admin Module (Role: admin, manager)

### GET /api/v1/admin/users

ユーザー一覧を取得します。

### PATCH /api/v1/admin/users/:id/role

ユーザーの権限を変更します。

### GET /api/v1/admin/prompts

システムプロンプト一覧を取得します。

### PUT /api/v1/admin/prompts/:key

指定されたキーのシステムプロンプトを更新し、次回以降の Vertex AI 呼び出しに反映させます。