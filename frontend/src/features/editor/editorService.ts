import { get, post, put } from '../../services/request';
import { mockCategoryTree } from '../home/mockData';
import { request } from '../../services/request';
import type { MockEntry } from '../home/types';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export interface EntryData {
  id?: number;
  title: string;
  summary?: string;
  content: string;
  categoryId?: number;
}

export interface PageData {
  records: { id: number; name: string; title: string; categoryId: number }[];
  total: number;
}

export interface MediaData {
  id: number;
  filePath: string;
  fileName: string;
}

export async function createEntry(data: EntryData): Promise<{ id: number }> {
  if (USE_MOCK) {
    return { id: Math.floor(Math.random() * 1000) + 100 };
  }
  const res = await post<{ id: number }>('/entry', data);
  return res.data;
}

export async function updateEntry(id: number, data: EntryData): Promise<void> {
  if (USE_MOCK) {
    return;
  }
  await put<void>(`/entry`, { ...data, id });
}

export async function getEntry(id: number): Promise<EntryData> {
  if (USE_MOCK) {
    const entry = mockCategoryTree
      .flatMap(c => c.children || [])
      .flatMap(c => c.entries || [])
      .find(e => String(e.id) === String(id));
    const name = entry && 'title' in entry ? entry.title : ((entry as MockEntry)?.name || '模拟词条');
    return {
      id,
      title: name,
      content: '<p>这是模拟的词条内容，可以在编辑器中修改。</p>',
      categoryId: undefined,
    };
  }
  const res = await get<EntryData>(`/entry/${id}`);
  return res.data;
}

export async function getAllEntries(keyword?: string): Promise<PageData> {
  if (USE_MOCK) {
    const entries = mockCategoryTree
      .flatMap(c => c.children || [])
      .flatMap(c => c.entries || [])
      .filter(e => {
        const name = 'title' in e ? e.title : e.name;
        return !keyword || name.includes(keyword);
      })
      .map((e, i) => ({
        id: parseInt(String(e.id).replace('e', ''), 10),
        name: 'title' in e ? e.title : e.name,
        title: 'title' in e ? e.title : e.name,
        categoryId: 0,
      }));
    return { records: entries, total: entries.length };
  }
  const params = keyword ? `?page=1&size=50` : `?page=1&size=50`;
  const res = await get<PageData>(`/entry/page${params}`);
  let records = res.data.records;
  if (keyword) {
    records = records.filter(r => (r.title || r.name || '').includes(keyword));
  }
  return { records, total: records.length };
}

export async function uploadMedia(file: File): Promise<MediaData> {
  if (USE_MOCK) {
    return {
      id: Math.floor(Math.random() * 1000) + 100,
      filePath: URL.createObjectURL(file),
      fileName: file.name,
    };
  }
  const formData = new FormData();
  formData.append('file', file);
  const res = await request.post<{ code: number; message: string; data: MediaData }>(
    '/media/upload',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return res.data.data;
}