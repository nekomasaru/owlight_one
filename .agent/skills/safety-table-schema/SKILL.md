name: "safety-table-schema"

description: "心理的安全性機能の中核となる discovery\_reports および consultations テーブルを作成し、適切なRLSポリシーを設定する。"

version: "1.0.0"

author: "OWLight Development Team"

tags: \["feature", "safety", "database"]

triggers:

&nbsp; - "心理的安全性DB"

&nbsp; - "失敗報告テーブル"

&nbsp; - "相談テーブル"

---



\## 概要



OWLight の「心理的安全性（Psychological Safety）」モジュールを支える2つの主要テーブルを作成します。

一つは「失敗」を「発見」として再定義する `discovery\_reports`（匿名性サポート）、もう一つは「困った」を学習機会に変える `consultations`（Q\&A）です。特に匿名性の扱いや閲覧制限（RLS）に注意して設計します。



\## このスキルが前提とするもの



\- `users` テーブルが作成済みであること（`auth-table-schema` 完了済み）

\- `knowledge\_base` テーブルが存在すること（将来的な連携のため）



\## 実装内容



\### テーブル設計



以下の SQL を実行してテーブル作成とインデックス設定を行います。



```sql

-- 1. discovery\_reports テーブル（旧: 失敗報告）

-- OWLight 統合設計書 TBL-010 に準拠

CREATE TABLE public.discovery\_reports (

&nbsp; id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),

&nbsp; reporter\_id UUID REFERENCES public.users(id) ON DELETE SET NULL, -- 完全匿名の際はNULL許容

&nbsp; situation\_desc TEXT NOT NULL, -- 状況

&nbsp; discovery\_insight TEXT NOT NULL, -- 発見・気づき

&nbsp; signpost\_solution TEXT NOT NULL, -- 道標・解決策

&nbsp; anonymity\_level TEXT NOT NULL CHECK (anonymity\_level IN ('real\_name', 'semi\_anonymous', 'full\_anonymous')),

&nbsp; praise\_count INTEGER DEFAULT 0,

&nbsp; department\_id TEXT, -- 分析用（匿名でも部署は残す場合あり、運用ポリシーによる）

&nbsp; created\_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

&nbsp; updated\_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL

);



-- 2. consultations テーブル（相談・Q\&A）

-- OWLight 統合設計書 TBL-011 に準拠

CREATE TABLE public.consultations (

&nbsp; id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),

&nbsp; asker\_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

&nbsp; question\_title TEXT NOT NULL,

&nbsp; question\_body TEXT NOT NULL,

&nbsp; status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'archived')),

&nbsp; good\_question\_count INTEGER DEFAULT 0,

&nbsp; created\_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

&nbsp; updated\_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL

);



-- 3. consultation\_comments テーブル（相談への回答）

-- 追加: Q\&Aの回答・リアクション用

CREATE TABLE public.consultation\_comments (

&nbsp; id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),

&nbsp; consultation\_id UUID NOT NULL REFERENCES public.consultations(id) ON DELETE CASCADE,

&nbsp; commenter\_id UUID NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,

&nbsp; content TEXT NOT NULL,

&nbsp; is\_solution BOOLEAN DEFAULT false, -- ベストアンサー

&nbsp; created\_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL

);



-- 4. RLS ポリシーの設定

ALTER TABLE public.discovery\_reports ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.consultation\_comments ENABLE ROW LEVEL SECURITY;



-- Policy: Discovery Report

-- 全員閲覧可能（ただしreporter\_idがNULLや匿名の場合はアプリ側またはViewで隠蔽）

CREATE POLICY "Allow logged-in read access" ON public.discovery\_reports

&nbsp; FOR SELECT USING (auth.role() = 'authenticated');

-- 作成は全員可能

CREATE POLICY "Allow logged-in insert access" ON public.discovery\_reports

&nbsp; FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 更新は作成者のみ（完全匿名の場合は更新不可、または別途トークン管理が必要だがMVPでは制限）

CREATE POLICY "Allow author update access" ON public.discovery\_reports

&nbsp; FOR UPDATE USING (auth.uid() = reporter\_id);



-- Policy: Consultations

-- 全員閲覧・作成可能

CREATE POLICY "Allow logged-in read/insert access" ON public.consultations

&nbsp; FOR ALL USING (auth.role() = 'authenticated');

-- 更新・削除は作成者のみ

CREATE POLICY "Allow author modify access" ON public.consultations

&nbsp; FOR UPDATE USING (auth.uid() = asker\_id);

参考資料

/docs/01\_DATABASE\_SCHEMA.md （TBL-010, TBL-011 定義）



/docs/02\_PSYCHOLOGICAL\_SAFETY\_FRAMEWORK.md （機能1, 機能2 の背景）



/docs/06\_SECURITY\_RLS.md （RLS ポリシー設計）



チェックリスト

実装完了時に、以下をすべて確認：



\[ ] discovery\_reports テーブルが作成され、anonymity\_level のCHECK制約があること



\[ ] consultations テーブルが作成され、status のCHECK制約があること



\[ ] consultation\_comments テーブルが作成され、外部キー制約が正しいこと



\[ ] 各テーブルで RLS が有効化（Enabled）されていること



\[ ] discovery\_reports の reporter\_id が NULL 許容になっていること（完全匿名対応）



\[ ] インデックス（外部キーカラム等）が自動作成または明示的に作成されているか確認



\[ ] 日付カラム（created\_at, updated\_at）のデフォルト値が UTC になっていること



補足・注意事項

完全匿名（full\_anonymous）の場合、DB上は reporter\_id を NULL にするか、アプリ側で保存しないロジックが必要です。本スキルでは NULL 許容スキーマにすることで対応します。



department\_id は users テーブルからコピーするか、投稿時に選択させるかはUI側の仕様に依存しますが、ここではカラムを用意しておきます。

