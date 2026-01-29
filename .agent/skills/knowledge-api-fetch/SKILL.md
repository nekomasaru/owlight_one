name: "knowledge-api-fetch"

description: "ナレッジの詳細情報（構造化データ含む）をID指定で取得し、関連するナレッジも同時に提案するAPIを実装する。"

version: "1.0.0"

author: "OWLight Development Team"

tags: \["feature", "knowledge", "api"]

triggers:

&nbsp; - "ナレッジ取得"

&nbsp; - "詳細API"

&nbsp; - "関連ドキュメント"

---



\## 概要



フロントエンドでナレッジ詳細画面を表示するためのデータを取得するAPIを実装します。

`knowledge\_base` テーブルから指定されたIDのナレッジを取得するだけでなく、JSONB型で格納された構造化データ（背景、根拠など）を適切にパースして返却します。また、同じタグや部署に関連する「おすすめナレッジ」も簡易的に抽出して返します。



\## このスキルが前提とするもの



\- `knowledge\_base` テーブルが作成済みであること（`knowledge-table-schema` 完了済み）

\- ナレッジデータが（テストデータ含め）存在すること

\- 認証基盤（`auth-api-session`）が存在すること



\## 実装内容



\### API 設計



\*\*GET /api/v1/knowledge/:id\*\*



\- 説明：指定されたIDのナレッジ詳細を取得

\- リクエスト：パスパラメータ `id` (UUID)

\- レスポンス成功：

&nbsp; ```json

&nbsp; {

&nbsp;   "success": true,

&nbsp;   "data": {

&nbsp;     "id": "uuid",

&nbsp;     "title": "文書管理規定の解釈について",

&nbsp;     "content": "...",

&nbsp;     "background": "...",

&nbsp;     "rationale": { "laws": \[...], "internal\_rules": \[...] },

&nbsp;     "examples": \[...],

&nbsp;     "common\_mistakes": \[...],

&nbsp;     "author": { "id": "...", "display\_name": "...", "avatar\_url": "..." },

&nbsp;     "tags": \["文書管理"],

&nbsp;     "view\_count": 150,

&nbsp;     "updated\_at": "...",

&nbsp;     "related\_knowledge": \[

&nbsp;       { "id": "...", "title": "...", "trust\_tier": 1 }

&nbsp;     ]

&nbsp;   }

&nbsp; }

認証：Required（参照権限チェック：RLSにより自動制御されるが、API層でも念のため確認）



副作用：view\_count をインクリメントする処理（非同期または別エンドポイント分離も可だが、今回は簡易的に同居または別途 POST /view を呼ぶ設計でも可。本スキルではデータ取得に専念）



GET /api/v1/knowledge/related?id=:id



説明：関連ナレッジの取得（詳細画面のサイドバー用）



クエリ：id (基準となるナレッジID)



ロジック：同じタグを持つナレッジ、または同じ部署のナレッジからランダムに3-5件取得



レスポンス：{ success: true, data: \[...] }



ロジック詳細

データ結合: author\_id をキーにして users テーブル（および profiles）と JOIN し、作成者名を取得します。



JSONB展開: PostgreSQL ドライバによっては JSONB が文字列として返る場合があるため、確実にオブジェクトとしてレスポンスに含めます。



閲覧数カウント: 本APIコール時に view\_count = view\_count + 1 の UPDATE を発行するロジックを含めるか、フロントエンド側で useEffect 等から別途ビーコンを送る設計にします（今回はシンプルに取得API内でカウントアップする方式を採用）。



参考資料

/docs/04\_API\_SPECIFICATION.md （REQ-001 詳細仕様）



/docs/09\_KNOWLEDGE\_ARCHITECTURE.md （構造化データのスキーマ定義）



/docs/01\_DATABASE\_SCHEMA.md （TBL-002 定義）



チェックリスト

実装完了時に、以下をすべて確認：



\[ ] GET /api/v1/knowledge/:id が実装され、詳細データが返却されること



\[ ] 存在しないIDを指定した場合に 404 エラーが返ること



\[ ] rationale, examples 等のJSONBフィールドが正しい構造で返ること



\[ ] 作成者情報（author）が結合されて返ること



\[ ] 関連ナレッジ（related\_knowledge）が取得できること（または別エンドポイントで実装）



\[ ] 閲覧時に view\_count がインクリメントされること（オプション）



\[ ] 認証ヘッダーがない場合に 401 エラーを返すこと



補足・注意事項

view\_count のインクリメントは、過剰な書き込み負荷を避けるため、本番環境では Redis 等のキャッシュ層やログ集計ベースに移行する可能性がありますが、MVPでは直接 DB UPDATE で構いません。



関連ナレッジのロジックは、現時点では「同じタグを持つもの」程度の単純なクエリで十分です（ベクトル検索は rag モジュールで扱います）。

