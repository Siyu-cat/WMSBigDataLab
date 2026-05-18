package com.wmsbigdatalab.controller;

import com.wmsbigdatalab.common.Result;
import com.wmsbigdatalab.entity.EntryVersion;
import com.wmsbigdatalab.service.EntryVersionService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/version")
public class EntryVersionController {

    private final EntryVersionService entryVersionService;

    public EntryVersionController(EntryVersionService entryVersionService) {
        this.entryVersionService = entryVersionService;
    }

    @GetMapping("/list/{entryId}")
    public Result<List<EntryVersion>> getVersions(@PathVariable Long entryId) {
        return Result.success(entryVersionService.getVersions(entryId));
    }

    @GetMapping("/{versionId}")
    public Result<EntryVersion> getVersion(@PathVariable Long versionId) {
        return Result.success(entryVersionService.getVersion(versionId));
    }

    @PostMapping("/restore/{versionId}")
    public Result<?> restore(@PathVariable Long versionId) {
        return Result.success(entryVersionService.restoreVersion(versionId));
    }

    @DeleteMapping("/{versionId}")
    public Result<?> delete(@PathVariable Long versionId) {
        return Result.success(entryVersionService.deleteVersion(versionId));
    }
}