package com.wmsbigdatalab.controller;

import com.wmsbigdatalab.common.Result;
import com.wmsbigdatalab.dto.SearchAggregateResultDTO;
import com.wmsbigdatalab.service.SearchAggregatorService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/search")
public class SearchController {

    private final SearchAggregatorService searchAggregatorService;

    public SearchController(SearchAggregatorService searchAggregatorService) {
        this.searchAggregatorService = searchAggregatorService;
    }

    /**
     * 全站聚合搜索（公开接口）
     */
    @GetMapping("/all")
    public Result<List<SearchAggregateResultDTO>> searchAll(@RequestParam String keyword) {
        return Result.success(searchAggregatorService.searchAll(keyword));
    }
}
