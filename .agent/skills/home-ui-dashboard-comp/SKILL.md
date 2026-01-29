name: "home-ui-dashboard-comp"

description: "成長グラフ、活動ログ、通知などの主要ウィジェットを統合し、ログイン直後のダッシュボード画面（ホーム）を構築する。"

version: "1.0.0"

author: "OWLight Development Team"

tags: \["feature", "dashboard", "ui-component", "integration"]

triggers:

&nbsp; - "ダッシュボード"

&nbsp; - "ホーム画面"

&nbsp; - "Dashboard Integration"

---



\## 概要



ユーザーがOWLightにログインして最初に目にする「ホーム画面（ダッシュボード）」を実装します。

`growth-viz-ui-timeline` で作成した成長推移グラフをメインコンテンツとして配置し、サイドバーやヘッダーと統合されたレイアウトの中で、最新の活動ログや通知などの重要情報を一元的に表示します。これにより、ユーザーは自身の状況を瞬時に把握し、次のアクションへスムーズに移行できます。







\## このスキルが前提とするもの



\- `growth-viz-ui-timeline` スキルにより、`GrowthTimelineChart` コンポーネントが実装済みであること

\- `nav-ui-sidebar` および `nav-ui-header` による共通レイアウトが適用されていること

\- ユーザー情報（`current\_user`）が取得可能であること



\## 実装内容



\### UI 実装



\*\*コンポーネント：DashboardPage.tsx\*\*



\- \*\*機能\*\*: 各種ウィジェットのレイアウト管理と統合表示

\- \*\*構成要素\*\*:

&nbsp; - \*\*Welcome Header\*\*: 「こんにちは、{User}さん」という挨拶と、現在のロールモデルバッジを表示。

&nbsp; - \*\*Main Section (Growth)\*\*: `GrowthTimelineChart` を配置し、最近の成長推移を強調表示。

&nbsp; - \*\*Sub Section (Activity \& Notifications)\*\*:

&nbsp;   - \*\*Activity Feed\*\*: 最新のナレッジ投稿や称賛履歴の簡易リスト（今回はモックまたは簡易実装）。

&nbsp;   - \*\*Quick Actions\*\*: 「ナレッジを書く」「SOSを送る」などのショートカットボタン。

\- \*\*レイアウト\*\*:

&nbsp; - \*\*Grid Layout\*\*: デスクトップではメイン（左 2/3）とサブ（右 1/3）の2カラム構成。

&nbsp; - \*\*Responsive\*\*: タブレット以下では1カラムにスタック表示。



\*\*画面レイアウト\*\*



\- \*\*Desktop (1024px~)\*\*:

&nbsp; - 左側: 成長グラフ（大）、クイックアクション。

&nbsp; - 右側: 最新のアクティビティ、通知。

\- \*\*Mobile (<768px)\*\*:

&nbsp; - 上から順に: Welcome -> クイックアクション -> 成長グラフ -> アクティビティ。



\## 参考資料



\- `/docs/03\_SCREEN\_DESIGN.md` （ダッシュボード全体のワイヤーフレーム）

\- `/docs/05\_UI\_UX\_GUIDELINES.md` （ダッシュボードのスペーシングとカードデザイン）



\## チェックリスト



実装完了時に、以下をすべて確認：



\- \[ ] `DashboardPage` が `/home` (またはルート) で表示されること

\- \[ ] 依存スキルで作成した `GrowthTimelineChart` が正しくレンダリングされること

\- \[ ] ユーザー名やロール情報が正しく表示されていること

\- \[ ] デスクトップ表示で2カラム、モバイル表示で1カラムのレイアウトになること

\- \[ ] 各カード（ウィジェット）間の余白（Gap）が適切に設定されていること

\- \[ ] クイックアクションボタンから各機能ページへ遷移できること

\- \[ ] データ読み込み中（Loading）に画面全体が真っ白にならず、スケルトンが表示されること



\## 補足・注意事項



\- このスキルは「統合（Integration）」が主目的です。Activity Feedなどの詳細な機能が未実装の場合は、この段階ではプレースホルダー（「近日公開」や静的データ）を表示する形でも構いません。

\- パフォーマンス（Core Web Vitals）を意識し、重いウィジェット（グラフ等）の遅延読み込み（Lazy Loading）を検討してください。

