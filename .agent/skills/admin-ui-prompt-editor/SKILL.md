name: "admin-ui-prompt-editor"

description: "システムプロンプトの閲覧・編集・バージョン更新を行うための管理者専用UIコンポーネントを実装する。"

version: "1.0.0"

author: "OWLight Development Team"

tags: \["feature", "admin-console", "ui-component"]

triggers:

&nbsp; - "プロンプト編集"

&nbsp; - "Prompt Editor"

&nbsp; - "システム設定"

---



\## 概要



OWLightのAI人格やRAGの挙動を制御する「システムプロンプト」を管理するための画面を実装します。

`admin-api-prompt-crud` を利用してプロンプト一覧を取得・表示し、選択したプロンプトの内容（Content）や説明（Description）を修正して更新できるエディタ機能を提供します。長文のテキストを扱いやすくするため、広めのテキストエリアやオートサイズ機能を備えます。



\## このスキルが前提とするもの



\- `admin-api-prompt-crud` スキルにより、API (`GET/PUT /api/v1/admin/prompts`) が実装済みであること

\- `admin-ui-layout` スキルにより、管理者用レイアウトが利用可能であること

\- UI ガイドライン（Teal #218F8D）および共通コンポーネント（Table, Textarea, Dialog/Modal）が利用可能であること



\## 実装内容



\### UI 実装



\*\*コンポーネント：PromptList.tsx\*\*



\- 機能：プロンプト一覧の表示

\- API：`GET /api/v1/admin/prompts`

\- 表示項目：キー名 (`key`)、説明 (`description`)、最終更新日時。

\- アクション：「編集」ボタン（クリックでエディタを開く）。



\*\*コンポーネント：PromptEditor.tsx\*\*



\- 機能：プロンプト詳細編集フォーム

\- API：`PUT /api/v1/admin/prompts/:key`

\- 状態管理：

&nbsp; - `isEditing`: 編集中かどうか

&nbsp; - `formData`: `{ content, description }`

\- UI要素：

&nbsp; - \*\*Content\*\*: 画面の大部分を占める `Textarea`（モノスペースフォント推奨）。

&nbsp; - \*\*Description\*\*: 概要説明用の `Input`。

&nbsp; - \*\*Action\*\*: 「保存する」（更新APIコール）、「キャンセル」。

\- フィードバック：保存成功時に Toast 通知を表示し、一覧データをリフレッシュ。



\*\*画面レイアウト\*\*



\- 配置：管理者コンソール内の「Prompt Engineering」ページ。

\- 構成：左側にリスト、右側（またはモーダル）にエディタを配置するマスター詳細ビュー、またはシンプルなリスト遷移構成。



\## 参考資料



\- `/docs/03\_SCREEN\_DESIGN.md` （管理画面のモックアップ）

\- `/docs/04\_API\_SPECIFICATION.md` （プロンプト管理APIの仕様）

\- `/docs/05\_UI\_UX\_GUIDELINES.md` （フォームとボタンのスタイル）



\## チェックリスト



実装完了時に、以下をすべて確認：



\- \[ ] `PromptList.tsx` でAPIから取得したプロンプト一覧が表示されること

\- \[ ] 「編集」ボタンでエディタ（`PromptEditor.tsx`）が起動すること

\- \[ ] テキストエリアで長文プロンプトが編集しやすいこと（フォント、サイズ）

\- \[ ] 「保存」ボタンで `PUT` リクエストが送信され、DBが更新されること

\- \[ ] 更新成功時に成功メッセージ（Toast）が表示されること

\- \[ ] 必須入力（Contentが空でないか）のバリデーションが機能すること

\- \[ ] エラー時（API障害など）にアラートが表示されること



\## 補足・注意事項



\- プロンプトはAIの挙動に直結する重要なデータであるため、保存前には「本当に更新しますか？」という確認ダイアログを挟むことを推奨します。

\- 将来的にはバージョン管理（履歴表示）やDiff表示を行いますが、本スキルでは「最新版の直接編集」に機能を絞ります。

