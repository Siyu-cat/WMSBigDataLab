import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchBar from './SearchBar';
import SearchResultList from './SearchResultList';
import { searchEntries } from '../searchService';
import type { SearchResult } from '../searchService';

const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = useCallback(async (keyword: string) => {
    if (!keyword.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const results = await searchEntries(keyword);
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSelect = useCallback((entry: SearchResult) => {
    navigate(`/entry/${entry.id}`);
  }, [navigate]);

  return (
    <div style={{ color: '#fff', minHeight: '100%' }}>
      <div style={{ padding: '16px' }}>
        <SearchBar isMobile onSearch={handleSearch} />
      </div>

      {isSearching ? (
        <div style={{
          textAlign: 'center',
          padding: '40px 20px',
          color: 'rgba(255,255,255,0.6)',
        }}>
          搜索中...
        </div>
      ) : searchResults.length > 0 ? (
        <SearchResultList
          results={searchResults}
          onSelect={handleSelect}
          isMobile
        />
      ) : (
        <div style={{
          textAlign: 'center',
          padding: '40px 20px',
          color: 'rgba(255,255,255,0.6)',
        }}>
          输入关键词开始搜索
        </div>
      )}
    </div>
  );
};

export default SearchPage;