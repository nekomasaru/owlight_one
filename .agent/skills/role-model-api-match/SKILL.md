name: "role-model-api-match"

description: "ユーザーの診断回答に基づき、最適なロールモデル（役割タイプ）を判定して登録するAPIを実装する。"

version: "1.0.0"

author: "OWLight Development Team"

tags: \["feature", "role-model", "api"]

triggers:

&nbsp; - "ロール診断API"

&nbsp; - "マッチングロジック"

&nbsp; - "Role Matching"

---



\## 概要



ロールモデル診断ウィザードから送信された回答データ（スコア配列など）を受け取り、事前に定義されたアルゴリズムに基づいて最適なロール（例：`innovator`, `mediator`）を判定します。

判定結果を `role\_models` テーブルに保存し、レスポンスとして決定したロール情報とマッチ度（スコア）を返却します。



\## このスキルが前提とするもの



\- `roles` および `role\_models` テーブルが作成済みであること（`role-model-table-schema` 完了済み）

\- `users` テーブルが存在すること

\- 認証基盤により `current\_user` が特定できること



\## 実装内容



\### API 設計



\*\*POST /api/v1/role-models/match\*\*



\- 説明：診断回答を受け取り、ロールを決定して保存する

\- リクエスト：

&nbsp; ```json

&nbsp; {

&nbsp;   "answers": {

&nbsp;     "q1": 5, // 革新性スコア

&nbsp;     "q2": 3, // 協調性スコア

&nbsp;     "q3": 4  // 堅実性スコア

&nbsp;     // ... 他の質問回答

&nbsp;   }

&nbsp; }

レスポンス：



JSON



{

&nbsp; "success": true,

&nbsp; "data": {

&nbsp;   "role": {

&nbsp;     "id": "uuid",

&nbsp;     "key": "innovator",

&nbsp;     "name": "革新的な開拓者",

&nbsp;     "description": "新しいアイデアで道を切り開くタイプです。",

&nbsp;     "icon\_url": "https://..."

&nbsp;   },

&nbsp;   "match\_score": 85, // 適合率

&nbsp;   "is\_new\_record": true // 新規登録か更新か

&nbsp; }

}

認証：Required



内部ロジック（マッチングアルゴリズム）

スコア集計: 回答（answers）をカテゴリ別（例: Innovation, Support, Management）に集計。



判定: 最も高得点だったカテゴリに対応する role\_key を特定。



DB保存:



roles テーブルから該当ロールの ID を取得。



role\_models テーブルに upsert（既存レコードがあれば更新、なければ作成）。



レスポンス生成: 決定したロール情報を返却。



参考資料

/docs/04\_API\_SPECIFICATION.md （API仕様書全体）



/docs/01\_DATABASE\_SCHEMA.md （role関連テーブル定義）



チェックリスト

実装完了時に、以下をすべて確認：



\[ ] POST /api/v1/role-models/match が実装されていること



\[ ] リクエストボディ（回答データ）のバリデーションが機能すること



\[ ] 回答に基づいて適切なロールが判定されること（ロジックのユニットテスト推奨）



\[ ] role\_models テーブルにデータが保存（または更新）されること



\[ ] レスポンスにロールの詳細情報（名前、説明、アイコン）が含まれていること



\[ ] 未認証ユーザーのリクエストを拒否すること（401）



補足・注意事項

マッチングロジックは将来的に複雑化する可能性があるため、コントローラー内ではなく、独立したサービスクラス（例: RoleMatchingService）として切り出して実装することを推奨します。



今回のフェーズでは「最もスコアが高いもの1つ」をメインロールとして登録します。

