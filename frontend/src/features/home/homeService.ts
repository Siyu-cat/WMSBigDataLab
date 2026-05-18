import { get } from '../../services/request';
import type { CategoryTreeNode } from './types';
import { mockCategoryTree } from './mockData';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export async function getCategoryTree(): Promise<CategoryTreeNode[]> {
  if (USE_MOCK) {
    return mockCategoryTree;
  }
  const res = await get<CategoryTreeNode[]>('/category/tree');
  return res.data;
}
