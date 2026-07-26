package com.wmsbigdatalab.dto;

import lombok.Data;

@Data
public class WordImportEntry {
    private String level1Category;
    private String level2Category;
    private String title;
    private String content;
    private boolean skipped;
    private String skipReason;
}
