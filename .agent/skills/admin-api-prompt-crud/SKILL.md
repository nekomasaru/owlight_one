name: "admin-api-prompt-crud"

description: "AIの挙動を制御するシステムプロンプトの作成、取得、更新、削除を行うCRUD APIを実装する。"

version: "1.0.0"

author: "OWLight Development Team"

tags: \["feature", "admin", "api"]

triggers:

&nbsp; - "プロンプトCRUD"

&nbsp; - "プロンプト更新"

&nbsp; - "バージョン管理"

---



\## 概要



管理者（Admin）がシステムプロンプトを管理するためのAPI群を実装します。

`prompts` テーブルへのCRUD操作に加え、更新時には自動的にバージョンをインクリメントし、`prompt\_history` テーブルに履歴を残すロジック（DBトリガーまたはAPI内ロジック）が含まれます。これにより、AIの挙動変更を安全かつ追跡可能な形で行えます。



\## このスキルが前提とするもの



\- `prompts` および `prompt\_history` テーブルが作成済みであること（`admin-table-prompts` 完了済み）

\- `users` テーブルおよび認証基盤（`auth-api-session`）が存在すること

\- 管理者権限のチェックロジック（ミドルウェアまたは関数）が利用可能であること



\## 実装内容



\### API 設計



\*\*GET /api/v1/admin/prompts\*\*



\- 説明：全システムプロンプトの一覧を取得

\- リクエスト：なし

\- レスポンス：`{ prompts: \[{ id, key, version, description, updated\_at, ... }] }`

\- 認証：Required（Admin Only）



\*\*GET /api/v1/admin/prompts/:key\*\*



\- 説明：特定のプロンプトの最新版を取得

\- リクエスト：パスパラメータ `key` (例: `knowledge\_synthesis`)

\- レスポンス：`{ success: true, data: { id, key, content, version, ... } }`

\- 認証：Required（Admin Only）



\*\*POST /api/v1/admin/prompts\*\*



\- 説明：新規プロンプト定義を作成

\- リクエスト：`{ key: string, content: string, description: string }`

\- レスポンス：`{ success: true, data: { id, ... } }`

\- 認証：Required（Admin Only）



\*\*PUT /api/v1/admin/prompts/:key\*\*



\- 説明：プロンプト内容を更新（新しいバージョンを作成）

\- リクエスト：`{ content: string, description?: string }`

\- レスポンス：`{ success: true, new\_version: 2 }`

\- ロジック：

&nbsp; - DBトリガー `handle\_prompt\_update` が設定されていれば、単純な UPDATE で履歴保存とバージョンアップが自動で行われる。

&nbsp; - トリガーがない場合は、API内でトランザクションを使用して履歴保存と更新を行う。



\*\*GET /api/v1/admin/prompts/:key/history\*\*



\- 説明：特定プロンプトの変更履歴を取得

\- レスポンス：`{ history: \[{ version, content, changed\_by, changed\_at }, ...] }`



\### 内部ロジック



\- \*\*権限チェック\*\*: すべてのエンドポイントで、リクエスターが管理者権限を持っているか確認する。

\- \*\*キャッシュ無効化\*\*: プロンプト更新時、アプリケーション側でキャッシュしているプロンプトがあれば無効化（Revalidation）する仕組みを検討する（MVPでは都度フェッチでも可）。



\## 参考資料



\- `/docs/11\_OWLIGHT\_CORE\_DEV\_KIT.md` （2.3 Prompt Admin 仕様）

\- `/docs/04\_API\_SPECIFICATION.md` （管理機能API仕様）

\- `/docs/01\_DATABASE\_SCHEMA.md` （prompts テーブル定義）



\## チェックリスト



実装完了時に、以下をすべて確認：



\- \[ ] `GET .../prompts` で一覧が取得できること

\- \[ ] `POST .../prompts` で新規プロンプトが作成され、`key` の重複エラーが適切に処理されること

\- \[ ] `PUT .../prompts/:key` で更新ができ、`version` がインクリメントされること

\- \[ ] 更新時に `prompt\_history` に旧データが保存されていること

\- \[ ] 管理者以外のユーザーがアクセスした場合に 403 エラーを返すこと

\- \[ ] `key` で指定して特定プロンプトの内容を取得できること



\## 補足・注意事項



\- プロンプトの `key` はシステム内でハードコードされた定数（例: `SYSTEM\_PROMPT\_CHAT`）と一致させる必要があります。初期データ投入（Seeding）スクリプトで必須プロンプトを作成しておくと開発がスムーズです。

\- プロンプト本文（content）は長文になることが多いため、APIのリクエストサイズ制限に注意してください。

