package com.wmsbigdatalab.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.wmsbigdatalab.entity.Category;
import com.wmsbigdatalab.entity.Entry;
import com.wmsbigdatalab.entity.EntrySimple;
import com.wmsbigdatalab.mapper.CategoryMapper;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CategoryService extends ServiceImpl<CategoryMapper, Category> {

    private final EntryService entryService;

    public CategoryService(EntryService entryService) {
        this.entryService = entryService;
    }

    @Cacheable(value = "category", key = "'tree'")
    public List<Category> getCategoryTree() {
        List<Category> allCategories = list(new LambdaQueryWrapper<Category>()
                .orderByAsc(Category::getSortOrder));

        LambdaQueryWrapper<Entry> entryWrapper = new LambdaQueryWrapper<>();
        entryWrapper.orderByDesc(Entry::getCreatedAt);
        List<Entry> allEntries = entryService.list(entryWrapper);

        return buildTree(allCategories, null, allEntries);
    }

    private List<Category> buildTree(List<Category> allCategories, Long parentId, List<Entry> allEntries) {
        List<Category> tree = new ArrayList<>();
        for (Category category : allCategories) {
            if ((parentId == null && category.getParentId() == null) ||
                    (parentId != null && parentId.equals(category.getParentId()))) {
                category.setChildren(buildTree(allCategories, category.getId(), allEntries));

                List<Entry> categoryEntries = allEntries.stream()
                        .filter(e -> category.getId().equals(e.getCategoryId()))
                        .collect(Collectors.toList());
                List<EntrySimple> simpleEntries = categoryEntries.stream()
                        .map(e -> {
                            EntrySimple s = new EntrySimple();
                            s.setId(e.getId());
                            s.setTitle(e.getTitle());
                            s.setSummary(e.getSummary());
                            s.setViewCount(e.getViewCount());
                            s.setCreatedAt(e.getCreatedAt());
                            return s;
                        })
                        .collect(Collectors.toList());
                category.setEntries(simpleEntries);

                tree.add(category);
            }
        }
        return tree;
    }

    @CacheEvict(value = "category", allEntries = true)
    public Category saveCategory(Category category) {
        save(category);
        return category;
    }

    @CacheEvict(value = "category", allEntries = true)
    public boolean updateCategory(Category category) {
        return updateById(category);
    }

    @CacheEvict(value = "category", allEntries = true)
    public boolean deleteCategory(Long id) {
        return removeById(id);
    }
}