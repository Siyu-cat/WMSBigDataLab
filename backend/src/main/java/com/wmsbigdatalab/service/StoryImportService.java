package com.wmsbigdatalab.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.poi.xwpf.usermodel.*;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.xml.namespace.QName;
import java.io.IOException;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 主线剧情 docx 解析器（格式规则与导出脚本/export.js、临时验证脚本/parse.js 一致）。
 *
 * 文档结构：
 *   第一段（非空）= 章节头：英文前缀 + 中文标题，如 Episode.1人情冷暖
 *   Heading1「XX-XX」= 幕
 *   段落样式 场景/展开/选项/推理/证物选择 = 交互块
 *   缩进 420 twips 一级，缩进归零 = 块结束
 *   【证物档案】/【词条档案】= 档案区
 */
@Service
public class StoryImportService {

    private static final int INDENT = 420;
    private static final String STYLE_SCENE = "Scene";
    private static final String STYLE_EXPAND = "Expand";
    private static final String STYLE_CHOICE = "Choice";
    private static final String STYLE_THINK = "Think";
    private static final String STYLE_EVIDENCE = "EvidencePick";

    /** 归一化样式键（小写去空格）→ 规范样式 id：覆盖导出原生 styleId 与 Word/WPS 保存后的 w:name（含中文化名） */
    private static final Map<String, String> STYLE_ALIASES = Map.ofEntries(
            Map.entry("heading1", "Heading1"),
            Map.entry("heading2", "Heading2"),
            Map.entry("scene", "Scene"),
            Map.entry("expand", "Expand"),
            Map.entry("choice", "Choice"),
            Map.entry("think", "Think"),
            Map.entry("evidencepick", "EvidencePick"),
            Map.entry("场景", "Scene"),
            Map.entry("展开", "Expand"),
            Map.entry("选项", "Choice"),
            Map.entry("推理", "Think"),
            Map.entry("证物选择", "EvidencePick"));

    private static final Pattern STAGE_PATTERN = Pattern.compile("^\\d{2}-\\d{2}$");
    private static final Pattern HEAD_PATTERN = Pattern.compile("^([\\x00-\\x7F]+?)([^\\x00-\\x7F].*)$");
    private static final Pattern DIALOGUE_PATTERN = Pattern.compile("^([^：]{1,10})：(.+)$");
    private static final Pattern DEBATE_PATTERN = Pattern.compile("^｛论证：(.+)｝$");
    private static final Pattern CG_PATTERN = Pattern.compile("^思绪【([^】]+)】$");
    /** CG 行变体前缀（方案A写死三个）：插画/CG/邀请函 + 「」（兼容⌈⌉与⌈⌋混搭），整行匹配，大小写不敏感 */
    private static final Pattern CG_VARIANT_PATTERN =
            Pattern.compile("^(插画|CG|邀请函)[「⌈⌊]([^」⌉⌋]+)[」⌉⌋]$", Pattern.CASE_INSENSITIVE);

    /** CG 绑定键（前后端同规则）：思绪=纯名；其他前缀=label:name——不同前缀同名不共图 */
    private static String cgBindKey(String label, String name) {
        return (label != null && !label.isBlank() && !"思绪".equals(label)) ? label + ":" + name : name;
    }

    private static final List<String> GETCLUE_PREFIX =
            Arrays.asList("获得词条：", "证物更新：", "获得线索：");
    private static final List<String> INTERACT_PREFIX = Arrays.asList(
            "辩论对象：", "消耗：", "属性倾向：", "推荐战力：", "通关奖励：", "事件概述：",
            "对方观点：", "我方观点：", "疑问：", "更新证物记录：", "选择证物：");
    private static final Set<String> STATUS_WORDS = new HashSet<>(
            Arrays.asList("完成调查", "完成询问", "胜诉", "败诉", "辩护成功", "辩护失败"));
    private static final Set<String> DIALOGUE_EXCLUDE = new HashSet<>(Arrays.asList(
            "获得词条", "证物更新", "获得线索", "线索", "辩论对象", "消耗", "属性倾向",
            "推荐战力", "通关奖励", "事件概述", "对方观点", "我方观点", "疑问",
            "更新证物记录", "选择证物", "正确答案", "错误答案", "简介", "详情",
            "推论", "勘验", "描述"));

