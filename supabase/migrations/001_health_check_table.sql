-- ヘルスチェック専用テーブル（最小限のデータ）
CREATE TABLE IF NOT EXISTS public.health_check (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 常に1レコードのみ保持
INSERT INTO public.health_check (id) VALUES (gen_random_uuid())
ON CONFLICT DO NOTHING;

-- インデックス（高速クエリ）
CREATE INDEX IF NOT EXISTS idx_health_check_created_at ON public.health_check(created_at DESC);

-- RLS: 全員読み取り可能
ALTER TABLE public.health_check ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access" ON public.health_check FOR SELECT USING (true);
