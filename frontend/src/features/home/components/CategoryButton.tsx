import React from 'react';

interface CategoryButtonProps {
  name: string;
  level: number;
  isExpanded: boolean;
  onClick: () => void;
}

const CategoryButton: React.FC<CategoryButtonProps> = ({ name, level, isExpanded, onClick }) => {
  const bg = level === 0
    ? 'rgba(60,60,60,0.7)'
    : 'rgba(160,160,160,0.4)';

  const bgHover = level === 0
    ? 'rgba(60,60,60,0.85)'
    : 'rgba(160,160,160,0.55)';

  const indent = level === 0 ? 0 : 24;

  return (
    <div style={{ paddingLeft: `${indent}px`, marginBottom: '8px' }}>
      <div
        onClick={onClick}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '10px',
          padding: '10px 22px',
          cursor: 'pointer',
          color: '#fff',
          fontSize: '16px',
          fontWeight: 400,
          borderRadius: '24px',
          background: isExpanded ? bg : 'transparent',
          transition: 'background 0.2s',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.background = isExpanded ? bgHover : 'rgba(255,255,255,0.1)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.background = isExpanded ? bg : 'transparent';
        }}
      >
        {level === 0 ? (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
            <path
              d="M3 5.5C3 4.67 3.67 4 4.5 4H11.5C12.33 4 13 4.67 13 5.5V5.5C13 5.78 12.78 6 12.5 6H3.5C3.22 6 3 5.78 3 5.5V5.5Z"
              fill="white"
            />
            <path
              d="M4.5 6H11.5L8.5 10C8.22 10.38 7.78 10.38 7.5 10L4.5 6Z"
              fill="white"
            />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
            <path
              d="M3.5 8.5L6.5 11.5L12.5 4.5"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
        <span>{name}</span>
      </div>
    </div>
  );
};

export default CategoryButton;
