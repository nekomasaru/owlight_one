name: "auth-table-schema"

description: "認証とユーザー管理の基盤となる users および profiles テーブルを作成し、RLSポリシーを設定する。"

version: "1.0.0"

author: "OWLight Development Team"

tags: \["feature", "auth", "database"]

triggers:

&nbsp; - "認証テーブル"

&nbsp; - "ユーザーDB設計"

&nbsp; - "RLS設定"

---



\## 概要



Supabase Auth と連携するユーザー管理基盤を構築します。

`auth.users`（Supabase管理）と 1:1 で紐づく `public.users`（職員マスタ）および `public.profiles`（詳細情報）を作成し、行レベルセキュリティ（RLS）を適用して、セキュアなデータアクセス制御を実現します。



\## このスキルが前提とするもの



\- Supabase プロジェクトが作成済みであること

\- SQL Editor またはマイグレーションツールへのアクセス権限



\## 実装内容



\### テーブル設計



以下の SQL を実行してテーブル作成とセキュリティ設定を行います。



```sql

-- 1. users テーブル（職員マスタ）

-- OWLight 統合設計書 TBL-001 に準拠

CREATE TABLE public.users (

&nbsp; id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,

&nbsp; email TEXT NOT NULL UNIQUE,

&nbsp; display\_name TEXT,

&nbsp; department\_id TEXT, -- Phase 1では簡略化のためTEXT（将来的にdepartmentsテーブルとFK）

&nbsp; grade\_level TEXT,

&nbsp; onboarding\_completed BOOLEAN DEFAULT false,

&nbsp; created\_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

&nbsp; updated\_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL

);



-- 2. profiles テーブル（詳細情報・拡張用）

CREATE TABLE public.profiles (

&nbsp; id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE PRIMARY KEY,

&nbsp; avatar\_url TEXT,

&nbsp; bio TEXT, -- 自己紹介や担当業務のメモ

&nbsp; updated\_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL

);



-- 3. RLS (Row Level Security) の有効化

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;



-- 4. RLS ポリシーの設定



-- users: 全ての認証済みユーザーが参照可能（社内公開）

CREATE POLICY "Allow logged-in read access" ON public.users

&nbsp; FOR SELECT USING (auth.role() = 'authenticated');



-- users: 本人のみ更新可能

CREATE POLICY "Allow individual update access" ON public.users

&nbsp; FOR UPDATE USING (auth.uid() = id);



-- profiles: 全ての認証済みユーザーが参照可能

CREATE POLICY "Allow logged-in read access" ON public.profiles

&nbsp; FOR SELECT USING (auth.role() = 'authenticated');



-- profiles: 本人のみ更新可能

CREATE POLICY "Allow individual update access" ON public.profiles

&nbsp; FOR UPDATE USING (auth.uid() = id);



-- profiles: 本人のみ挿入可能（初回作成時など）

CREATE POLICY "Allow individual insert access" ON public.profiles

&nbsp; FOR INSERT WITH CHECK (auth.uid() = id);



-- 5. 自動同期トリガー（Auth -> Public）

-- 新規ユーザー登録時に public.users にレコードを自動作成する

CREATE OR REPLACE FUNCTION public.handle\_new\_user()

RETURNS TRIGGER AS $$

BEGIN

&nbsp; INSERT INTO public.users (id, email, display\_name)

&nbsp; VALUES (new.id, new.email, new.raw\_user\_meta\_data->>'full\_name');

&nbsp; RETURN new;

END;

$$ LANGUAGE plpgsql SECURITY DEFINER;



CREATE TRIGGER on\_auth\_user\_created

&nbsp; AFTER INSERT ON auth.users

&nbsp; FOR EACH ROW EXECUTE PROCEDURE public.handle\_new\_user();



```



\## 参考資料



\* `/docs/01\_DATABASE\_SCHEMA.md` （Section 3: Database Design \& Schema - TBL-001）

\* `/docs/06\_SECURITY\_RLS.md` （RLS ポリシー設計指針）



\## チェックリスト



実装完了時に、以下をすべて確認：



\* \[ ] `public.users` テーブルが作成されていること（`id` が `auth.users` を参照）

\* \[ ] `public.profiles` テーブルが作成されていること

\* \[ ] 両方のテーブルで RLS が有効化（Enabled）されていること

\* \[ ] SELECT ポリシー：認証済みユーザー（authenticated）が全データを参照できること

\* \[ ] UPDATE ポリシー：`auth.uid() = id` のユーザーのみが更新できること

\* \[ ] `handle\_new\_user` 関数とトリガーが作成されていること

\* \[ ] テストユーザーを作成し、`public.users` に自動的にレコードが追加されるか確認



\## 補足・注意事項



\* `department\_id` は現時点では外部キー制約を設けず TEXT 型で運用します（部署マスタの実装後に移行検討）。

\* `handle\_new\_user` トリガーは Supabase Auth の新規登録フックとして機能します。既存ユーザーがいる場合は手動で `public.users` にデータを移行する必要があります。



