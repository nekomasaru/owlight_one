name: "engage-table-schema"

description: "職員の貢献度を可視化するための wisdom\_points および thanks\_logs テーブルを作成し、ゲーミフィケーション基盤を構築する。"

version: "1.0.0"

author: "OWLight Development Team"

tags: \["feature", "engagement", "database"]

triggers:

&nbsp; - "貢献度DB"

&nbsp; - "ポイントテーブル"

&nbsp; - "感謝ログ"

---



\## 概要



OWLight の「隠れゲーミフィケーション」を支えるデータベース基盤を構築します。

ユーザーの貢献（ナレッジ登録、検索活用、感謝の受領など）を数値化する `wisdom\_points` テーブルと、感謝のやり取りを記録して「感謝の輪」を可視化するための `thanks\_logs` テーブルを作成します。



\## このスキルが前提とするもの



\- `users` テーブルが作成済みであること（`auth-table-schema` 完了済み）

\- `knowledge\_base` テーブルが存在すること（感謝対象として参照）

\- `consultations` テーブルが存在すること（Q\&A貢献の記録のため）



\## 実装内容



\### テーブル設計



以下の SQL を実行してテーブル作成とインデックス設定を行います。



```sql

-- 1. wisdom\_points テーブル（ユーザーごとの累積ポイント・レベル）

CREATE TABLE public.wisdom\_points (

&nbsp; user\_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,

&nbsp; current\_points INTEGER DEFAULT 0, -- 現在のポイント

&nbsp; total\_points INTEGER DEFAULT 0, -- 累計獲得ポイント（レベル計算用）

&nbsp; level INTEGER DEFAULT 1, -- フクロウの進化段階 (1:卵 -> 5:長老)

&nbsp; time\_saved\_minutes INTEGER DEFAULT 0, -- 「守った時間」の累計（推計値）

&nbsp; last\_updated\_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL

);



-- 2. point\_history テーブル（ポイント獲得履歴）

CREATE TABLE public.point\_history (

&nbsp; id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),

&nbsp; user\_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

&nbsp; activity\_type TEXT NOT NULL, -- 'create\_knowledge', 'receive\_thanks', 'daily\_login' etc.

&nbsp; points\_awarded INTEGER NOT NULL,

&nbsp; metadata JSONB DEFAULT '{}'::jsonb, -- 関連IDなど

&nbsp; created\_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL

);



-- 3. thanks\_logs テーブル（感謝の記録）

-- TBL-003 feedback (サンクス/評価) を拡張・統合

CREATE TABLE public.thanks\_logs (

&nbsp; id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),

&nbsp; sender\_id UUID NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,

&nbsp; receiver\_id UUID NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,

&nbsp; target\_type TEXT NOT NULL CHECK (target\_type IN ('knowledge', 'consultation', 'user')),

&nbsp; target\_id UUID NOT NULL, -- knowledge\_id or consultation\_id

&nbsp; message TEXT, -- 「助かりました！」などの任意メッセージ

&nbsp; tags TEXT\[] DEFAULT '{}', -- \['時短になった', 'わかりやすい']

&nbsp; created\_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL

);



-- 4. インデックス作成

CREATE INDEX idx\_point\_history\_user ON public.point\_history(user\_id);

CREATE INDEX idx\_thanks\_sender ON public.thanks\_logs(sender\_id);

CREATE INDEX idx\_thanks\_receiver ON public.thanks\_logs(receiver\_id); -- 感謝の輪の描画用



-- 5. RLS ポリシーの設定

ALTER TABLE public.wisdom\_points ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.point\_history ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.thanks\_logs ENABLE ROW LEVEL SECURITY;



-- wisdom\_points: 全員閲覧可能（ランキング等）、更新はシステム（トリガー）のみ

CREATE POLICY "Allow logged-in read access" ON public.wisdom\_points

&nbsp; FOR SELECT USING (auth.role() = 'authenticated');



-- point\_history: 本人のみ閲覧可能

CREATE POLICY "Allow individual read access" ON public.point\_history

&nbsp; FOR SELECT USING (auth.uid() = user\_id);



-- thanks\_logs: 全員閲覧可能（感謝の輪）

CREATE POLICY "Allow logged-in read access" ON public.thanks\_logs

&nbsp; FOR SELECT USING (auth.role() = 'authenticated');

-- 作成は全員可能

CREATE POLICY "Allow logged-in insert access" ON public.thanks\_logs

&nbsp; FOR INSERT WITH CHECK (auth.role() = 'authenticated');

参考資料

/docs/01\_DATABASE\_SCHEMA.md （TBL-003: feedback 定義）



/docs/07\_BEHAVIORAL\_DESIGN.md （Phase 2: Personal Dashboard の仕様）



/docs/06\_SECURITY\_RLS.md （RLS ポリシー設計）



チェックリスト

実装完了時に、以下をすべて確認：



\[ ] wisdom\_points テーブルが作成されていること



\[ ] point\_history テーブルが作成されていること



\[ ] thanks\_logs テーブルが作成され、target\_type 制約があること



\[ ] receiver\_id に対するインデックスが作成されていること（ネットワーク図描画の高速化）



\[ ] RLS が有効化され、point\_history が他人に漏れないよう制御されていること



\[ ] 新規ユーザー作成時に wisdom\_points の初期レコードを作成するトリガー（またはアプリ側ロジック）を検討済みであること



補足・注意事項

ポイントの加算ロジック（例えば「ナレッジ作成＝50pt」）は、次の engage-api-metrics スキルで実装するAPIや、DBトリガーで行います。本スキルではデータの器（テーブル）を用意することに専念してください。



time\_saved\_minutes はあくまで「推計値」です（例：検索1回＝10分節約）。厳密な計測ではなく、職員の自己効力感を高めるための演出用指標として扱います。

