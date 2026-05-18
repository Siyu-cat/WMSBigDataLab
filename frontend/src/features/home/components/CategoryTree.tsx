import React from 'react';
import { CategoryTreeNode } from '../types';
import CategoryButton from './CategoryButton';
import EntryCard from './EntryCard';

interface CategoryTreeProps {
  categories: CategoryTreeNode[];
  expandedIds: string[];
  selectedEntryId: string | null;
  onToggleCategory: (id: string) => void;
  onEntryClick: (entry: { id: string; name: string }, categoryName: string) => void;
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
            {category.entries?.map(entry => (
              <EntryCard
                key={entry.id}
                id={entry.id}
                name={entry.name}
                isSelected={selectedEntryId === entry.id}
                paddingLeft={entryPaddingLeft}
                onClick={() => onEntryClick(entry, category.name)}
              />
            ))}
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