    private final ObjectMapper objectMapper = new ObjectMapper();

    // ---------- 解析结果 ----------

    public static class ParseResult {
        public String tag;
        public String title;
        public String num = "";
        public Map<String, List<Map<String, Object>>> stages = new LinkedHashMap<>();
        public List<Map<String, Object>> evidence = new ArrayList<>();
        public List<Map<String, Object>> clues = new ArrayList<>();
    }

    private static class LineResult {
        Map<String, Object> line;
        int next;
    }

    private static class BlockResult {
        List<Map<String, Object>> lines = new ArrayList<>();
        int next;
    }

    // ---------- 段落模型 ----------

    private static class Run {
        String text;
        String color;
    }

    private static class Para {
        String text = "";
        String style;
        int indent;
        List<Run> runs = new ArrayList<>();
    }

    // ---------- 入口 ----------

    public ParseResult parse(MultipartFile file) throws IOException {
        List<Para> paras;
        try (XWPFDocument doc = new XWPFDocument(file.getInputStream())) {
            paras = readParagraphs(doc);
        }

        ParseResult result = new ParseResult();

        // 第一个非空段落 = 章节头
        int i = 0;
        while (i < paras.size() && paras.get(i).text.trim().isEmpty()) i++;
        if (i >= paras.size()) {
            throw new RuntimeException("文档为空");
        }
        String head = paras.get(i).text.trim();
        Matcher hm = HEAD_PATTERN.matcher(head);
        if (!hm.matches()) {
            throw new RuntimeException("文档第一段应为「英文前缀+中文标题」格式，例如 Episode.1人情冷暖");
        }
        result.tag = hm.group(1).trim();
        result.title = hm.group(2).trim();
        if (result.tag.isEmpty() || result.title.isEmpty()) {
            throw new RuntimeException("章节头解析失败，应为「英文前缀+中文标题」，例如 Episode.1人情冷暖");
        }
        i++;

        String mode = "skip";
        String currentStage = null;
        Map<String, Object> currentEvidence = null;
        String evidenceField = null;
        Map<String, Object> currentInspection = null;
        Map<String, Object> currentClue = null;

        while (i < paras.size()) {
            Para p = paras.get(i);
            boolean h1 = "Heading1".equals(p.style);
            boolean h2 = "Heading2".equals(p.style);
            String t = p.text.trim();
            // 文本兜底：幕/档案标题即使样式被 Word/WPS 重排也能识别
            if (!h1 && (STAGE_PATTERN.matcher(t).matches() || "【证物档案】".equals(t) || "【词条档案】".equals(t))) {
                h1 = true;
            }

            if (h1) {
                if (STAGE_PATTERN.matcher(t).matches()) {
                    mode = "stage";
                    currentStage = t;
                    result.stages.put(t, new ArrayList<>());
                    currentEvidence = null;
                    currentClue = null;
                    i++;
                    continue;
                }
                if ("【证物档案】".equals(t)) {
                    mode = "evidence";
                    currentEvidence = null;
                    currentClue = null;
                    i++;
                    continue;
                }
                if ("【词条档案】".equals(t)) {
                    mode = "clues";
                    currentEvidence = null;
                    currentClue = null;
                    i++;
                    continue;
                }
                i++;
                continue;
            }

            if ("stage".equals(mode)) {
                if (p.indent == 0) {
                    LineResult r = parseTopLine(paras, i);
                    if (r != null) {
                        result.stages.get(currentStage).add(r.line);
                        i = r.next;
                        continue;
                    }
                }
                i++;
                continue;
            }

            if ("evidence".equals(mode)) {
                if (h2) {
                    currentEvidence = new LinkedHashMap<>();
                    currentEvidence.put("name", t);
                    currentEvidence.put("summary", "");
                    currentEvidence.put("details", new ArrayList<String>());
                    result.evidence.add(currentEvidence);
                    evidenceField = null;
                    currentInspection = null;
                    i++;
                    continue;
                }
                if (currentEvidence != null) {
                    if (p.indent == 0) {
                        if (t.startsWith("简介：")) {
                            currentEvidence.put("summary", t.substring("简介：".length()));
                            evidenceField = null;
                        } else if ("详情：".equals(t)) {
                            evidenceField = "details";
                        } else if ("推论：".equals(t)) {
                            evidenceField = "inferences";
                            currentEvidence.putIfAbsent("inferences", new ArrayList<String>());
                        } else if (t.startsWith("勘验：")) {
                            evidenceField = "inspection";
                            currentInspection = new LinkedHashMap<>();
                            currentInspection.put("target", t.substring("勘验：".length()));
                            currentInspection.put("result", new ArrayList<String>());
                            @SuppressWarnings("unchecked")
                            List<Map<String, Object>> inspections =
                                    (List<Map<String, Object>>) currentEvidence.computeIfAbsent(
                                            "inspections", k -> new ArrayList<Map<String, Object>>());
                            inspections.add(currentInspection);
                        }
                    } else if (p.indent > 0) {
                        if ("details".equals(evidenceField)) {
                            @SuppressWarnings("unchecked")
                            List<String> details = (List<String>) currentEvidence.get("details");
                            details.add(t);
                        } else if ("inferences".equals(evidenceField)) {
                            @SuppressWarnings("unchecked")
                            List<String> inf = (List<String>) currentEvidence.get("inferences");
                            inf.add(t);
                        } else if ("inspection".equals(evidenceField) && currentInspection != null) {
                            @SuppressWarnings("unchecked")
                            List<String> res = (List<String>) currentInspection.get("result");
                            res.add(t);
                        }
                    }
                }
                i++;
                continue;
            }

            if ("clues".equals(mode)) {
                if (h2) {
                    currentClue = new LinkedHashMap<>();
                    currentClue.put("name", t);
                    currentClue.put("description", "");
                    result.clues.add(currentClue);
                    i++;
                    continue;
                }
                if (currentClue != null && t.startsWith("描述：")) {
                    currentClue.put("description", t.substring("描述：".length()));
                }
                i++;
                continue;
            }

            i++;
        }

        if (result.stages.isEmpty()) {
            throw new RuntimeException("未找到任何幕（Heading1「XX-XX」格式标题）");
        }
        String firstStage = result.stages.keySet().iterator().next();
        result.num = firstStage.length() >= 2 ? firstStage.substring(0, 2) : "";
        assignCgInstances(result.stages);
        return result;
    }

