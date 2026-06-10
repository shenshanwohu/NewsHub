-- ============================================================================
-- Migration 10: storage
-- 职责: 创建 Storage bucket 及对应的存储桶 RLS 策略
-- 依赖: 无（Storage 系统独立于数据库表）
-- 回滚: 见各 bucket 的 DROP 注释；DELETE FROM storage.buckets WHERE id = '...'
-- ============================================================================

-- ==========================================================================
-- 第 1 部分：创建 Storage Bucket
-- ==========================================================================

-- 1.1 news-covers: 新闻封面图、OG 图片、列表缩略图
INSERT INTO storage.buckets (id, name, public)
VALUES ('news-covers', 'news-covers', true)
ON CONFLICT (id) DO NOTHING;

-- 1.2 article-images: 富文本编辑器正文插图
INSERT INTO storage.buckets (id, name, public)
VALUES ('article-images', 'article-images', true)
ON CONFLICT (id) DO NOTHING;

-- ==========================================================================
-- 第 2 部分：Storage RLS 策略
-- ==========================================================================

-- --------------------------------------------------------------------------
-- 2.1 公开读取（两个 bucket 均允许匿名访问，支持 SEO 和 OG 抓取）
-- --------------------------------------------------------------------------
CREATE POLICY "public_read_news_covers" ON storage.objects
    FOR SELECT
    USING (bucket_id = 'news-covers');

CREATE POLICY "public_read_article_images" ON storage.objects
    FOR SELECT
    USING (bucket_id = 'article-images');

-- --------------------------------------------------------------------------
-- 2.2 登录管理员可上传到两个 bucket
-- --------------------------------------------------------------------------
CREATE POLICY "auth_upload_news_covers" ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'news-covers'
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "auth_upload_article_images" ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'article-images'
        AND auth.role() = 'authenticated'
    );

-- --------------------------------------------------------------------------
-- 2.3 上传者或超级管理员可删除
-- --------------------------------------------------------------------------
CREATE POLICY "owner_or_admin_delete_news_covers" ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'news-covers'
        AND (
            auth.uid() = owner
            OR EXISTS (
                SELECT 1
                FROM public.profiles
                WHERE auth_id = auth.uid()
                  AND role = 'super_admin'
            )
        )
    );

CREATE POLICY "owner_or_admin_delete_article_images" ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'article-images'
        AND (
            auth.uid() = owner
            OR EXISTS (
                SELECT 1
                FROM public.profiles
                WHERE auth_id = auth.uid()
                  AND role = 'super_admin'
            )
        )
    );

-- --------------------------------------------------------------------------
-- 2.4 上传者可更新自己的文件（覆盖/替换）
-- --------------------------------------------------------------------------
CREATE POLICY "owner_update_news_covers" ON storage.objects
    FOR UPDATE
    USING (
        bucket_id = 'news-covers'
        AND auth.uid() = owner
    );

CREATE POLICY "owner_update_article_images" ON storage.objects
    FOR UPDATE
    USING (
        bucket_id = 'article-images'
        AND auth.uid() = owner
    );
