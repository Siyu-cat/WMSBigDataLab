export interface Category {
  id: string;
  name: string;
  parentId: string | null;
  description?: string;
  icon?: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Entry {
  id: string;
  title: string;
  content: string;
  categoryId: string;
  tags: string[];
  authorId: string;
  status: 'draft' | 'published' | 'archived';
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface Annotation {
  id: string;
  entryId: string;
  content: string;
  range: {
    start: number;
    end: number;
  };
  type: 'highlight' | 'comment' | 'note';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Version {
  id: string;
  entryId: string;
  content: string;
  versionNumber: number;
  createdBy: string;
  createdAt: string;
  changeSummary?: string;
}

export interface Media {
  id: string;
  filename: string;
  url: string;
  mimeType: string;
  size: number;
  uploadedBy: string;
  createdAt: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  avatar?: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResponse<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}