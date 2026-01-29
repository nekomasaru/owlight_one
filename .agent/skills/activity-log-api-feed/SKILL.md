name: "activity-log-api-feed"

description: "庁内掲示板（活動ログ）のタイムライン表示用データ取得、新規投稿、および削除を行うAPIを実装する。"

version: "1.0.0"

author: "OWLight Development Team"

tags: \["feature", "activity-log", "api"]

triggers:

&nbsp; - "活動ログAPI"

&nbsp; - "フィード取得"

&nbsp; - "投稿API"

---



\## 概要



職員が投稿した活動ログを時系列で取得するフィードAPIと、新規活動を投稿するAPIを実装します。

取得時には、投稿者のユーザー情報（アバター等）や、付与されたリアクションの集計結果（いいね数など）を結合して返却し、フロントエンドでリッチな表示ができるようにします。



\## このスキルが前提とするもの



\- `activity\_logs` および `reactions` テーブルが作成済みであること（`activity-log-table-schema` 完了済み）

\- `users` テーブルが存在すること

\- 認証基盤（`auth-api-session`）により、`current\_user` が特定できること



\## 実装内容



\### API 設計



\*\*GET /api/v1/activity-logs?limit=20\&offset=0\*\*



\- 説明：活動ログのタイムライン一覧を取得（新しい順）

\- クエリ：`limit` (default: 20), `offset` (default: 0)

\- レスポンス：

&nbsp; ```json

&nbsp; {

&nbsp;   "success": true,

&nbsp;   "data": {

&nbsp;     "logs": \[

&nbsp;       {

&nbsp;         "id": "uuid",

&nbsp;         "content": "地域の清掃活動に参加しました！",

&nbsp;         "image\_url": "https://...",

&nbsp;         "activity\_type": "event",

&nbsp;         "created\_at": "ISO8601",

&nbsp;         "author": {

&nbsp;           "id": "uuid",

&nbsp;           "display\_name": "佐藤 太郎",

&nbsp;           "avatar\_url": "https://..."

&nbsp;         },

&nbsp;         "reactions\_count": {

&nbsp;           "like": 12,

&nbsp;           "clap": 5

&nbsp;         },

&nbsp;         "my\_reactions": \["like"] // ログインユーザーがリアクション済みか

&nbsp;       }

&nbsp;     ],

&nbsp;     "total\_count": 150

&nbsp;   }

&nbsp; }

認証：Required



POST /api/v1/activity-logs



説明：新規活動ログを作成



リクエスト：{ content: string, image\_url?: string, activity\_type?: string }



レスポンス：{ success: true, data: { id, ... } }



バリデーション：content は1文字以上、activity\_type は許可された値のみ



DELETE /api/v1/activity-logs/:id



説明：活動ログを削除



権限チェック：作成者本人、または管理者（Admin）のみ実行可能



レスポンス：{ success: true, message: "Deleted successfully" }



参考資料

/docs/04\_API\_SPECIFICATION.md （API仕様書全体）



/docs/01\_DATABASE\_SCHEMA.md （activity\_logs テーブル定義）



チェックリスト

実装完了時に、以下をすべて確認：



\[ ] GET /api/v1/activity-logs でデータが取得でき、ページングが機能すること



\[ ] レスポンスに author 情報（JOIN結果）が含まれていること



\[ ] レスポンスにリアクションの集計値（reactions\_count）が含まれていること



\[ ] POST で新規投稿が保存され、created\_at が自動設定されること



\[ ] DELETE で自分の投稿は削除でき、他人の投稿は削除できないこと（403エラー）



\[ ] 画像URLがない投稿（テキストのみ）も正常に処理されること



補足・注意事項

リアクション数の集計は、SQLの COUNT と GROUP BY を使用するか、Supabaseクライアントの集計機能を利用して効率的に行ってください。



N+1問題を避けるため、投稿ごとのユーザー情報取得はJOINで一括処理することを推奨します。

