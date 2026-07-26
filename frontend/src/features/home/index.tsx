import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLayout } from '../../contexts/LayoutContext';
import CategoryTree from './components/CategoryTree';
import CollapseAllButton from './components/CollapseAllButton';
import { spacing } from './components/spacingConfig';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const {
    categories,
    expandedIds,
    selectedSlug,
    loading,
    toggleCategory,
    collapseAll,
    handleEntryClick,
  } = useLayout();

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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: `${spacing.titleToCategoryGap}px 25px` }}>
        <CategoryTree
          categories={categories}
          expandedIds={expandedIds}
          selectedSlug={selectedSlug}
          onToggleCategory={toggleCategory}
          onEntryClick={handleEntryClick}
        />
      </div>
      <CollapseAllButton isMobile={true} onClick={collapseAll} />
    </div>
  );
};

export default Home;
