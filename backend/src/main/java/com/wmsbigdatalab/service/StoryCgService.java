package com.wmsbigdatalab.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.wmsbigdatalab.entity.StoryCg;
import com.wmsbigdatalab.mapper.StoryCgMapper;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 思绪 CG 图片：按 (chapter_slug, name, instance) 绑定图片。
 * 章节重导只更新 story_chapter，本表按名称绑定不丢；
 * 同名第 N 次出现的行对应 instance=N，可各自绑不同的图（instance 默认 1 = 旧行为）。
 */
@Service
public class StoryCgService {

    private static final long MAX_SIZE = 10L * 1024 * 1024;
    private static final List<String> ALLOWED_EXT = List.of("jpg", "jpeg", "png", "webp");

    private final StoryCgMapper storyCgMapper;
    private final MediaService mediaService;

    public StoryCgService(StoryCgMapper storyCgMapper, MediaService mediaService) {
        this.storyCgMapper = storyCgMapper;
        this.mediaService = mediaService;
    }

    /** 上传/替换图片，按 (slug, name, instance) upsert，返回图片直链 */
    public String upload(String chapterSlug, String name, int instance, MultipartFile file) throws IOException {
        if (chapterSlug == null || chapterSlug.isBlank()) {
            throw new IllegalArgumentException("章节标识不能为空");
        }
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("思绪名称不能为空");
        }
        if (instance < 1) {
            throw new IllegalArgumentException("实例序号必须大于 0");
        }
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("请选择图片");
        }
        if (file.getSize() > MAX_SIZE) {
            throw new IllegalArgumentException("图片不能超过 10MB");
        }
        String ext = "";
        String original = file.getOriginalFilename();
        if (original != null && original.contains(".")) {
            ext = original.substring(original.lastIndexOf('.') + 1).toLowerCase();
        }
        if (!ALLOWED_EXT.contains(ext)) {
            throw new IllegalArgumentException("仅支持 jpg / jpeg / png / webp 格式");
        }

        var media = mediaService.uploadFile(file);
        String url = mediaService.getFileUrl(media);

        StoryCg existing = storyCgMapper.selectOne(new LambdaQueryWrapper<StoryCg>()
                .eq(StoryCg::getChapterSlug, chapterSlug)
                .eq(StoryCg::getName, name)
                .eq(StoryCg::getInstance, instance));
        if (existing != null) {
            existing.setImageUrl(url);
            storyCgMapper.updateById(existing);
        } else {
            StoryCg cg = new StoryCg();
            cg.setChapterSlug(chapterSlug);
            cg.setName(name);
            cg.setInstance(instance);
            cg.setImageUrl(url);
            storyCgMapper.insert(cg);
        }
        return url;
    }

    /** 章节已绑定图片列表：[{name, imageUrl, instance}] */
    public List<Map<String, String>> listByChapter(String chapterSlug) {
        List<StoryCg> list = storyCgMapper.selectList(new LambdaQueryWrapper<StoryCg>()
                .eq(StoryCg::getChapterSlug, chapterSlug)
                .orderByAsc(StoryCg::getId));
        List<Map<String, String>> out = new ArrayList<>();
        for (StoryCg cg : list) {
            Map<String, String> m = new LinkedHashMap<>();
            m.put("name", cg.getName());
            m.put("imageUrl", cg.getImageUrl());
            m.put("instance", String.valueOf(cg.getInstance() == null ? 1 : cg.getInstance()));
            out.add(m);
        }
        return out;
    }
}
