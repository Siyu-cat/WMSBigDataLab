import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getCategoryTree } from '../features/home/homeService';
import type { CategoryTreeNode, EntrySimple } from '../features/home/types';

interface LayoutContextType {
  categories: CategoryTreeNode[];
  expandedIds: string[];
  selectedSlug: string | null;
  rightTitle: string;
  loading: boolean;

  toggleCategory: (id: string) => void;
  collapseAll: () => void;
  setSelectedSlug: (slug: string | null) => void;
  setRightTitle: (title: string) => void;
  handleEntryClick: (entry: EntrySimple, categoryName: string) => void;
  expandToEntry: (slug: string) => void;
}

const LayoutContext = createContext<LayoutContextType | null>(null);

export const useLayout = () => {
  const ctx = useContext(LayoutContext);
  if (!ctx) throw new Error('useLayout must be used within LayoutProvider');
  return ctx;
};

export const LayoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [categories, setCategories] = useState<CategoryTreeNode[]>([]);
  const [expandedIds, setExpandedIds] = useState<string[]>(['1', '1-1']);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [rightTitle, setRightTitle] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCategoryTree()
      .then(data => {
        setCategories(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const match = window.location.pathname.match(/^\/entry\/([^/]+)/);
    if (match) {
      setSelectedSlug(match[1]);
    }
  }, []);

  const toggleCategory = useCallback((id: string) => {
    setExpandedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  }, []);

  const collapseAll = useCallback(() => {
    setExpandedIds([]);
    setSelectedSlug(null);
    setRightTitle('');
  }, []);

  const handleEntryClick = useCallback((entry: EntrySimple, categoryName: string) => {
    setSelectedSlug(entry.slug);
    setRightTitle(categoryName);
  }, []);

  const expandToEntry = useCallback((slug: string) => {
    const pathIds: string[] = [];
    const find = (nodes: CategoryTreeNode[], ancestors: string[]): boolean => {
      for (const node of nodes) {
        if (node.entries?.some(e => 'slug' in e && e.slug === slug)) {
          pathIds.push(...ancestors, node.id);
          return true;
        }
        if (node.children?.length && find(node.children, [...ancestors, node.id])) {
          return true;
        }
      }
      return false;
    };
    find(categories, []);
    if (pathIds.length > 0) {
      setExpandedIds(prev => [...new Set([...prev, ...pathIds])]);
    }
  }, [categories]);

  return (
    <LayoutContext.Provider value={{
      categories,
      expandedIds,
      selectedSlug,
      rightTitle,
      loading,
      toggleCategory,
      collapseAll,
      setSelectedSlug,
      setRightTitle,
      handleEntryClick,
      expandToEntry,
    }}>
      {children}
    </LayoutContext.Provider>
  );
};
