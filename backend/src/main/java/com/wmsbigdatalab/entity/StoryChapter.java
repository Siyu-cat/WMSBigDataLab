package com.wmsbigdatalab.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("story_chapter")
public class StoryChapter {
    @TableId(type = IdType.AUTO)
    private Long id;

    private String slug;

    private String title;

    private String tag;

    private String num;

    private String arc;

    /** 整章 JSON 字符串：{stages, evidence, clues} */
    private String data;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
