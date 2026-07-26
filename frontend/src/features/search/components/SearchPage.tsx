import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import SearchBar from './SearchBar';
import SearchResultList from './SearchResultList';
import { searchEntries } from '../searchService';
import type { SearchResult } from '../searchService';

const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    const state = location.state as any;
    if (state?.restoreKeyword) setKeyword(state.restoreKeyword);
    if (state?.restoreResults?.length) setSearchResults(state.restoreResults);
  }, []);

  const handleSearch = useCallback(async (kw: string) => {
    if (!kw.trim()) {
      setSearchResults([]);
      setKeyword('');
      return;
    }
    setKeyword(kw);
    setIsSearching(true);
    try {
      const results = await searchEntries(kw);
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSelect = useCallback((entry: SearchResult) => {
    navigate(`/entry/${entry.slug}`, {
      state: {
        categoryName: entry.categoryPath?.split('-').pop() || '词条详情',
        from: 'search',
        searchKeyword: keyword,
        searchResults: searchResults,
      }
    });
  }, [navigate, keyword, searchResults]);

  return (
    <div style={{ color: '#fff', display: 'flex', flexDirection: 'column', flex: 1 }}>
      <div style={{ padding: '16px' }}>
        <SearchBar isMobile autoExpand defaultValue={keyword} onSearch={handleSearch} />
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
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
    </div>
  );
};

export default SearchPage;
