-- ============================================================================
-- Migration 03: categories
-- 职责: 创建树形分类表（自引用外键 parent_id 实现多级嵌套）
-- 依赖: 无
-- 回滚: DROP TABLE IF EXISTS public.categories CASCADE;
-- ============================================================================

-- --------------------------------------------------------------------------
-- 3.1 创建 categories 表
-- --------------------------------------------------------------------------
CREATE TABLE public.categories (
    id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    name            text        NOT NULL,
    slug            text        NOT NULL UNIQUE,
    description     text,
    parent_id       uuid        REFERENCES public.categories(id) ON DELETE SET NULL,
    sort_order      integer     NOT NULL DEFAULT 0,
    is_active       boolean     NOT NULL DEFAULT true,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

-- --------------------------------------------------------------------------
-- 3.2 表注释
-- --------------------------------------------------------------------------
COMMENT ON TABLE public.categories IS '新闻分类表（树形结构，最大 3 层）';
COMMENT ON COLUMN public.categories.slug IS 'URL 友好的唯一标识';
COMMENT ON COLUMN public.categories.parent_id IS '父分类 ID，null 为顶级分类';
COMMENT ON COLUMN public.categories.sort_order IS '同级排序权重（小值前排）';
COMMENT ON COLUMN public.categories.is_active IS '是否在前台展示';

-- --------------------------------------------------------------------------
-- 3.3 启用行级安全
-- --------------------------------------------------------------------------
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
