package com.wmsbigdatalab.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.wmsbigdatalab.common.Result;
import com.wmsbigdatalab.entity.Entry;
import com.wmsbigdatalab.service.EntryService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/entry")
public class EntryController {

    private final EntryService entryService;

    public EntryController(EntryService entryService) {
        this.entryService = entryService;
    }

    @GetMapping("/page")
    public Result<Page<Entry>> getPage(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(required = false) Long categoryId) {
        return Result.success(entryService.getEntryPage(page, size, categoryId));
    }

    @GetMapping("/{id}")
    public Result<Entry> getById(@PathVariable Long id) {
        return Result.success(entryService.getEntryDetail(id));
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
    public Result<List<Entry>> search(@RequestParam String keyword) {
        return Result.success(entryService.search(keyword));
    }

    @GetMapping("/hot")
    public Result<List<Entry>> getHot(@RequestParam(defaultValue = "10") Integer limit) {
        return Result.success(entryService.getHotEntries(limit));
    }
}