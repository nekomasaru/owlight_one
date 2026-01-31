# 05_UI_UX_GUIDELINES.md

## 概要

OWLightのUIデザインガイドラインです。
コンセプトである **"Gentle Professionalism"（知的で優しい）** を体現し、ユーザーの心理的安全性を守りながら、Supabaseから取得したデータの信頼度（スコア）を直感的に伝えるためのルールを定めます。

## 1. カラーパレット (Color Palette)

Tealをプライマリーとし、目に優しい中間色を多用します。警告色も攻撃的にならないよう調整します。

| Role | Color Name | Hex Code | Usage |
| --- | --- | --- | --- |
| **Primary** | **Owl Teal** | `#218F8D` | メインアクション、ロゴ、アクティブ状態 |
| **Secondary** | **Slate Grey** | `var(--secondary)` | キャンセル、サブアクション、補佐的ボタン |
| **Background** | **Soft White** | `#F8FAFC` | アプリケーション背景 (Slate-50) |
| **Surface** | **Pure White** | `#FFFFFF` | カード、サイドバー背景 |
| **Text Main** | **Dark Slate** | `#1E293B` | 本文、見出し (Slate-800) |
| **Text Muted** | **Cool Gray** | `#64748B` | 補足情報、プレースホルダー (Slate-500) |
| **Danger** | **Soft Red** | `#EF4444` | エラー、削除アクション (Red-500) |
| **Warning** | **Amber** | `#F59E0B` | 注意喚起 (Amber-500) |
| **SOS** | **Emergency Orange** | `#F97316` | SOSボタン専用 (Orange-500) |

### Dark Mode (ダークモード)
ユーザーの好みや環境に合わせてテーマを切り替える機能を実装します。
*   **Background**: `Slate-950` (`#020617`) をベースとし、完全な黒 (`#000000`) は避ける。
*   **Card**: `Slate-900` (`#0f172a`) を使用し、背景と区別する。
*   **Text**: コントラスト比を保ちつつ、眩しすぎない `Slate-50` (`#f8fafc`) をメインに使用。

## 3. 言語 (Language)
アプリケーションのユーザーインターフェース（UI）は、原則として **日本語** を使用します。
*   **例外**: プロダクト名（OWLight）、コード、標準的な技術用語など、英語表記の方が自然な場合。
*   **翻訳**: すべてのボタン、ラベル、メニュー項目、エラーメッセージは日本語で実装してください。

## 2. タイポグラフィ (Typography)

可読性を最優先し、システムフォント（San Francisco, Inter, Noto Sans JP）を使用します。

* **Font Family**: `Inter`, `Noto Sans JP`, sans-serif
* **Scale**:
* **H1 (Page Title)**: 24px / Bold / Tracking-tight
* **H2 (Section)**: 20px / Semibold
* **H3 (Card Title)**: 16px / Semibold
* **Body**: 14px / Regular / Leading-relaxed (1.6)
* **Small**: 12px / Medium / Text-muted



## 3. コンポーネントスタイル

### Buttons

* **Primary**: Teal背景 + 白文字。角丸 (`rounded-md` or `rounded-full`)。ホバー時は輝度を落とす。
* **Secondary**: 薄いグレー背景 (`Slate-200`) + 濃いグレー文字。キャンセルや否定的なアクション。
* **Outline**: 背景なし + 枠線あり。補助的なアクション。

### Cards (ナレッジ・検索結果)

* **Style**: 白背景、微細なシャドウ (`shadow-sm`)、境界線 (`border-slate-100`)。
* **Data Presentation**:
* 表示するテキスト（タイトル、スニペット）は全て **Supabase** のデータを正とします。


* **Evaluation Score Visualization (Trust Tier)**:
Supabaseの `evaluation_score` 値に基づき、情報の信頼性を可視化します。
* **Gold Tier (High Score)**: カード枠に金/黄色のアクセント、または「Best Practice」バッジ。
* **Silver Tier (Mid Score)**: 通常表示。
* **Bronze Tier (Low/Old)**: 背景色をわずかにグレーアウト。



### AI Answer Box

* **Appearance**: 検索結果最上部に表示。Tealの極薄色背景 (`bg-teal-50`)。
* **Icon**: Gemini/Sparkle アイコンを配置し、AI生成であることを明示。
* **Typography**: 通常の検索結果と区別するため、少し大きめの行間を設定。

### Inputs & Forms

* **Border**: 通常時は `slate-300`。フォーカス時は `teal-500` のリングを表示。
* **Error**: 枠線を `red-400` に変更し、下部に優しい口調のエラーメッセージを表示。
* **Search Input**: 背景色は明確に区別するため `bg-white` (Dark: `bg-zinc-950`) を使用し、入力エリアとしての視認性を高める。

