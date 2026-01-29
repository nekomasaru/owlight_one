name: "rag-vertex-setup"

description: "GCSバケットとの連携およびVertex AI Searchのデータストア設定手順を定義し、検索基盤を確立する。"

version: "1.0.0"

author: "OWLight Development Team"

tags: \["feature", "rag", "integration"]

triggers:

&nbsp; - "Vertex AI 設定"

&nbsp; - "GCS連携"

&nbsp; - "検索基盤構築"

---



\## 概要



OWLight の RAG（Retrieval-Augmented Generation）機能を支える検索基盤である Vertex AI Search (Agent Builder) の初期セットアップ手順を定義します。

Google Cloud Storage (GCS) バケットを作成し、それをデータソースとする Vertex AI Search アプリを作成・設定することで、ファイル（PDF等）のインデックス化が可能になります。
※ テストデータやテキストのみのナレッジについては、API (`DocumentServiceClient`) から直接プッシュ登録するため、GCSは必須ではありませんが、将来的なファイル検索のために構成します。



\## このスキルが前提とするもの



\- Google Cloud Project が作成済みで、課金が有効化されていること

\- Vertex AI API および Discovery Engine API が有効化されていること

\- `knowledge\_base` テーブルが存在すること（データソースとしての整合性確認のため）

\- `infra-script-gcs-sync` スキルが後に実装され、ここにデータを流し込む予定であること



\## 実装内容



\### インフラ設定手順（Integration）



1\. \*\*GCS バケット作成\*\*

&nbsp;  - バケット名: `owlight-knowledge-store-\[env]` (例: `owlight-knowledge-store-dev`)

&nbsp;  - リージョン: `asia-northeast1` (東京)

&nbsp;  - ストレージクラス: Standard

&nbsp;  - アクセス制御: 均一なバケットレベルのアクセス



2\. \*\*Vertex AI Search アプリ作成\*\*

&nbsp;  - コンソールで「Agent Builder」 > 「アプリを作成」 > 「検索」を選択

&nbsp;  - アプリ名: `owlight-search-app`

&nbsp;  - エディション: Enterprise (Advanced Generative Answers を有効化するため)

&nbsp;  - 機能設定:

&nbsp;    - 回答機能: ON (Core + Advanced Generative Answers)

&nbsp;    - マルチターン会話: ON



3\. \*\*データストア設定\*\*

&nbsp;  - データソースとして「Cloud Storage」を選択

&nbsp;  - 対象バケット: 手順1で作成したバケット

&nbsp;  - インポート設定:

&nbsp;    - データ形式: JSONL (for Structured Data) または Unstructured (PDF等)

&nbsp;    - \*\*継続的インポート (Continuous Import)\*\* を有効化 (重要)



4\. \*\*スキーマ定義（JSONLの場合）\*\*

&nbsp;  - `knowledge\_base` テーブルとマッピングするためのスキーマを設定

&nbsp;  - 必須フィールド: `id`, `title`, `content` (searchable)

&nbsp;  - フィルタ用フィールド: `tags` (filterable), `department\_id` (filterable), `trust\_tier` (filterable)

&nbsp;  - リッチデータ: `rationale`, `background` 等も searchable として登録



\### 設定値の保存



作成したリソースのIDを環境変数 (`.env.local`) に保存します。



```bash

NEXT\_PUBLIC\_GCP\_PROJECT\_ID=your-project-id

NEXT\_PUBLIC\_GCP\_LOCATION=global

VERTEX\_SEARCH\_DATA\_STORE\_ID=your-data-store-id

GCS\_KNOWLEDGE\_BUCKET=owlight-knowledge-store-dev

参考資料

/docs/10\_INFRASTRUCTURE\_MIGRATION.md （Phase 3: Vertex AI Search Configuration）



/docs/13\_RAG\_CHAT\_ADMIN.md （Vertex AI Search 構成指針）



\[Vertex AI Search Documentation] (Google Cloud 公式)



チェックリスト

実装完了時に、以下をすべて確認：



\[ ] GCS バケットが作成されていること



\[ ] Vertex AI Search アプリが作成され、Enterprise Edition が選択されていること



\[ ] データストアが GCS バケットとリンクされていること



\[ ] 継続的インポート（Continuous Import）が有効になっていること



\[ ] スキーマ設定で title, content が searchable、tags, trust\_tier が filterable になっていること



\[ ] 環境変数（DATA\_STORE\_ID 等）が .env に記録されていること



\[ ] テスト用 JSONL ファイルを手動アップロードし、コンソール上で検索・回答生成ができること



補足・注意事項

このステップは GCP コンソールでの手動操作が主になりますが、可能であれば Terraform 等の IaC 化を検討してください（MVPでは手動で十分です）。



継続的インポートを有効にすることで、後続の infra-script-gcs-sync スキルで GCS にファイルを置くだけで自動的にインデックスが更新されるようになります。

