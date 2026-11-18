package com.wmsbigdatalab.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("story_cg")
public class StoryCg {
    @TableId(type = IdType.AUTO)
    private Long id;

    private String chapterSlug;

    private String name;

    /** 同名思绪的实例序号（文档内第 N 次出现），默认 1 */
    private Integer instance;

    private String imageUrl;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