## 4. レイアウトとスペーシング

* **Grid System**: 4px / 8px の倍数を基本とする（Tailwindのspacing scale準拠）。
* **Whitespace**: 情報過多によるストレスを防ぐため、セクション間には十分な余白 (`gap-6` ~ `gap-8`) を設ける。
* **Z-Index Strategy**:
* **Base**: 0
* **Header (Sticky)**: 40
* **Sidebar (Mobile Drawer)**: 50
* **AI Panel (Resizable Sidebar)**: 20 (Main content overlaps if overlay, but here Side-by-Side is used)
* **Modal / Dialog**: 60
* **Toast Notification**: 70
* **Tooltip**: 80

## 4.1. スペシャルレイアウト (Special Layouts)

### Gemini-Style App Sidebar
* **State**: ハンバーガーアイコンにより「Expanded (256px)」と「Collapsed (80px)」を切り替え。
* **Visual**: 閉じた状態ではアイコンのみを表示し、ツールチップでメニュー名を表示。境界線にドラッグ機能は持たせず、クリックによるトグル。

### Persistent AI Sidebar (Side-by-Side)
* **Resizable**: パネル左端のドラッグハンドルにより、ユーザーが幅を自由に調整可能（Min: 250px / Max: 1000px）。
* **Collapsible**: `>>` アイコンで畳み、`<<` アイコンで展開。
* **Persistence**: 開閉時もパネルをアンマウントせず、状態（チャット履歴・入力内容）を保持する。
* **Scroll**: 画面全体のスクロールは禁止し、メインの編集エリアとAIパネルがそれぞれ独立して垂直スクロールするよう制御する。

## 4.2. ウィザード形式のナビゲーション (Wizard Navigation)
* **One Action at a Time**: 多機能なフォームでは、ステップ（タブ）ごとに「次へ」「戻る」のアクションを強調し、認知的負荷を下げる。
* **Submission Restriction**: 最終ステップに到達するまで「保存」アクションは非表示または無効化し、ユーザーが全項目を順に確認する動線を作る。



## 5. インタラクションとアニメーション

* **Transition**: すべてのホバー効果や開閉動作には `duration-200` 程度のスムーズなトランジションを付与。
* **Micro-interactions**:
* **Like/Praise**: クリック時に弾むようなアニメーション。
* **SOS Long Press**: 押し続けている間、円形のプログレスバーがアニメーション進行。


* **Loading State**:
* 画面全体をロックせず、該当コンポーネント部分のみスケルトン画面 (`Skeleton`) を表示。
* 検索中は Vertex AI の応答待ちと Supabase の取得待ちがあるため、スケルトン表示が重要。



## 6. アクセシビリティ (a11y) 基準

* **Contrast**: テキストと背景のコントラスト比は 4.5:1 以上を確保（WCAG AA）。
* **Keyboard Nav**: 全てのインタラクティブ要素に `focus-visible` スタイル（Teal色の太いアウトライン）を設定。
* **Semantic HTML**: 適切なタグ (`<main>`, `<nav>`, `<article>`, `<button>`) の使用を徹底。

## 7. System & Connectivity States

システムの接続状態や障害時のフィードバックに関するルールです。

* **Connecting / Reconnecting**:
  * ユーザーの操作を妨げない「非侵入的」なインジケータ（Toastや画面隅のステータスアイコン）を使用。
  * **Color**: `Amber` (Warning) または `Blue` (Info)。"再接続中..." のような短いメッセージ。

* **Offline / Down**:
  * サーキットブレーカー発動時は、画面全体をブロックせず、影響を受けるパーツのみを「メンテナンス中/オフライン」表示に切り替える。
  * **Message**: 技術的なエラーコードではなく、「現在アクセスしづらくなっています。自動復旧を試みています」といった安心感を与える表現。

* **Admin Dashboard (Health)**:
  * **Healthy**: `Teal` or `Green`
  * **Degraded**: `Amber` (レイテンシ高騰など)
  * **Down**: `Red`

## 8. Knowledge Creation Flow (Search First)

ナレッジマネジメントシステムの体験を分断させないため、**「Search First (検索・対話が先)」** の原則を徹底します。

1.  **Entrance (入口)**: ユーザーは必ず「AIチャット」または「検索」から開始します。
2.  **Transition (移行)**: 検索結果が0件、またはAIが回答できない場合にのみ、「ナレッジを作成する」または「リクエストする」のアクションを提示します。
3.  **Inheritance (継承)**: 作成画面へ移行する際は、直前の検索キーワードやチャット内容を自動的に引き継ぎ、入力負荷を軽減します。
    - *Bad UI*: いきなり空白のフォームを表示する。
    - *Good UI*: 「〇〇について」というタイトルが既に入力された状態でエディタが開く。

