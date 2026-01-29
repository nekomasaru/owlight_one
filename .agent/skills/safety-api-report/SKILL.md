name: "safety-api-report"

description: "Discovery Report（失敗報告）を作成・閲覧するAPIを実装し、匿名レベルに応じたデータ保存と閲覧制限を実現する。"

version: "1.0.0"

author: "OWLight Development Team"

tags: \["feature", "safety", "api"]

triggers:

&nbsp; - "失敗報告API"

&nbsp; - "Discovery Report"

&nbsp; - "匿名性制御"

---



\## 概要



職員が心理的安全性を持って失敗や発見を報告するための「Discovery Report」APIを実装します。

報告時の匿名性レベル（実名、半匿名、完全匿名）に応じて `reporter\_id` の保存方法を切り替え、閲覧時にはそのレベルに応じたデータを返却するロジックを含みます。



\## このスキルが前提とするもの



\- `discovery\_reports` テーブルが作成済みであること（`safety-table-schema` 完了済み）

\- `users` テーブルおよび認証基盤（`auth-api-session`）が存在すること

\- 匿名性レベルの定義（`real\_name`, `semi\_anonymous`, `full\_anonymous`）が共有されていること



\## 実装内容



\### API 設計



\*\*POST /api/v1/safety/discovery\*\*



\- 説明：新規 Discovery Report を作成

\- リクエスト：

&nbsp; ```json

&nbsp; {

&nbsp;   "situation\_desc": "住民票発行時の誤交付...",

&nbsp;   "discovery\_insight": "確認フローが形骸化していた...",

&nbsp;   "signpost\_solution": "ダブルチェックの手順見直し...",

&nbsp;   "anonymity\_level": "semi\_anonymous"

&nbsp; }

レスポンス成功：{ success: true, data: { id: "uuid", ... } }



認証：Required



ロジック：



anonymity\_level が full\_anonymous の場合、DBへの reporter\_id 保存時に NULL を設定（RLSだけでなくアプリ側でも保存しない）。



semi\_anonymous の場合、IDは保存するが、一般ユーザー閲覧時にマスクする。



GET /api/v1/safety/discovery?limit=20\&offset=0



説明：Discovery Report 一覧を取得



クエリ：ページング用パラメータ



レスポンス：



JSON



{

&nbsp; "reports": \[

&nbsp;   {

&nbsp;     "id": "...",

&nbsp;     "situation\_desc": "...",

&nbsp;     "reporter": { "display\_name": "匿名職員", "avatar\_url": null } // 半匿名・完全匿名の場合

&nbsp;   }

&nbsp; ]

}

ロジック：



取得時に anonymity\_level をチェック。



full\_anonymous: reporter 情報は一切返さない。



semi\_anonymous: 管理職ロール（Manager）以外のリクエストには reporter を隠蔽して返す。



real\_name: 通常通り reporter 情報を結合して返す。



称賛機能（簡易）

POST /api/v1/safety/discovery/:id/praise



説明：報告に対して称賛（Good Discovery）を送る



処理：praise\_count をインクリメント



レスポンス：{ success: true, new\_count: 5 }



参考資料

/docs/04\_API\_SPECIFICATION.md （REQ-010: Discovery Report 詳細仕様）



/docs/02\_PSYCHOLOGICAL\_SAFETY\_FRAMEWORK.md （機能2: 失敗情報の資産化）



/docs/01\_DATABASE\_SCHEMA.md （TBL-010 定義）



チェックリスト

実装完了時に、以下をすべて確認：



\[ ] POST /api/v1/safety/discovery が実装され、匿名レベルに応じた保存が行われること



\[ ] 完全匿名（full\_anonymous）選択時に reporter\_id が NULL で保存されること



\[ ] GET /api/v1/safety/discovery が実装され、閲覧権限に応じたマスク処理が機能すること



\[ ] 管理職（Manager）以外のユーザーが半匿名レポートを見た際、投稿者が「匿名」と表示されること



\[ ] 称賛API（praise）が機能し、カウントアップされること



\[ ] 必須項目（状況、発見、道標）のバリデーションが機能すること



補足・注意事項

匿名性の担保は本機能の生命線です。特に「完全匿名」の場合は、システム管理者であってもDBから投稿者を特定できない（IDを保存しない）実装を徹底してください。



「失敗」という言葉をAPIのエラーメッセージ等でも使わず、「Discovery（発見）」という用語で統一してください。

