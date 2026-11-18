package com.wmsbigdatalab.dto;

import lombok.Data;

/**
 * 全站聚合搜索结果条目
 */
@Data
public class SearchAggregateResultDTO {
    /** 来源站点：大数据中心 / 事件簿（未来） */
    private String source;
    /** 结果类型：wiki / story */
    private String type;
    private String title;
    private String summary;
    /** 跳转地址（绝对路径，跨子应用） */
    private String url;

    public SearchAggregateResultDTO() {
    }

    public SearchAggregateResultDTO(String source, String type, String title, String summary, String url) {
        this.source = source;
        this.type = type;
        this.title = title;
        this.summary = summary;
        this.url = url;
    }
}
