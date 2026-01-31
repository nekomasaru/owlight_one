name: "infra-governance-schema"
description: "動的ガバナンスと知恵影響追跡を実現するための拡張DBスキーマと分析ロジックを構築する。"
version: "1.0.0"
author: "OWLight Development Team"
tags: ["infrastructure", "supabase", "governance", "analytics", "hr-tech"]
triggers:
  - "ガバナンス機能実装"
  - "評価システム構築"
  - "影響追跡実装"
  - "動的ルール適用"
---

## 概要

OWLightの高度な機能である「Contextual Governance Engine（動的ガバナンス）」と「Wisdom Impact Attribution（知恵影響追跡）」のためのデータベース構造を定義します。
このモジュールは、AIの判断に対する「人間の主権」を技術的に担保し、人事評価（HR Tech）に利用可能な「貢献データ」を生成します。

## 依存関係
- `infra-supabase-schema` が適用済みであること（`wisdoms`, `users` テーブルが存在すること）。

## 実装内容

以下のSQLを `supabase/migrations/` 配下のファイル（例: `010_governance_schema.sql`）として保存し、実行してください。

### 1. Dynamic Governance (動적ルール管理)

組織の状況（コンテキスト）に応じて、AIの判断基準を動的に変更するためのテーブル群です。

```sql
-- 組織の状況（経営方針、規制環境、市場フェーズ）
CREATE TABLE IF NOT EXISTS organization_context (
  id SERIAL PRIMARY KEY,
  market_phase TEXT, -- 'growth', 'recession' etc.
  strategic_priority TEXT[], -- ['profit', 'compliance']
  regulatory_environment JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 動的ルール定義
CREATE TABLE IF NOT EXISTS dynamic_governance_rules (
  id SERIAL PRIMARY KEY,
  rule_name TEXT NOT NULL,
  trigger_conditions JSONB, -- 適用条件 (例: market_phase = 'recession')
  rule_actions JSONB,       -- 実行内容 (例: threshold = 0.9)
  priority INT DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ルール適用ログ（監査証跡）
CREATE TABLE IF NOT EXISTS governance_rule_applications (
  id SERIAL PRIMARY KEY,
  ai_decision_id UUID, -- AI判定ID
  applied_rules INT[], -- 適用されたルールID配列
  context_snapshot JSONB, -- その時点の状況
  ai_judgment_before JSONB,
  ai_judgment_after JSONB,
  human_override BOOLEAN DEFAULT FALSE,
  applied_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. Wisdom Impact Tracking (知恵の影響追跡)

知恵が「いつ」「誰の」「どんな判断」に使われ、どのような「結果」を生んだかを追跡します。

```sql
-- 知恵の適用記録（Application Recording）
CREATE TABLE IF NOT EXISTS wisdom_applications (
  id SERIAL PRIMARY KEY,
  wisdom_id INT REFERENCES wisdoms(id) ON DELETE CASCADE,
  applied_by UUID REFERENCES auth.users(id),
  application_context TEXT, -- 案件ID等
  influence_type TEXT CHECK (influence_type IN ('decisive', 'significant', 'supporting', 'context')),
  how_used TEXT, -- 適用理由
  applied_at TIMESTAMPTZ DEFAULT NOW()
);

-- 適用結果の測定（Impact Measurement: 6ヶ月後検証用）
CREATE TABLE IF NOT EXISTS wisdom_application_outcomes (
  id SERIAL PRIMARY KEY,
  application_id INT REFERENCES wisdom_applications(id) ON DELETE CASCADE,
  actual_outcome TEXT CHECK (actual_outcome IN ('success', 'failure', 'neutral')),
  financial_impact DECIMAL(15,2), -- 金銭的価値
  qualitative_impact TEXT,
  verified_at TIMESTAMPTZ DEFAULT NOW()
);

-- 知恵の系譜（Lineage: 派生関係）
CREATE TABLE IF NOT EXISTS wisdom_lineage (
  id SERIAL PRIMARY KEY,
  source_wisdom_id INT REFERENCES wisdoms(id),
  derived_wisdom_id INT REFERENCES wisdoms(id),
  generation_gap INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3. Analytics & Reporting (人事評価用メトリクス)

リアルタイム計算コストを下げるため、Materialized Viewを使用して「知恵貢献スコア」を集計します。

```sql
-- 総合影響スコア（LTV）
CREATE MATERIALIZED VIEW IF NOT EXISTS wisdom_impact_scores AS
WITH application_impacts AS (
  SELECT
    wa.wisdom_id,
    COUNT(*) as total_applications,
    COUNT(*) FILTER (WHERE wao.actual_outcome = 'success') as successful_applications,
    COALESCE(SUM(wao.financial_impact), 0) as total_value
  FROM wisdom_applications wa
  LEFT JOIN wisdom_application_outcomes wao ON wa.id = wao.application_id
  GROUP BY wa.wisdom_id
)
SELECT
  w.id as wisdom_id,
  w.title,
  w.created_by,
  COALESCE(ai.total_applications, 0) as app_count,
  COALESCE(ai.total_value, 0) as impact_value,
  -- ランク付けロジック
  CASE
    WHEN ai.total_value > 10000000 THEN 'Gold'
    WHEN ai.total_value > 1000000 THEN 'Silver'
    ELSE 'Bronze'
  END as impact_rank
FROM wisdoms w
LEFT JOIN application_impacts ai ON w.id = ai.wisdom_id;

CREATE INDEX IF NOT EXISTS idx_impact_scores_value ON wisdom_impact_scores(impact_value DESC);
```

### 4. Logic Functions (RPC)

複雑な計算ロジックをデータベース関数として実装します。

- **A. ルール適用関数**: `analyze_and_apply_governance_rules(ai_decision_id)`
    - 現在の `organization_context` を読み取り、マッチするルールを抽出。
    - AIのパラメータ（信頼度閾値など）を修正するJSONを返す。
- **B. 影響連鎖計算関数**: `calculate_wisdom_total_impact(wisdom_id)`
    - `WITH RECURSIVE` を使用して、対象の知恵および「その知恵から派生した子・孫知恵」の `financial_impact` を合計し、生涯価値（LTV）を算出する。

### 運用・保守 (Guardrails)

- **Materialized Viewの更新**:
    - データ反映にラグが生じるため、`REFRESH MATERIALIZED VIEW CONCURRENTLY wisdom_impact_scores` を定期実行（cron job等）する必要があります。
- **プライバシー**:
    - `financial_impact` などの生々しい数字は、適切なRLS（Row Level Security）で閲覧権限を管理職・人事担当者に限定することを推奨します。

### チェックリスト
- [ ] テーブル作成後、テストデータで `wisdom_impact_scores` ビューが正しく集計されるか確認したか
- [ ] 再帰クエリ (`calculate_wisdom_total_impact`) が無限ループしないか（最大深度制限を入れているか）
- [ ] 人事評価システムとしての公平性を担保するため、ロジックが透明化（ドキュメント化）されているか
