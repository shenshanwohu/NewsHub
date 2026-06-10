-- ============================================================================
-- Migration 12: Fix RLS infinite recursion
-- 职责: 创建安全函数 is_super_admin() 并用它替换所有自引用 RLS 策略
-- 背景: EXISTS (SELECT FROM profiles WHERE ...) 在 RLS 中会自引用导致无限递归
-- 解决方案: SECURITY DEFINER 函数绕过 RLS，避免递归
-- 回滚: DROP FUNCTION IF EXISTS public.is_super_admin;
--       然后重新创建旧的 RLS 策略（恢复原状见回滚脚本）
-- ============================================================================

-- ==========================================================================
-- 第 1 部分: 创建安全函数
-- ==========================================================================

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE auth_id = auth.uid()
    AND role = 'super_admin'
  );
$$;

-- 允许所有角色调用此函数（函数内部用 SECURITY DEFINER 绕过 RLS）
GRANT EXECUTE ON FUNCTION public.is_super_admin TO anon;
GRANT EXECUTE ON FUNCTION public.is_super_admin TO authenticated;

-- ==========================================================================
-- 第 2 部分: 替换 profiles 表的超级管理员策略
-- ==========================================================================

DROP POLICY IF EXISTS super_admin_manage_profiles ON public.profiles;

CREATE POLICY super_admin_manage_profiles ON public.profiles
    ALL USING (public.is_super_admin());

-- ==========================================================================
-- 第 3 部分: 替换 categories 表的策略
-- ==========================================================================

DROP POLICY IF EXISTS super_admin_manage_categories ON public.categories;

CREATE POLICY super_admin_manage_categories ON public.categories
    ALL USING (public.is_super_admin());

-- ==========================================================================
-- 第 4 部分: 替换 news 表的策略
-- ==========================================================================

DROP POLICY IF EXISTS super_admin_delete_news ON public.news;

CREATE POLICY super_admin_delete_news ON public.news
    FOR DELETE USING (public.is_super_admin());

-- 注意: news 表的 UPDATE 策略中 publisher_update_all_news 使用了
-- auth.role() = 'authenticated' 而非自引用，不需要修复
-- editor_update_own_drafts 和 publisher_update_all_news 不涉及递归

-- ==========================================================================
-- 第 5 部分: 替换 news_categories 表的策略
-- ==========================================================================

DROP POLICY IF EXISTS publisher_manage_nc ON public.news_categories;
DROP POLICY IF EXISTS editor_delete_nc ON public.news_categories;

CREATE POLICY publisher_manage_nc ON public.news_categories
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.news
            WHERE news.id = news_id
            AND (
                news.author_id IN (SELECT id FROM public.profiles WHERE auth_id = auth.uid())
                OR public.is_super_admin()
            )
        )
    );

CREATE POLICY publisher_delete_nc ON public.news_categories
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.news
            WHERE news.id = news_id
            AND public.is_super_admin()
        )
    );

-- ==========================================================================
-- 第 6 部分: 替换 media 表的策略
-- ==========================================================================

DROP POLICY IF EXISTS super_admin_update_media ON public.media;
DROP POLICY IF EXISTS super_admin_delete_media ON public.media;

CREATE POLICY super_admin_update_media ON public.media
    FOR UPDATE USING (public.is_super_admin());

CREATE POLICY super_admin_delete_media ON public.media
    FOR DELETE USING (public.is_super_admin());

-- ==========================================================================
-- 第 7 部分: 替换 settings 表的策略
-- ==========================================================================

DROP POLICY IF EXISTS super_admin_insert_settings ON public.settings;
DROP POLICY IF EXISTS super_admin_update_settings ON public.settings;

CREATE POLICY super_admin_insert_settings ON public.settings
    FOR INSERT WITH CHECK (public.is_super_admin());

CREATE POLICY super_admin_update_settings ON public.settings
    FOR UPDATE USING (public.is_super_admin());
