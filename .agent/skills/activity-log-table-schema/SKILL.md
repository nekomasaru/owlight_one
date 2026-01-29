name: "activity-log-table-schema"

description: "庁内掲示板機能のための activity\_logs および reactions テーブルを作成し、RLSポリシーを設定する。"

version: "1.0.0"

author: "OWLight Development Team"

tags: \["feature", "activity-log", "database"]

triggers:

&nbsp; - "活動ログDB"

&nbsp; - "掲示板テーブル"

&nbsp; - "Activity Log Schema"

---



\## 概要



職員が日々の活動やイベントの様子を写真付きで投稿できる「庁内掲示板」機能のデータベース基盤を構築します。

タイムライン表示用の `activity\_logs` テーブルと、それに対する「いいね」や「応援」を記録する `reactions` テーブルを作成し、適切なインデックスとセキュリティ設定（RLS）を行います。



\## このスキルが前提とするもの



\- `users` テーブル（users.id）が既に存在すること（外部キー参照のため）



\## 実装内容



\### テーブル設計



以下の SQL を実行してテーブル作成、インデックス設定、および RLS ポリシーの適用を行います。



```sql

-- 1. activity\_logs テーブル（活動投稿）

CREATE TABLE public.activity\_logs (

&nbsp; id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),

&nbsp; user\_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

&nbsp; content TEXT NOT NULL, -- 投稿本文

&nbsp; image\_url TEXT, -- 画像URL（任意）

&nbsp; activity\_type TEXT DEFAULT 'general', -- 'daily\_report', 'event', 'share' 等

&nbsp; created\_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL

);



-- 2. reactions テーブル（いいね・リアクション）

CREATE TABLE public.reactions (

&nbsp; id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),

&nbsp; activity\_log\_id UUID NOT NULL REFERENCES public.activity\_logs(id) ON DELETE CASCADE,

&nbsp; user\_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

&nbsp; reaction\_type TEXT NOT NULL, -- 'like', 'heart', 'clap' 等

&nbsp; created\_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

&nbsp; UNIQUE(activity\_log\_id, user\_id, reaction\_type) -- 同一ユーザーによる同種リアクションの重複防止

);



-- 3. インデックス作成

-- タイムラインは新しい順に表示するため作成日時でインデックス

CREATE INDEX idx\_activity\_logs\_created\_at ON public.activity\_logs(created\_at DESC);

-- 投稿ごとのリアクション数集計を高速化

CREATE INDEX idx\_reactions\_log\_id ON public.reactions(activity\_log\_id);



-- 4. RLS (Row Level Security) の設定

ALTER TABLE public.activity\_logs ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;



-- activity\_logs: 全員閲覧可、作成は本人のみ

CREATE POLICY "Allow read access for all authenticated users" ON public.activity\_logs

&nbsp; FOR SELECT USING (auth.role() = 'authenticated');



CREATE POLICY "Allow insert access for own posts" ON public.activity\_logs

&nbsp; FOR INSERT WITH CHECK (auth.uid() = user\_id);



CREATE POLICY "Allow delete access for own posts" ON public.activity\_logs

&nbsp; FOR DELETE USING (auth.uid() = user\_id);



-- reactions: 全員閲覧可、作成・削除は本人のみ

CREATE POLICY "Allow read access for all authenticated users" ON public.reactions

&nbsp; FOR SELECT USING (auth.role() = 'authenticated');



CREATE POLICY "Allow insert/delete for own reactions" ON public.reactions

&nbsp; FOR ALL USING (auth.uid() = user\_id);

参考資料

/docs/01\_DATABASE\_SCHEMA.md （データベース設計全体）



/docs/04\_API\_SPECIFICATION.md （API仕様書）



チェックリスト

実装完了時に、以下をすべて確認：



\[ ] activity\_logs テーブルが作成されていること



\[ ] reactions テーブルが作成され、複合ユニーク制約が設定されていること



\[ ] タイムライン表示用のインデックス（created\_at DESC）が作成されていること



\[ ] ログインユーザーで activity\_logs にデータを INSERT できること



\[ ] 他人の投稿を DELETE しようとして拒否されること（RLS確認）



\[ ] reactions テーブルで同一ユーザーが同じリアクションを2回送れないこと（制約確認）



\[ ] image\_url カラムが NULL を許容していること



補足・注意事項

画像アップロード用の Storage Bucket 設定はこのスキルには含まれません（別途インフラ設定またはUI実装時に対応）。ここではURLを保存するカラムのみを用意します。



activity\_type は将来的なフィルタリング拡張（例：「イベントのみ表示」）を見越して定義していますが、初期実装では 'general' をデフォルトとします。

