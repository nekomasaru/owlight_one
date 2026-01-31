name: "infra-supabase-schema"
description: "OWLightのナレッジベース用データベーススキーマ（Wisdom, Tags, Comments, References, Cases）を構築・更新する。"
version: "2.1.0"
author: "OWLight Development Team"
tags: ["infrastructure", "supabase", "schema", "migration"]
triggers:
  - "DBスキーマ構築"
  - "テーブル作成"
  - "マイグレーション実行"
---

## 概要

OWLight設計書に基づき、PostgreSQLのテーブル、インデックス、RLSポリシーを作成します。
このスキルは冪等性（Idempotency）を意識し、`CREATE TABLE IF NOT EXISTS` を使用します。

## 実装内容

以下のSQLを `supabase/migrations/` 配下の適切なファイル（例: `004_knowledge_schema.sql`）として保存し、実行してください。

### 1. Core Tables (Wisdom & Versions)

```sql
-- Wisdom本体
CREATE TABLE IF NOT EXISTS wisdoms (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,
  version INT DEFAULT 1,
  
  -- 評価キャッシュ
  like_count INT DEFAULT 0,
  view_count INT DEFAULT 0,
  helpful_count INT DEFAULT 0,
  quality_score DECIMAL(5,2) DEFAULT 0,
  
  -- メタデータ (Supabase Auth連携)
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 検索用
  search_vector tsvector
);
CREATE INDEX IF NOT EXISTS idx_wisdoms_quality ON wisdoms(quality_score DESC);
CREATE INDEX IF NOT EXISTS idx_wisdoms_search ON wisdoms USING GIN(search_vector);

-- 履歴テーブル
CREATE TABLE IF NOT EXISTS wisdom_versions (
  id SERIAL PRIMARY KEY,
  wisdom_id INT REFERENCES wisdoms(id) ON DELETE CASCADE,
  version INT NOT NULL,
  title TEXT,
  content TEXT,
  summary TEXT,
  changed_by UUID REFERENCES auth.users(id),
  change_reason TEXT,
  reflected_comment_ids INT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(wisdom_id, version)
);
```

### 2. Tag System (DAG Structure)

```sql
CREATE TABLE IF NOT EXISTS tags (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  parent_tag_ids INT[] DEFAULT '{}', -- DAG
  level INT DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tags_parents ON tags USING GIN(parent_tag_ids);

CREATE TABLE IF NOT EXISTS wisdom_tags (
  wisdom_id INT REFERENCES wisdoms(id) ON DELETE CASCADE,
  tag_id INT REFERENCES tags(id) ON DELETE CASCADE,
  confidence_score DECIMAL(3,2) DEFAULT 1.0,
  is_approved BOOLEAN DEFAULT FALSE,
  suggested_by TEXT DEFAULT 'manual',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (wisdom_id, tag_id)
);
```

### 3. Feedback Loop (Comments)

```sql
CREATE TABLE IF NOT EXISTS wisdom_comments (
  id SERIAL PRIMARY KEY,
  wisdom_id INT REFERENCES wisdoms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  comment_text TEXT NOT NULL,
  -- 拡張性のためCHECK制約は緩めに設定
  comment_type TEXT CHECK (comment_type IN ('correction', 'addition', 'question', 'clarification', 'case_study', 'failure_story')),
  is_reflected BOOLEAN DEFAULT FALSE,
  reflected_at TIMESTAMPTZ,
  helpful_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4. References & Cases

```sql
CREATE TABLE IF NOT EXISTS wisdom_references (
  id SERIAL PRIMARY KEY,
  wisdom_id INT REFERENCES wisdoms(id) ON DELETE CASCADE,
  reference_type TEXT CHECK (reference_type IN ('law', 'regulation', 'guideline', 'case_study', 'research', 'background', 'related_wisdom')),
  title TEXT NOT NULL,
  url TEXT,
  citation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wisdom_cases (
  id SERIAL PRIMARY KEY,
  wisdom_id INT REFERENCES wisdoms(id) ON DELETE CASCADE,
  case_type TEXT CHECK (case_type IN ('success', 'failure', 'common')),
  title TEXT NOT NULL,
  situation TEXT,
  action TEXT,
  result TEXT,
  lesson TEXT,
  is_anonymous BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5. RLS Policies (Security)

```sql
-- RLSの有効化
ALTER TABLE wisdoms ENABLE ROW LEVEL SECURITY;
ALTER TABLE wisdom_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wisdom_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE wisdom_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE wisdom_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE wisdom_cases ENABLE ROW LEVEL SECURITY;

-- 読み取りポリシー（全員OK）
CREATE POLICY "Allow public read access" ON wisdoms FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON wisdom_comments FOR SELECT USING (true);

-- 書き込みポリシー（認証済みユーザーのみ）
CREATE POLICY "Allow authenticated insert" ON wisdom_comments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
-- ※詳細なポリシーは運用要件に合わせて追加
```

### チェックリスト
- [ ] すべてのテーブルがエラーなく作成されたか
- [ ] RLSポリシーが有効化されているか（`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`）
- [ ] インデックスが適切に作成されているか
