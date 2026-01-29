name: "knowledge-api-create"

description: "構造化されたナレッジデータを検証・保存し、検索エンジン同期用のキュー処理をトリガーするAPIを実装する。"

version: "1.0.0"

author: "OWLight Development Team"

tags: \["feature", "knowledge", "api"]

triggers:

&nbsp; - "ナレッジ作成"

&nbsp; - "同期キュー"

&nbsp; - "知識保存"

---



\## 概要



ナレッジ作成・保存の中核となるAPIを実装します。

フロントエンドまたはAIエージェントから送信された構造化データ（JSONBを含む）を受け取り、`knowledge\_base` テーブルへ保存します。保存成功後は、**Vertex AI Search API を直接呼び出し (`indexDocument`)、リアルタイムにインデックス登録** を行います（テキストの場合）。ファイル添付がある場合は GCS 連携を行います。



\## このスキルが前提とするもの



\- `knowledge\_base` テーブルが作成済みであること（`knowledge-table-schema` 完了済み）

\- `users` テーブルおよび認証基盤（`auth-api-session`）が存在すること

\- バリデーションライブラリ（Zod等）が利用可能であること



\## 実装内容



\### API 設計



\*\*POST /api/v1/knowledge\*\*



\- 説明：新規ナレッジを作成し、検索インデックス同期の準備を行う

\- リクエスト本文：

&nbsp; ```json

&nbsp; {

&nbsp;   "title": "文書管理規定の解釈について",

&nbsp;   "content": "文書保存期間の例外措置に関する...",

&nbsp;   "background": "監査での指摘事項を受けて...",

&nbsp;   "rationale": { "laws": \["公文書管理法 第5条"], "internal\_rules": \["文書取扱規程 別表1"] },

&nbsp;   "examples": \[{ "title": "ケースA", "situation": "..." }],

&nbsp;   "common\_mistakes": \[],

&nbsp;   "tags": \["文書管理", "監査対応"],

&nbsp;   "trust\_tier": 3

&nbsp; }

レスポンス成功：{ success: true, data: { id: "uuid", ... } }



認証：Required（JWT Bearer Token）



バリデーション：



title: 必須、1-100文字



content: 必須、1文字以上



tags: 最大10個まで



PUT /api/v1/knowledge/:id



説明：既存ナレッジの更新（作成者のみ）



リクエスト：作成時と同様（差分更新）



処理：更新時に synced\_to\_vertex フラグを false にリセットし、再同期対象とする



認証：Required



権限チェック：author\_id == current\_user.id



内部ロジック（同期トリガー）

API 処理内で以下のロジックを実装します（Supabase Edge Functions への移行も考慮しつつ、まずは API Route 内で完結）：



DB保存: knowledge\_base へ INSERT/UPDATE



同期フラグ管理: synced\_to\_vertex = false を明示的に設定



（オプション）即時同期キック: 優先度が高い場合、GCS 同期スクリプトのエンドポイントを叩く（MVPではバッチ処理に委譲するため、フラグ更新のみでOK）



参考資料

/docs/04\_API\_SPECIFICATION.md （REQ-001: ナレッジ登録・管理）



/docs/09\_KNOWLEDGE\_ARCHITECTURE.md （Knowledge System Design v2.0 - API Flow）



/docs/01\_DATABASE\_SCHEMA.md （TBL-002 定義）



チェックリスト

実装完了時に、以下をすべて確認：



\[ ] POST /api/v1/knowledge が実装され、JSONBデータが正しく保存されること



\[ ] PUT /api/v1/knowledge/:id が実装され、更新と権限チェックが機能すること



\[ ] 入力バリデーション（Zod等）が適用されていること



\[ ] 保存・更新時に synced\_to\_vertex が false になること



\[ ] 必須フィールド（title, content）の欠損時に 400 エラーを返すこと



\[ ] 認証されていないリクエストを 401 で弾くこと



\[ ] 他人のナレッジを更新しようとした場合に 403 を返すこと



補足・注意事項

このAPIは、人間が手入力する場合と、AI（Gemini）が生成したデータを保存する場合の両方で利用されます。バリデーションは厳しすぎず、かつデータの整合性を保てるレベル（必須項目のチェック等）に留めてください。



GCSへの実際のアップロード処理は infra-script-gcs-sync スキルで実装するバッチ処理が行うため、このAPIでは「同期待ち状態（synced\_to\_vertex=false）」にすることまでが責務です。

