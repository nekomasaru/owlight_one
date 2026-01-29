-- ==========================================
-- OWLight Database Schema Setup
-- Based on 01_DATABASE_SCHEMA.md
-- ==========================================

-- 1. Users Table (auth.users と連動)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    role TEXT DEFAULT 'general' CHECK (role IN ('admin', 'manager', 'general')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Knowledge Table
CREATE TABLE public.knowledges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    evaluation_score INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Roles Table
CREATE TABLE public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL
);

-- 4. Role Models Table
CREATE TABLE public.role_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    match_score INTEGER DEFAULT 0
);

-- ==========================================
-- Security (RLS Policies)
-- ==========================================

-- RLS を有効化
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_models ENABLE ROW LEVEL SECURITY;

-- Users: 本人は自分のデータを編集可能、全員が参照可能（プロファイル閲覧のため）
CREATE POLICY "Public profiles are viewable by everyone." ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile." ON public.users FOR UPDATE USING (auth.uid() = id);

-- Knowledges: 公開記事は全員参照可能、作成者のみ編集可能
CREATE POLICY "Public knowledges are viewable by everyone." ON public.knowledges FOR SELECT USING (is_public = true);
CREATE POLICY "Authors can insert knowledges." ON public.knowledges FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors can update own knowledges." ON public.knowledges FOR UPDATE USING (auth.uid() = author_id);

-- Roles: 全員参照可能、管理人のみ編集可能（ここでは簡略化）
CREATE POLICY "Roles are viewable by everyone." ON public.roles FOR SELECT USING (true);

-- ==========================================
-- Triggers (Updated At)
-- ==========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_knowledges_updated_at BEFORE UPDATE ON public.knowledges FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
