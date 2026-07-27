import React from 'react';
import type { CategoryTreeNode, EntrySimple } from '../types';
import CategoryButton from './CategoryButton';
import EntryCard from './EntryCard';
import { spacing } from './spacingConfig';
import { useResponsive } from '../../../hooks/useResponsive';

interface CategoryTreeProps {
  categories: CategoryTreeNode[];
  expandedIds: string[];
  selectedSlug: string | null;
  onToggleCategory: (id: string) => void;
  onEntryClick: (entry: EntrySimple, categoryName: string) => void;
}

const getLastChildType = (category: CategoryTreeNode, expandedIds: string[]): 'level2' | 'entry' | undefined => {
  if (!category.children || category.children.length === 0) return undefined;
  const lastChild = category.children[category.children.length - 1];
  const isLastChildExpanded = expandedIds.includes(lastChild.id);
  if (isLastChildExpanded && lastChild.entries && lastChild.entries.length > 0) {
    return 'entry';
  }
  return 'level2';
};

const CategoryTree: React.FC<CategoryTreeProps> = ({
  categories,
  expandedIds,
  selectedSlug,
  onToggleCategory,
  onEntryClick,
}) => {
  const { scale } = useResponsive();
  const renderCategory = (category: CategoryTreeNode, level: number, prevType?: 'level1' | 'level2' | 'entry') => {
    const isExpanded = expandedIds.includes(category.id);

    // 计算当前元素的 marginTop
    let marginTop = 0;
    if (level === 0 && prevType) {
      if (prevType === 'level2') {
        marginTop = (spacing.level2ToLevel1Gap - spacing.level2Gap) * scale;
      } else if (prevType === 'entry') {
        marginTop = (spacing.entryToLevel1Gap - spacing.entryGap) * scale;
      }
    } else if (level === 1 && prevType === 'entry') {
      marginTop = (spacing.entryToLevel2Gap - spacing.entryGap) * scale;
    }

    // 计算当前元素的 gap（marginBottom）
    const gap = level === 0 ? spacing.level1Gap * scale : spacing.level2Gap * scale;

    // 子内容的 marginTop 根据父分类类型动态设置
    const childContentMarginTop = level === 0
      ? (spacing.level1ToLevel2Gap - spacing.level1Gap) * scale
      : (spacing.level2ToEntryGap - spacing.level2Gap) * scale;

    // 跟踪前一个子元素的类型
    let prevChildType: 'level2' | 'entry' | undefined = undefined;

    return (
      <div key={category.id} style={{ marginTop: `${marginTop}px` }}>
        <CategoryButton
          name={category.name}
          level={level}
          isExpanded={isExpanded}
          onClick={() => onToggleCategory(category.id)}
          gap={gap}
          textOffsetY={level === 0 ? -1.5 : 1.5}
          level1ArrowOffset={{ x: -2, y: 2 }}
          level2ArrowOffset={{ x: -2, y: 2 }}
        />

        {isExpanded && (
          <div style={{ marginTop: `${childContentMarginTop}px` }}>
            {category.children?.map((child, index) => {
              const childPrevType = index === 0 ? undefined : prevChildType;
              
              // 更新 prevChildType
              const childIsExpanded = expandedIds.includes(child.id);
              if (childIsExpanded && child.entries && child.entries.length > 0) {
                prevChildType = 'entry';
              } else {
                prevChildType = 'level2';
              }
              
              return (
                <React.Fragment key={child.id}>
                  {renderCategory(child, level + 1, childPrevType)}
                  {childIsExpanded && (
                    <div style={{ marginTop: `${(spacing.level2ToEntryGap - spacing.level2Gap) * scale}px` }}>
                      {child.entries?.map(entry => {
                        const name = 'title' in entry ? (entry.title || entry.summary || '未命名') : entry.name;
                        const eid = Number(entry.id);
                        return (
                          <EntryCard
                            key={entry.id}
                            id={eid}
                            name={name}
                            isSelected={selectedSlug === ('slug' in entry ? entry.slug : '')}
                            paddingLeft={54 * scale}
                            gap={spacing.entryGap * scale}
                            onClick={() => onEntryClick({ id: eid, slug: 'slug' in entry ? entry.slug || '' : '', title: name } as EntrySimple, child.name)}
                          />
                        );
                      })}
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      {categories.map((category, index) => {
        let lastChildType: 'level2' | 'entry' | undefined = undefined;
        if (index > 0) {
          const prevCategory = categories[index - 1];
          const isPrevExpanded = expandedIds.includes(prevCategory.id);
          if (isPrevExpanded && prevCategory.children && prevCategory.children.length > 0) {
            lastChildType = getLastChildType(prevCategory, expandedIds);
          }
        }
        const prevType = index === 0 ? undefined : lastChildType;
        return renderCategory(category, 0, prevType);
      })}
    </div>
  );
};

export default CategoryTree;
