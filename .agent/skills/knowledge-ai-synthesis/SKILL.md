name: "knowledge-ai-synthesis"

description: "Gemini 2.5 Flash を使用し、チャットログや添付ファイルから背景・根拠・具体例を含む構造化されたナレッジJSONを生成するAPIを実装する。"

version: "1.0.0"

author: "OWLight Development Team"

tags: \["feature", "knowledge", "api", "ai"]

triggers:

&nbsp; - "AI蒸留"

&nbsp; - "Gemini連携"

&nbsp; - "ナレッジ生成"

---



\## 概要



OWLight の核心機能である「ナレッジ蒸留（Knowledge Distillation）」ロジックを実装します。

Gemini 2.5 Flash Lite (または最新の Vertex AI モデル) にチャット履歴や添付ファイル（PDF/Word等）を送信し、構造化された JSON（`rationale`, `examples`, `common_mistakes` などを含む）を受け取り、ナレッジ作成APIへ渡せる形式に整形して返却します。



\## このスキルが前提とするもの



\- `knowledge-api-create` スキルが実装済みであること（生成結果の保存先）

\- Gemini API キーが環境変数に設定されていること

\- サーバーサイドでのファイル抽出ロジック（`infra-doc-extraction` スキルで実装予定だが、本スキルではテキスト入力があれば動作可能）

\- `admin-table-prompts` でシステムプロンプトが管理されていること（推奨）



\## 実装内容



\### API 設計



\*\*POST /api/v1/knowledge/synthesize\*\*



\- 説明：入力テキスト（チャットログ等）から構造化ナレッジを生成する

\- リクエスト：

&nbsp; ```json

&nbsp; {

&nbsp;   "chat\_history": \[

&nbsp;     { "role": "user", "text": "..." },

&nbsp;     { "role": "model", "text": "..." }

&nbsp;   ],

&nbsp;   "file\_contents": \[

&nbsp;     { "filename": "manual.txt", "text": "..." }

&nbsp;   ]

&nbsp; }

レスポンス成功：



JSON



{

&nbsp; "success": true,

&nbsp; "data": {

&nbsp;   "title": "...",

&nbsp;   "content": "...",

&nbsp;   "background": "...",

&nbsp;   "rationale": { "laws": \[], "internal\_rules": \[] },

&nbsp;   "examples": \[],

&nbsp;   "common\_mistakes": \[],

&nbsp;   "tags": \[]

&nbsp; }

}

認証：Required



エラー処理：Gemini API エラー時、JSONパース失敗時のリトライロジックを含む



ロジック詳細

プロンプト構築:



システムプロンプト：「あなたは行政ナレッジの専門家です。以下の入力から、背景・根拠・具体例を抽出し、指定されたJSONスキーマに従って出力してください。」



JSONモード（response\_mime\_type: "application/json"）を使用し、スキーマを厳密に指定。



Gemini 呼び出し:



モデル: gemini-2.0-flash (または gemini-1.5-pro、コスト/速度で選択)



generateContent メソッドを使用。



個人情報フィルタリング（DLP）:



入力テキストに含まれる氏名・電話番号などを、正規表現等で簡易マスクしてからAPIに送信（\[Name], \[Phone] 等）。



フォールバック:



JSONパースに失敗した場合、生のテキストを content に入れて返す安全策を実装。



参考資料

/docs/09\_KNOWLEDGE\_ARCHITECTURE.md （AI Synthesis Logic）



/docs/11\_OWLIGHT\_CORE\_DEV\_KIT.md （Dynamic Prompts）



/docs/04\_API\_SPECIFICATION.md （API仕様）



チェックリスト

実装完了時に、以下をすべて確認：



\[ ] POST /api/v1/knowledge/synthesize が実装されていること



\[ ] Gemini API を呼び出し、JSON レスポンスが返ってくること



\[ ] レスポンスが knowledge\_base テーブルのスキーマ（JSONB構造）と一致していること



\[ ] 入力テキスト内の個人情報（電話番号パターン等）がマスクされていること



\[ ] エラー時（APIダウン等）に適切なエラーコードとメッセージを返すこと



\[ ] テストデータ（模擬チャットログ）で意図した構造化データが生成されること



\[ ] zod 等で Gemini からのレスポンスをバリデーションしていること

\[ ] \*\*タグの正規化\*\*: 生成されたタグが既存のタグの類義語である場合、標準タグに変換されるロジック（またはプロンプト内の指示）が含まれていること。



補足・注意事項

Gemini 1.5/2.0 の JSON Mode は非常に強力ですが、稀にスキーマ違反を起こすことがあります。必ず try-catch と JSON.parse 後の検証を入れてください。



プロンプトはコード内にハードコードせず、可能な限り外部ファイルやDBから読み込む設計にしておくと、後のチューニングが楽になります。

