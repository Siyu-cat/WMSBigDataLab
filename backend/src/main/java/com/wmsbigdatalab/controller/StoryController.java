package com.wmsbigdatalab.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.wmsbigdatalab.common.Result;
import com.wmsbigdatalab.dto.StoryImportSaveDTO;
import com.wmsbigdatalab.entity.StoryChapter;
import com.wmsbigdatalab.mapper.StoryChapterMapper;
import com.wmsbigdatalab.service.StoryCgService;
import com.wmsbigdatalab.service.StoryImportService;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/story")
public class StoryController {

    private final StoryImportService storyImportService;
    private final StoryChapterMapper storyChapterMapper;
    private final StoryCgService storyCgService;

    public StoryController(StoryImportService storyImportService, StoryChapterMapper storyChapterMapper,
                           StoryCgService storyCgService) {
        this.storyImportService = storyImportService;
        this.storyChapterMapper = storyChapterMapper;
        this.storyCgService = storyCgService;
    }

    /** 解析 docx 预览（不落库） */
    @PostMapping("/import/preview")
    public Result<Map<String, Object>> importPreview(@RequestParam("file") MultipartFile file) {
        try {
            if (file == null || file.isEmpty()) {
                return Result.error("请选择 docx 文件");
            }
            StoryImportService.ParseResult r = storyImportService.parse(file);
            Map<String, Object> out = new LinkedHashMap<>();
            out.put("tag", r.tag);
            out.put("title", r.title);
            out.put("num", r.num);
            List<String> stageKeys = new ArrayList<>(r.stages.keySet());
            out.put("stageKeys", stageKeys);
            Map<String, Integer> stageCounts = new LinkedHashMap<>();
            r.stages.forEach((k, v) -> stageCounts.put(k, v.size()));
            out.put("stageCounts", stageCounts);
            out.put("evidenceCount", r.evidence.size());
            out.put("clueCount", r.clues.size());
            out.put("data", storyImportService.toJson(r));
            return Result.success(out);
        } catch (Exception e) {
            return Result.error("解析失败: " + e.getMessage());
        }
    }

    /** 按 slug upsert 保存（预览确认后调用） */
    @PostMapping("/import/save")
    public Result<Map<String, Object>> importSave(@RequestBody StoryImportSaveDTO dto) {
        if (dto.getSlug() == null || dto.getSlug().trim().isEmpty()) {
            return Result.error("章节标识（slug）不能为空");
        }
        if (dto.getTitle() == null || dto.getTitle().trim().isEmpty()) {
            return Result.error("章节标题不能为空");
        }
        if (dto.getData() == null || dto.getData().trim().isEmpty()) {
            return Result.error("章节数据不能为空，请先预览解析");
        }
        String slug = dto.getSlug().trim();
        if (!slug.matches("[a-z0-9-]{1,64}")) {
            return Result.error("章节标识只能包含小写字母、数字和连字符（1-64位）");
        }
        try {
            StoryChapter existing = storyChapterMapper.selectOne(
                    new LambdaQueryWrapper<StoryChapter>().eq(StoryChapter::getSlug, slug));
            boolean created = existing == null;
            StoryChapter c = existing != null ? existing : new StoryChapter();
            c.setSlug(slug);
            c.setTitle(dto.getTitle().trim());
            c.setTag(dto.getTag() != null ? dto.getTag().trim() : "");
            c.setNum(dto.getNum() != null ? dto.getNum().trim() : "");
            c.setArc(dto.getArc() != null && !dto.getArc().trim().isEmpty() ? dto.getArc().trim() : "haiosen");
            c.setData(dto.getData());
            c.setUpdatedAt(LocalDateTime.now());
            if (created) {
                c.setCreatedAt(LocalDateTime.now());
                storyChapterMapper.insert(c);
            } else {
                storyChapterMapper.updateById(c);
            }
            Map<String, Object> out = new LinkedHashMap<>();
            out.put("slug", slug);
            out.put("created", created);
            return Result.success(out);
        } catch (Exception e) {
            return Result.error("保存失败: " + e.getMessage());
        }
    }

