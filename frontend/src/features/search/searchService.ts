import { get } from '../../services/request';
import { mockCategoryTree } from '../home/mockData';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export interface SearchResult {
  id: number;
  name: string;
}

export async function searchEntries(keyword: string): Promise<SearchResult[]> {
  if (!keyword.trim()) return [];

  if (USE_MOCK) {
    const results: SearchResult[] = [];
    mockCategoryTree.forEach(category => {
      category.children?.forEach(child => {
        child.entries?.forEach(entry => {
          const name = 'title' in entry ? (entry.title || '') : entry.name;
          if (name.toLowerCase().includes(keyword.toLowerCase())) {
            results.push({ id: Number(entry.id), name });
          }
        });
      });
    });
    return results;
  }

  const res = await get<SearchResult[]>(`/entry/search?keyword=${encodeURIComponent(keyword)}`);
  return res.data;
}