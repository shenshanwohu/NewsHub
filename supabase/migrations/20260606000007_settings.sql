-- ============================================================================
-- Migration 07: settings
-- 职责: 创建系统配置表（key-value 模式）
-- 依赖: public.profiles
-- 回滚: DROP TABLE IF EXISTS public.settings CASCADE;
-- ============================================================================

-- --------------------------------------------------------------------------
-- 7.1 创建 settings 表
-- --------------------------------------------------------------------------
CREATE TABLE public.settings (
    id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    key           text        NOT NULL UNIQUE,
    value         jsonb       NOT NULL DEFAULT '{}',
    description   text,
    updated_by    uuid        REFERENCES public.profiles(id),
    updated_at    timestamptz NOT NULL DEFAULT now(),
    created_at    timestamptz NOT NULL DEFAULT now()
);

-- --------------------------------------------------------------------------
-- 7.2 表注释
-- --------------------------------------------------------------------------
COMMENT ON TABLE public.settings IS '系统配置表（key-value 模式）';
COMMENT ON COLUMN public.settings.key IS '配置键（唯一），如 site_name, news_per_page';
COMMENT ON COLUMN public.settings.value IS '配置值（JSON 格式）';
COMMENT ON COLUMN public.settings.description IS '配置说明';

-- --------------------------------------------------------------------------
-- 7.3 启用行级安全
-- --------------------------------------------------------------------------
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
