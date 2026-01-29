name: "rag-api-chat"

description: "Vertex AI Search と連携し、チャット履歴とナレッジを考慮した回答を生成・ストリーミングするAPIを実装する。"

version: "1.0.0"

author: "OWLight Development Team"

tags: \["feature", "rag", "api"]

triggers:

&nbsp; - "RAGチャット"

&nbsp; - "回答生成"

&nbsp; - "Vertex連携"

---



\## 概要



ユーザーからの質問に対し、OWLight のナレッジベース（GCS/Vertex AI Search）を検索し、その結果を根拠（Grounding）とした回答を生成するAPIを実装します。

マルチターン会話（文脈理解）に対応し、Google Cloud の Discovery Engine API を使用して、ストリーミング形式で回答をフロントエンドに返却します。



\## このスキルが前提とするもの



\- `rag-vertex-setup` スキルが完了し、Vertex AI Search のデータストアID等が環境変数に設定されていること

\- 認証基盤（`auth-api-session`）が存在すること

\- Google Cloud の認証情報（Service Account Key または ADC）がサーバー環境で有効であること



\## 実装内容



\### API 設計



\*\*POST /api/v1/chat\*\*



\- 説明：ユーザーの質問を受け取り、RAGによる回答を生成してストリーミング返却する

\- リクエスト：

&nbsp; ```json

&nbsp; {

&nbsp;   "messages": \[

&nbsp;     { "role": "user", "content": "..." },

&nbsp;     { "role": "assistant", "content": "..." }

&nbsp;   ],

&nbsp;   "conversation\_id": "uuid" (optional)

&nbsp; }

レスポンス：Server-Sent Events (SSE) または Streaming Text



各チャンクには回答テキストと、最後に引用元（Source）メタデータが含まれる



認証：Required



内部ロジック

Vertex AI Search 呼び出し:



ConversationalSearchService を使用。



過去の会話履歴（messages）をコンテキストとして渡す。



servingConfig で Enterprise Edition の設定（Advanced Generative Answers）を指定。



根拠（Citations）の処理:



APIレスポンスに含まれる citations または searchResults から、ドキュメントのタイトル、URL（GCSリンクまたはアプリ内リンク）、スニペットを抽出。



ストリーミング制御:



Vercel AI SDK (ai パッケージ) を使用すると実装が容易（推奨）。GoogleVertexAI プロバイダを利用。



ログ保存（非同期）:



会話ログを chat\_logs テーブル（別途定義またはNoSQL）に保存し、後の分析に活用（本スキルでは最低限のログ出力まで）。



参考資料

/docs/13\_RAG\_CHAT\_ADMIN.md （Vertex AI Search API 利用指針）



/docs/04\_API\_SPECIFICATION.md （API仕様）



\[Vertex AI Search Client Library Documentation]



チェックリスト

実装完了時に、以下をすべて確認：



\[ ] POST /api/v1/chat が実装され、ストリーミングレスポンスが返ること



\[ ] Vertex AI Search に対して正しい dataStoreId でクエリが投げられていること



\[ ] マルチターン（「それはどういう意味？」等の指示語）が正しく機能すること



\[ ] 回答に含まれる根拠（Citation）がフロントエンドで解釈可能な形式で返却されること



\[ ] 環境変数（GCP認証情報）がない場合に適切なエラーが出ること



\[ ] 認証済みユーザー以外のアクセスを拒否すること



補足・注意事項

ローカル開発環境で Vertex AI API を叩くには、gcloud auth application-default login が必要になる場合があります。



レスポンス速度を向上させるため、Edge Runtime の利用も検討してください（ただし、grpc 依存ライブラリとの兼ね合いに注意）。

