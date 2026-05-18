package com.wmsbigdatalab.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.wmsbigdatalab.entity.Entry;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface EntryMapper extends BaseMapper<Entry> {
    List<Entry> fullTextSearch(@Param("keyword") String keyword);
}