name: "notify-table-schema"

description: "ユーザーへの通知を管理する notifications テーブルを作成し、リアルタイム配信のためのRLSポリシーを設定する。"

version: "1.0.0"

author: "OWLight Development Team"

tags: \["feature", "notify", "database"]

triggers:

&nbsp; - "通知テーブル"

&nbsp; - "Realtime設定"

&nbsp; - "お知らせDB"

---



\## 概要



OWLight の通知システム（ベル通知、リアルタイム更新）の基盤となるテーブルを作成します。

ユーザーIDごとに未読・既読ステータスを管理し、Supabase Realtime 機能と連携して、新しい通知が追加された瞬間にフロントエンドへプッシュ配信できるようなセキュリティ設計を行います。



\## このスキルが前提とするもの



\- `users` テーブルが作成済みであること（`auth-table-schema` 完了済み）

\- `knowledge\_base` や `consultations` テーブルが存在すること（通知元として参照）



\## 実装内容



\### テーブル設計



以下の SQL を実行してテーブル作成とインデックス設定を行います。



```sql

-- 1. notifications テーブル

-- OWLight 統合設計書および通知システム設計に準拠

CREATE TABLE public.notifications (

&nbsp; id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),

&nbsp; user\_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

&nbsp; actor\_id UUID REFERENCES public.users(id) ON DELETE SET NULL, -- 通知のきっかけを作った人（例: 感謝した人）

&nbsp; type TEXT NOT NULL, -- 'thanks', 'comment', 'system', 'approval\_request'

&nbsp; title TEXT NOT NULL, -- 通知タイトル

&nbsp; message TEXT, -- 通知本文

&nbsp; link\_url TEXT, -- クリック時の遷移先

&nbsp; is\_read BOOLEAN DEFAULT false,

&nbsp; metadata JSONB DEFAULT '{}'::jsonb, -- 関連ID等の拡張データ

&nbsp; created\_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL

);



-- 2. インデックス作成

CREATE INDEX idx\_notifications\_user\_read ON public.notifications(user\_id, is\_read);

CREATE INDEX idx\_notifications\_created\_at ON public.notifications(created\_at DESC);



-- 3. RLS ポリシーの設定

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;



-- 参照: 本人のみ閲覧可能

CREATE POLICY "Allow individual read access" ON public.notifications

&nbsp; FOR SELECT USING (auth.uid() = user\_id);



-- 更新: 本人のみ更新可能（既読フラグ変更など）

CREATE POLICY "Allow individual update access" ON public.notifications

&nbsp; FOR UPDATE USING (auth.uid() = user\_id);



-- 挿入: システム（Service Role）またはトリガー経由のみ許可する運用が望ましいが、

-- 簡易的に authenticated ユーザーからの挿入も許可（他人の user\_id への通知作成）

-- ※本番では関数経由にするのがベストだが、MVPではRLSで制御

CREATE POLICY "Allow insert for others" ON public.notifications

&nbsp; FOR INSERT WITH CHECK (auth.role() = 'authenticated');



-- 4. Realtime の有効化

-- 特定のテーブルの変更を購読できるように設定

ALTER PUBLICATION supabase\_realtime ADD TABLE public.notifications;

参考資料

/docs/14\_OWLIGHT\_BELL\_NOTIFICATIONS.md （通知システムの設計方針）



/docs/06\_SECURITY\_RLS.md （RLS ポリシー設計）



チェックリスト

実装完了時に、以下をすべて確認：



\[ ] notifications テーブルが作成されていること



\[ ] user\_id に対するインデックスが作成されていること（未読件数取得の高速化）



\[ ] RLS が有効化され、他人の通知が見えないようになっていること



\[ ] supabase\_realtime パブリケーションにテーブルが追加されていること



\[ ] type カラム等で通知の種類を識別できる設計になっていること



補足・注意事項

Supabase Realtime をクライアントサイドで購読する際、RLS ポリシーが適用されるため、SELECT ポリシーが正しく設定されていないと通知が届きません（auth.uid() = user\_id でフィルタリングされるため安全です）。



通知の自動削除（古い通知のクリーンアップ）ポリシーは別途バッチ処理で検討してください。

