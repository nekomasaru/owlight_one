name: "knowledge-ui-editor"

description: "AIによって生成されたナレッジJSON（背景・根拠・具体例など）を、人間が確認・修正するためのタブ切り替え式エディタコンポーネントを実装する。"

version: "1.0.0"

author: "OWLight Development Team"

tags: \["feature", "knowledge", "ui-component"]

triggers:

&nbsp; - "ナレッジエディタ"

&nbsp; - "JSON編集UI"

&nbsp; - "構造化データ入力"

---



\## 概要



Gemini が生成した構造化ナレッジ（JSON）を、職員が直感的に編集できる UI コンポーネントを実装します。

単なるテキストエリアではなく、「基本情報」「背景・根拠」「具体例・注意点」の3つのタブに分割し、`rationale` や `examples` などの複雑なデータ構造をフォーム形式で編集可能にします。



\## このスキルが前提とするもの



\- `knowledge-api-create`, `knowledge-api-fetch` スキルが実装済みであること

\- ナレッジ作成・更新用の Zod スキーマが定義されていること

\- UI ガイドライン（Teal #218F8D）および共通コンポーネント（Tabs, Input, Textarea, DynamicFieldArray）が利用可能であること



\## 実装内容



\### UI 実装



\*\*コンポーネント：KnowledgeEditor.tsx\*\*



\- 機能：ナレッジの新規作成・編集フォーム

\- 入力データ：`KnowledgeInput` 型（APIリクエストボディに対応）

\- 構成要素（タブ切り替え）：

&nbsp; 1. \*\*基本情報タブ\*\*:

&nbsp;    - タイトル（Input）

&nbsp;    - 概要・要約（Textarea）

&nbsp;    - タグ入力（TagInput）

&nbsp; 2. \*\*背景・根拠タブ\*\*:

&nbsp;    - 背景・コンテキスト（Textarea）

&nbsp;    - 根拠（DynamicFieldArray）: 法令（laws）と内規（internal\_rules）のリスト追加・削除

&nbsp; 3. \*\*具体例・注意点タブ\*\*:

&nbsp;    - 具体例（DynamicFieldArray）: タイトルと状況説明のセット

&nbsp;    - 失敗例（DynamicFieldArray）: 注意点リスト

- アクションボタン：
  - **Wizardモード**: 「次へ（Next）」「戻る（Back）」によるタブ遷移。
  - **Submit**: 最終タブのみ「ナレッジを保存」ボタンを表示。
  - **Apply**: AI生成案の各項目（タイトル、構成案など）をワンクリックでフォームの各フィールドへ `setValue` する機能。



\*\*コンポーネント：DynamicFieldArray.tsx（共通部品化推奨）\*\*



\- 機能：配列データの追加・削除・編集を行うサブコンポーネント

\- UI：リスト表示、各行に削除ボタン、末尾に「＋追加」ボタン



- **画面レイアウト**
  - 配置：**Side-by-Side (左右分割)**
    - **Left (Main)**: ナレッジ入力フォーム (Tabs)。
    - **Right (Sidebar)**: `AIAssistantPanel` (Chat & Actions)。
  - **Sidebar制御**:
    - **Resizable**: ドラッグハンドルにより幅を自由に変更可能（`sidebarWidth` ステート）。
    - **Collapsible**: `ChevronsRight` (`>>`) で畳み、`ChevronsLeft` (`<<`) で展開。
    - **State Persistence**: 畳む際にコンポーネントを外さず `hidden` クラス等で制御し、**チャット履歴を保持**すること。
  - **スクロール**:
    - 画面全体のスクロールを抑止 (`overflow-hidden`)。
    - 左フォームと右AIパネルがそれぞれ独立してスクロール可能にすること。



\### 状態管理・連携



\- \*\*React Hook Form\*\*: フォームの状態管理に使用

\- \*\*Zod\*\*: バリデーションスキーマの適用（タイトル必須など）

\- \*\*初期値注入\*\*:
  - **編集モード**: `knowledge-api-fetch` の結果をセット。
  - **AI生成モード**: `knowledge-ai-synthesis` の結果をセット。
  - **新規作成 (Search First)**: URLクエリパラメータ (`?title=...`) から `initialTitle` を受け取り、タイトル欄に自動入力。



\## 参考資料



\- `/docs/03\_SCREEN\_DESIGN.md` （エディタ画面のワイヤーフレーム）

\- `/docs/09\_KNOWLEDGE\_ARCHITECTURE.md` （Frontend Components - KnowledgeClipModal）

\- `/docs/05\_UI\_UX\_GUIDELINES.md` （タブおよびフォームのデザイン）



\## チェックリスト



実装完了時に、以下をすべて確認：



\- \[ ] `KnowledgeEditor.tsx` が実装され、3つのタブで切り替え可能であること

\- \[ ] 「基本情報」タブでタイトル・本文・タグが編集できること

\- \[ ] 「背景・根拠」タブで法令・内規のリストを追加・削除できること

\- \[ ] 「具体例」タブで具体例オブジェクト（タイトル・状況）を追加・編集できること

\- \[ ] 保存ボタン押下時に `POST` または `PUT` API が正しく呼ばれること

\- \[ ] バリデーションエラー時（必須項目空など）にメッセージが表示されること

\- \[ ] AI生成データ（JSON）を初期値として正しくロードできること
\- \[ ] URLパラメータ (`?title=...`) がある場合、タイトル入力欄に自動で反映されること

\- \[ ] レスポンシブ対応（スマホ幅でもフォームがはみ出さないこと）



\## 補足・注意事項



\- AIが生成したデータは完璧ではないため、ユーザーが必ず目視確認して修正できるUXにしてください（「AI生成」バッジを表示するなど）。

\- \*\*タグの制限\*\*: ユーザーによる新規タグの手動登録は禁止されています。既存のタグ、またはAIが今回提案したタグから選択させるようにしてください。

\- フォームの内容が多岐にわたるため、誤ってブラウザを閉じた際のアラート（`useBeforeUnload`）の実装を推奨します。

