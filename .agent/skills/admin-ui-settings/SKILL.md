name: "infra-script-gcs-sync"

description: "Supabaseのナレッジデータを抽出・整形し、Vertex AI SearchのデータソースとなるGCSバケットへJSONL形式で同期するバッチスクリプトを実装する。"

version: "1.0.0"

author: "OWLight Development Team"

tags: \["feature", "rag", "integration"]

triggers:

&nbsp; - "GCS同期"

&nbsp; - "ナレッジアップロード"

&nbsp; - "Vertexデータ連携"

---



\## 概要



OWLight の RAG 検索精度を維持するために、Supabase 上の最新ナレッジ（`knowledge\_base`）を Google Cloud Storage (GCS) に同期する Node.js スクリプトを実装します。

このスクリプトは、承認済み（`status = 'approved'`）のナレッジのみを抽出し、Vertex AI Search が解釈可能な JSONL（NDJSON）形式に変換して指定のバケットにアップロードします。これを定期実行（Cron等）することで、検索インデックスの鮮度を保ちます。







\## このスキルが前提とするもの



\- `knowledge\_base` テーブルが存在し、データが格納されていること

\- `rag-vertex-setup` スキルにより、同期先の GCS バケット（`owlight-knowledge-store-\[env]`）が作成済みであること

\- Google Cloud の Service Account キー（JSON）が環境変数またはファイルとして利用可能であること



\## 実装内容



\### スクリプト設計



\*\*ファイル: `scripts/sync-knowledge-to-gcs.ts`\*\*



\- \*\*機能\*\*:

&nbsp; 1. \*\*Fetch\*\*: Supabase (PostgreSQL) からデータを取得

&nbsp; 2. \*\*Transform\*\*: Vertex AI Search 用のスキーマに変換

&nbsp; 3. \*\*Upload\*\*: `@google-cloud/storage` を使用して GCS にアップロード



\*\*1. データ取得ロジック\*\*

\- 対象: `knowledge\_base` テーブル

\- 条件: `status = 'approved'` AND `visibility = 'public'` (必要に応じて調整)

\- 取得項目: `id`, `title`, `content`, `tags`, `rationale`, `trust\_tier`, `updated\_at`



\*\*2. データ変換（JSONL形式）\*\*

Vertex AI Search (Structured Data) 向けに以下の形式へ変換します。



```typescript

interface VertexDocument {

&nbsp; id: string;

&nbsp; structData: {

&nbsp;   title: string;

&nbsp;   content: string; // 検索対象の全文

&nbsp;   tags: string\[];

&nbsp;   url: string; // アプリ内の参照URL (/knowledge/:id)

&nbsp;   trust\_tier: string;

&nbsp;   department\_id?: string;

&nbsp;   rationale?: any; // JSONBデータ

&nbsp;   updated\_at: string;

&nbsp; };

&nbsp; content: {

&nbsp;   mimeType: "text/plain";

&nbsp;   uri: string; // GCS URI (optional)

&nbsp; };

}

3\. アップロード処理



バケット名: 環境変数 GCS\_KNOWLEDGE\_BUCKET から取得



ファイル名: knowledge\_export.jsonl (毎回上書き、またはタイムスタンプ付きで管理)



Vertex AI Search の "Continuous Import" が設定されていれば、ファイルを置くだけでインデックスが更新されます。



セキュリティ・検証

認証: GOOGLE\_APPLICATION\_CREDENTIALS 環境変数を使用。



バリデーション: 生成された JSONL が正しい JSON 形式であることを確認（1行1JSON）。



エラーハンドリング: GCS 接続エラーや DB 接続エラー時に、プロセスを終了コード 1 で終了させ、ジョブスケジューラに通知する。



参考資料

/docs/10\_INFRASTRUCTURE\_MIGRATION.md （データパイプラインの設計）



/docs/13\_RAG\_CHAT\_ADMIN.md （検索インデックスの更新頻度）



\[Vertex AI Search: Prepare data for ingestion] (Google Cloud 公式)



チェックリスト

実装完了時に、以下をすべて確認：



\[ ] scripts/sync-knowledge-to-gcs.ts が実装され、実行可能であること



\[ ] Supabase から approved なナレッジのみが抽出されること



\[ ] 生成されたデータが正しい JSONL 形式（改行区切りのJSON）であること



\[ ] GCS バケットへのアップロードが成功すること



\[ ] 環境変数（DB接続情報、GCP認証、バケット名）が設定されていること



\[ ] Vertex AI Search コンソール側で、アップロード後の取り込み（Ingestion）が開始されること



\[ ] 大量データ（例: 1000件）でもメモリ不足にならず動作すること（Stream処理推奨）



補足・注意事項

Vertex AI Search のインデックス更新には数分〜数十分かかる場合があります。



content フィールドには HTML タグを除去したプレーンテキストを入れると、検索精度が向上する場合があります（infra-doc-extraction での処理結果を利用推奨）。

