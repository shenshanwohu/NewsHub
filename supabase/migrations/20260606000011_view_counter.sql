-- ============================================================================
-- Migration 11: view_counter function
-- 职责: 创建 SECURITY DEFINER 函数，允许访客匿名递增浏览计数
-- 依赖: public.news 表已存在
-- 回滚: DROP FUNCTION IF EXISTS public.increment_view_count;
-- ============================================================================

CREATE OR REPLACE FUNCTION public.increment_view_count(row_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.news
  SET view_count = view_count + 1
  WHERE id = row_id;
END;
$$;

-- 允许匿名用户调用此函数
GRANT EXECUTE ON FUNCTION public.increment_view_count TO anon;
GRANT EXECUTE ON FUNCTION public.increment_view_count TO authenticated;
