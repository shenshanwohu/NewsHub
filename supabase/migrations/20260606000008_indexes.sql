-- ============================================================================
-- Migration 08: indexes
-- 职责: 创建所有性能索引（不含 PK 和 UNIQUE 约束自带索引）
-- 依赖: 01~07 迁移已全部执行
-- 回滚: 见各索引的 DROP INDEX 注释
-- ============================================================================

-- --------------------------------------------------------------------------
-- 8.1 profiles 索引
-- --------------------------------------------------------------------------
CREATE INDEX idx_profiles_role      ON public.profiles(role);
CREATE INDEX idx_profiles_is_active ON public.profiles(is_active);

-- --------------------------------------------------------------------------
-- 8.2 categories 索引
-- --------------------------------------------------------------------------
CREATE INDEX idx_categories_parent_id     ON public.categories(parent_id);
CREATE INDEX idx_categories_active_sort   ON public.categories(is_active, sort_order);

-- --------------------------------------------------------------------------
-- 8.3 news 索引
-- --------------------------------------------------------------------------
CREATE INDEX idx_news_status           ON public.news(status);
CREATE INDEX idx_news_published_at     ON public.news(published_at DESC);
CREATE INDEX idx_news_author_id        ON public.news(author_id);
CREATE INDEX idx_news_view_count       ON public.news(view_count DESC);
CREATE INDEX idx_news_featured_published
    ON public.news(is_featured DESC, published_at DESC);
CREATE INDEX idx_news_fulltext
    ON public.news
    USING GIN (to_tsvector('simple', COALESCE(title, '') || ' ' || COALESCE(content, '')));

-- --------------------------------------------------------------------------
-- 8.4 news_categories 索引
-- --------------------------------------------------------------------------
CREATE INDEX idx_nc_news_id        ON public.news_categories(news_id);
CREATE INDEX idx_nc_category_id    ON public.news_categories(category_id);

-- --------------------------------------------------------------------------
-- 8.5 media 索引
-- --------------------------------------------------------------------------
CREATE INDEX idx_media_uploaded_by ON public.media(uploaded_by);
CREATE INDEX idx_media_created_at  ON public.media(created_at DESC);
