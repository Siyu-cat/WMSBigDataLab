package com.wmsbigdatalab.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.wmsbigdatalab.entity.EntryVersion;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface EntryVersionMapper extends BaseMapper<EntryVersion> {
    Integer selectMaxVersion(Long entryId);
}