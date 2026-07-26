package com.wmsbigdatalab.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.wmsbigdatalab.dto.SearchResultDTO;
import com.wmsbigdatalab.entity.Category;
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

import com.wmsbigdatalab.dto.WordImportEntry;
import org.springframework.cache.annotation.Caching;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import com.wmsbigdatalab.utils.SlugUtil;

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

    public Page<Entry> getEntryPage(Integer page, Integer size, Long categoryId, String sortBy) {
        Page<Entry> pageParam = new Page<>(page, size);
        LambdaQueryWrapper<Entry> wrapper = new LambdaQueryWrapper<>();
        if (categoryId != null) {
            wrapper.eq(Entry::getCategoryId, categoryId);
        }
        if ("createdAt".equals(sortBy)) {
            wrapper.orderByDesc(Entry::getCreatedAt);
        } else {
            wrapper.orderByAsc(Entry::getSlug);
        }
        return page(pageParam, wrapper);
    }

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
    @Caching(evict = {
        @org.springframework.cache.annotation.CacheEvict(value = "entry", allEntries = true),
        @org.springframework.cache.annotation.CacheEvict(value = "category", allEntries = true)
    })
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
        entry.setSlug(getUniqueSlug(entry.getTitle(), null));
        save(entry);
        if (entry.getId() != null) {
            EntryVersion version = createVersion(entry, 1);
            entryVersionMapper.insert(version);
        }
        return entry;
    }

    @Transactional
    @Caching(evict = {
        @org.springframework.cache.annotation.CacheEvict(value = "entry", allEntries = true),
        @org.springframework.cache.annotation.CacheEvict(value = "category", allEntries = true)
    })
    public boolean updateEntry(Entry entry) {
        Entry oldEntry = getById(entry.getId());
        if (oldEntry != null) {
            Integer maxVersion = entryVersionMapper.selectMaxVersion(entry.getId());
            EntryVersion version = createVersion(oldEntry, maxVersion + 1);
            entryVersionMapper.insert(version);
            if (!oldEntry.getTitle().equals(entry.getTitle())) {
                entry.setSlug(getUniqueSlug(entry.getTitle(), entry.getId()));
            }
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

    @Caching(evict = {
        @org.springframework.cache.annotation.CacheEvict(value = "entry", allEntries = true),
        @org.springframework.cache.annotation.CacheEvict(value = "category", allEntries = true)
    })
    public boolean deleteEntry(Long id) {
        return removeById(id);
    }

    public List<SearchResultDTO> search(String keyword) {
        List<Entry> entries = baseMapper.fullTextSearch(keyword);
        List<SearchResultDTO> results = new ArrayList<>();
        for (Entry entry : entries) {
            SearchResultDTO dto = new SearchResultDTO();
            dto.setId(entry.getId());
            dto.setSlug(entry.getSlug());
            dto.setTitle(entry.getTitle());
            dto.setContentSnippet(getContentSnippet(entry.getContent(), keyword));
            dto.setCategoryPath(getCategoryPath(entry.getCategoryId()));
            results.add(dto);
        }
        return results;
    }

    private String getCategoryPath(Long categoryId) {
        if (categoryId == null) {
            return "";
        }
        Category category = categoryMapper.selectById(categoryId);
        if (category == null) {
            return "";
        }
        List<String> path = new ArrayList<>();
        path.add(category.getName());
        Long parentId = category.getParentId();
        while (parentId != null) {
            Category parent = categoryMapper.selectById(parentId);
            if (parent == null) {
                break;
            }
            path.add(0, parent.getName());
            parentId = parent.getParentId();
        }
        return String.join("-", path);
    }

    private String getContentSnippet(String content, String keyword) {
        if (content == null || content.isEmpty()) {
            return "";
        }
        String plainText = stripHtml(content);
        int index = plainText.toLowerCase().indexOf(keyword.toLowerCase());
        if (index == -1) {
            return plainText.length() > 100 ? plainText.substring(0, 100) + "..." : plainText;
        }
        int start = Math.max(0, index - 50);
        int end = Math.min(plainText.length(), index + keyword.length() + 50);
        String snippet = plainText.substring(start, end);
        if (start > 0) {
            snippet = "..." + snippet;
        }
        if (end < plainText.length()) {
            snippet = snippet + "...";
        }
        return snippet;
    }

    private String stripHtml(String html) {
        return html.replaceAll("<[^>]+>", "").replaceAll("\\s+", " ").trim();
    }

    public List<Entry> getHotEntries(Integer limit) {
        return list(new LambdaQueryWrapper<Entry>()
                .orderByDesc(Entry::getViewCount)
                .last("LIMIT " + limit));
    }

    public Entry getEntryBySlug(String slug) {
        Entry entry = getOne(new LambdaQueryWrapper<Entry>().eq(Entry::getSlug, slug));
        if (entry != null) {
            List<EntryAnnotation> annotations = entryAnnotationService.getByEntryId(entry.getId());
            entry.setAnnotations(annotations);
            incrementViewCount(entry.getId());
        }
        return entry;
    }

    public String getUniqueSlug(String title, Long excludeId) {
        String baseSlug = SlugUtil.generateSlug(title);
        if (baseSlug.isEmpty()) {
            baseSlug = "entry";
        }
        String slug = baseSlug;
        int counter = 2;
        while (isSlugExists(slug, excludeId)) {
            slug = baseSlug + counter;
            counter++;
        }
        return slug;
    }

    private boolean isSlugExists(String slug, Long excludeId) {
        LambdaQueryWrapper<Entry> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Entry::getSlug, slug);
        if (excludeId != null) {
            wrapper.ne(Entry::getId, excludeId);
        }
        return count(wrapper) > 0;
    }

    @CacheEvict(value = "entry", allEntries = true)
    public void generateSlugsForExistingEntries() {
        List<Entry> entries = list(new LambdaQueryWrapper<Entry>().isNull(Entry::getSlug));
        for (Entry entry : entries) {
            entry.setSlug(getUniqueSlug(entry.getTitle(), entry.getId()));
            updateById(entry);
        }
    }

    @Transactional
    @Caching(evict = {
        @org.springframework.cache.annotation.CacheEvict(value = "entry", allEntries = true),
        @org.springframework.cache.annotation.CacheEvict(value = "category", allEntries = true)
    })
    public Map<String, Integer> importEntries(List<WordImportEntry> items) {
        int created = 0, updated = 0, skipped = 0, errors = 0;

        List<WordImportEntry> validItems = items.stream()
                .filter(item -> !item.isSkipped())
                .collect(Collectors.toList());

        for (WordImportEntry item : validItems) {
            try {
                Category level1 = findOrCreateCategory(item.getLevel1Category(), null);
                Category level2 = findOrCreateCategory(item.getLevel2Category(), level1.getId());

                Entry existing = getOne(new LambdaQueryWrapper<Entry>()
                        .eq(Entry::getTitle, item.getTitle()));

                String htmlContent = buildHtmlContent(item.getContent());

                if (existing != null) {
                    existing.setContent(htmlContent);
                    existing.setCategoryId(level2.getId());
                    existing.setSummary(item.getContent().length() > 200
                            ? item.getContent().substring(0, 200) + "..."
                            : item.getContent());
                    updateById(existing);
                    updated++;
                } else {
                    Entry entry = new Entry();
                    entry.setTitle(item.getTitle());
                    entry.setContent(htmlContent);
                    entry.setCategoryId(level2.getId());
                    entry.setSummary(item.getContent().length() > 200
                            ? item.getContent().substring(0, 200) + "..."
                            : item.getContent());
                    entry.setViewCount(0);
                    entry.setSlug(getUniqueSlug(item.getTitle(), null));
                    save(entry);
                    created++;
                }
            } catch (Exception e) {
                errors++;
            }
        }

        skipped = items.size() - validItems.size();

        return Map.of("created", created, "updated", updated, "skipped", skipped, "errors", errors);
    }

    private Category findOrCreateCategory(String name, Long parentId) {
        LambdaQueryWrapper<Category> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Category::getName, name);
        if (parentId != null) {
            wrapper.eq(Category::getParentId, parentId);
        } else {
            wrapper.isNull(Category::getParentId);
        }
        Category category = categoryMapper.selectOne(wrapper);

        if (category == null) {
            category = new Category();
            category.setName(name);
            category.setParentId(parentId);
            category.setSortOrder(0);
            categoryMapper.insert(category);
        }

        return category;
    }

    private String buildHtmlContent(String plainText) {
        if (plainText == null || plainText.isEmpty()) {
            return "";
        }
        String[] paragraphs = plainText.split("\n");
        StringBuilder html = new StringBuilder();
        for (String p : paragraphs) {
            String trimmed = p.trim();
            if (!trimmed.isEmpty()) {
                html.append("<p>").append(escapeHtml(trimmed)).append("</p>");
            }
        }
        return html.toString();
    }

    private String escapeHtml(String text) {
        if (text == null) return "";
        return text
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}