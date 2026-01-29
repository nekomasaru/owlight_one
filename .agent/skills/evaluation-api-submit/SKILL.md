name: "evaluation-api-submit"

description: "1on1前の自己評価データや、ピアボーナス（称賛）をシステムに登録するためのAPIエンドポイントを実装する。"

version: "1.0.0"

author: "OWLight Development Team"

tags: \["feature", "evaluation", "api"]

triggers:

&nbsp; - "評価提出API"

&nbsp; - "ピアボーナス送付"

&nbsp; - "Evaluation Submission"

---



\## 概要



定期的な1on1に向けてユーザーが事前提出する自己評価（`feedback\_sessions`）と、日常的に同僚に送る感謝メッセージ（`peer\_rewards`）を受け付けるAPIを実装します。

ピアボーナス送付時には、自分自身への送付を防ぐバリデーションを行い、同時に`notifications` テーブルへ通知レコードを作成するロジックも含みます。



\## このスキルが前提とするもの



\- `feedback\_sessions` および `peer\_rewards` テーブルが作成済みであること（`evaluation-table-schema` 完了済み）

\- `users` および `notifications` テーブルが存在すること

\- 認証基盤により `current\_user` が特定できること



\## 実装内容



\### API 設計



\*\*POST /api/v1/evaluation/feedback-sessions\*\*



\- 説明：自己評価またはフィードバックの下書き・提出を行う

\- リクエスト：

&nbsp; ```json

&nbsp; {

&nbsp;   "reviewer\_id": "uuid", // 評価者（マネージャー）

&nbsp;   "content": {

&nbsp;     "self\_assessment": "今月は目標を達成しました...",

&nbsp;     "concerns": "特になし"

&nbsp;   },

&nbsp;   "status": "draft" // 'draft' | 'completed'

&nbsp; }

レスポンス：{ success: true, data: { id, status, updated\_at } }



認証：Required



POST /api/v1/evaluation/peer-rewards



説明：同僚へ感謝ポイントとメッセージを送る



リクエスト：



JSON



{

&nbsp; "receiver\_id": "uuid",

&nbsp; "points": 10,

&nbsp; "message": "資料作成手伝ってくれてありがとう！"

}

レスポンス：{ success: true, message: "Sent successfully" }



ロジック：



receiver\_id != current\_user.id をチェック（自己送付禁止）。



peer\_rewards にレコード作成。



notifications に受信者への通知を作成（type: 'thanks'）。



（オプション）wisdom\_points の加算処理を呼び出し。



バリデーション

Feedback Session: content はJSON形式であること。reviewer\_id が存在すること。



Peer Rewards: points は 1〜50 の範囲内であること（乱用防止）。message は空でないこと。



参考資料

/docs/04\_API\_SPECIFICATION.md （API仕様書全体）



/docs/01\_DATABASE\_SCHEMA.md （Evaluation関連テーブル定義）



チェックリスト

実装完了時に、以下をすべて確認：



\[ ] POST /api/v1/evaluation/feedback-sessions が実装され、データが保存されること



\[ ] POST /api/v1/evaluation/peer-rewards が実装され、ポイント送付ができること



\[ ] 自分自身にピアボーナスを送ろうとした際に 400 エラーが返ること



\[ ] ピアボーナス送付後、受信者の notifications テーブルにレコードが追加されること



\[ ] 必須項目（message, points）のバリデーションが機能すること



\[ ] 認証されていないリクエストを 401 で弾くこと



補足・注意事項

ピアボーナスの月間送付上限（予算管理）ロジックは、MVPフェーズでは省略可能ですが、本番運用時には必須となるため、拡張性を意識したコード（例: RewardsService クラス）にしておいてください。



通知作成処理は非同期で行っても構いませんが、信頼性確保のためトランザクション内での実行を推奨します。

