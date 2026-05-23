package com.wmsbigdatalab.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.wmsbigdatalab.entity.Entry;
import com.wmsbigdatalab.entity.EntryAnnotation;
import com.wmsbigdatalab.entity.EntryVersion;
import com.wmsbigdatalab.mapper.CategoryMapper;
import com.wmsbigdatalab.mapper.EntryMapper;
import com.wmsbigdatalab.mapper.EntryVersionMapper;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class EntryService extends ServiceImpl<EntryMapper, Entry> {

    private final EntryVersionMapper entryVersionMapper;
    private final EntryAnnotationService entryAnnotationService;
    private final CategoryMapper categoryMapper;

    public EntryService(EntryVersionMapper entryVersionMapper, EntryAnnotationService entryAnnotationService, CategoryMapper categoryMapper) {
        this.entryVersionMapper = entryVersionMapper;
        this.entryAnnotationService = entryAnnotationService;
        this.categoryMapper = categoryMapper;
    }

    @Cacheable(value = "entry", key = "'page:' + #page + ':' + #size")
    public Page<Entry> getEntryPage(Integer page, Integer size, Long categoryId) {
        Page<Entry> pageParam = new Page<>(page, size);
        LambdaQueryWrapper<Entry> wrapper = new LambdaQueryWrapper<>();
        if (categoryId != null) {
            wrapper.eq(Entry::getCategoryId, categoryId);
        }
        wrapper.orderByDesc(Entry::getCreatedAt);
        return page(pageParam, wrapper);
    }

    @Cacheable(value = "entry", key = "'detail:' + #id")
    public Entry getEntryDetail(Long id) {
        Entry entry = getById(id);
        if (entry != null) {
            List<EntryAnnotation> annotations = entryAnnotationService.getByEntryId(id);
            entry.setAnnotations(annotations);
            incrementViewCount(id);
        }
        return entry;
    }

    @Async
    public void incrementViewCount(Long id) {
        Entry entry = getById(id);
        if (entry != null) {
            entry.setViewCount(entry.getViewCount() + 1);
            updateById(entry);
        }
    }

    @Transactional
    @CacheEvict(value = "entry", allEntries = true)
    public Entry saveEntry(Entry entry) {
        if (entry.getCategoryId() != null) {
            var category = categoryMapper.selectById(entry.getCategoryId());
            if (category == null) {
                throw new RuntimeException("分类不存在: " + entry.getCategoryId());
            }
        }
        if (entry.getViewCount() == null) {
            entry.setViewCount(0);
        }
        save(entry);
        if (entry.getId() != null) {
            EntryVersion version = createVersion(entry, 1);
            entryVersionMapper.insert(version);
        }
        return entry;
    }

    @Transactional
    @CacheEvict(value = "entry", allEntries = true)
    public boolean updateEntry(Entry entry) {
        Entry oldEntry = getById(entry.getId());
        if (oldEntry != null) {
            Integer maxVersion = entryVersionMapper.selectMaxVersion(entry.getId());
            EntryVersion version = createVersion(oldEntry, maxVersion + 1);
            entryVersionMapper.insert(version);
        }
        return updateById(entry);
    }

    private EntryVersion createVersion(Entry entry, Integer versionNum) {
        EntryVersion version = new EntryVersion();
        version.setEntryId(entry.getId());
        version.setTitle(entry.getTitle());
        version.setSummary(entry.getSummary());
        version.setContent(entry.getContent());
        version.setVersionNum(versionNum);
        return version;
    }

    @CacheEvict(value = "entry", allEntries = true)
    public boolean deleteEntry(Long id) {
        return removeById(id);
    }

    public List<Entry> search(String keyword) {
        return baseMapper.fullTextSearch(keyword);
    }

    @Cacheable(value = "entry", key = "'hot'")
    public List<Entry> getHotEntries(Integer limit) {
        return list(new LambdaQueryWrapper<Entry>()
                .orderByDesc(Entry::getViewCount)
                .last("LIMIT " + limit));
    }
}