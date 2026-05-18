package com.wmsbigdatalab.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.wmsbigdatalab.common.Result;
import com.wmsbigdatalab.entity.Media;
import com.wmsbigdatalab.service.MediaService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/media")
public class MediaController {

    private final MediaService mediaService;

    @Value("${wiki.upload.path:./uploads}")
    private String uploadPath;

    public MediaController(MediaService mediaService) {
        this.mediaService = mediaService;
    }

    @PostMapping("/upload")
    public Result<Media> upload(MultipartFile file) throws IOException {
        Media media = mediaService.uploadFile(file);
        media.setFilePath(mediaService.getFileUrl(media));
        return Result.success(media);
    }

    @GetMapping("/page")
    public Result<Page<Media>> getPage(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer size) {
        return Result.success(mediaService.getMediaPage(page, size));
    }

    @GetMapping("/list")
    public Result<List<Media>> list() {
        return Result.success(mediaService.list());
    }

    @GetMapping("/{id}")
    public Result<Media> getById(@PathVariable Long id) {
        return Result.success(mediaService.getById(id));
    }

    @DeleteMapping("/{id}")
    public Result<?> delete(@PathVariable Long id) {
        return Result.success(mediaService.deleteMedia(id));
    }

    @GetMapping("/uploads/**")
    public ResponseEntity<Resource> serveFile(jakarta.servlet.http.HttpServletRequest request) throws IOException {
        String path = request.getRequestURI().replaceFirst("/api/media", "");
        String basePath = System.getProperty("user.dir");
        File file = new File(basePath + File.separator + uploadPath + path);
        if (!file.exists()) {
            return ResponseEntity.notFound().build();
        }
        Resource resource = new FileSystemResource(file);
        String contentType = "application/octet-stream";
        if (file.getName().endsWith(".jpg") || file.getName().endsWith(".jpeg")) {
            contentType = "image/jpeg";
        } else if (file.getName().endsWith(".png")) {
            contentType = "image/png";
        } else if (file.getName().endsWith(".gif")) {
            contentType = "image/gif";
        }
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + file.getName() + "\"")
                .body(resource);
    }
}