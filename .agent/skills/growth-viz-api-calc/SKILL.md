name: "growth-viz-api-calc"

description: "過去の自分や同期平均と比較した成長率を計算し、可視化用データを返却するAPIを実装する。"

version: "1.0.0"

author: "OWLight Development Team"

tags: \["feature", "growth-viz", "api"]

triggers:

&nbsp; - "成長率計算"

&nbsp; - "比較API"

&nbsp; - "Growth Calculation"

---



\## 概要



ユーザーの成長を定量的に評価するためのAPIエンドポイントを実装します。

`user\_growth\_metrics` テーブルに蓄積された時系列データをもとに、「前月比の成長率」や「同期入社ユーザーの平均値との乖離」をオンデマンドで計算し、フロントエンドのグラフ描画コンポーネントが利用しやすい形式で返却します。



\## このスキルが前提とするもの



\- `user\_growth\_metrics` テーブルが作成済みであること（`growth-viz-table-schema` 完了済み）

\- `users` テーブル（`created\_at` を含む）が存在すること

\- 認証基盤により `current\_user` が特定できること



\## 実装内容



\### API 設計



\*\*GET /api/v1/growth/summary\*\*



\- 説明：現在の成長ステータスと、比較指標（前月比、同期比）を取得

\- クエリ：なし

\- レスポンス：

&nbsp; ```json

&nbsp; {

&nbsp;   "success": true,

&nbsp;   "data": {

&nbsp;     "current\_points": 1250,

&nbsp;     "growth\_rate\_mom": 15.4, // 前月比成長率 (%)

&nbsp;     "peer\_comparison": {

&nbsp;       "my\_rank": 12, // 同期内順位

&nbsp;       "peer\_avg\_points": 1100, // 同期平均ポイント

&nbsp;       "percentile": 75 // 上位何%にいるか

&nbsp;     },

&nbsp;     "skill\_radar": { // レーダーチャート用

&nbsp;       "innovation": 70,

&nbsp;       "collaboration": 85,

&nbsp;       "diligence": 60

&nbsp;     }

&nbsp;   }

&nbsp; }

ロジック：



ログインユーザーの最新メトリクスを取得。



30日前のメトリクスを取得し、ポイント増加率を計算。



同時期（入社日が前後3ヶ月以内など）の他ユーザーの最新メトリクス平均を算出。



GET /api/v1/growth/timeline?range=6m



説明：過去の推移グラフ用データを取得



クエリ：range (1m, 3m, 6m, 1y)



レスポンス：



JSON



{

&nbsp; "success": true,

&nbsp; "data": \[

&nbsp;   {

&nbsp;     "date": "2023-10-01",

&nbsp;     "my\_points": 800,

&nbsp;     "peer\_avg": 750

&nbsp;   },

&nbsp;   // ... 日次または週次の配列

&nbsp; ]

}

参考資料

/docs/04\_API\_SPECIFICATION.md （API仕様書全体）



/docs/01\_DATABASE\_SCHEMA.md （user\_growth\_metrics 定義）



/docs/07\_ROLE\_MODEL\_FRAMEWORK.md （同期定義や評価ロジック）



チェックリスト

実装完了時に、以下をすべて確認：



\[ ] GET /api/v1/growth/summary が実装され、計算結果が返ること



\[ ] 前月データが存在しない場合（新規ユーザー）の0除算やエラーをハンドリングしていること



\[ ] 同期（Peer）の定義ロジック（例：入社日±90日）が実装されていること



\[ ] GET /api/v1/growth/timeline が指定期間のデータを返すこと



\[ ] 自分以外のユーザーデータ（同期平均）を計算する際、個人情報が漏れないよう集計値のみを扱うこと



\[ ] レスポンス速度確保のため、同期平均の計算結果をキャッシュする（またはマテリアライズドビュー検討）か確認



補足・注意事項

「同期」の定義が厳密すぎると比較対象が0人になる可能性があるため、対象が少ない場合は「全ユーザー平均」や「同部署平均」にフォールバックするロジックを検討してください。



データの集計負荷が高い場合、APIレスポンスのキャッシュ（Next.js unstable\_cache 等）を有効活用してください。

