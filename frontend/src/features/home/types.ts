export interface CategoryTreeNode {
  id: string;
  name: string;
  parentId: string | null;
  children?: CategoryTreeNode[];
  entries?: { id: string; name: string }[];
}
