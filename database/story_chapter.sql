-- 主线章节表（阶段2：主线 docx 导入）
CREATE TABLE IF NOT EXISTS public.story_chapter (
    id BIGSERIAL PRIMARY KEY,
    slug VARCHAR(64) NOT NULL UNIQUE,
    title VARCHAR(128) NOT NULL,
    tag VARCHAR(64) NOT NULL DEFAULT '',
    num VARCHAR(8) NOT NULL DEFAULT '',
    arc VARCHAR(32) NOT NULL DEFAULT 'haiosen',
    data TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);