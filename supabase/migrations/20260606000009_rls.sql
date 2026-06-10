-- ============================================================================
-- Migration 09: rls
-- 职责: 创建所有 RLS 策略、updated_at 触发器函数、各表触发器
-- 依赖: 01~08 迁移已全部执行（所有表已存在）
-- 回滚: DROP POLICY ... ON ...; DROP TRIGGER ... ON ...; DROP FUNCTION ...;
-- ============================================================================

-- ==========================================================================
-- 第 1 部分：updated_at 自动更新机制
-- ==========================================================================

-- --------------------------------------------------------------------------
-- 1.1 创建触发器函数
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- --------------------------------------------------------------------------
-- 1.2 注册各表的 BEFORE UPDATE 触发器
-- 注: media 和 news_categories 无 updated_at 列，不注册触发器
-- --------------------------------------------------------------------------
CREATE TRIGGER trigger_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_categories_updated_at
    BEFORE UPDATE ON public.categories
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_news_updated_at
    BEFORE UPDATE ON public.news
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_settings_updated_at
    BEFORE UPDATE ON public.settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ==========================================================================
-- 第 2 部分：profiles RLS 策略
-- ==========================================================================

-- 2.1 访客完全不可见
CREATE POLICY "anon_block_profiles" ON public.profiles
    FOR ALL
    USING (false);

-- 2.2 管理员可查看自己的记录
CREATE POLICY "auth_select_own_profile" ON public.profiles
    FOR SELECT
    USING (auth.uid() = auth_id);

-- 2.3 超级管理员可管理全部
CREATE POLICY "super_admin_manage_profiles" ON public.profiles
    FOR ALL
    USING (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE auth_id = auth.uid()
              AND role = 'super_admin'
        )
    );

-- ==========================================================================
-- 第 3 部分：categories RLS 策略
-- ==========================================================================

-- 3.1 访客仅可见已启用的分类
CREATE POLICY "anon_select_active_categories" ON public.categories
    FOR SELECT
    USING (is_active = true);

-- 3.2 超级管理员可管理全部分类
CREATE POLICY "super_admin_manage_categories" ON public.categories
    FOR ALL
    USING (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE auth_id = auth.uid()
              AND role = 'super_admin'
        )
    );

-- ==========================================================================
-- 第 4 部分：news RLS 策略
-- ==========================================================================

-- 4.1 访客仅可见已发布新闻
CREATE POLICY "anon_select_published_news" ON public.news
    FOR SELECT
    USING (status = 'published');

-- 4.2 登录管理员可见全部新闻
CREATE POLICY "auth_select_all_news" ON public.news
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- 4.3 编辑/发布者/超级管理员可创建新闻
CREATE POLICY "auth_insert_news" ON public.news
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE auth_id = auth.uid()
              AND role IN ('editor', 'publisher', 'super_admin')
        )
    );

-- 4.4 编辑仅可更新自己的草稿
CREATE POLICY "editor_update_own_drafts" ON public.news
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE auth_id = auth.uid()
              AND role = 'editor'
        )
        AND author_id = (
            SELECT id
            FROM public.profiles
            WHERE auth_id = auth.uid()
        )
        AND status = 'draft'
    );

-- 4.5 发布者/超级管理员可更新任意新闻
CREATE POLICY "publisher_update_all_news" ON public.news
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE auth_id = auth.uid()
              AND role IN ('publisher', 'super_admin')
        )
    );

-- 4.6 编辑可删除自己的草稿
CREATE POLICY "editor_delete_own_drafts" ON public.news
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE auth_id = auth.uid()
              AND role = 'editor'
        )
        AND author_id = (
            SELECT id
            FROM public.profiles
            WHERE auth_id = auth.uid()
        )
        AND status = 'draft'
    );

-- 4.7 超级管理员可删除任意新闻
CREATE POLICY "super_admin_delete_news" ON public.news
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE auth_id = auth.uid()
              AND role = 'super_admin'
        )
    );

