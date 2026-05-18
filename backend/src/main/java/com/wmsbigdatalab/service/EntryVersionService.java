package com.wmsbigdatalab.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.wmsbigdatalab.entity.Entry;
import com.wmsbigdatalab.entity.EntryVersion;
import com.wmsbigdatalab.mapper.EntryMapper;
import com.wmsbigdatalab.mapper.EntryVersionMapper;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class EntryVersionService extends ServiceImpl<EntryVersionMapper, EntryVersion> {

    private final EntryMapper entryMapper;

    public EntryVersionService(EntryMapper entryMapper) {
        this.entryMapper = entryMapper;
    }

    public List<EntryVersion> getVersions(Long entryId) {
        return list(new LambdaQueryWrapper<EntryVersion>()
                .eq(EntryVersion::getEntryId, entryId)
                .orderByDesc(EntryVersion::getVersionNum));
    }

    public EntryVersion getVersion(Long versionId) {
        return getById(versionId);
    }

    @Transactional
    @CacheEvict(value = "entry", allEntries = true)
    public boolean restoreVersion(Long versionId) {
        EntryVersion version = getById(versionId);
        if (version == null) {
            return false;
        }
        Entry entry = entryMapper.selectById(version.getEntryId());
        if (entry == null) {
            return false;
        }
        com.wmsbigdatalab.entity.EntryVersion newVersion = new com.wmsbigdatalab.entity.EntryVersion();
        newVersion.setEntryId(entry.getId());
        newVersion.setTitle(entry.getTitle());
        newVersion.setSummary(entry.getSummary());
        newVersion.setContent(entry.getContent());
        Integer maxVersion = getMaxVersion(entry.getId());
        newVersion.setVersionNum(maxVersion + 1);
        save(newVersion);

        entry.setTitle(version.getTitle());
        entry.setSummary(version.getSummary());
        entry.setContent(version.getContent());
        return entryMapper.updateById(entry) > 0;
    }

    @CacheEvict(value = "entry", allEntries = true)
    public boolean deleteVersion(Long versionId) {
        return removeById(versionId);
    }

    public Integer getMaxVersion(Long entryId) {
        return getBaseMapper().selectMaxVersion(entryId);
    }
}