name: "evaluation-table-schema"

description: "透明な評価システムとピアボーナス機能のための feedback\_sessions および peer\_rewards テーブルを作成する。"

version: "1.0.0"

author: "OWLight Development Team"

tags: \["feature", "evaluation", "database"]

triggers:

&nbsp; - "評価DB"

&nbsp; - "ピアボーナステーブル"

&nbsp; - "Evaluation Schema"

---



\## 概要



「納得感のある評価」と「日常的な称賛」をデータとして蓄積するためのデータベース基盤を構築します。

定期的な1on1や振り返りを記録する `feedback\_sessions` テーブルと、同僚同士で感謝ポイントを送り合う `peer\_rewards` テーブルを作成し、適切なアクセス制御（RLS）を設定します。







\## このスキルが前提とするもの



\- `users` テーブル（users.id）が既に存在すること（外部キー参照のため）



\## 実装内容



\### テーブル設計



以下の SQL を実行してテーブル作成、インデックス設定、および RLS ポリシーの適用を行います。



```sql

-- 1. feedback\_sessions テーブル（1on1・評価面談ログ）

CREATE TABLE public.feedback\_sessions (

&nbsp; id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),

&nbsp; user\_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE, -- 被評価者

&nbsp; reviewer\_id UUID NOT NULL REFERENCES public.users(id), -- 評価者（マネージャー等）

&nbsp; session\_date DATE NOT NULL DEFAULT CURRENT\_DATE,

&nbsp; status TEXT DEFAULT 'scheduled', -- 'scheduled', 'draft', 'completed'

&nbsp; 

&nbsp; -- 評価内容（自己評価、フィードバックコメント、Next Action等）

&nbsp; content JSONB DEFAULT '{}'::jsonb,

&nbsp; 

&nbsp; created\_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

&nbsp; updated\_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL

);



-- 2. peer\_rewards テーブル（ピアボーナス・称賛）

CREATE TABLE public.peer\_rewards (

&nbsp; id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),

&nbsp; sender\_id UUID NOT NULL REFERENCES public.users(id),

&nbsp; receiver\_id UUID NOT NULL REFERENCES public.users(id),

&nbsp; points INTEGER NOT NULL CHECK (points > 0), -- 送付ポイント

&nbsp; message TEXT NOT NULL, -- 感謝のメッセージ

&nbsp; 

&nbsp; created\_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL

);



-- 3. インデックス作成

CREATE INDEX idx\_feedback\_sessions\_user ON public.feedback\_sessions(user\_id);

CREATE INDEX idx\_peer\_rewards\_receiver ON public.peer\_rewards(receiver\_id);

CREATE INDEX idx\_peer\_rewards\_sender ON public.peer\_rewards(sender\_id);



-- 4. RLS (Row Level Security) の設定

ALTER TABLE public.feedback\_sessions ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.peer\_rewards ENABLE ROW LEVEL SECURITY;



-- feedback\_sessions: 当事者（被評価者と評価者）のみ閲覧・更新可

CREATE POLICY "Allow access for participants" ON public.feedback\_sessions

&nbsp; FOR ALL USING (auth.uid() = user\_id OR auth.uid() = reviewer\_id);



-- peer\_rewards: 全員閲覧可（オープンな称賛）、作成は本人のみ（自分宛は不可）

CREATE POLICY "Allow read access for all authenticated users" ON public.peer\_rewards

&nbsp; FOR SELECT USING (auth.role() = 'authenticated');



CREATE POLICY "Allow insert for sender" ON public.peer\_rewards

&nbsp; FOR INSERT WITH CHECK (auth.uid() = sender\_id AND sender\_id != receiver\_id);

参考資料

/docs/01\_DATABASE\_SCHEMA.md （データベース設計全体）



/docs/07\_ROLE\_MODEL\_FRAMEWORK.md （評価と報酬の設計思想）



チェックリスト

実装完了時に、以下をすべて確認：



\[ ] feedback\_sessions テーブルが作成されていること



\[ ] peer\_rewards テーブルが作成され、自己送付防止チェック（sender\_id != receiver\_id）が機能するか（RLSポリシーまたはAPIロジックで担保）



\[ ] content カラムが JSONB 型で定義されていること



\[ ] RLSが有効化され、部外者が他人の評価面談ログを見れないこと



\[ ] ピアボーナスが全ユーザーから閲覧できること（透明性の確保）



\[ ] 外部キー制約（users テーブル参照）が正しく設定されていること



補足・注意事項

peer\_rewards のポイント原資管理（1ヶ月に送れる上限など）は、別途 API 層または users テーブルの付帯情報として管理します。



feedback\_sessions の content JSON構造は、評価フォーマットの変更に柔軟に対応できるようスキーマレスとしていますが、アプリケーション側で型定義をしっかり管理してください。

