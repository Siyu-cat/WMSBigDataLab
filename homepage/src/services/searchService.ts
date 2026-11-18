export interface SearchAggregateItem {
  source: string;
  type: string;
  title: string;
  summary: string;
  url: string;
}

interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export async function searchAll(keyword: string): Promise<SearchAggregateItem[]> {
  const res = await fetch(`/api/search/all?keyword=${encodeURIComponent(keyword)}`);
  if (!res.ok) {
    throw new Error(`搜索请求失败: ${res.status}`);
  }
  const json = (await res.json()) as ApiResponse<SearchAggregateItem[]>;
  if (json.code !== 200) {
    throw new Error(json.message || '搜索失败');
  }
  return json.data ?? [];
}
