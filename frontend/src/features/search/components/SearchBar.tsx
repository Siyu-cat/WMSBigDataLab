import React, { useState, useEffect, useRef } from 'react';
import SearchIcon from '../../../components/icons/SearchIcon';

interface SearchBarProps {
  isMobile?: boolean;
  onSearch: (keyword: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ isMobile = false, onSearch }) => {
  const [value, setValue] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (value.trim()) {
      debounceRef.current = setTimeout(() => {
        onSearch(value.trim());
      }, 300);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [value, onSearch]);

  const handleSearch = () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    onSearch(value.trim());
  };

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  if (isMobile) {
    return (
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {isExpanded ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '20px',
            padding: '6px 12px',
            flex: 1,
          }}>
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onBlur={() => {
                if (!value) setIsExpanded(false);
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="搜索词条..."
              style={{
                flex: 1,
                border: 'none',
                background: 'transparent',
                outline: 'none',
                color: '#fff',
                fontSize: '14px',
              }}
            />
            <div onClick={handleSearch} style={{ cursor: 'pointer', padding: '4px' }}>
              <SearchIcon color="#fff" size={20} />
            </div>
          </div>
        ) : (
          <div onClick={handleToggle} style={{ cursor: 'pointer', padding: '4px' }}>
            <SearchIcon color="#fff" size={22} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      background: 'rgba(255,255,255,0.35)',
      borderRadius: '16px',
      padding: '6px 6px',
      width: '200px',
    }}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleSearch}
        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        placeholder="搜索词条..."
        style={{
          flex: 1,
          border: 'none',
          background: 'transparent',
          outline: 'none',
          fontSize: '14px',
          color: '#333',
        }}
      />
      <div onClick={handleSearch} style={{ cursor: 'pointer' }}>
        <SearchIcon color="#fff" size={20} />
      </div>
    </div>
  );
};

export default SearchBar;