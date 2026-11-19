package com.wmsbigdatalab.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

/**
 * 启动时自动建表/升级结构（全部幂等）。
 * 线上库只在数据卷首次建库时执行 initdb SQL，之后新增的表必须靠这里补建，
 * 否则线上会因缺表在业务 SQL 处 500（Spring 返回 HTML 错误页）。
 */
@Configuration
public class SchemaInitConfig {

    private static final Logger log = LoggerFactory.getLogger(SchemaInitConfig.class);

    /** 主线章节表（阶段2：主线 docx 导入） */
    private static final String CREATE_STORY_CHAPTER = """
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
            )""";

    /** 思绪 CG 图片绑定表（(chapter_slug, name, instance) 三列绑定，同名多实例各绑一图） */
    private static final String CREATE_STORY_CG = """
            CREATE TABLE IF NOT EXISTS public.story_cg (
                id BIGSERIAL PRIMARY KEY,
                chapter_slug VARCHAR(64) NOT NULL,
                name VARCHAR(128) NOT NULL,
                instance INT NOT NULL DEFAULT 1,
                image_url VARCHAR(255) NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT now(),
                updated_at TIMESTAMP NOT NULL DEFAULT now(),
                UNIQUE (chapter_slug, name, instance)
            )""";

    /** 旧版库升级：补 instance 列、两列唯一约束升级为三列（各步均幂等） */
    private static final String[] UPGRADE_STATEMENTS = {
            "ALTER TABLE story_cg ADD COLUMN IF NOT EXISTS instance INT NOT NULL DEFAULT 1",
            "ALTER TABLE story_cg DROP CONSTRAINT IF EXISTS story_cg_chapter_slug_name_key",
            "CREATE UNIQUE INDEX IF NOT EXISTS story_cg_chapter_slug_name_instance_key ON story_cg (chapter_slug, name, instance)"
    };

    @Bean
    public ApplicationRunner databaseSchemaInitializer(JdbcTemplate jdbcTemplate) {
        return args -> {
            jdbcTemplate.execute(CREATE_STORY_CHAPTER);
            jdbcTemplate.execute(CREATE_STORY_CG);
            for (String sql : UPGRADE_STATEMENTS) {
                jdbcTemplate.execute(sql);
            }
            log.info("数据库结构初始化完成（story_chapter / story_cg，幂等）");
        };
    }
}
