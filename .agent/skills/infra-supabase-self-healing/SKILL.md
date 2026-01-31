name: "infra-supabase-self-healing"

description: "Supabase接続の障害検知、自動再接続、サーキットブレーカーを含む自己修復クライアントを実装する。"

version: "1.0.0"

author: "OWLight Development Team"

tags: \["infrastructure", "supabase", "reliability", "zero-cost"]

triggers:

&nbsp; - "自己修復実装"

&nbsp; - "ヘルスチェック実装"

&nbsp; - "Supabase安定化"

&nbsp; - "コネクション管理"

---



\## 概要



OWLightのSupabase接続に対し、接続障害やパフォーマンス劣化を自動検知し、自己修復する機能（Phase 1）を実装します。

これにより、追加費用なしで99.9%以上の高可用性を目指します。標準のSupabaseクライアントをラップし、ヘルスチェック、指数バックオフによる自動再接続、サーキットブレーカーパターンを導入します。



\## このスキルが前提とするもの



\- Next.js (App Router) プロジェクトが存在すること

\- Supabaseプロジェクトがセットアップ済みであること

\- 環境変数 (`NEXT\_PUBLIC\_SUPABASE\_URL`, `NEXT\_PUBLIC\_SUPABASE\_ANON\_KEY`) が設定されていること



\## 実装内容



\### Step 1: データベース構築 (Migration)



以下のSQLを使用し、ヘルスチェック専用の軽量テーブルを作成します。

\*\*ファイル\*\*: `supabase/migrations/001\_health\_check\_table.sql`



```sql

-- ヘルスチェック専用テーブル（最小限のデータ）

CREATE TABLE IF NOT EXISTS public.health\_check (

&nbsp; id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),

&nbsp; created\_at TIMESTAMPTZ DEFAULT NOW()

);



-- 常に1レコードのみ保持

INSERT INTO public.health\_check (id) VALUES (gen\_random\_uuid())

ON CONFLICT DO NOTHING;



-- インデックス（高速クエリ）

CREATE INDEX IF NOT EXISTS idx\_health\_check\_created\_at ON public.health\_check(created\_at DESC);



-- RLS: 全員読み取り可能

ALTER TABLE public.health\_check ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON public.health\_check FOR SELECT USING (true);



```



\### Step 2: セルフヒーリングクライアントの実装



`@supabase/supabase-js` をラップした高可用性クライアントクラスを実装します。

\*\*ファイル\*\*: `lib/supabase/self-healing-client.ts`



\*\*実装要件\*\*:



1\. \*\*ヘルスチェック\*\*: 30秒ごとに `health\_check` テーブルを読み取り、レイテンシとステータス（healthy/degraded/down）を更新。

2\. \*\*自動再接続\*\*: 接続失敗時、指数バックオフ（1s, 2s, 4s... Max 30s）を用いて最大5回再接続を試行。再接続時にクライアントインスタンスを再生成する。

3\. \*\*サーキットブレーカー\*\*: ステータスが `down` の場合、クエリ実行を即座に遮断しユーザーフレンドリーなエラーを返す。

4\. \*\*管理者通知\*\*: 重大障害（5回リトライ失敗）時に `/api/alerts` を叩く。



\*\*コード構造イメージ\*\*:



```typescript

// クラス構造の概要

class SelfHealingSupabaseClient {

&nbsp; private client: SupabaseClient

&nbsp; private healthStatus: HealthCheck

&nbsp; // ...



&nbsp; // 30秒ごとのチェック

&nbsp; private async performHealthCheck() { ... }



&nbsp; // 指数バックオフによる再接続

&nbsp; private async attemptSelfHeal() { ... }



&nbsp; // クエリラッパー（サーキットブレーカー付き）

&nbsp; async query<T>(operation: () => Promise<T>): Promise<T> {

&nbsp;   if (this.healthStatus.status === 'down') throw new Error(...)

&nbsp;   // ... try-catch \& retry logic

&nbsp; }

}



```



\### Step 3: APIエンドポイントの実装



\*\*1. ヘルスチェックAPI\*\* (`app/api/health/route.ts`)

外部監視サービス（Uptime Robot等）用のエンドポイント。現在のステータスjsonと、状況に応じたステータスコード（200/503）を返却する。



\*\*2. アラート通知API\*\* (`app/api/alerts/route.ts`)

クライアントからのPOSTを受け取り、Slack Webhook等へ通知を送る。



\### Step 4: 監視ダッシュボード



\*\*ファイル\*\*: `app/admin/health/page.tsx`

現在のヘルスステータス、レイテンシ、連続失敗回数をリアルタイム表示する管理画面を作成する。



\## 安全装置 (Guardrails)



\* \*\*環境変数\*\*: `SUPABASE\_SERVICE\_ROLE\_KEY` はサーバーサイド（API Routes）でのみ使用し、クライアントサイドには絶対に露出させない。

\* \*\*無限ループ防止\*\*: 再接続ロジックには必ず「最大試行回数（Max 5回）」を設け、到達したら停止する。

\* \*\*通知スパム防止\*\*: アラート通知の失敗時はログ出力にとどめ、通知処理自体がエラーでループしないようにする。



\## チェックリスト



実装完了時に、以下を確認してください：



\* \[ ] `health\_check` テーブルが作成され、1件のレコードが存在すること

\* \[ ] `SelfHealingSupabaseClient` 経由でデータ取得ができること

\* \[ ] 意図的にネットワークを切断（または誤ったURLを設定）した際、自動再接続が指数バックオフで動作すること

\* \[ ] 5回失敗後に管理者アラート（Slack通知ログ等）が発火すること

\* \[ ] `/api/health` が現在のステータスを正しく返却すること

\* \[ ] 管理画面でレイテンシが表示されていること



\## 補足・注意事項



\* 既存の `createClient` を使用している箇所は、段階的にこの `SelfHealingSupabaseClient` に置き換えていきます。

\* 外部監視ツール（Uptime Robot）の設定は別途手動で行う必要があります。

