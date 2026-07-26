package com.wmsbigdatalab.service;

import com.wmsbigdatalab.dto.WordImportEntry;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class WordImportService {

    private static final Pattern TITLE_PATTERN = Pattern.compile("^#([^#]+)##([^#]+)###(.+)$");

    public List<WordImportEntry> parse(MultipartFile file) throws IOException {
        List<WordImportEntry> entries = new ArrayList<>();

        try (XWPFDocument doc = new XWPFDocument(file.getInputStream())) {
            XWPFWordExtractor extractor = new XWPFWordExtractor(doc);
            String text = extractor.getText();
            extractor.close();

            String[] lines = text.split("\\r?\\n");

            WordImportEntry current = null;
            boolean lastWasEmpty = true;

            for (String line : lines) {
                String trimmed = line.trim();

                if (trimmed.isEmpty()) {
                    if (current != null && current.getTitle() != null && !current.getTitle().isEmpty()) {
                        entries.add(current);
                    }
                    current = null;
                    lastWasEmpty = true;
                    continue;
                }

                Matcher matcher = TITLE_PATTERN.matcher(trimmed);
                if (matcher.matches()) {
                    if (current != null && current.getTitle() != null && !current.getTitle().isEmpty()) {
                        entries.add(current);
                    }

                    current = new WordImportEntry();
                    current.setLevel1Category(matcher.group(1).trim());
                    current.setLevel2Category(matcher.group(2).trim());

                    String title = matcher.group(3).trim();
                    if (title.isEmpty()) {
                        current.setSkipped(true);
                        current.setSkipReason("标题为空");
                    } else {
                        current.setTitle(title);
                    }

                    current.setContent("");
                    lastWasEmpty = false;
                } else if (current != null) {
                    if (!current.isSkipped()) {
                        String content = current.getContent();
                        if (!content.isEmpty()) {
                            content += "\n";
                        }
                        content += trimmed;
                        current.setContent(content);
                    }
                    lastWasEmpty = false;
                }
            }

            if (current != null && current.getTitle() != null && !current.getTitle().isEmpty()) {
                entries.add(current);
            }
        }

        return entries;
    }
}
