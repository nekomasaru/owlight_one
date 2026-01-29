name: "safety-api-consult"

description: "「困っています」相談の投稿・回答APIを実装し、ステータス（募集中/解決済み）管理と通知連携を行う。"

version: "1.0.0"

author: "OWLight Development Team"

tags: \["feature", "safety", "api"]

triggers:

&nbsp; - "相談API"

&nbsp; - "Q\&A管理"

&nbsp; - "ステータス更新"

---



\## 概要



職員が業務上の疑問を安全に相談できるQ\&A機能のAPIを実装します。

質問の投稿、回答の追加、およびステータス（Open/Resolved/Archived）の更新を行い、回答時には質問者への通知やポイント付与（`good\_question\_count` 等）のロジックを含みます。



\## このスキルが前提とするもの



\- `consultations` および `consultation\_comments` テーブルが作成済みであること（`safety-table-schema` 完了済み）

\- `users` テーブルおよび認証基盤（`auth-api-session`）が存在すること

\- 通知機能（`notify-api-realtime`）との連携準備ができていること（本スキルでは呼び出しポイントを作成）



\## 実装内容



\### API 設計



\*\*POST /api/v1/safety/consultations\*\*



\- 説明：新規相談（質問）を作成

\- リクエスト：`{ title: string, body: string, tags: string\[] }`

\- レスポンス：`{ success: true, data: { id: "uuid", ... } }`

\- 認証：Required



\*\*GET /api/v1/safety/consultations?status=open\&limit=20\*\*



\- 説明：相談一覧を取得

\- クエリ：`status` (open | resolved | all), `limit`, `offset`

\- レスポンス：`{ consultations: \[ { id, title, asker: {...}, comment\_count: 5, ... } ] }`



\*\*POST /api/v1/safety/consultations/:id/comments\*\*



\- 説明：相談への回答またはコメントを追加

\- リクエスト：`{ content: string }`

\- レスポンス：`{ success: true, data: { id: "uuid", ... } }`

\- 副作用：質問者への通知（Notification）を作成



\*\*PATCH /api/v1/safety/consultations/:id/status\*\*



\- 説明：ステータス更新（解決済みマーク等）

\- リクエスト：`{ status: "resolved" | "archived" }`

\- 認証：Required

\- 権限チェック：質問者（`asker\_id`）のみ実行可能



\### ロジック詳細



\- \*\*Good Question カウント\*\*: 質問に対して「良い質問」ボタンが押された場合、`good\_question\_count` をインクリメントするエンドポイント（`POST .../good-question`）も検討（MVPではコメントAPIに含めるか別途）。

\- \*\*ステータス管理\*\*: `resolved` に変更された際、回答者への感謝ポイント付与などのフックを用意する（エンゲージメント機能との連携）。



\## 参考資料



\- `/docs/04\_API\_SPECIFICATION.md` （REQ-011: 「困っています」相談機能詳細）

\- `/docs/02\_PSYCHOLOGICAL\_SAFETY\_FRAMEWORK.md` （機能1: 相談の正規化）

\- `/docs/01\_DATABASE\_SCHEMA.md` （TBL-011 定義）



\## チェックリスト



実装完了時に、以下をすべて確認：



\- \[ ] `POST /api/v1/safety/consultations` が実装され、データが保存されること

\- \[ ] `GET /api/v1/safety/consultations` でステータスフィルタリングが機能すること

\- \[ ] `POST .../comments` が実装され、回答が紐づいて保存されること

\- \[ ] `PATCH .../status` が実装され、質問者のみが解決済みにできること

\- \[ ] 必須項目（タイトル、本文）のバリデーションが機能すること

\- \[ ] 認証されていないユーザーの投稿を拒否すること



\## 補足・注意事項



\- 「わかりません」と言える心理的安全性を確保するため、UI側だけでなくAPIのエラーメッセージ等でも否定的な言葉を使わないよう注意してください。

\- 通知（`notify`）との連携は、まずダミー関数を置いておき、後続のスキルで中身を実装する形でも構いません。

