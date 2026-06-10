-- ============================================================================
-- Migration 01: extensions
-- 职责: 启用所需的 PostgreSQL 扩展
-- 依赖: 无
-- 回滚: DROP EXTENSION IF EXISTS pgcrypto; DROP EXTENSION IF EXISTS pg_trgm;
-- ============================================================================

-- pgcrypto: 提供 gen_random_uuid() 函数，用于 UUID 主键生成
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- pg_trgm: 提供三元组模糊搜索，用于 ILIKE 查询优化
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;
