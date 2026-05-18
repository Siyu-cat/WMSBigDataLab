import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useResponsive } from '../../hooks/useResponsive';
import { getCategoryTree } from './homeService';
import { CategoryTreeNode } from './types';
import CategoryTree from './components/CategoryTree';
import CollapseAllButton from './components/CollapseAllButton';
import EntryDetail from '../entry/components/EntryDetail';

const Home: React.FC = () => {
  const { isMobile } = useResponsive();
  const navigate = useNavigate();

  const [categories, setCategories] = useState<CategoryTreeNode[]>([]);
  const [expandedIds, setExpandedIds] = useState<string[]>(['1', '1-1']);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
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

  const toggleCategory = useCallback((id: string) => {
    setExpandedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  }, []);

  const expandAll = useCallback(() => {
    const allIds: string[] = [];
    const walk = (items: CategoryTreeNode[]) => {
      items.forEach(item => {
        allIds.push(item.id);
        if (item.children) walk(item.children);
      });
    };
    walk(categories);
    setExpandedIds(allIds);
  }, [categories]);

  const collapseAll = useCallback(() => {
    setExpandedIds([]);
  }, []);

  const handleEntryClick = useCallback((entry: { id: string; name: string }, categoryName: string) => {
    setSelectedEntryId(entry.id);
    setRightTitle(categoryName);
    if (isMobile) {
      navigate(`/entry/${entry.id}`);
    }
  }, [isMobile, navigate]);

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

  if (isMobile) {
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
  }

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      position: 'relative',
      zIndex: 1,
    }}>
      <div style={{
        width: '33.333%',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid rgba(255,255,255,0.3)',
        position: 'relative',
        zIndex: 2,
      }}>
        <div style={{
          padding: '20px',
          textAlign: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.3)',
        }}>
          <h1 style={{
            color: '#fff',
            fontSize: '20px',
            fontWeight: 500,
            margin: 0,
          }}>大数据中心</h1>
        </div>

        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
        }}>
          <CategoryTree
            categories={categories}
            expandedIds={expandedIds}
            selectedEntryId={selectedEntryId}
            onToggleCategory={toggleCategory}
            onEntryClick={handleEntryClick}
          />
        </div>

        <CollapseAllButton isMobile={false} onClick={collapseAll} />
      </div>

      <div style={{
        width: '66.666%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}>
        <div style={{
          padding: '20px',
          textAlign: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.3)',
          position: 'relative',
        }}>
          <h2 style={{
            color: '#fff',
            fontSize: '20px',
            fontWeight: 500,
            margin: 0,
          }}>{rightTitle || '大数据中心'}</h2>
        </div>

        <div style={{
          flex: 1,
          overflowY: 'auto',
          position: 'relative',
        }}>
          {selectedEntryId ? (
            <EntryDetail entryId={selectedEntryId} />
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: 'rgba(255,255,255,0.6)',
              fontSize: '48px',
              fontWeight: 300,
            }}>
              <span>大数据检索中</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
