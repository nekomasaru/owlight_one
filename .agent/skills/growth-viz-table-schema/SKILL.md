name: "growth-viz-table-schema"

description: "ユーザーの成長推移（ポイント、活動量、スキル傾向）を時系列で記録する user\_growth\_metrics テーブルを作成する。"

version: "1.0.0"

author: "OWLight Development Team"

tags: \["feature", "growth-viz", "database"]

triggers:

&nbsp; - "成長DB"

&nbsp; - "指標テーブル"

&nbsp; - "Growth Metrics Schema"

---



\## 概要



ユーザーが「昨日の自分」や「同期の平均」と成長度合いを比較できるようにするためのデータベース基盤を構築します。

日次または週次でスナップショットとして記録される `user\_growth\_metrics` テーブルを作成し、定量データ（ポイント数など）と定性データ（スキルディメンション）を格納します。



\## このスキルが前提とするもの



\- `users` テーブル（users.id）が既に存在すること



\## 実装内容



\### テーブル設計



以下の SQL を実行してテーブル作成、インデックス設定、および RLS ポリシーの適用を行います。



```sql

-- 1. user\_growth\_metrics テーブル（成長指標履歴）

CREATE TABLE public.user\_growth\_metrics (

&nbsp; id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),

&nbsp; user\_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

&nbsp; recorded\_at DATE NOT NULL DEFAULT CURRENT\_DATE, -- 集計対象日

&nbsp; 

&nbsp; -- 定量指標（累積値のスナップショット）

&nbsp; total\_wisdom\_points INTEGER DEFAULT 0,

&nbsp; knowledge\_created\_count INTEGER DEFAULT 0,

&nbsp; thanks\_received\_count INTEGER DEFAULT 0,

&nbsp; 

&nbsp; -- 定性・分析指標（レーダーチャート用データ等）

&nbsp; -- 例: { "innovation": 65, "collaboration": 40, "diligence": 80 }

&nbsp; skill\_dimensions JSONB DEFAULT '{}'::jsonb,

&nbsp; 

&nbsp; created\_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

&nbsp; 

&nbsp; -- 1ユーザーにつき1日1レコードまで

&nbsp; UNIQUE(user\_id, recorded\_at)

);



-- 2. インデックス作成

-- 期間指定での取得（タイムライン表示）を高速化

CREATE INDEX idx\_growth\_metrics\_user\_date ON public.user\_growth\_metrics(user\_id, recorded\_at DESC);



-- 3. RLS (Row Level Security) の設定

ALTER TABLE public.user\_growth\_metrics ENABLE ROW LEVEL SECURITY;



-- 全員閲覧可（プロフィールの成長グラフ表示のため）

-- ※必要に応じて「自分とマネージャーのみ」などに制限することも検討

CREATE POLICY "Allow read access for all authenticated users" ON public.user\_growth\_metrics

&nbsp; FOR SELECT USING (auth.role() = 'authenticated');



-- 作成・更新はシステム（バッチ処理）または本人のみ

-- 基本的には日次バッチで挿入される想定だが、MVPではAPI経由も許可

CREATE POLICY "Allow insert/update for own metrics" ON public.user\_growth\_metrics

&nbsp; FOR ALL USING (auth.uid() = user\_id);

参考資料

/docs/01\_DATABASE\_SCHEMA.md （データベース設計全体）



/docs/03\_SCREEN\_DESIGN.md （成長グラフのUI要件）



チェックリスト

実装完了時に、以下をすべて確認：



\[ ] user\_growth\_metrics テーブルが作成されていること



\[ ] user\_id と recorded\_at の複合ユニーク制約が設定されていること



\[ ] skill\_dimensions カラムが JSONB 型で定義されていること



\[ ] インデックス idx\_growth\_metrics\_user\_date が作成されていること



\[ ] RLSが有効化され、認証済みユーザーがデータをSELECTできること



\[ ] バッチ処理やAPIからデータをINSERTできること



補足・注意事項

このテーブルは主に「日次バッチ（cron job）」等でデータを蓄積することを想定しています。



skill\_dimensions の中身（キー名やスコア計算ロジック）は、growth-viz-api-calc スキルで定義されるロジックに依存します。

