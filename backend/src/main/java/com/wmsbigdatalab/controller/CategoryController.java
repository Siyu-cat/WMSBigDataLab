package com.wmsbigdatalab.controller;

import com.wmsbigdatalab.common.Result;
import com.wmsbigdatalab.entity.Category;
import com.wmsbigdatalab.service.CategoryService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/category")
public class CategoryController {

    private final CategoryService categoryService;

    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping("/tree")
    public Result<List<Category>> getCategoryTree() {
        return Result.success(categoryService.getCategoryTree());
    }

    @GetMapping("/list")
    public Result<List<Category>> list() {
        return Result.success(categoryService.list());
    }

    @GetMapping("/{id}")
    public Result<Category> getById(@PathVariable Long id) {
        return Result.success(categoryService.getById(id));
    }

    @PostMapping
    public Result<?> save(@RequestBody Category category) {
        return Result.success(categoryService.saveCategory(category));
    }

    @PutMapping
    public Result<?> update(@RequestBody Category category) {
        return Result.success(categoryService.updateCategory(category));
    }

    @DeleteMapping("/{id}")
    public Result<?> delete(@PathVariable Long id) {
        return Result.success(categoryService.deleteCategory(id));
    }
}