package com.wmsbigdatalab.controller;

import com.wmsbigdatalab.common.Result;
import com.wmsbigdatalab.entity.EntryAnnotation;
import com.wmsbigdatalab.service.EntryAnnotationService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/annotation")
public class EntryAnnotationController {

    private final EntryAnnotationService entryAnnotationService;

    public EntryAnnotationController(EntryAnnotationService entryAnnotationService) {
        this.entryAnnotationService = entryAnnotationService;
    }

    @GetMapping("/list/{entryId}")
    public Result<List<EntryAnnotation>> getByEntryId(@PathVariable Long entryId) {
        return Result.success(entryAnnotationService.getByEntryId(entryId));
    }

    @PostMapping
    public Result<?> save(@RequestBody EntryAnnotation annotation) {
        return Result.success(entryAnnotationService.saveAnnotation(annotation));
    }

    @PutMapping
    public Result<?> update(@RequestBody EntryAnnotation annotation) {
        return Result.success(entryAnnotationService.updateAnnotation(annotation));
    }

    @DeleteMapping("/{id}")
    public Result<?> delete(@PathVariable Long id) {
        return Result.success(entryAnnotationService.deleteAnnotation(id));
    }
}