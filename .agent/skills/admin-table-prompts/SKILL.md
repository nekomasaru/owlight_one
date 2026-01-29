name: "admin-table-prompts"

description: "AIエージェントのシステムプロンプトを管理・バージョニングするための prompts テーブルを作成する。"

version: "1.0.0"

author: "OWLight Development Team"

tags: \["feature", "admin", "database"]

triggers:

&nbsp; - "プロンプト管理"

&nbsp; - "システムプロンプト"

&nbsp; - "Prompts DB"

---



\## 概要



OWLight 内で使用されるAI（ナレッジ蒸留、チャットボット、分析エージェント等）の挙動を制御する「システムプロンプト」をデータベースで管理します。

ソースコードにハードコードするのではなく、DB管理にすることで、アプリの再デプロイなしにAIの人格やルールを調整可能にします。また、変更履歴（バージョン管理）もサポートします。



\## このスキルが前提とするもの



\- `users` テーブルが作成済みであること（作成者・更新者の記録用）

\- RLS が有効化できる PostgreSQL 環境であること



\## 実装内容



\### テーブル設計



以下の SQL を実行してテーブル作成とインデックス設定を行います。



```sql

-- 1. prompts テーブル

-- プロンプトの定義とバージョン管理

CREATE TABLE public.prompts (

&nbsp; id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),

&nbsp; key TEXT NOT NULL UNIQUE, -- プロンプト識別子 (例: 'knowledge\_synthesis', 'chat\_persona')

&nbsp; version INTEGER NOT NULL DEFAULT 1,

&nbsp; content TEXT NOT NULL, -- システムプロンプト本文

&nbsp; description TEXT, -- 用途説明

&nbsp; is\_active BOOLEAN DEFAULT true,

&nbsp; author\_id UUID REFERENCES public.users(id) ON DELETE SET NULL,

&nbsp; created\_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

&nbsp; updated\_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL

);



-- 2. prompt\_history テーブル（変更履歴）

-- プロンプト更新時にトリガーで履歴を残す（監査用）

CREATE TABLE public.prompt\_history (

&nbsp; id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),

&nbsp; prompt\_id UUID NOT NULL REFERENCES public.prompts(id) ON DELETE CASCADE,

&nbsp; version INTEGER NOT NULL,

&nbsp; content TEXT NOT NULL,

&nbsp; changed\_by UUID REFERENCES public.users(id) ON DELETE SET NULL,

&nbsp; changed\_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL

);



-- 3. インデックス作成

CREATE INDEX idx\_prompts\_key ON public.prompts(key);



-- 4. RLS ポリシーの設定

ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.prompt\_history ENABLE ROW LEVEL SECURITY;



-- 参照: 認証済みユーザー（システム含む）は全プロンプトを取得可能

-- ※ただし、通常はサーバーサイドからService Roleで取得するため、クライアント公開は慎重に

CREATE POLICY "Allow read for authenticated" ON public.prompts

&nbsp; FOR SELECT USING (auth.role() = 'authenticated');



-- 更新: 管理者ロール（admin）のみ許可（簡易的に全authenticated許可は危険なので、メタデータ等で制御推奨）

-- MVPでは、usersテーブルに role カラムがないため、特定のemailドメインやIDで制限するか、

-- API側で制御することを前提に、DBレベルでは authenticated のみ許可（本番は厳密化要）

CREATE POLICY "Allow update for admins" ON public.prompts

&nbsp; FOR UPDATE USING (auth.role() = 'authenticated'); -- TODO: admin check



-- 5. 更新履歴自動保存トリガー

CREATE OR REPLACE FUNCTION public.handle\_prompt\_update()

RETURNS TRIGGER AS $$

BEGIN

&nbsp; IF NEW.content <> OLD.content THEN

&nbsp;   INSERT INTO public.prompt\_history (prompt\_id, version, content, changed\_by)

&nbsp;   VALUES (OLD.id, OLD.version, OLD.content, auth.uid());

&nbsp;   NEW.version := OLD.version + 1;

&nbsp; END IF;

&nbsp; RETURN NEW;

END;

$$ LANGUAGE plpgsql SECURITY DEFINER;



CREATE TRIGGER on\_prompt\_update

&nbsp; BEFORE UPDATE ON public.prompts

&nbsp; FOR EACH ROW EXECUTE PROCEDURE public.handle\_prompt\_update();

参考資料

/docs/11\_OWLIGHT\_CORE\_DEV\_KIT.md （2.3 Prompt Admin 仕様）



/docs/06\_SECURITY\_RLS.md （RLS ポリシー設計）



チェックリスト

実装完了時に、以下をすべて確認：



\[ ] prompts テーブルが作成され、key にユニーク制約があること



\[ ] prompt\_history テーブルが作成されていること



\[ ] prompts を更新すると、自動的に version がインクリメントされ、history に旧データが保存されること（トリガー動作確認）



\[ ] 初期データ（例: key='default\_chat'）を1件インサートできること



\[ ] RLS が有効化されていること



補足・注意事項

プロンプトの中身（content）はAIの挙動を決定する重要な設定値です。本番環境では、管理者以外の更新を厳密にブロックするRLSポリシー（auth.jwt() ->> 'role' = 'admin' 等）を適用してください。



アプリケーション側では、key を指定して最新の content を取得するだけで済むよう設計します。

