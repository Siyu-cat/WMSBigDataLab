import { getToken, clearToken } from './auth';

interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface WordImportEntry {
  level1Category: string;
  level2Category: string;
  title: string;
  content: string;
  skipped: boolean;
  skipReason: string;
}

export interface ImportResult {
  created: number;
  updated: number;
  skipped: number;
  errors: number;
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

export async function login(
  username: string,
  password: string
): Promise<{ token: string; username: string }> {
  return request('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
}

export async function importEntryPreview(file: File): Promise<WordImportEntry[]> {
  const formData = new FormData();
  formData.append('file', file);
  return request('/api/entry/import/preview', {
    method: 'POST',
    body: formData,
  });
}

export async function importEntrySave(entries: WordImportEntry[]): Promise<ImportResult> {
  return request('/api/entry/import/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entries),
  });
}
