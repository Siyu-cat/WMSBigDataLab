package com.wmsbigdatalab.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.wmsbigdatalab.common.Result;
import com.wmsbigdatalab.dto.SearchResultDTO;
import com.wmsbigdatalab.dto.WordImportEntry;
import com.wmsbigdatalab.entity.Entry;
import com.wmsbigdatalab.service.EntryService;
import com.wmsbigdatalab.service.WordImportService;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/entry")
public class EntryController {

    private final EntryService entryService;
    private final WordImportService wordImportService;

    public EntryController(EntryService entryService, WordImportService wordImportService) {
        this.entryService = entryService;
        this.wordImportService = wordImportService;
    }

    @GetMapping("/page")
    public Result<Page<Entry>> getPage(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false, defaultValue = "slug") String sortBy) {
        return Result.success(entryService.getEntryPage(page, size, categoryId, sortBy));
    }

    @GetMapping("/{id}")
    public Result<Entry> getById(@PathVariable Long id) {
        return Result.success(entryService.getEntryDetail(id));
    }

    @GetMapping("/slug/{slug}")
    public Result<Entry> getBySlug(@PathVariable String slug) {
        return Result.success(entryService.getEntryBySlug(slug));
    }

    @PostMapping
    public Result<?> save(@RequestBody Entry entry) {
        return Result.success(entryService.saveEntry(entry));
    }

    @PutMapping
    public Result<?> update(@RequestBody Entry entry) {
        return Result.success(entryService.updateEntry(entry));
    }

    @DeleteMapping("/{id}")
    public Result<?> delete(@PathVariable Long id) {
        return Result.success(entryService.deleteEntry(id));
    }

    @GetMapping("/search")
    public Result<List<SearchResultDTO>> search(@RequestParam String keyword) {
        return Result.success(entryService.search(keyword));
    }

    @GetMapping("/hot")
    public Result<List<Entry>> getHot(@RequestParam(defaultValue = "10") Integer limit) {
        return Result.success(entryService.getHotEntries(limit));
    }

    @PostMapping("/import/preview")
    public Result<List<WordImportEntry>> importPreview(@RequestParam("file") MultipartFile file) {
        try {
            List<WordImportEntry> entries = wordImportService.parse(file);
            return Result.success(entries);
        } catch (Exception e) {
            return Result.error("文件解析失败: " + e.getMessage());
        }
    }

    @PostMapping("/import/save")
    public Result<Map<String, Integer>> importSave(@RequestBody List<WordImportEntry> entries) {
        try {
            Map<String, Integer> result = entryService.importEntries(entries);
            return Result.success(result);
        } catch (Exception e) {
            return Result.error("导入失败: " + e.getMessage());
        }
    }
}