    /**
     * 同名「思绪【X】」行按出现次序发实例号 inst（章内计数，DFS 树序 = 文档顺序）。
     * inst 供前端与后台按 (name, instance) 各自绑图；全写（含首个实例=1），语义唯一权威。
     */
    private void assignCgInstances(Map<String, List<Map<String, Object>>> stages) {
        Map<String, Integer> counter = new HashMap<>();
        for (List<Map<String, Object>> lines : stages.values()) {
            walkCgInstances(lines, counter);
        }
    }

    @SuppressWarnings("unchecked")
    private void walkCgInstances(List<Map<String, Object>> lines, Map<String, Integer> counter) {
        if (lines == null) {
            return;
        }
        for (Map<String, Object> l : lines) {
            if (l == null) {
                continue;
            }
            if ("cg".equals(l.get("type")) && l.get("name") instanceof String name && !name.isBlank()) {
                Object lbl = l.get("label");
                String key = cgBindKey(lbl instanceof String s ? s : null, name);
                l.put("inst", counter.merge(key, 1, Integer::sum));
            }
            walkCgInstances((List<Map<String, Object>>) l.get("lines"), counter);
            if (l.get("options") instanceof List<?> opts) {
                for (Object o : opts) {
                    if (o instanceof Map<?, ?> om) {
                        walkCgInstances((List<Map<String, Object>>) om.get("lines"), counter);
                    }
                }
            }
            walkCgInstances((List<Map<String, Object>>) l.get("correctLines"), counter);
            walkCgInstances((List<Map<String, Object>>) l.get("wrongLines"), counter);
            if (l.get("gate") instanceof Map<?, ?> gate) {
                walkCgInstances((List<Map<String, Object>>) gate.get("lockedLines"), counter);
            }
            if (l.get("debate") instanceof Map<?, ?> debate) {
                walkCgInstances((List<Map<String, Object>>) debate.get("ledgerLines"), counter);
                walkCgInstances((List<Map<String, Object>>) debate.get("printLines"), counter);
            }
        }
    }

