import React, { useState, useEffect, useCallback } from 'react';
import FloatingBlocks from '../../features/background/FloatingBlocks';
import { getCategoryTree } from '../../features/home/homeService';
import type { CategoryTreeNode, EntrySimple } from '../../features/home/types';
import CategoryTree from '../../features/home/components/CategoryTree';
import CollapseAllButton from '../../features/home/components/CollapseAllButton';
import EntryDetail from '../../features/entry/components/EntryDetail';
import SearchBar from '../../features/search/components/SearchBar';
import SearchResultList from '../../features/search/components/SearchResultList';
import { searchEntries } from '../../features/search/searchService';
import type { SearchResult } from '../../features/search/searchService';

const DesktopLayout: React.FC = () => {
  const [categories, setCategories] = useState<CategoryTreeNode[]>([]);
  const [expandedIds, setExpandedIds] = useState<string[]>(['1', '1-1']);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [rightTitle, setRightTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentKeyword, setCurrentKeyword] = useState('');

  useEffect(() => {
    getCategoryTree()
      .then(data => {
        setCategories(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const toggleCategory = useCallback((id: string) => {
    setExpandedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  }, []);

  const collapseAll = useCallback(() => {
    setExpandedIds([]);
  }, []);

  const handleEntryClick = useCallback((entry: EntrySimple, categoryName: string) => {
    setSelectedEntryId(String(entry.id));
    setRightTitle(categoryName);
    setSearchResults([]);
    setCurrentKeyword('');
    setIsSearching(false);
  }, []);

  const handleSearch = useCallback(async (keyword: string) => {
    if (!keyword.trim()) {
      setSearchResults([]);
      setCurrentKeyword('');
      setIsSearching(false);
      return;
    }
    setCurrentKeyword(keyword);
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

  const handleSearchResultClick = useCallback((entry: SearchResult) => {
    setSelectedEntryId(String(entry.id));
    setRightTitle(entry.name);
    setSearchResults([]);
    setCurrentKeyword('');
    setIsSearching(false);
  }, []);

  return (
    <div style={{ position: 'relative', zIndex: 1 }}>
      <FloatingBlocks />
      <div style={{
        display: 'flex',
        height: '100vh',
      }}>
        <div style={{
          width: '33.333%',
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid rgba(255,255,255,0.3)',
          position: 'relative',
          zIndex: 2,
        }}>
          <div style={{
            padding: '20px',
            textAlign: 'center',
            borderBottom: '1px solid rgba(255,255,255,0.3)',
          }}>
            <h1 style={{
              color: '#fff',
              fontSize: '20px',
              fontWeight: 500,
              margin: 0,
            }}>大数据中心</h1>
          </div>

          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
          }}>
            {!loading && (
              <CategoryTree
                categories={categories}
                expandedIds={expandedIds}
                selectedEntryId={selectedEntryId}
                onToggleCategory={toggleCategory}
                onEntryClick={handleEntryClick}
              />
            )}
          </div>

          <CollapseAllButton isMobile={false} onClick={collapseAll} />
        </div>

        <div style={{
          width: '66.666%',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}>
          <div style={{
            padding: '20px',
            textAlign: 'center',
            borderBottom: '1px solid rgba(255,255,255,0.3)',
            position: 'relative',
          }}>
            <h2 style={{
              color: '#fff',
              fontSize: '20px',
              fontWeight: 500,
              margin: 0,
            }}>{rightTitle || '大数据中心'}</h2>

            <div style={{
              position: 'absolute',
              right: '20px',
              top: '50%',
              transform: 'translateY(-50%)',
            }}>
              <SearchBar onSearch={handleSearch} />
            </div>
          </div>

          <div style={{
            flex: 1,
            overflowY: 'auto',
            position: 'relative',
          }}>
            {isSearching ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: 'rgba(255,255,255,0.6)',
                fontSize: '18px',
              }}>
                搜索中...
              </div>
            ) : searchResults.length > 0 ? (
              <SearchResultList
                results={searchResults}
                onSelect={handleSearchResultClick}
              />
            ) : selectedEntryId ? (
              <EntryDetail entryId={selectedEntryId} />
            ) : (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: 'rgba(255,255,255,0.6)',
                fontSize: '48px',
                fontWeight: 300,
              }}>
                <span>大数据检索中</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesktopLayout;
