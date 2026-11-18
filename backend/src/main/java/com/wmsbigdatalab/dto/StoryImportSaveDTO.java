package com.wmsbigdatalab.dto;

import lombok.Data;

@Data
public class StoryImportSaveDTO {
    private String slug;
    private String title;
    private String tag;
    private String num;
    private String arc;
    /** 整章 JSON 字符串（preview 返回的 data 原样回传） */
    private String data;
}
