import { getToken, clearToken } from './auth';
import type { StoryArc, StoryChapter } from '../data/story';

interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

/** 章节列表项（不含 data，附带幕列表） */
export interface StoryChapterMeta {
  id: number;
  slug: string;
  title: string;
  tag: string;
  num: string;
  arc: string;
  stageKeys?: string[];
  updatedAt?: string;
}

/** 章节详情（含 data JSON 字符串与已绑定 CG 图片），instance 为同名第 N 次出现的实例号 */
export interface StoryChapterDetail extends StoryChapterMeta {
  data: string;
  cgs?: { name: string; imageUrl: string; instance?: string }[];
}

/** 整章解析结果：与前端 ScriptLine 结构兼容的 JSON */
export interface StoryChapterData {
  stages: Record<string, unknown[]>;
  evidence: unknown[];
  clues: unknown[];
}

export interface StoryPreviewResult {
  tag: string;
  title: string;
  num: string;
  stageKeys: string[];
  stageCounts: Record<string, number>;
  evidenceCount: number;
  clueCount: number;
  data: string;
}

export interface StorySaveResult {
  slug: string;
  created: boolean;
}

export class UnauthorizedError extends Error {
  constructor() {
    super('登录已过期');
    this.name = 'UnauthorizedError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(path, {
    ...init,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {}),
    },
  });
  if (res.status === 401) {
    clearToken();
    throw new UnauthorizedError();
  }
  const json = (await res.json()) as ApiResponse<T>;
  if (json.code !== 200) {
    throw new Error(json.message || '请求失败');
  }
  return json.data;
}

/** 章节目录（公开） */
export async function getStoryChapters(): Promise<StoryChapterMeta[]> {
  return request('/api/story/chapters');
}

/** 章节详情（公开） */
export async function getStoryChapter(slug: string): Promise<StoryChapterDetail> {
  return request(`/api/story/chapter/${encodeURIComponent(slug)}`);
}

/** 主线 docx 解析预览（需登录） */
export async function previewStoryImport(file: File): Promise<StoryPreviewResult> {
  const formData = new FormData();
  formData.append('file', file);
  return request('/api/story/import/preview', {
    method: 'POST',
    body: formData,
  });
}

/** 主线章节保存（按 slug upsert，需登录） */
export async function saveStoryImport(payload: {
  slug: string;
  title: string;
  tag: string;
  num: string;
  arc: string;
  data: string;
}): Promise<StorySaveResult> {
  return request('/api/story/import/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

/** 上传/替换思绪 CG 图片（需登录），按 (chapterSlug, name, instance) 绑定 */
export async function uploadStoryCg(
  chapterSlug: string,
  name: string,
  file: File,
  instance = 1,
): Promise<{ name: string; imageUrl: string }> {
  const formData = new FormData();
  formData.append('chapterSlug', chapterSlug);
  formData.append('name', name);
  formData.append('instance', String(instance));
  formData.append('file', file);
  return request('/api/story/cg/upload', {
    method: 'POST',
    body: formData,
  });
}

/** 大数据中心词条详情（公开接口） */
export interface StoryEntryDetail {
  title: string;
  slug: string;
  content: string;
  summary?: string;
}

interface EntrySearchItem {
  id: number;
  slug: string;
  title: string;
  contentSnippet?: string;
  categoryPath?: string;
}

interface EntryBySlug {
  id: number;
  title: string;
  slug?: string;
  summary?: string;
  content: string;
}

/** 词条标题 → 详情缓存（同一词条只请求一次；失败不缓存） */
const entryByTitleCache = new Map<string, Promise<StoryEntryDetail | null>>();

// 间隔号视觉一致但码点不同（· U+00B7 与 ・ U+30FB 等），统一归一化后再比较
const normEntryName = (s: string) =>
  s.replace(/[\u00b7\u30fb\u2027\u2022\u22c5\uff65]/g, '\u00b7');

/** 生成搜索关键词变体（原文 + 两种间隔号写法） */
const entrySearchKeywords = (title: string): string[] => {
  const keywords = [title];
  if (/[\u00b7\u30fb]/.test(title)) {
    keywords.push(title.replace(/\u00b7/g, '\u30fb'));
    keywords.push(title.replace(/\u30fb/g, '\u00b7'));
  }
  return [...new Set(keywords)];
};

/** 按标题精确匹配获取词条详情（公开接口，无匹配返回 null） */
export function getEntryByTitle(title: string): Promise<StoryEntryDetail | null> {
  const cached = entryByTitleCache.get(title);
  if (cached) return cached;
  const promise = (async () => {
    const wanted = normEntryName(title);
    for (const keyword of entrySearchKeywords(title)) {
      const list = await request<EntrySearchItem[]>(
        `/api/entry/search?keyword=${encodeURIComponent(keyword)}`,
      );
      const hit = list.find((e) => normEntryName(e.title) === wanted);
      if (hit) {
        const detail = await request<EntryBySlug>(
          `/api/entry/slug/${encodeURIComponent(hit.slug)}`,
        );
        return {
          title: detail.title || hit.title,
          slug: detail.slug || hit.slug,
          content: detail.content || '',
          summary: detail.summary,
        };
      }
    }
    return null;
  })();
  entryByTitleCache.set(title, promise);
  promise.catch(() => entryByTitleCache.delete(title));
  return promise;
}

export const ARC_NAMES: Record<string, string> = {
  haiosen: '海奥森篇',
  jianlangu: '剑兰谷篇',
  yaning: '亚宁篇',
};
const ARC_ORDER = ['haiosen', 'jianlangu', 'yaning'];

/** 按 arc 分组为目录展示结构（只包含已导入章节） */
export function groupChaptersByArc(list: StoryChapterMeta[]): StoryArc[] {
  const grouped = new Map<string, StoryChapter[]>();
  for (const c of list) {
    const key = c.arc || 'haiosen';
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push({
      num: c.num,
      tag: c.tag,
      title: c.title,
      slug: c.slug,
      stages: c.stageKeys ?? [],
    });
  }
  const keys = [...ARC_ORDER, ...[...grouped.keys()].filter((k) => !ARC_ORDER.includes(k))];
  const result: StoryArc[] = [];
  for (const key of keys) {
    const chapters = grouped.get(key);
    if (chapters && chapters.length) {
      result.push({ key, name: ARC_NAMES[key] || key, chapters });
    }
  }
  return result;
}
