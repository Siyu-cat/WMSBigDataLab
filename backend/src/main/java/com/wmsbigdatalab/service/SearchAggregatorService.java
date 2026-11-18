package com.wmsbigdatalab.service;

import com.wmsbigdatalab.dto.SearchAggregateResultDTO;
import com.wmsbigdatalab.dto.SearchResultDTO;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/**
 * 全站聚合搜索：并列查询各子站数据源，统一返回格式。
 * 新增子站（如事件簿）时，在 searchAll 中追加一个数据源调用即可。
 */
@Service
public class SearchAggregatorService {

    private static final String SOURCE_WIKI = "大数据中心";

    private final EntryService entryService;

    public SearchAggregatorService(EntryService entryService) {
        this.entryService = entryService;
    }

    public List<SearchAggregateResultDTO> searchAll(String keyword) {
        List<SearchAggregateResultDTO> results = new ArrayList<>();
        if (keyword == null || keyword.isBlank()) {
            return results;
        }
        String q = keyword.trim();

        // 数据源 1：大数据中心（百科词条）
        try {
            List<SearchResultDTO> wiki = entryService.search(q);
            if (wiki != null) {
                for (SearchResultDTO r : wiki) {
                    String url = r.getSlug() != null && !r.getSlug().isBlank()
                            ? "/bigdatalab/entry/" + r.getSlug()
                            : "/bigdatalab/";
                    results.add(new SearchAggregateResultDTO(
                            SOURCE_WIKI, "wiki", r.getTitle(),
                            r.getContentSnippet(), url));
                }
            }
        } catch (Exception e) {
            // 单个数据源失败不影响其他数据源
        }

        // 数据源 2：事件簿（未来子站上线后在此追加）

        return results;
    }
}
