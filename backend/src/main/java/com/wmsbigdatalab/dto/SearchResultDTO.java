package com.wmsbigdatalab.dto;

import lombok.Data;

@Data
public class SearchResultDTO {
    private Long id;
    private String slug;
    private String title;
    private String contentSnippet;
    private String categoryPath;
}