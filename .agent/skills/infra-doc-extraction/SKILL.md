Markdown





---



name: "infra-doc-extraction"



description: "Word、Excel、PDFなどのドキュメントファイルからテキスト情報を抽出し、AI処理可能な形式に変換するサーバーサイドロジックを実装する。"



version: "1.0.0"



author: "OWLight Development Team"



tags: \["feature", "infrastructure", "integration"]



triggers:

&nbsp; - "ファイル抽出"

&nbsp; - "テキスト変換"

&nbsp; - "ドキュメント解析"



---





\## 概要





OWLight では既存のマニュアルや規定書（Word/Excel/PDF）をナレッジの元データとして利用します。

本スキルでは、アップロードされたマルチパート形式のファイルを受け取り、ファイル形式に応じたライブラリを使用してテキストデータを抽出・クリーニングするAPIエンドポイントおよびユーティリティ関数を実装します。





\## このスキルが前提とするもの





\- Node.js 環境（Next.js API Routes）がセットアップされていること



\- 必要な抽出ライブラリ（`mammoth`, `xlsx`, `pdf-parse` 等）を `package.json` に追加可能であること





\## 実装内容





\### API 設計（api 型の場合のみ）





\*\*POST /api/v1/utils/extract-text\*\*



\- 説明：ファイルを受け取り、抽出されたテキストを返す



\- リクエスト：`multipart/form-data`（key: `file`, value: Binary）



\- レスポンス：

&nbsp; ```json

&nbsp; {

&nbsp;   "success": true,

&nbsp;   "data": {

&nbsp;     "filename": "manual.docx",

&nbsp;     "text": "抽出されたプレーンテキスト...",

&nbsp;     "metadata": { "page\_count": 5, "file\_type": "docx" }

&nbsp;   }

&nbsp; }

認証：Required



抽出ロジック（Utility）

lib/doc-extractor.ts



以下のライブラリを使用してフォーマットごとの抽出処理を実装します。



Word (.docx):



ライブラリ: mammoth



処理: extractRawText を使用し、スタイル情報を除いた純粋なテキストを取得。



Excel (.xlsx):



ライブラリ: xlsx (SheetJS)



処理: 全シートをループし、sheet\_to\_csv または sheet\_to\_txt でテキスト化して結合。LLMが理解しやすいよう、シート名も見出しとして付与。



PDF (.pdf):



ライブラリ: pdf-parse



処理: ページごとのテキストを結合。



クリーニング:



空行の連続削除、制御文字の除去などの正規化処理を行う。



参考資料

/docs/10\_INFRASTRUCTURE\_MIGRATION.md （Data Processing Pipeline）



/docs/09\_KNOWLEDGE\_ARCHITECTURE.md （Input Sources）



/docs/04\_API\_SPECIFICATION.md （Utility API）



チェックリスト

実装完了時に、以下をすべて確認：



\[ ] POST /api/v1/utils/extract-text が実装されていること



\[ ] Wordファイル（.docx）からテキストが抽出できること



\[ ] Excelファイル（.xlsx）の複数シートからテキストが抽出できること



\[ ] PDFファイル（.pdf）からテキストが抽出できること



\[ ] 抽出されたテキストから過剰な改行や制御文字が除去されていること



\[ ] 対応していない拡張子のファイルがアップロードされた際に400エラーを返すこと



\[ ] 5MB以上の大きなファイルでもメモリリークせずに処理できること



\[ ] multipart/form-data のパース処理（formidable や multer 等）が適切に行われていること



補足・注意事項

Excelファイルは表形式の構造が失われると意味が通じなくなる場合があるため、CSV形式に変換するなど、LLMが理解しやすい形式を意識して変換ロジックを調整してください。



OCR（画像からの文字認識）は本スキルには含みません（テキスト埋め込み型PDFのみ対応）。

