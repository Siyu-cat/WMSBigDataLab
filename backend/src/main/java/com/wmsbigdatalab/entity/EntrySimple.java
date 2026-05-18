package com.wmsbigdatalab.entity;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class EntrySimple {
    private Long id;
    private String title;
    private String summary;
    private Integer viewCount;
    private LocalDateTime createdAt;
}