    public String toJson(ParseResult result) throws IOException {
        Map<String, Object> root = new LinkedHashMap<>();
        root.put("stages", result.stages);
        root.put("evidence", result.evidence);
        root.put("clues", result.clues);
        return objectMapper.writeValueAsString(root);
    }

    public com.fasterxml.jackson.databind.JsonNode readTree(String json) throws IOException {
        return objectMapper.readTree(json);
    }

    // ---------- 段落读取 ----------

    /**
     * 样式识别双通道：styleId + w:name 归一化后查别名表。
     * Word/WPS 重存文档会重排 styleId（Heading1→1、Scene→af0…）但保留样式名字，
     * 因此 name 必须也认；均未命中返回原 styleId（导出工具原生文档行为不变）。
     */
    private String resolveStyle(XWPFDocument doc, String styleId) {
        String byId = STYLE_ALIASES.get(normalizeStyleKey(styleId));
        if (byId != null) {
            return byId;
        }
        try {
            var styles = doc.getStyles();
            var st = styles != null ? styles.getStyle(styleId) : null;
            if (st != null && st.getCTStyle() != null && st.getCTStyle().getName() != null) {
                String byName = STYLE_ALIASES.get(normalizeStyleKey(st.getCTStyle().getName().getVal()));
                if (byName != null) {
                    return byName;
                }
            }
        } catch (Exception ignore) {
            // 样式表缺失/异常时按原 styleId 走
        }
        return styleId;
    }

    private static String normalizeStyleKey(String s) {
        if (s == null) {
            return "";
        }
        return s.toLowerCase(java.util.Locale.ROOT).replaceAll("[\\s_\\-]", "");
    }

    private List<Para> readParagraphs(XWPFDocument doc) {
        List<Para> paras = new ArrayList<>();
        for (XWPFParagraph xp : doc.getParagraphs()) {
            Para p = new Para();
            org.openxmlformats.schemas.wordprocessingml.x2006.main.CTP ctP = xp.getCTP();
            if (ctP.getPPr() != null) {
                if (ctP.getPPr().getPStyle() != null) {
                    p.style = resolveStyle(doc, ctP.getPPr().getPStyle().getVal());
                }
                if (ctP.getPPr().getInd() != null && ctP.getPPr().getInd().getLeft() != null) {
                    Object left = ctP.getPPr().getInd().getLeft();
                    if (left instanceof Number) {
                        p.indent = ((Number) left).intValue();
                    } else if (left != null) {
                        try {
                            p.indent = Integer.parseInt(left.toString().trim());
                        } catch (NumberFormatException ignore) {
                            p.indent = 0;
                        }
                    }
                }
            }
            StringBuilder sb = new StringBuilder();
            for (XWPFRun xr : xp.getRuns()) {
                Run r = new Run();
                r.text = xr.text() == null ? "" : xr.text();
                r.color = xr.getColor();
                p.runs.add(r);
                sb.append(r.text);
            }
            p.text = sb.toString();
            paras.add(p);
        }
        return paras;
    }

    // ---------- 参数解析 ----------

    private Map<String, String> parseParamStr(String s) {
        Map<String, String> out = new LinkedHashMap<>();
        if (s == null || s.isEmpty()) return out;
        for (String part : s.split("\\|")) {
            part = part.trim();
            if (part.isEmpty()) continue;
            int eq = part.indexOf('=');
            if (eq < 0) {
                out.put(part, "true");
            } else {
                out.put(part.substring(0, eq).trim(), part.substring(eq + 1).trim());
            }
        }
        return out;
    }