-- ==========================================================================
-- 第 5 部分：news_categories RLS 策略
-- ==========================================================================

-- 5.1 访客仅可见已发布新闻的分类关联
CREATE POLICY "anon_select_nc_published" ON public.news_categories
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM public.news
            WHERE id = news_id
              AND status = 'published'
        )
    );

-- 5.2 登录管理员可见全部关联
CREATE POLICY "auth_select_all_nc" ON public.news_categories
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- 5.3 编辑仅可管理自己草稿的分类关联
CREATE POLICY "editor_manage_nc" ON public.news_categories
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE auth_id = auth.uid()
              AND role = 'editor'
        )
        AND EXISTS (
            SELECT 1
            FROM public.news
            WHERE id = news_id
              AND author_id = (
                  SELECT id
                  FROM public.profiles
                  WHERE auth_id = auth.uid()
              )
              AND status = 'draft'
        )
    );

-- 5.4 发布者/超级管理员可管理所有关联
CREATE POLICY "publisher_manage_nc" ON public.news_categories
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE auth_id = auth.uid()
              AND role IN ('publisher', 'super_admin')
        )
    );

-- 5.5 编辑可删除自己草稿的分类关联
CREATE POLICY "editor_delete_nc" ON public.news_categories
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE auth_id = auth.uid()
              AND role = 'editor'
        )
        AND EXISTS (
            SELECT 1
            FROM public.news
            WHERE id = news_id
              AND author_id = (
                  SELECT id
                  FROM public.profiles
                  WHERE auth_id = auth.uid()
              )
              AND status = 'draft'
        )
    );

-- 5.6 发布者/超级管理员可删除所有关联
CREATE POLICY "publisher_delete_nc" ON public.news_categories
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE auth_id = auth.uid()
              AND role IN ('publisher', 'super_admin')
        )
    );

-- ==========================================================================
-- 第 6 部分：media RLS 策略
-- ==========================================================================

-- 6.1 访客不可见 media 表（图片通过 Storage URL 直接访问）
CREATE POLICY "anon_block_media" ON public.media
    FOR SELECT
    USING (false);

-- 6.2 登录管理员可见全部媒体文件
CREATE POLICY "auth_select_all_media" ON public.media
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- 6.3 登录管理员可上传
CREATE POLICY "auth_insert_media" ON public.media
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE auth_id = auth.uid()
        )
    );

-- 6.4 上传者可更新自己的文件
CREATE POLICY "owner_update_media" ON public.media
    FOR UPDATE
    USING (
        uploaded_by = (
            SELECT id
            FROM public.profiles
            WHERE auth_id = auth.uid()
        )
    );

-- 6.5 超级管理员可更新全部
CREATE POLICY "super_admin_update_media" ON public.media
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE auth_id = auth.uid()
              AND role = 'super_admin'
        )
    );

-- 6.6 上传者可删除自己的文件
CREATE POLICY "owner_delete_media" ON public.media
    FOR DELETE
    USING (
        uploaded_by = (
            SELECT id
            FROM public.profiles
            WHERE auth_id = auth.uid()
        )
    );

-- 6.7 超级管理员可删除全部
CREATE POLICY "super_admin_delete_media" ON public.media
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE auth_id = auth.uid()
              AND role = 'super_admin'
        )
    );

-- ==========================================================================
-- 第 7 部分：settings RLS 策略
-- ==========================================================================

-- 7.1 访客不可见（通过 Server Action 读取公开配置）
CREATE POLICY "anon_block_settings" ON public.settings
    FOR SELECT
    USING (false);

-- 7.2 登录管理员可读取
CREATE POLICY "auth_select_settings" ON public.settings
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- 7.3 超级管理员可写入
CREATE POLICY "super_admin_insert_settings" ON public.settings
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE auth_id = auth.uid()
              AND role = 'super_admin'
        )
    );

-- 7.4 超级管理员可更新
CREATE POLICY "super_admin_update_settings" ON public.settings
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE auth_id = auth.uid()
              AND role = 'super_admin'
        )
    );
