package com.wmsbigdatalab.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.wmsbigdatalab.entity.Category;
import com.wmsbigdatalab.mapper.CategoryMapper;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class CategoryService extends ServiceImpl<CategoryMapper, Category> {

    @Cacheable(value = "category", key = "'tree'")
    public List<Category> getCategoryTree() {
        List<Category> allCategories = list(new LambdaQueryWrapper<Category>()
                .orderByAsc(Category::getSortOrder));

        return buildTree(allCategories, null);
    }

    private List<Category> buildTree(List<Category> allCategories, Long parentId) {
        List<Category> tree = new ArrayList<>();
        for (Category category : allCategories) {
            if ((parentId == null && category.getParentId() == null) ||
                    (parentId != null && parentId.equals(category.getParentId()))) {
                category.setChildren(buildTree(allCategories, category.getId()));
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