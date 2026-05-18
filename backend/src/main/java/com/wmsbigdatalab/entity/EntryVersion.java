package com.wmsbigdatalab.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("entry_version")
public class EntryVersion {
    @TableId(type = IdType.AUTO)
    private Long id;

    private Long entryId;

    private String title;

    private String summary;

    private String content;

    private Integer versionNum;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableLogic
    private LocalDateTime deletedAt;
}