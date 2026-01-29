name: "engage-api-metrics"

description: "ユーザーごとのポイント（Wisdom Points）集計やレベル計算、および「守った時間」を推計するAPIを実装する。"

version: "1.0.0"

author: "OWLight Development Team"

tags: \["feature", "engagement", "api"]

triggers:

&nbsp; - "ポイント計算"

&nbsp; - "メトリクスAPI"

&nbsp; - "守った時間"

---



\## 概要



ゲーミフィケーション機能の頭脳となるAPIを実装します。

特定のアクション（例：ナレッジ作成、感謝、検索活用）に基づいてポイントを加算するロジックや、それに基づくレベル（フクロウの進化）計算、さらに「守った時間（Time Saved）」の推計ロジックを提供します。



\## このスキルが前提とするもの



\- `wisdom\_points`, `point\_history`, `thanks\_logs` テーブルが作成済みであること（`engage-table-schema` 完了済み）

\- `users` テーブルおよび認証基盤（`auth-api-session`）が存在すること



\## 実装内容



\### API 設計



\*\*GET /api/v1/engagement/metrics\*\*



\- 説明：現在のユーザーのエンゲージメント指標（ポイント、レベル、守った時間）を取得

\- リクエスト：なし（認証トークンからユーザー特定）

\- レスポンス：

&nbsp; ```json

&nbsp; {

&nbsp;   "success": true,

&nbsp;   "data": {

&nbsp;     "current\_points": 1250,

&nbsp;     "total\_points": 5400,

&nbsp;     "level": 3,

&nbsp;     "next\_level\_points": 10000,

&nbsp;     "time\_saved\_minutes": 450,

&nbsp;     "owl\_stage": "young\_adult" // レベルに応じたフクロウの姿

&nbsp;   }

&nbsp; }

認証：Required



POST /api/v1/engagement/activity



説明：ユーザー活動（検索、ナレッジ閲覧など）を記録し、ポイントを加算する（サーバーサイドから呼ばれる内部APIとしても機能）



リクエスト：{ activity\_type: "search" | "view\_knowledge" | "create\_knowledge", metadata: {...} }



レスポンス：{ success: true, points\_awarded: 10, new\_total: 1260 }



ロジック：



create\_knowledge: +50pt



receive\_thanks: +30pt



search: +5pt (1日上限あり)



「守った時間」加算: 検索1回 = 10分、ナレッジ閲覧 = 20分 として推計し加算



内部ロジック

レベル計算: total\_points に基づき、レベル（1-5）を算出。



Lv1: 0-999 (Egg)



Lv2: 1000-2999 (Chick)



Lv3: 3000-9999 (Young)



Lv4: 10000-29999 (Adult)



Lv5: 30000+ (Elder)



参考資料

/docs/04\_API\_SPECIFICATION.md （REQ-002, REQ-021: ポイント関連仕様）



/docs/07\_BEHAVIORAL\_DESIGN.md （Phase 2: Personal Dashboard の仕様）



/docs/11\_OWLIGHT\_CORE\_DEV\_KIT.md （Motivation Logic）



チェックリスト

実装完了時に、以下をすべて確認：



\[ ] GET /api/v1/engagement/metrics が実装され、正しいポイントとレベルが返却されること



\[ ] POST /api/v1/engagement/activity が実装され、ポイント履歴（point\_history）が保存されること



\[ ] ポイント加算時に wisdom\_points テーブルの total\_points と current\_points が更新されること



\[ ] レベル計算ロジックが正しく機能し、次のレベルまでの残りポイントが計算されていること



\[ ] 「守った時間」の推計ロジック（検索回数等に基づく）が実装されていること



\[ ] 1日のポイント獲得上限（検索アクション等）が機能していること（Bot対策）



補足・注意事項

このAPIは、ユーザーのモチベーションを左右する重要な要素です。レスポンスには「今回何ポイント増えたか」を含めることで、UI側で演出（+10pt! のポップアップ等）を行いやすくしてください。



「守った時間」は厳密な計測ではなく、あくまで「ポジティブなフィードバック」としての演出値です。複雑な計算よりも、わかりやすい係数（検索1回10分など）を設定してください。

