import React from 'react';
import type { SearchResult } from '../searchService';

interface SearchResultListProps {
  results: SearchResult[];
  onSelect: (entry: SearchResult) => void;
  isMobile?: boolean;
}

const SearchResultList: React.FC<SearchResultListProps> = ({ results, onSelect, isMobile = false }) => {
  if (results.length === 0) {
    return (
      <div style={{
        color: 'rgba(255,255,255,0.6)',
        textAlign: 'center',
        padding: '40px 20px',
        fontSize: isMobile ? '14px' : '16px',
      }}>
        未找到相关词条
      </div>
    );
  }

  const containerStyle: React.CSSProperties = isMobile
    ? {
        padding: '16px',
      }
    : {
        padding: '24px',
      };

  return (
    <div style={containerStyle}>
      <div style={{
        color: '#fff',
        fontSize: isMobile ? '16px' : '18px',
        marginBottom: isMobile ? '16px' : '20px',
        fontWeight: 350,
      }}>
        搜索结果 ({results.length})
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: isMobile ? '10px' : '12px',
      }}>
        {results.map((entry) => (
          <div
            key={entry.id}
            onClick={() => onSelect(entry)}
            style={{
              padding: isMobile ? '12px 16px' : '16px 20px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: isMobile ? '8px' : '10px',
              cursor: 'pointer',
              transition: 'background 0.2s',
              color: '#fff',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
            }}
          >
            <div style={{
              fontSize: isMobile ? '14px' : '16px',
              fontWeight: 500,
              marginBottom: '4px',
            }}>
              {entry.title}
            </div>
            <div style={{
              fontSize: isMobile ? '12px' : '14px',
              color: 'rgba(255,255,255,0.7)',
              marginBottom: '4px',
              lineHeight: 1.4,
            }}>
              {entry.contentSnippet}
            </div>
            <div style={{
              fontSize: isMobile ? '11px' : '12px',
              color: 'rgba(255,255,255,0.5)',
            }}>
              {entry.categoryPath}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SearchResultList;