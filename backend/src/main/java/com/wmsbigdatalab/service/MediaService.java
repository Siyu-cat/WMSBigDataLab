package com.wmsbigdatalab.service;

import cn.hutool.core.io.FileUtil;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.wmsbigdatalab.entity.Media;
import com.wmsbigdatalab.mapper.MediaMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
public class MediaService extends ServiceImpl<MediaMapper, Media> {

    @Value("${wiki.upload.path:./uploads}")
    private String uploadPath;

    public Media uploadFile(MultipartFile file) throws IOException {
        String originalName = file.getOriginalFilename();
        String extension = FileUtil.extName(originalName);
        String filename = UUID.randomUUID().toString() + "." + extension;

        String datePath = LocalDate.now().toString().replace("-", "/");

        String basePath = System.getProperty("user.dir");
        File dir = new File(basePath + File.separator + uploadPath + File.separator + datePath);
        if (!dir.exists()) {
            dir.mkdirs();
        }

        File dest = new File(dir, filename);
        file.transferTo(dest);

        Media media = new Media();
        media.setFilename(filename);
        media.setOriginalName(originalName);
        media.setFileType(getFileType(extension));
        media.setFileSize(file.getSize());
        media.setFilePath(datePath + "/" + filename);
        save(media);

        return media;
    }

    public Page<Media> getMediaPage(Integer page, Integer size) {
        Page<Media> pageParam = new Page<>(page, size);
        return page(pageParam);
    }

    public boolean deleteMedia(Long id) {
        Media media = getById(id);
        if (media != null) {
            String basePath = System.getProperty("user.dir");
            File file = new File(basePath + File.separator + uploadPath + File.separator + media.getFilePath());
            if (file.exists()) {
                file.delete();
            }
        }
        return removeById(id);
    }

    private String getFileType(String extension) {
        extension = extension.toLowerCase();
        if ("jpg".equals(extension) || "jpeg".equals(extension) ||
                "png".equals(extension) || "gif".equals(extension) ||
                "webp".equals(extension)) {
            return "image";
        } else if ("mp4".equals(extension) || "avi".equals(extension) ||
                "mov".equals(extension) || "wmv".equals(extension)) {
            return "video";
        } else if ("pdf".equals(extension) || "doc".equals(extension) ||
                "docx".equals(extension) || "txt".equals(extension)) {
            return "document";
        }
        return "other";
    }

    public String getFileUrl(Media media) {
        return "/uploads/" + media.getFilePath();
    }
}