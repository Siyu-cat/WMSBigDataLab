package com.wmsbigdatalab.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("media")
public class Media {
    @TableId(type = IdType.AUTO)
    private Long id;

    private String filename;

    private String originalName;

    private String fileType;

    private Long fileSize;

    private String filePath;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableLogic
    private LocalDateTime deletedAt;
}