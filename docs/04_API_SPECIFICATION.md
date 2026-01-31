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
* Vertex AI から返却された IDリスト を条件に `wisdoms` テーブルを検索 (`WHERE id IN (...)`)。
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
      "id": 123, // Supabase ID (int)
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

## 3. Wisdom Module

### POST /api/v1/wisdom

「知恵」を新規作成します。

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
* Supabase にデータを保存 (`quality_score` 初期値 0)。
* 非同期ジョブで Vertex AI のインデックスにデータを連携（ID, Title, Content, Score=0）。



### GET /api/v1/wisdom

知恵の一覧を取得します。ダイナミック・ダッシュボード等の表示に使用されます。

* **Query Params**:
    * `sort`: ソート条件
        * `latest`: 新着順（デフォルト）
        * `rating`: 評価スコア（高品質）順
        * `discussion`: 話題順（モック：現在は最新順）
        * `contribution`: 貢献募集（未完成・スコア低）順
        * `updated`: 最近の更新順
        * `recommended`: あなたへのおすすめ（モック：現在は最新順）
        * `seasonal`: 季節のトピック（モック：特定のタグを含む）
    * `limit`: 取得件数 (デフォルト: 10)

* **Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "title": "...",
      "content": "...",
      "quality_score": 90,
      "tags": ["...", "..."],
      "created_at": "..."
    }
  ]
}
```

### GET /api/v1/wisdom/:id

知恵の詳細（Supabase データ）を取得します。
正規化された関連データ（tags, references, cases, comments）を1回で取得する際は RPC `get_wisdom_full_context` の利用を推奨します。

### PUT /api/v1/wisdom/:id

知恵を更新します。Supabase 更新後、Vertex AI へ再同期を行います。

### DELETE /api/v1/wisdom/:id

知恵を削除します。

### POST /api/v1/wisdom/:id/comments

コメント（補足・質問）を投稿します。

* **Request**: `{ "comment_text": "...", "comment_type": "correction" | "addition" | ... }`
* **Response**: Comment Object (including user info)

### GET /api/v1/wisdom/:id/comments

知恵に紐づくコメント一覧を取得します。

* **Response**: List of Comment Objects

### POST /api/v1/wisdom/:id/engagement

「感謝（いいね）」や「コピー」などのアクションを記録します。

* **Request**: `{ "type": "like" | "copy" | "helpful" }`
* **Logic**:
    * `like`: `wisdoms.like_count` を加算。
    * `helpful`: `wisdoms.helpful_count` を加算。
* **Response**: `{ "success": true, "new_count": 123 }`

### POST /api/v1/wisdom/synthesize

AIとの対話を通じて知恵を生成・修正する (Iterative Refinement) APIです。
チャット履歴 (`chat_history`) をコンテキストとして受け取り、文脈を踏まえた修正提案を行います。
AIとの対話を通じてナレッジを生成・修正する (Iterative Refinement) APIです。
チャット履歴 (`chat_history`) をコンテキストとして受け取り、文脈を踏まえた修正提案を行います。

- **モデル**: 最新の `gemini-2.5-flash-lite` を使用。
- **認証**: **OAuth 2.0 アクセストークン (ADC)** 方式を採用。`google-auth-library` を用いて動的に取得したトークンを `Authorization: Bearer` ヘッダーに付与する。
- **プロトコル**: 安定性と最新モデルへの対応のため、REST API (`generateContent`) を直接 `fetch` する。

プロダクション環境では、AIの思考過程やテキスト生成をリアルタイムで表示するために、**Server-Sent Events (SSE)** によるストリーミング応答を推奨します。

* **Request**:
```json
{
  "intent": "Generate" | "Refine" | "Summarize",
  "chat_history": [
    { "role": "user", "text": "ユニコーンの飼い方を教えて" },
    { "role": "model", "text": "承知しました...", "data": { "title": "...", "content": "..." } }
  ],
  "file_data": "base64_string..." // Optional (for Summarize intent)
}
```

* **Response (Standard)**:
```json
{
  "message": "ユニコーンの飼育に関する基本的な知恵を生成しました。具体例を追加したい場合は指示してください。",
  "data": {
    "title": "ユニコーン飼育ガイドライン",
    "content": "...",
    "references": [...],
    "cases": [...]
  }
}
```

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

* **Request**: `{ "receiver_id": "uuid", "target_wisdom_id": 123, "points": 10, "message": "Thanks!" }`
* **Logic**:
1. `peer_rewards` テーブルに記録。
2. 受信ユーザーの合計ポイントを更新。
3. **対象の知恵がある場合、その `quality_score` 加算の検討材料とする (Supabase)。**
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

## 8. Infrastructure & Monitoring

### GET /api/health

システムの稼働状況を確認します。外部監視サービス (Uptime Robot等) からの利用を想定しています。

* **Response (Status 200)**:
```json
{
  "status": "healthy",
  "latency": 45, // ms
  "timestamp": "2023-10-01T..."
}
```
* **Response (Status 503)**:
```json
{
  "status": "down",
  "error": "Database connection failed"
}
```

### POST /api/alerts

重大なシステム障害が発生した際に、クライアントまたはサーバー内部から呼び出され、管理者に通知を行います。

* **Request**:
```json
{
  "level": "critical",
  "message": "Supabase connection failed 5 times in a row.",
  "metadata": { "retry_count": 5, "last_error": "..." }
}
```
* **Response**: `{ "success": true }`

## 9. Wisdom Features (Future V2)

### REQ-00X: Wisdom Request (知恵執筆リクエスト)
検索しても情報が見つからず、かつ自分でも書けない場合、ユーザーは「リクエスト」を登録できます。

- **POST /api/v1/wisdom-requests**
    - 説明: 知恵の執筆依頼を登録する。
    - Body: `{ "query": "検索キーワード", "description": "知りたい内容", "priority": "normal" }`
    - 処理: `wisdom_requests` テーブルへ保存し、管理者に通知する。
