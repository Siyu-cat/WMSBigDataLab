package com.wmsbigdatalab.utils;

import cn.hutool.extra.pinyin.PinyinUtil;

public class SlugUtil {

    /**
     * 将标题转换为拼音 slug
     * 中文转拼音（小写无声调），英文/数字保留小写，特殊字符删除
     */
    public static String generateSlug(String title) {
        if (title == null || title.trim().isEmpty()) {
            return "";
        }

        StringBuilder slug = new StringBuilder();
        for (int i = 0; i < title.length(); i++) {
            char c = title.charAt(i);
            if (PinyinUtil.isChinese(c)) {
                slug.append(PinyinUtil.getPinyin(c).toLowerCase());
            } else if (Character.isLetterOrDigit(c)) {
                slug.append(Character.toLowerCase(c));
            }
        }

        return slug.toString();
    }

    /**
     * 生成唯一 slug，如果已存在则追加数字后缀
     */
    public static String makeUnique(String baseSlug, int existingCount) {
        if (existingCount == 0) {
            return baseSlug;
        }
        return baseSlug + (existingCount + 1);
    }
}
