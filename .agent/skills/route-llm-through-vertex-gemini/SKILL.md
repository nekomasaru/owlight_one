name: "route-llm-through-vertex-gemini"

description: "既存のLLM呼び出しをGemini Developer APIからVertex AI Gemini APIに切り替え、ガバナンスと運用を強化する。"

version: "1.0.0"

author: "OWLight Development Team"

tags: ["infrastructure", "llm", "migration"]

triggers:
  - "Vertex AI移行"
  - "LLMルーティング"
  - "Gemini API切り替え"

---


## 概要

アプリケーション内のLLM呼び出し経路を、APIキーベースの「Gemini Developer API」から、IAM認証ベースの「Vertex AI Gemini API」へ移行するための実装および設定手順です。
性能向上よりも、Google Cloud プロジェクトによる一元管理、セキュリティ（IAM/VPC）、およびログ監査（Cloud Logging）の実現を主目的とします。


## このスキルが前提とするもの

- `rag-vertex-setup` スキルにより、GCPプロジェクトとVertex AIの基本設定が完了していること
- 既に Gemini Developer API (`gemini-2.0-flash` 等) を使用したコードベースが存在すること
- 実行環境（Cloud Run/GKE等）で Workload Identity または Service Account が利用可能であること


## 実装内容


### GCP環境設定

**1. プロジェクト・権限設定**
- 対象プロジェクト（例: `owlight-prod`）で **Vertex AI API** を有効化。
- 実行用サービスアカウントを作成し、以下のIAMロールを付与：
  - `roles/aiplatform.user` (Vertex AI ユーザー)
  - `roles/logging.logWriter` (ログ出力用)

**2. リージョン選定**
- 原則として日本リージョン（`asia-northeast1`）を使用。
- モデルの可用性に応じて `us-central1` を検討する場合は、レイテンシとデータレジデンシー要件を確認。


### クライアント実装（Factory Pattern）

既存の呼び出し箇所を修正し、設定（Config）に応じて接続先を切り替えられるファクトリ関数を実装します。

**コンポーネント：LlmClientFactory.ts**

```typescript
import { VertexAI } from '@google-cloud/vertexai';
import { GoogleGenerativeAI } from '@google/generative-ai'; // 旧クライアント

type LlmProvider = "gemini-developer" | "vertex-gemini";

interface LlmConfig {
  provider: LlmProvider;
  projectId?: string;
  location?: string; // default: "asia-northeast1"
  model: string;     // e.g. "gemini-2.0-flash"
}

export function createLlmClient(config: LlmConfig) {
  if (config.provider === "vertex-gemini") {
    // Vertex AI (ADC認証を使用)
    const vertexAI = new VertexAI({
      project: config.projectId,
      location: config.location ?? 'asia-northeast1'
    });
    return vertexAI.getGenerativeModel({ model: config.model });
  } else {
    // Legacy: Gemini Developer API (API Key認証)
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    return genAI.getGenerativeModel({ model: config.model });
  }
}
移行プラン
Dual Route (検証): provider フラグで切り替え可能な状態でデプロイし、ステージング環境で同一プロンプトに対するレスポンスとエラー率を比較。

Switch Default (切り替え): 本番環境のデフォルトを vertex-gemini に変更。

Cleanup (廃止): Developer API用のコードと環境変数（GEMINI_API_KEY）を削除。

参考資料
/docs/09_INFRASTRUCTURE.md （GCP構成図とIAM設計）

Vertex AI Gemini API Documentation

Migrate from Gemini API to Vertex AI

チェックリスト
実装完了時に、以下をすべて確認：

[ ] 対象GCPプロジェクトで Vertex AI API が有効化されている

[ ] 実行環境（Cloud Run等）のSAに roles/aiplatform.user が付与されている

[ ] createLlmClient ファクトリ経由でLLMが呼び出されている

[ ] アプリケーションコード内に APIキー の直書きがない（ADC認証への移行）

[ ] asia-northeast1 (Tokyo) リージョンで動作確認できている

[ ] Cloud Logging に Vertex AI のアクセスログ（Audit Log）が記録されている

[ ] ステージング環境での比較検証で、意図しない劣化がないことを確認済み

[ ] 旧環境変数 GEMINI_API_KEY を Secret Manager / 環境変数から削除した

補足・注意事項
性能について: Vertex AI への移行だけでモデル自体の回答精度や速度が劇的に向上するわけではありません。

認証: ローカル開発時は gcloud auth application-default login を使用し、JSONキーファイルの管理は避けてください。

エラーハンドリング: 403 PERMISSION_DENIED (IAM権限不足) や 429 RESOURCE_EXHAUSTED (クォータ制限) のエラーハンドリングを実装してください。