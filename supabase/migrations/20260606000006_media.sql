-- ============================================================================
-- Migration 06: media
-- 职责: 创建媒体文件元数据表（对应 Supabase Storage 文件）
-- 依赖: public.profiles
-- 回滚: DROP TABLE IF EXISTS public.media CASCADE;
-- ============================================================================

-- --------------------------------------------------------------------------
-- 6.1 创建 media 表
-- --------------------------------------------------------------------------
CREATE TABLE public.media (
    id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    filename        text        NOT NULL,
    storage_path    text        NOT NULL UNIQUE,
    public_url      text        NOT NULL,
    mime_type       text        NOT NULL,
    file_size       bigint      NOT NULL,
    width           integer,
    height          integer,
    alt_text        text,
    uploaded_by     uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    created_at      timestamptz NOT NULL DEFAULT now()
);

-- --------------------------------------------------------------------------
-- 6.2 表注释
-- --------------------------------------------------------------------------
COMMENT ON TABLE public.media IS '媒体文件元数据表（不可变设计，无 updated_at）';
COMMENT ON COLUMN public.media.filename IS '原始文件名';
COMMENT ON COLUMN public.media.storage_path IS 'Supabase Storage 存储路径';
COMMENT ON COLUMN public.media.public_url IS '公开访问 URL';
COMMENT ON COLUMN public.media.mime_type IS 'MIME 类型，如 image/jpeg';
COMMENT ON COLUMN public.media.file_size IS '文件大小（字节）';
COMMENT ON COLUMN public.media.width IS '图片宽度（像素），非图片可空';
COMMENT ON COLUMN public.media.height IS '图片高度（像素），非图片可空';
COMMENT ON COLUMN public.media.alt_text IS 'Alt 替代文本';

-- --------------------------------------------------------------------------
-- 6.3 启用行级安全
-- --------------------------------------------------------------------------
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
