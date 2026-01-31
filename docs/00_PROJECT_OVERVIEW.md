# 00_PROJECT_OVERVIEW.md

## 1. プロジェクト基本情報

| 項目 | 内容 |
| --- | --- |
| **プロジェクト名** | **OWLight** (オウライト) |
| **コンセプト** | 暗黙知を「集合知」に変え、個人の成長と心理的安全性を守るナレッジ・エコシステム |
| **メタファー** | **Owl (フクロウ)**: 知恵、夜（静けさ）、視野の広さの象徴 |
| **プライマリーカラー** | **Teal (#218F8D)**: 信頼、知性、精神的安定 |
| **開発ステータス** | MVP Development Phase |

## 2. ビジョンとミッション

組織内に埋もれている「暗黙知」や「個人の悩み」に光を当て、誰もが安心して成長できる環境（サンクチュアリ）を提供します。
単なるWikiではなく、**「誰がどのような強み（ロールモデル）を持っているか」**を可視化し、**「適切な評価と称賛」**を循環させることで、組織全体のエンゲージメントを高めます。
知恵（Wisdom）の蓄積と共有が、組織の成長を加速させるコアとなります。

## 3. 技術スタック

| カテゴリ | 技術選定 |
| --- | --- |
| **Frontend** | Next.js (App Router), React, TypeScript |
| **Styling** | Tailwind CSS, Lucide React (Icons), Shadcn UI (Base) |
| **Backend** | Node.js (API Routes / Server Actions) |
| **Database** | PostgreSQL (Supabase) |
| **Auth** | Supabase Auth (Email/Password, MFA) |
| **Infrastructure** | Vercel (Hosting), Supabase (BaaS) with Self-Healing Client |
| **Testing** | Playwright (E2E), Jest (Unit) |
| **AI/Search** | **Google Cloud Vertex AI** (Gemini Pro, Vector Search) |

## 4. コア機能 (MVPスコープ)

### A. Role Model System (役割と適性)

ユーザーの志向性を診断し、組織内での「キャラクター（フクロウのタイプ）」を付与します。

* **診断ウィザード**: ステップ形式の質問で適性を分析。
* **Vertex AI連携**: 診断ロジックに Gemini を活用し、回答から最適な役割を導出。
* **マッチング**: 自分の強みを活かせる役割をシステムが提案。

### B. Growth Visualization (成長の可視化)

「昨日の自分」や「同期」と比較した成長をグラフ化し、モチベーションを維持します。

* **成長タイムライン**: 獲得ポイントやスキル習得の推移を可視化。
* **比較分析**: 同期平均や全体平均との比較（匿名性を担保）。

### C. Evaluation & Praise (評価と称賛)

納得感のある評価と、日常的な感謝の循環を作ります。

* **1on1支援**: フィードバックログの蓄積。
* **ピアボーナス**: 感謝のメッセージとポイントを送付。

### D. Sanctuary (心理的安全性)

組織の中で「逃げ場」や「助け」を求めるための安全装置です。

* **SOSビーコン**: 長押し操作で管理者/メンターへ緊急アラートを匿名送信。
* **隠れ家ウィジェット**: ログに残らない（Ephemeral）AIチャットで、誰にも言えない悩みを吐き出す。

### E. Unified Search (統合検索)

Vertex AI の検索能力と Supabase のデータ管理を組み合わせたRAG検索です。

* **ハイブリッド検索**: Vertex AI Search で自然言語検索を行い、該当ドキュメントIDを取得後、Supabaseから実データ（知恵）を表示。
* **スコア連携**: 組織内でのクオリティスコア（優先度）を Vertex AI にメタデータとして連携し、検索ランキングに反映。
* **AI Answer**: 検索結果に基づいた要約回答を表示。

### F. Admin Console (管理機能)

* **ユーザー管理**: 権限管理とステータス変更。
* **プロンプトエンジニアリング**: Vertex AI に渡すシステムプロンプトの管理。

### G. Reliability & Self-Healing (高可用性)

フェイルセーフなインフラ基盤により、システムの安定稼働を保証します。

* **Self-Healing Client**: 接続障害を自動検知し、指数バックオフによる自動復旧を実行。
* **Circuit Breaker**: 障害時の連鎖的なダウンを防ぐ遮断機構。
* **Health Monitoring**: 30秒ごとのヘルスチェックとパフォーマンストラッキング。

## 5. ディレクトリ構造（主要部分のみ）

```
src/
├── app/
│   ├── (auth)/          # ログイン、登録、MFA
│   ├── (main)/          # メインアプリ画面
│   │   ├── home/        # ダッシュボード
│   │   ├── wisdom/      # 知恵（Wisdom）検索・投稿
│   │   ├── profile/     # ユーザー設定
│   │   ├── growth/      # 成長グラフ
│   │   ├── search/      # 検索結果 (Vertex AI連携)
│   │   └── safety/      # サンクチュアリ関連
│   ├── admin/           # 管理者専用画面
│   ├── api/             # API Routes
│   │   └── v1/
│   │       └── wisdom/  # 知恵関連API
│   ├── error.tsx        # Global Error Boundary
│   └── not-found.tsx    # 404 Page
├── components/
│   ├── ui/              # 共通UIパーツ
│   ├── features/        # 機能別コンポーネント
│   └── layouts/         # Header, Sidebar
├── lib/                 # ユーティリティ (Supabase, Vertex AI Client)
├── types/               # TypeScript型定義
└── styles/              # グローバルスタイル

```

## 6. デザイン原則

* **Gentle Professionalism**: 知的でありながら、冷たくない。Tealを基調とした落ち着きのあるトーン。
* **Psychological Safety First**: ユーザーを追い詰めないUI。エラーメッセージは優しく、SOSは押しやすく。
* **Scannability**: 膨大なナレッジから必要な情報へ最短でアクセスできる視認性。