    /** 拆「标签 {k=v|k2}」；无参数时 label=全文 */
    private String[] splitLabelParams(String text) {
        Matcher m = Pattern.compile("^(.*?)\\s*\\{([^{}]*)\\}\\s*$").matcher(text);
        if (m.matches()) {
            return new String[]{m.group(1).trim(), m.group(2)};
        }
        return new String[]{text.trim(), null};
    }

    private List<String> parseList(String v) {
        List<String> out = new ArrayList<>();
        for (String s : v.split(",")) {
            s = s.trim();
            if (!s.isEmpty()) out.add(s);
        }
        return out;
    }

    private List<Object> parseWhenList(String v) {
        List<Object> out = new ArrayList<>();
        for (String s : v.split(",")) {
            s = s.trim();
            if (s.isEmpty()) continue;
            if (s.contains("@")) {
                String[] kv = s.split("@", 2);
                out.add(Arrays.asList(kv[0].trim(), Integer.parseInt(kv[1].trim())));
            } else {
                out.add(s);
            }
        }
        return out;
    }

    // ---------- 行解析 ----------

    private Map<String, Object> line(String type) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("type", type);
        return m;
    }

    private Object extractHighlight(Para p) {
        List<Map<String, Object>> reds = new ArrayList<>();
        for (Run r : p.runs) {
            if (r.color != null && "FF0000".equalsIgnoreCase(r.color) && !r.text.isEmpty()) {
                Map<String, Object> h = new LinkedHashMap<>();
                h.put("text", r.text);
                h.put("color", "#DF545E");
                reds.add(h);
            }
        }
        if (reds.isEmpty()) return null;
        return reds.size() == 1 ? reds.get(0) : reds;
    }

    @SuppressWarnings("unchecked")
    private Object filterHighlight(Object hl, String text) {
        if (hl == null) return null;
        if (hl instanceof Map) {
            String t = (String) ((Map<String, Object>) hl).get("text");
            return text.contains(t) ? hl : null;
        }
        if (hl instanceof List) {
            List<Map<String, Object>> kept = new ArrayList<>();
            for (Object item : (List<Object>) hl) {
                String t = (String) ((Map<String, Object>) item).get("text");
                if (text.contains(t)) kept.add((Map<String, Object>) item);
            }
            if (kept.isEmpty()) return null;
            return kept.size() == 1 ? kept.get(0) : kept;
        }
        return null;
    }

    private Map<String, Object> parsePlainLine(Para p) {
        String text = p.text;
        Object hl = extractHighlight(p);

        if ("［空］".equals(text)) {
            return line("gap");
        }
        Matcher cg = CG_PATTERN.matcher(text);
        if (cg.matches()) {
            Map<String, Object> m = line("cg");
            m.put("name", cg.group(1));
            return m;
        }
        Matcher cv = CG_VARIANT_PATTERN.matcher(text);
        if (cv.matches()) {
            Map<String, Object> m = line("cg");
            m.put("name", cv.group(2));
            m.put("label", cv.group(1));
            return m;
        }
        for (String pre : GETCLUE_PREFIX) {
            if (text.startsWith(pre)) {
                Map<String, Object> m = line("getclue");
                m.put("text", text);
                if ("获得词条：".equals(pre)) m.put("color", "#89614A");
                else if ("证物更新：".equals(pre)) m.put("color", "#55948A");
                return m;
            }
        }
        for (String pre : INTERACT_PREFIX) {
            if (text.startsWith(pre)) {
                Map<String, Object> m = line("interact");
                m.put("text", text);
                return m;
            }
        }
        if (STATUS_WORDS.contains(text) || text.matches("^WAVE\\s.*") || text.matches("^【[^】]+】.*")) {
            Map<String, Object> m = line("interact");
            m.put("text", text);
            return m;
        }
        Matcher dm = DIALOGUE_PATTERN.matcher(text);
        if (dm.matches() && !DIALOGUE_EXCLUDE.contains(dm.group(1))) {
            Map<String, Object> m = line("dialogue");
            m.put("speaker", dm.group(1));
            m.put("text", dm.group(2));
            Object h = filterHighlight(hl, dm.group(2));
            if (h != null) m.put("highlight", h);
            return m;
        }
        Map<String, Object> m = line("narration");
        m.put("text", text);
        if (hl != null) m.put("highlight", hl);
        return m;
    }

    /** 幕内顶格行分发：块/场景/普通行 */
    private LineResult parseTopLine(List<Para> paras, int i) {
        Para p = paras.get(i);
        if (STYLE_EXPAND.equals(p.style)) return parseExpand(paras, i);
        if (STYLE_CHOICE.equals(p.style)) return parseChoice(paras, i);
        if (STYLE_THINK.equals(p.style)) return parseThink(paras, i);
        if (STYLE_EVIDENCE.equals(p.style)) return parseEvidencePick(paras, i);
        if (STYLE_SCENE.equals(p.style)) {
            String[] lp = splitLabelParams(p.text);
            Map<String, Object> m = line("scene");
            m.put("text", lp[0]);
            if (lp[1] != null) {
                Map<String, String> params = parseParamStr(lp[1]);
                if (params.containsKey("sub") && !params.get("sub").isEmpty()) {
                    m.put("sub", params.get("sub"));
                }
            }
            LineResult r = new LineResult();
            r.line = m;
            r.next = i + 1;
            return r;
        }
        LineResult r = new LineResult();
        r.line = parsePlainLine(p);
        r.next = i + 1;
        return r;
    }

    private BlockResult parseBlockLines(List<Para> paras, int start, int baseIndent) {
        BlockResult out = new BlockResult();
        int j = start;
        while (j < paras.size() && paras.get(j).indent > baseIndent) {
            Para q = paras.get(j);
            if ("Heading1".equals(q.style)) break;
            if (q.indent == baseIndent + INDENT) {
                LineResult r = null;
                if (STYLE_EXPAND.equals(q.style)) r = parseExpand(paras, j);
                else if (STYLE_CHOICE.equals(q.style)) r = parseChoice(paras, j);
                else if (STYLE_THINK.equals(q.style)) r = parseThink(paras, j);
                else if (STYLE_EVIDENCE.equals(q.style)) r = parseEvidencePick(paras, j);
                if (r != null) {
                    out.lines.add(r.line);
                    j = r.next;
                    continue;
                }
            }
            out.lines.add(parsePlainLine(q));
            j++;
        }
        out.next = j;
        return out;
    }

    private LineResult parseExpand(List<Para> paras, int i) {
        Para p = paras.get(i);
        String[] lp = splitLabelParams(p.text);
        Map<String, String> params = lp[1] != null ? parseParamStr(lp[1]) : Collections.emptyMap();
        int base = p.indent;

        List<Map<String, Object>> lines = new ArrayList<>();
        List<Map<String, Object>> locked = new ArrayList<>();
        boolean inLocked = false;
        int j = i + 1;
        while (j < paras.size() && paras.get(j).indent > base) {
            Para q = paras.get(j);
            if ("｛锁定内容｝".equals(q.text.trim())) {
                inLocked = true;
                j++;
                continue;
            }
            List<Map<String, Object>> target = inLocked ? locked : lines;
            if (q.indent == base + INDENT) {
                LineResult r = null;
                if (STYLE_EXPAND.equals(q.style)) r = parseExpand(paras, j);
                else if (STYLE_CHOICE.equals(q.style)) r = parseChoice(paras, j);
                else if (STYLE_THINK.equals(q.style)) r = parseThink(paras, j);
                else if (STYLE_EVIDENCE.equals(q.style)) r = parseEvidencePick(paras, j);
                if (r != null) {
                    target.add(r.line);
                    j = r.next;
                    continue;
                }
            }
            target.add(parsePlainLine(q));
            j++;
        }

        Map<String, Object> exp = line("expand");
        exp.put("label", lp[0]);
        exp.put("lines", lines);
        if (params.containsKey("id")) exp.put("id", params.get("id"));
        if (params.containsKey("when")) exp.put("when", parseList(params.get("when")));
        if (params.containsKey("keyInfo")) exp.put("keyInfo", parseList(params.get("keyInfo")));
        Map<String, Object> gate = null;
        if (params.containsKey("gate")) {
            gate = new LinkedHashMap<>();
            gate.put("require", parseList(params.get("gate")));
            gate.put("lockedLines", locked);
        }
        if (params.containsKey("disabled")) {
            if (gate == null) {
                gate = new LinkedHashMap<>();
                gate.put("require", new ArrayList<String>());
                gate.put("lockedLines", locked);
            }
            gate.put("disabled", true);
        }
        if (gate != null) exp.put("gate", gate);

        LineResult r = new LineResult();
        r.line = exp;
        r.next = j;
        return r;
    }

    private LineResult parseChoice(List<Para> paras, int i) {
        int base = paras.get(i).indent;
        List<Map<String, Object>> options = new ArrayList<>();
        Map<String, String> choiceParams = Collections.emptyMap();
        int j = i;
        while (j < paras.size() && STYLE_CHOICE.equals(paras.get(j).style) && paras.get(j).indent == base) {
            Para p = paras.get(j);
            String[] lp = splitLabelParams(p.text);
            Map<String, String> params = lp[1] != null ? parseParamStr(lp[1]) : Collections.emptyMap();
            if (options.isEmpty()) choiceParams = params;
            j++;
            BlockResult br = parseBlockLines(paras, j, base);
            j = br.next;

            Map<String, Object> opt = new LinkedHashMap<>();
            opt.put("label", lp[0]);
            opt.put("lines", br.lines);
            if ("true".equals(params.get("wrong"))) opt.put("wrong", true);
            if (params.containsKey("when")) opt.put("when", parseWhenList(params.get("when")));
            if (params.containsKey("require")) opt.put("require", parseList(params.get("require")));
            if (params.containsKey("expandRequire")) opt.put("expandRequire", parseList(params.get("expandRequire")));
            options.add(opt);
        }

        Map<String, Object> choice = line("choice");
        choice.put("options", options);
        if (choiceParams.containsKey("key")) choice.put("key", choiceParams.get("key"));
        if (choiceParams.containsKey("linked")) choice.put("linked", choiceParams.get("linked"));
        if ("true".equals(choiceParams.get("defer"))) choice.put("defer", true);

        LineResult r = new LineResult();
        r.line = choice;
        r.next = j;
        return r;
    }

    private LineResult parseThink(List<Para> paras, int i) {
        Para p = paras.get(i);
        Map<String, String> params = new LinkedHashMap<>();
        Matcher pm = Pattern.compile("\\{([^{}]*)\\}").matcher(p.text);
        if (pm.find()) params = parseParamStr(pm.group(1));
        int base = p.indent;

        List<Map<String, Object>> correctLines = new ArrayList<>();
        List<Map<String, Object>> wrongLines = new ArrayList<>();
        List<String> correct = new ArrayList<>();
        String mode = "correct";
        int j = i + 1;
        while (j < paras.size() && paras.get(j).indent > base) {
            Para q = paras.get(j);
            if (q.indent == base + INDENT) {
                if (q.text.startsWith("正确答案：")) {
                    String v = q.text.substring("正确答案：".length());
                    correct = new ArrayList<>();
                    for (String s : v.split("、")) {
                        s = s.trim();
                        if (!s.isEmpty()) correct.add(s);
                    }
                    j++;
                    continue;
                }
                if ("错误答案：".equals(q.text)) {
                    mode = "wrong";
                    j++;
                    continue;
                }
                LineResult r = null;
                if (STYLE_EXPAND.equals(q.style)) r = parseExpand(paras, j);
                else if (STYLE_CHOICE.equals(q.style)) r = parseChoice(paras, j);
                else if (STYLE_THINK.equals(q.style)) r = parseThink(paras, j);
                else if (STYLE_EVIDENCE.equals(q.style)) r = parseEvidencePick(paras, j);
                if (r != null) {
                    ("correct".equals(mode) ? correctLines : wrongLines).add(r.line);
                    j = r.next;
                    continue;
                }
            }
            ("correct".equals(mode) ? correctLines : wrongLines).add(parsePlainLine(q));
            j++;
        }

        Map<String, Object> think = line("think");
        think.put("id", params.get("id"));
        think.put("correct", correct);
        think.put("correctLines", correctLines);
        think.put("wrongLines", wrongLines);
        if (params.containsKey("pool")) think.put("pool", parseList(params.get("pool")));
        if (params.containsKey("disabled")) think.put("disabled", parseList(params.get("disabled")));

        LineResult r = new LineResult();
        r.line = think;
        r.next = j;
        return r;
    }

    private LineResult parseEvidencePick(List<Para> paras, int i) {
        Para p = paras.get(i);
        Map<String, String> params = new LinkedHashMap<>();
        Matcher pm = Pattern.compile("\\{([^{}]*)\\}").matcher(p.text);
        if (pm.find()) params = parseParamStr(pm.group(1));
        int base = p.indent;

        List<Map<String, Object>> correctLines = new ArrayList<>();
        List<Map<String, Object>> wrongLines = new ArrayList<>();
        String correct = "";
        String mode = "correct";
        Map<String, Object> debate = null;
        String debateMode = null;
        int j = i + 1;
        while (j < paras.size() && paras.get(j).indent > base) {
            Para q = paras.get(j);
            if (q.indent == base + INDENT) {
                if (q.text.startsWith("正确答案：")) {
                    correct = q.text.substring("正确答案：".length()).trim();
                    j++;
                    continue;
                }
                if ("错误答案：".equals(q.text)) {
                    mode = "wrong";
                    j++;
                    continue;
                }
                Matcher dm = DEBATE_PATTERN.matcher(q.text);
                if (dm.matches()) {
                    if (debate == null) {
                        debate = new LinkedHashMap<>();
                        debate.put("ledgerLabel", "");
                        debate.put("ledgerLines", new ArrayList<Map<String, Object>>());
                        debate.put("printLabel", "");
                        debate.put("printLines", new ArrayList<Map<String, Object>>());
                    }
                    if (String.valueOf(debate.get("ledgerLabel")).isEmpty()) {
                        debate.put("ledgerLabel", dm.group(1));
                        debateMode = "ledger";
                    } else {
                        debate.put("printLabel", dm.group(1));
                        debateMode = "print";
                    }
                    j++;
                    continue;
                }
                LineResult r = null;
                if (STYLE_EXPAND.equals(q.style)) r = parseExpand(paras, j);
                else if (STYLE_CHOICE.equals(q.style)) r = parseChoice(paras, j);
                else if (STYLE_THINK.equals(q.style)) r = parseThink(paras, j);
                else if (STYLE_EVIDENCE.equals(q.style)) r = parseEvidencePick(paras, j);
                if (r != null) {
                    targetFor(debate, debateMode, mode, correctLines, wrongLines).add(r.line);
                    j = r.next;
                    continue;
                }
            }
            targetFor(debate, debateMode, mode, correctLines, wrongLines).add(parsePlainLine(q));
            j++;
        }

        Map<String, Object> ev = line("evidencePick");
        ev.put("id", params.get("id"));
        ev.put("correct", correct);
        ev.put("correctLines", correctLines);
        ev.put("wrongLines", wrongLines);
        if (debate != null) ev.put("debate", debate);

        LineResult r = new LineResult();
        r.line = ev;
        r.next = j;
        return r;
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> targetFor(
            Map<String, Object> debate, String debateMode, String mode,
            List<Map<String, Object>> correctLines, List<Map<String, Object>> wrongLines) {
        if ("ledger".equals(debateMode)) return (List<Map<String, Object>>) debate.get("ledgerLines");
        if ("print".equals(debateMode)) return (List<Map<String, Object>>) debate.get("printLines");
        return "correct".equals(mode) ? correctLines : wrongLines;
    }
}
