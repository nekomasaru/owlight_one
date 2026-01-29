name: "role-model-table-schema"

description: "ロールモデル機能のための roles（マスタ）および role\_models（ユーザー割り当て）テーブルを作成し、RLSを設定する。"

version: "1.0.0"

author: "OWLight Development Team"

tags: \["feature", "role-model", "database"]

triggers:

&nbsp; - "ロールモデルDB"

&nbsp; - "役割テーブル"

&nbsp; - "Role Schema"

---



\## 概要



ユーザーの特性や志向性を診断し、適切な「ロールモデル（役割タイプ）」を付与するためのデータベース基盤を構築します。

ロールの定義（名称、アイコン、説明）を管理するマスタテーブル `roles` と、診断結果に基づいてユーザーとロールを紐付ける `role\_models` テーブルを作成します。



\## このスキルが前提とするもの



\- `users` テーブル（users.id）が既に存在すること（外部キー参照のため）



\## 実装内容



\### テーブル設計



以下の SQL を実行してテーブル作成、インデックス設定、および RLS ポリシーの適用を行います。



```sql

-- 1. roles テーブル（ロール定義マスタ）

CREATE TABLE public.roles (

&nbsp; id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),

&nbsp; key TEXT NOT NULL UNIQUE, -- プログラム参照用キー（例: 'innovator', 'supporter'）

&nbsp; name TEXT NOT NULL, -- 表示名（例: '革新的な開拓者'）

&nbsp; description TEXT NOT NULL, -- ロールの詳細説明

&nbsp; icon\_url TEXT, -- バッジ画像URL

&nbsp; created\_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL

);



-- 2. role\_models テーブル（ユーザーへのロール割り当て）

CREATE TABLE public.role\_models (

&nbsp; id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),

&nbsp; user\_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

&nbsp; role\_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,

&nbsp; match\_score INTEGER DEFAULT 0, -- 適合度（0-100%）

&nbsp; assigned\_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

&nbsp; UNIQUE(user\_id, role\_id) -- 1ユーザーにつき同じロールは1つまで

);



-- 3. インデックス作成

CREATE INDEX idx\_role\_models\_user\_id ON public.role\_models(user\_id);

CREATE INDEX idx\_roles\_key ON public.roles(key);



-- 4. RLS (Row Level Security) の設定

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.role\_models ENABLE ROW LEVEL SECURITY;



-- roles: 全員閲覧可（マスタデータのため）、変更は管理者のみ（別途Adminポリシーにて）

CREATE POLICY "Allow read access for all authenticated users" ON public.roles

&nbsp; FOR SELECT USING (auth.role() = 'authenticated');



-- role\_models: 全員閲覧可（プロフィールのバッジ表示のため）、作成は本人またはシステム

CREATE POLICY "Allow read access for all authenticated users" ON public.role\_models

&nbsp; FOR SELECT USING (auth.role() = 'authenticated');



CREATE POLICY "Allow insert/update for own profile" ON public.role\_models

&nbsp; FOR ALL USING (auth.uid() = user\_id);

参考資料

/docs/01\_DATABASE\_SCHEMA.md （データベース設計全体）



/docs/05\_UI\_UX\_GUIDELINES.md （バッジ表示の仕様）



チェックリスト

実装完了時に、以下をすべて確認：



\[ ] roles テーブルが作成され、key にユニーク制約があること



\[ ] role\_models テーブルが作成され、外部キー制約が設定されていること



\[ ] 認証済みユーザーが roles を SELECT できること



\[ ] 認証済みユーザーが role\_models を SELECT できること



\[ ] match\_score カラム（INTEGER）が存在すること



\[ ] role\_models に複合ユニーク制約（user\_id, role\_id）があること



補足・注意事項

roles テーブルへの初期データ（マスタデータ）投入は、別途シードスクリプトまたは管理画面経由で行います。



1人のユーザーが複数のロールを持つ可能性（メイン/サブなど）を考慮し、role\_models は 1:N の関係で設計しています。

