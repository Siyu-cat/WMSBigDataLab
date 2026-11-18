-- 思绪 CG 图片绑定表（阶段3：思绪【xxx】CG 功能；阶段：同名多实例各自绑图）
-- 按 (chapter_slug, name, instance) 绑定图片：章节重导不丢图；
-- 同名第 N 次出现的行对应 instance=N（inst 由 StoryImportService 导入时按文档顺序发出）
CREATE TABLE IF NOT EXISTS public.story_cg (
    id BIGSERIAL PRIMARY KEY,
    chapter_slug VARCHAR(64) NOT NULL,
    name VARCHAR(128) NOT NULL,
    instance INT NOT NULL DEFAULT 1,
    image_url VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    UNIQUE (chapter_slug, name, instance)
);

-- 已有库升级（新旧记录 instance 均默认 1，行为不变）：
-- ALTER TABLE story_cg ADD COLUMN IF NOT EXISTS instance INT NOT NULL DEFAULT 1;
-- ALTER TABLE story_cg DROP CONSTRAINT IF EXISTS story_cg_chapter_slug_name_key;
-- ALTER TABLE story_cg ADD CONSTRAINT story_cg_chapter_slug_name_instance_key UNIQUE (chapter_slug, name, instance);
