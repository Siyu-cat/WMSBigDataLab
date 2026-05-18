export interface EntrySimple {
  id: number;
  title: string;
  summary?: string;
  viewCount?: number;
  createdAt?: string;
}

export interface MockEntry {
  id: string;
  name: string;
}

export interface CategoryTreeNode {
  id: string;
  name: string;
  parentId: string | null;
  children?: CategoryTreeNode[];
  entries?: (EntrySimple | MockEntry)[];
}
