import React from 'react';
import { spacing } from './spacingConfig';

interface CategoryButtonProps {
  name: string;
  level: number;
  isExpanded: boolean;
  onClick: () => void;
  gap: number;
  /** 文字垂直偏移量（像素），正数往下，负数往上。不传则使用默认值 -1.5 */
  textOffsetY?: number;
  /** 一级分类箭头展开后偏移量，{x: 水平(正数往右)，y: 垂直(正数往下)} */
  level1ArrowOffset?: { x: number; y: number };
  /** 二级分类箭头展开后偏移量，{x: 水平(正数往右)，y: 垂直(正数往下)} */
  level2ArrowOffset?: { x: number; y: number };
}

const CategoryButton: React.FC<CategoryButtonProps> = ({ name, level, isExpanded, onClick, gap, textOffsetY = -1.5, level1ArrowOffset = { x: 0, y: 0 }, level2ArrowOffset = { x: 0, y: 0 } }) => {
  const bg = level === 0
    ? 'rgba(76,77,82,1)'
    : 'rgba(76,77,82,0.55)';

  const indent = level === 0 ? 0 : 32;
  const marginBottom = `${gap}px`;

  return (
    <div style={{ paddingLeft: `${indent}px`, marginBottom }}>
      <div
        onClick={onClick}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: level === 0 ? '2px' : '6px',
          padding: level === 0 ? '10px 23px 10px 17px' : '10px 23px 11px 22px',
          width: level === 0 ? '186px' : '240px',
          height: level === 0 ? '47.5px' : '48px',
          minWidth: level === 0 ? '186px' : '240px',
          cursor: 'pointer',
          color: '#fff',
          fontSize: '18.5px',
          fontWeight: 350,
          borderRadius: '24px',
          background: bg,
          boxShadow: level === 0 ? spacing.level1Shadow : spacing.level2Shadow,
        }}
      >
        {level === 0 ? (
          <svg width="37" height="37" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, transform: isExpanded ? `translate(${level1ArrowOffset.x}px, ${level1ArrowOffset.y}px) rotate(90deg)` : 'rotate(0deg)' }}>
            <path
              d="M5.5 2.8 L12 7.2 Q13.18 8 12 8.8 L5.5 13.2 Q4 14.22 4 11.5 L4 4.5 Q4 1.78 5.5 2.8Z"
              fill="white"
            />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, transform: isExpanded ? `translate(${level2ArrowOffset.x}px, ${level2ArrowOffset.y}px) rotate(90deg)` : 'rotate(0deg)' }}>
            <path
              d="M4 3L9 8L4 13"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
        <span style={{ transform: `translateY(${textOffsetY}px)` }}>{name}</span>
      </div>
    </div>
  );
};

export default CategoryButton;
