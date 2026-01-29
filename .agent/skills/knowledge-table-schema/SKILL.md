name: "knowledge-table-schema"

description: "ナレッジ管理の中核となる knowledge\_base テーブルを作成し、JSONBカラムを含むスキーマを定義する。"

version: "1.0.0"

author: "OWLight Development Team"

tags: \["feature", "knowledge", "database"]

triggers:

&nbsp; - "ナレッジDB"

&nbsp; - "JSONBスキーマ"

&nbsp; - "ナレッジテーブル"

---



\## 概要



OWLight の「構造化ナレッジ（Explicit Knowledge）」を格納する `knowledge\_base` テーブルを作成します。

従来の「タイトル＋本文」だけでなく、「背景（Context）」「根拠（Rationale）」「失敗例（Common Mistakes）」などを柔軟に格納するため、PostgreSQL の JSONB 型を積極的に活用したスキーマを定義します。



\## このスキルが前提とするもの



\- `users` テーブルが作成済みであること（`auth-table-schema` 完了済み）

\- Supabase プロジェクトで `pg\_trgm` などの拡張機能が利用可能であること（検索用）



\## 実装内容



\### テーブル設計



以下の SQL を実行してテーブル作成とインデックス設定を行います。



```sql

-- 1. 拡張機能の有効化（検索・ベクトル用）

CREATE EXTENSION IF NOT EXISTS "pg\_trgm";

CREATE EXTENSION IF NOT EXISTS "vector";



-- 2. knowledge\_base テーブル（ナレッジ本体）

-- OWLight 統合設計書 TBL-002 および Knowledge System Design v2.0 に準拠

CREATE TABLE public.knowledge\_base (

&nbsp; id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),

&nbsp; author\_id UUID NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,

&nbsp; title TEXT NOT NULL,

&nbsp; content TEXT NOT NULL, -- 概要・要約（検索用）

&nbsp; 

&nbsp; -- 構造化データ（JSONB）

&nbsp; background TEXT, -- \[NEW] 背景・コンテキスト

&nbsp; rationale JSONB DEFAULT '{}'::jsonb, -- \[NEW] 根拠（法令、内規） { "laws": \[], "internal\_rules": \[] }

&nbsp; examples JSONB DEFAULT '\[]'::jsonb, -- \[NEW] 具体例 { "title": "", "situation": "" }

&nbsp; common\_mistakes JSONB DEFAULT '\[]'::jsonb, -- \[NEW] 失敗例・注意点

&nbsp; learning\_path JSONB DEFAULT '{}'::jsonb, -- \[NEW] 前提知識・次のステップ

&nbsp; 

&nbsp; -- メタデータ

&nbsp; tags TEXT\[] DEFAULT '{}', -- 配列型タグ

&nbsp; department\_id TEXT, -- 部署ID（フィルタ用）

&nbsp; trust\_tier INTEGER DEFAULT 3, -- 1:Gold(公式), 2:Silver(準公式), 3:Bronze(一般)

&nbsp; 

&nbsp; -- システム管理

&nbsp; view\_count INTEGER DEFAULT 0,

&nbsp; thanks\_count INTEGER DEFAULT 0,

&nbsp; synced\_to\_vertex BOOLEAN DEFAULT false, -- GCS/Vertexへの同期フラグ

&nbsp; is\_preset BOOLEAN DEFAULT false, -- プリセットデータか否か

&nbsp; 

&nbsp; created\_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

&nbsp; updated\_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL

);



-- 3. インデックス作成

CREATE INDEX idx\_knowledge\_author ON public.knowledge\_base(author\_id);

CREATE INDEX idx\_knowledge\_tags ON public.knowledge\_base USING GIN(tags);

CREATE INDEX idx\_knowledge\_rationale ON public.knowledge\_base USING GIN(rationale); -- JSONB検索用

CREATE INDEX idx\_knowledge\_synced ON public.knowledge\_base(synced\_to\_vertex); -- 同期バッチ用



-- 4. RLS ポリシーの設定

ALTER TABLE public.knowledge\_base ENABLE ROW LEVEL SECURITY;



-- 参照: 認証済みユーザーは全員閲覧可能

CREATE POLICY "Allow logged-in read access" ON public.knowledge\_base

&nbsp; FOR SELECT USING (auth.role() = 'authenticated');



-- 作成: 認証済みユーザーなら誰でも作成可能

CREATE POLICY "Allow logged-in insert access" ON public.knowledge\_base

&nbsp; FOR INSERT WITH CHECK (auth.role() = 'authenticated');



-- 更新: 作成者のみ更新可能

CREATE POLICY "Allow author update access" ON public.knowledge\_base

&nbsp; FOR UPDATE USING (auth.uid() = author\_id);



-- 削除: 作成者のみ削除可能（論理削除はアプリ側で制御推奨だが今回は物理削除許可）

CREATE POLICY "Allow author delete access" ON public.knowledge\_base

&nbsp; FOR DELETE USING (auth.uid() = author\_id);

参考資料

/docs/01\_DATABASE\_SCHEMA.md （TBL-002: knowledge\_base 定義）



/docs/09\_KNOWLEDGE\_ARCHITECTURE.md （Knowledge System Design v2.0 - Data Schema）



/docs/06\_SECURITY\_RLS.md （RLS ポリシー設計）



チェックリスト

実装完了時に、以下をすべて確認：



\[ ] public.knowledge\_base テーブルが作成されていること



\[ ] rationale, examples, common\_mistakes が JSONB 型で定義されていること



\[ ] synced\_to\_vertex フラグ（デフォルト false）が存在すること



\[ ] trust\_tier カラム（デフォルト 3）が存在すること



\[ ] GIN インデックス（tags, rationale）が作成されていること



\[ ] RLS が有効化され、作成者のみが更新・削除できるポリシーが適用されていること



\[ ] users テーブルへの外部キー制約（author\_id）が機能していること



補足・注意事項

content カラムは「要約（Abstract）」としての役割を持ちます。Vertex AI Search への同期時には、JSONBの中身も含めたリッチなテキストチャンクを生成しますが、DB上では検索性能のために主要テキストをここに保持します。



trust\_tier はバリデーション（承認）フロー実装時に重要になりますが、初期値は 3 (Bronze) とします。

