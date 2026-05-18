package com.wmsbigdatalab.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.wmsbigdatalab.entity.EntryAnnotation;
import com.wmsbigdatalab.mapper.EntryAnnotationMapper;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class EntryAnnotationService extends ServiceImpl<EntryAnnotationMapper, EntryAnnotation> {

    public List<EntryAnnotation> getByEntryId(Long entryId) {
        return list(new LambdaQueryWrapper<EntryAnnotation>()
                .eq(EntryAnnotation::getEntryId, entryId)
                .orderByAsc(EntryAnnotation::getCreatedAt));
    }

    @CacheEvict(value = "entry", allEntries = true)
    public EntryAnnotation saveAnnotation(EntryAnnotation annotation) {
        save(annotation);
        return annotation;
    }

    @CacheEvict(value = "entry", allEntries = true)
    public boolean updateAnnotation(EntryAnnotation annotation) {
        return updateById(annotation);
    }

    @CacheEvict(value = "entry", allEntries = true)
    public boolean deleteAnnotation(Long id) {
        return removeById(id);
    }
}