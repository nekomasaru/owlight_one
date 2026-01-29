---

name: "knowledge-ui-list"

description: "信頼度バッジ（Gold/Silver/Bronze）付きのナレッジカードリストを表示し、検索やフィルタリング結果を視覚化するUIコンポーネントを実装する。"

version: "1.0.0"

author: "OWLight Development Team"

tags: \["feature", "knowledge", "ui-component"]

triggers:

&nbsp; - "ナレッジリスト"

&nbsp; - "カードUI"

&nbsp; - "信頼度バッジ"

---



\## 概要



検索結果や新着一覧として表示されるナレッジカードのリストUIを実装します。

各カードには、タイトル・概要に加え、情報の信頼性を一目で判断できる「Trust Tier バッジ（🥇 Gold, 🥈 Silver, 🥉 Bronze）」を表示し、ユーザーが安心して情報を選択できるUXを提供します。



\## このスキルが前提とするもの



\- `knowledge-api-fetch` スキルが実装済みであること（データ取得元）

\- ナレッジのデータ型（Trust Tier を含む）が定義されていること

\- UI ガイドライン（Teal #218F8D, Gold/Silver カラーコード）が利用可能であること

\- アイコンライブラリ（Lucide React 等）が導入されていること



\## 実装内容



\### UI 実装



\*\*コンポーネント：KnowledgeCard.tsx\*\*



\- 機能：ナレッジ1件分の情報を表示するカード

\- 表示項目：

&nbsp; - タイトル（2行までで省略）

&nbsp; - 概要（3行までで省略）

&nbsp; - 作成者アバターと名前

&nbsp; - 更新日

&nbsp; - \*\*Trust Tier バッジ\*\*:

&nbsp;   - Gold: 🥇 公式（法令・規則準拠）

&nbsp;   - Silver: 🥈 準公式（ベテラン監修）

&nbsp;   - Bronze: 🥉 一般（ユーザー投稿）

&nbsp; - メタデータ: 閲覧数、感謝数

\- インタラクション：クリックで詳細画面へ遷移、ホバー時に浮き上がるアニメーション



\*\*コンポーネント：KnowledgeList.tsx\*\*



\- 機能：KnowledgeCard のリスト表示コンポーネント

\- レイアウト：

&nbsp; - PC: 3カラムのグリッド表示

&nbsp; - タブレット: 2カラム

&nbsp; - モバイル: 1カラム（縦積み）

\- 空状態（Empty State）：データがない場合に「ナレッジが見つかりません」等のメッセージとイラストを表示



\### スタイル・演出



\- \*\*カードデザイン\*\*: 白背景、淡いシャドウ（`shadow-sm` -> `shadow-md`）、角丸（`rounded-lg`）

\- \*\*バッジ\*\*: 視認性を高めるため、タイトルの横またはカード右上に配置

\- \*\*ローディング\*\*: スケルトンローディング（`Skeleton`）を表示して待機時間を快適に



\## 参考資料



\- `/docs/03\_SCREEN\_DESIGN.md` （Activity Log / Feed UI仕様）

\- `/docs/11\_OWLIGHT\_CORE\_DEV\_KIT.md` （Design System - Premium Theme）

\- `/docs/12\_KNOWLEDGE\_ARCHITECTURE.md` （Trust Tier Badge の定義）



\## チェックリスト



実装完了時に、以下をすべて確認：



\- \[ ] `KnowledgeCard.tsx` が実装され、Trust Tier に応じて正しいバッジが表示されること

\- \[ ] `KnowledgeList.tsx` がレスポンシブなグリッドレイアウトで表示されること

\- \[ ] データ取得中（Loading）のスケルトン表示が機能すること

\- \[ ] データ0件時のエンプティステートが表示されること

\- \[ ] カードクリック時に `/knowledge/:id` へ遷移すること

\- \[ ] 長いタイトルや概要が適切に省略（...）されること

\- \[ ] ホバー時のマイクロインタラクション（浮き上がり）が動作すること



\## 補足・注意事項



\- バッジの色味は、UIガイドラインの `Teal` と喧嘩しないよう、落ち着いたゴールド・シルバーを選定してください（例: Gold `#D4AF37`, Silver `#C0C0C0`）。

\- 閲覧数や感謝数のアイコンには、Lucide React の `Eye`, `Heart` 等を使用してください。

