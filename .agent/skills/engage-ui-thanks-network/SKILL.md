name: "engage-ui-thanks-network"

description: "ユーザー間の感謝（Thanks）のつながりを可視化するネットワーク図コンポーネントを実装する。"

version: "1.0.0"

author: "OWLight Development Team"

tags: \["feature", "engagement", "ui-component"]

triggers:

&nbsp; - "感謝の輪"

&nbsp; - "ネットワーク可視化"

&nbsp; - "Thanks Network"

---



\## 概要



職員間の「感謝のやり取り」を可視化し、組織内でのつながりや自身の貢献範囲を実感できる「感謝の輪（Thanks Network）」コンポーネントを実装します。

D3.js や React Force Graph 等のライブラリを使用し、自分を中心としたネットワーク図（ノードとリンク）を描画します。ノードはユーザー（アバター）、リンクは感謝のアクションを表し、インタラクティブに操作可能です。



\## このスキルが前提とするもの



\- `engage-api-metrics` スキルにより、感謝ログ取得APIが実装済みであること（または本スキル内で取得ロジックを追加）

\- `thanks\_logs` テーブルにデータが存在すること

\- 可視化ライブラリ（`d3` または `react-force-graph`）が導入されていること



\## 実装内容



\### UI 実装



\*\*コンポーネント：ThanksNetworkGraph.tsx\*\*



\- 機能：感謝のつながりをフォースレイアウト（力学モデル）で描画

\- データソース：`GET /api/v1/engagement/network`（新規定義または `metrics` に含める）

\- ノード（Node）：

&nbsp; - 自分（中心、少し大きく表示）

&nbsp; - 感謝を送った人 / 感謝された人

&nbsp; - 画像：アバターURLを使用（なければイニシャル）

\- リンク（Link）：

&nbsp; - 方向：矢印で表示（Sender -> Receiver）

&nbsp; - 太さ：感謝の回数に応じて変化

\- インタラクション：

&nbsp; - ドラッグ＆ドロップでノードを動かせる

&nbsp; - ホバー時にユーザー名と感謝メッセージを表示（ツールチップ）



\*\*画面レイアウト\*\*



\- 配置：`PersonalDashboard` の中段または下部

\- サイズ：高さ 300px ~ 400px 程度のコンテナ

\- デザイン：背景は白または薄いグレー、リンクの色はブランドカラー（Teal）または暖色系（Orange）



\### データ取得ロジック（簡易）



\*\*GET /api/v1/engagement/network\*\*



\- 説明：ログインユーザーを中心とした感謝のつながりデータを取得

\- クエリ：`depth` (1:直接のやり取りのみ, 2:友達の友達まで)

\- レスポンス：

&nbsp; ```json

&nbsp; {

&nbsp;   "nodes": \[ { "id": "u1", "name": "自分", "img": "..." }, { "id": "u2", "name": "佐藤", "img": "..." } ],

&nbsp;   "links": \[ { "source": "u2", "target": "u1", "value": 3 } ]

&nbsp; }

参考資料

/docs/03\_SCREEN\_DESIGN.md （3.2 Home Dashboard - Thanks Network UI）



/docs/07\_BEHAVIORAL\_DESIGN.md （所属意識と感謝の可視化）



/docs/05\_UI\_UX\_GUIDELINES.md （データビジュアライゼーションの配色）



チェックリスト

実装完了時に、以下をすべて確認：



\[ ] ThanksNetworkGraph.tsx が実装され、ノードとリンクが描画されること



\[ ] 自分（ログインユーザー）が中心に配置されること



\[ ] 感謝データに基づき、正しい相手とリンクが結ばれていること



\[ ] ノードをドラッグして動かせること



\[ ] ホバー時に相手の名前や詳細が表示されること



\[ ] データがない場合（孤立状態）でも、自分だけのノードが表示され「感謝を送ってみよう」等のメッセージが出ること



\[ ] レスポンシブ対応（コンテナサイズに合わせてリサイズされること）



補足・注意事項

ネットワーク図は計算負荷が高くなる可能性があるため、ノード数が多い場合は表示数を制限（例：直近30人のみ）するロジックを入れてください。



react-force-graph を使用すると、Reactコンポーネントとして扱いやすく、実装工数を削減できます。

