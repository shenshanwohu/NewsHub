-- ============================================================================
-- Migration 02: profiles
-- 职责: 创建管理员档案表（与 auth.users 一一对应）
-- 依赖: auth.users (Supabase 内置表，已存在)
-- 回滚: DROP TABLE IF EXISTS public.profiles CASCADE;
-- ============================================================================

-- --------------------------------------------------------------------------
-- 2.1 创建 profiles 表
-- --------------------------------------------------------------------------
CREATE TABLE public.profiles (
    id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_id         uuid        NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    email           text        NOT NULL UNIQUE,
    display_name    text        NOT NULL,
    role            text        NOT NULL CHECK (role IN ('super_admin', 'publisher', 'editor')),
    is_active       boolean     NOT NULL DEFAULT true,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

-- --------------------------------------------------------------------------
-- 2.2 表注释
-- --------------------------------------------------------------------------
COMMENT ON TABLE public.profiles IS '管理员档案表，与 auth.users 一一对应';
COMMENT ON COLUMN public.profiles.auth_id IS '关联 Supabase Auth 用户 UUID';
COMMENT ON COLUMN public.profiles.email IS '管理员邮箱（唯一）';
COMMENT ON COLUMN public.profiles.display_name IS '显示名称（作者署名）';
COMMENT ON COLUMN public.profiles.role IS '角色: super_admin, publisher, editor';
COMMENT ON COLUMN public.profiles.is_active IS '启用状态，false 为禁用';

-- --------------------------------------------------------------------------
-- 2.3 启用行级安全
-- --------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