    /** 章节目录（公开 GET，不含 data，附带每章幕列表） */
    @GetMapping("/chapters")
    public Result<List<Map<String, Object>>> listChapters() {
        List<StoryChapter> list = storyChapterMapper.selectList(
                new LambdaQueryWrapper<StoryChapter>()
                        .select(StoryChapter::getId, StoryChapter::getSlug, StoryChapter::getTitle,
                                StoryChapter::getTag, StoryChapter::getNum, StoryChapter::getArc,
                                StoryChapter::getData, StoryChapter::getUpdatedAt)
                        .orderByAsc(StoryChapter::getNum));
        List<Map<String, Object>> out = new ArrayList<>();
        for (StoryChapter c : list) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", c.getId());
            m.put("slug", c.getSlug());
            m.put("title", c.getTitle());
            m.put("tag", c.getTag());
            m.put("num", c.getNum());
            m.put("arc", c.getArc());
            m.put("updatedAt", c.getUpdatedAt());
            m.put("stageKeys", extractStageKeys(c.getData()));
            out.add(m);
        }
        return Result.success(out);
    }

    private List<String> extractStageKeys(String data) {
        List<String> keys = new ArrayList<>();
        if (data == null || data.isEmpty()) return keys;
        try {
            com.fasterxml.jackson.databind.JsonNode root = storyImportService.readTree(data);
            com.fasterxml.jackson.databind.JsonNode stages = root.get("stages");
            if (stages != null && stages.isObject()) {
                stages.fieldNames().forEachRemaining(keys::add);
            }
        } catch (Exception ignore) {
            // data 异常时返回空列表
        }
        return keys;
    }

    /** 章节详情（公开 GET），附带已绑定的思绪 CG 图片 */
    @GetMapping("/chapter/{slug}")
    public Result<Map<String, Object>> getChapter(@PathVariable String slug) {
        StoryChapter c = storyChapterMapper.selectOne(
                new LambdaQueryWrapper<StoryChapter>().eq(StoryChapter::getSlug, slug));
        if (c == null) {
            return Result.error(404, "章节不存在");
        }
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", c.getId());
        m.put("slug", c.getSlug());
        m.put("title", c.getTitle());
        m.put("tag", c.getTag());
        m.put("num", c.getNum());
        m.put("arc", c.getArc());
        m.put("data", c.getData());
        m.put("createdAt", c.getCreatedAt());
        m.put("updatedAt", c.getUpdatedAt());
        m.put("cgs", storyCgService.listByChapter(slug));
        return Result.success(m);
    }

    /** 上传/替换思绪 CG 图片（需登录），按 (chapterSlug, name, instance) 绑定 */
    @PostMapping("/cg/upload")
    public Result<Map<String, String>> uploadCg(
            @RequestParam("chapterSlug") String chapterSlug,
            @RequestParam("name") String name,
            @RequestParam(value = "instance", required = false, defaultValue = "1") int instance,
            @RequestParam("file") MultipartFile file) {
        try {
            String url = storyCgService.upload(chapterSlug, name, instance, file);
            Map<String, String> out = new LinkedHashMap<>();
            out.put("name", name);
            out.put("imageUrl", url);
            return Result.success(out);
        } catch (IllegalArgumentException e) {
            return Result.error(e.getMessage());
        } catch (Exception e) {
            return Result.error("上传失败: " + e.getMessage());
        }
    }

    // ==================== 分片上传（免疫大流量 QoS / CF 100s 超时） ====================

    private static final int MAX_CHUNK_SIZE = 512 * 1024;
    private static final int MAX_CHUNKS = 200;
    private static final java.util.regex.Pattern UPLOAD_ID_PATTERN =
            java.util.regex.Pattern.compile("^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$");

    @org.springframework.beans.factory.annotation.Value("${wiki.upload.path:./uploads}")
    private String uploadPath;

    private File chunkDir(String uploadId) {
        String basePath = System.getProperty("user.dir");
        return new File(basePath + File.separator + uploadPath + File.separator + ".tmp" + File.separator + uploadId);
    }

    private String validateUploadId(String uploadId) {
        if (uploadId == null || !UPLOAD_ID_PATTERN.matcher(uploadId).matches()) {
            throw new IllegalArgumentException("uploadId 格式非法");
        }
        return uploadId;
    }

    /** 接收单个分片（幂等：同片重复上传直接覆盖，供重试/断点使用） */
    @PostMapping("/cg/chunk")
    public Result<?> uploadCgChunk(
            @RequestParam("uploadId") String uploadId,
            @RequestParam("chunkIndex") int chunkIndex,
            @RequestParam("totalChunks") int totalChunks,
            @RequestParam("file") MultipartFile file) {
        try {
            validateUploadId(uploadId);
            if (totalChunks < 1 || totalChunks > MAX_CHUNKS) {
                return Result.error("分片数量超出限制");
            }
            if (chunkIndex < 0 || chunkIndex >= totalChunks) {
                return Result.error("分片序号非法");
            }
            if (file == null || file.isEmpty()) {
                return Result.error("分片内容为空");
            }
            if (file.getSize() > MAX_CHUNK_SIZE) {
                return Result.error("单片不能超过 512KB");
            }
            File dir = chunkDir(uploadId);
            if (!dir.exists()) {
                dir.mkdirs();
            }
            File dest = new File(dir, chunkIndex + ".part").getAbsoluteFile();
            file.transferTo(dest);
            return Result.success();
        } catch (IllegalArgumentException e) {
            return Result.error(e.getMessage());
        } catch (Exception e) {
            return Result.error("分片保存失败: " + e.getMessage());
        }
    }

    /** 合并全部分片并完成绑定（需登录），成功后清理临时分片 */
    @PostMapping("/cg/chunk-complete")
    public Result<Map<String, String>> completeCgChunk(
            @RequestParam("uploadId") String uploadId,
            @RequestParam("chapterSlug") String chapterSlug,
            @RequestParam("name") String name,
            @RequestParam(value = "instance", required = false, defaultValue = "1") int instance,
            @RequestParam("originalName") String originalName,
            @RequestParam("totalChunks") int totalChunks) {
        File dir = null;
        try {
            validateUploadId(uploadId);
            if (totalChunks < 1 || totalChunks > MAX_CHUNKS) {
                return Result.error("分片数量超出限制");
            }
            dir = chunkDir(uploadId);
            for (int i = 0; i < totalChunks; i++) {
                if (!new File(dir, i + ".part").exists()) {
                    return Result.error("分片缺失（" + i + "/" + totalChunks + "），请重新上传");
                }
            }

            File merged = new File(dir, "merged").getAbsoluteFile();
            try (var out = new java.io.BufferedOutputStream(java.nio.file.Files.newOutputStream(merged.toPath()))) {
                for (int i = 0; i < totalChunks; i++) {
                    java.nio.file.Files.copy(new File(dir, i + ".part").toPath(), out);
                }
            }

            String url = storyCgService.uploadFromDisk(chapterSlug, name, instance, merged, originalName);
            Map<String, String> out = new LinkedHashMap<>();
            out.put("name", name);
            out.put("imageUrl", url);
            return Result.success(out);
        } catch (IllegalArgumentException e) {
            return Result.error(e.getMessage());
        } catch (Exception e) {
            return Result.error("合并失败: " + e.getMessage());
        } finally {
            // 成功后 dir 里的文件已被 move 走，这里兜底清理整个临时目录
            if (dir != null && dir.exists()) {
                deleteRecursively(dir);
            }
        }
    }

    private void deleteRecursively(File f) {
        File[] children = f.listFiles();
        if (children != null) {
            for (File c : children) {
                deleteRecursively(c);
            }
        }
        f.delete();
    }
}
