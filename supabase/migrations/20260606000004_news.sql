-- ============================================================================
-- Migration 04: news
-- 职责: 创建新闻主表（含 SEO 字段、浏览计数、置顶标记）
-- 依赖: public.profiles
-- 回滚: DROP TABLE IF EXISTS public.news CASCADE;
-- ============================================================================

-- --------------------------------------------------------------------------
-- 4.1 创建 news 表
-- --------------------------------------------------------------------------
CREATE TABLE public.news (
    id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    title             text        NOT NULL,
    slug              text        NOT NULL UNIQUE,
    summary           text,
    content           text        NOT NULL,
    cover_image_url   text,
    status            text        NOT NULL DEFAULT 'draft'
                                  CHECK (status IN ('draft', 'published', 'archived')),
    author_id         uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    is_featured       boolean     NOT NULL DEFAULT false,
    view_count        bigint      NOT NULL DEFAULT 0,
    seo_title         text,
    seo_description   text,
    seo_og_image      text,
    published_at      timestamptz,
    created_at        timestamptz NOT NULL DEFAULT now(),
    updated_at        timestamptz NOT NULL DEFAULT now()
);

-- --------------------------------------------------------------------------
-- 4.2 表注释
-- --------------------------------------------------------------------------
COMMENT ON TABLE public.news IS '新闻主表，包含核心内容、SEO 元数据、状态管理';
COMMENT ON COLUMN public.news.slug IS 'URL 友好唯一标识';
COMMENT ON COLUMN public.news.summary IS '新闻摘要/导语';
COMMENT ON COLUMN public.news.content IS '富文本 HTML 内容';
COMMENT ON COLUMN public.news.cover_image_url IS '封面图 URL（也是 OG image 回退值）';
COMMENT ON COLUMN public.news.status IS '状态: draft=草稿, published=已发布, archived=已归档';
COMMENT ON COLUMN public.news.is_featured IS '置顶标记';
COMMENT ON COLUMN public.news.view_count IS '浏览计数（异步延迟更新）';
COMMENT ON COLUMN public.news.seo_title IS '自定义 SEO meta title，为空回退 title';
COMMENT ON COLUMN public.news.seo_description IS '自定义 SEO meta description，为空回退 summary';
COMMENT ON COLUMN public.news.seo_og_image IS '自定义 OG image URL，为空回退 cover_image_url';
COMMENT ON COLUMN public.news.published_at IS '首次发布时间（重新发布不更新）';

-- --------------------------------------------------------------------------
-- 4.3 启用行级安全
-- --------------------------------------------------------------------------
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
