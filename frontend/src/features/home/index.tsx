import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCategoryTree } from './homeService';
import type { CategoryTreeNode, EntrySimple } from './types';
import CategoryTree from './components/CategoryTree';
import CollapseAllButton from './components/CollapseAllButton';

const Home: React.FC = () => {
  const navigate = useNavigate();

  const [categories, setCategories] = useState<CategoryTreeNode[]>([]);
  const [expandedIds, setExpandedIds] = useState<string[]>(['1', '1-1']);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
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

  const toggleCategory = useCallback((id: string) => {
    setExpandedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  }, []);

  const collapseAll = useCallback(() => {
    setExpandedIds([]);
  }, []);

  const handleEntryClick = useCallback((entry: EntrySimple, _categoryName: string) => {
    setSelectedEntryId(String(entry.id));
    navigate(`/entry/${entry.id}`);
  }, [navigate]);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        color: 'rgba(255,255,255,0.6)',
        fontSize: '18px',
      }}>
        加载中...
      </div>
    );
  }

  return (
    <div style={{ padding: '8px 16px' }}>
      <CategoryTree
        categories={categories}
        expandedIds={expandedIds}
        selectedEntryId={selectedEntryId}
        onToggleCategory={toggleCategory}
        onEntryClick={handleEntryClick}
      />
      <CollapseAllButton isMobile={true} onClick={collapseAll} />
    </div>
  );
};

export default Home;
