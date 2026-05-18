import React from 'react';
import type { CategoryTreeNode, EntrySimple } from '../types';
import CategoryButton from './CategoryButton';
import EntryCard from './EntryCard';

interface CategoryTreeProps {
  categories: CategoryTreeNode[];
  expandedIds: string[];
  selectedEntryId: string | null;
  onToggleCategory: (id: string) => void;
  onEntryClick: (entry: EntrySimple, categoryName: string) => void;
}

const CategoryTree: React.FC<CategoryTreeProps> = ({
  categories,
  expandedIds,
  selectedEntryId,
  onToggleCategory,
  onEntryClick,
}) => {
  const renderCategory = (category: CategoryTreeNode, level: number) => {
    const isExpanded = expandedIds.includes(category.id);
    const entryPaddingLeft = (level + 1) * 24 + 8;

    return (
      <div key={category.id}>
        <CategoryButton
          name={category.name}
          level={level}
          isExpanded={isExpanded}
          onClick={() => onToggleCategory(category.id)}
        />

        {isExpanded && (
          <div style={{ marginTop: '4px' }}>
            {category.children?.map(child => renderCategory(child, level + 1))}
            {category.entries?.map(entry => {
              const name = 'title' in entry ? (entry.title || entry.summary || '未命名') : entry.name;
              const eid = Number(entry.id);
              return (
                <EntryCard
                  key={entry.id}
                  id={eid}
                  name={name}
                  isSelected={selectedEntryId === String(eid)}
                  paddingLeft={entryPaddingLeft}
                  onClick={() => onEntryClick({ id: eid, title: name } as EntrySimple, category.name)}
                />
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      {categories.map(category => renderCategory(category, 0))}
    </div>
  );
};

export default CategoryTree;