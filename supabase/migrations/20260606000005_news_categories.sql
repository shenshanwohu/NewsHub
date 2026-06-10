-- ============================================================================
-- Migration 05: news_categories
-- 职责: 创建新闻-分类多对多关联表
-- 依赖: public.news, public.categories
-- 回滚: DROP TABLE IF EXISTS public.news_categories CASCADE;
-- ============================================================================

-- --------------------------------------------------------------------------
-- 5.1 创建 news_categories 关联表
-- --------------------------------------------------------------------------
CREATE TABLE public.news_categories (
    news_id       uuid        NOT NULL REFERENCES public.news(id) ON DELETE CASCADE,
    category_id   uuid        NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    created_at    timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (news_id, category_id)
);

-- --------------------------------------------------------------------------
-- 5.2 表注释
-- --------------------------------------------------------------------------
COMMENT ON TABLE public.news_categories IS '新闻-分类多对多关联表';
COMMENT ON COLUMN public.news_categories.news_id IS '新闻 ID';
COMMENT ON COLUMN public.news_categories.category_id IS '分类 ID';

-- --------------------------------------------------------------------------
-- 5.3 启用行级安全
-- --------------------------------------------------------------------------
ALTER TABLE public.news_categories ENABLE ROW LEVEL SECURITY;
