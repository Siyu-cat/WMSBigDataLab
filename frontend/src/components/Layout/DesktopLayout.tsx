import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import FloatingBlocks from '../../features/background/FloatingBlocks';
import { useLayout } from '../../contexts/LayoutContext';
import CategoryTree from '../../features/home/components/CategoryTree';
import CollapseAllButton from '../../features/home/components/CollapseAllButton';
import EntryDetail from '../../features/entry/components/EntryDetail';
import SearchBar from '../../features/search/components/SearchBar';
import SearchResultList from '../../features/search/components/SearchResultList';
import { searchEntries } from '../../features/search/searchService';
import { spacing } from '../../features/home/components/spacingConfig';
import type { SearchResult } from '../../features/search/searchService';
import type { EntrySimple } from '../../features/home/types';
import BackArrow from '../icons/BackArrow';

const DesktopLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    categories,
    expandedIds,
    selectedSlug,
    rightTitle,
    loading,
    toggleCategory,
    collapseAll,
    setSelectedSlug,
    setRightTitle,
    handleEntryClick,
    expandToEntry,
  } = useLayout();

  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentKeyword, setCurrentKeyword] = useState('');
  const [viewFromSearch, setViewFromSearch] = useState(false);

  useEffect(() => {
    if (location.pathname === '/search') {
      navigate('/', { replace: true });
    } else {
      const match = location.pathname.match(/^\/entry\/([^/]+)/);
      if (match) {
        setSelectedSlug(match[1]);
        const state = location.state as any;
        if (state?.categoryName) {
          setRightTitle(state.categoryName);
        }
      }
    }
  }, []);

  const handleEntryClickDesktop = useCallback((entry: EntrySimple, categoryName: string) => {
    handleEntryClick(entry, categoryName);
    navigate(`/entry/${entry.slug}`, { replace: true });
  }, [handleEntryClick, navigate]);

  const handleSearch = useCallback(async (keyword: string) => {
    if (!keyword.trim()) {
      setSearchResults([]);
      setCurrentKeyword('');
      setIsSearching(false);
      return;
    }
    setSelectedSlug(null);
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
  }, [setSelectedSlug]);

  const collapseAllWithSearch = useCallback(() => {
    collapseAll();
    setSearchResults([]);
    setCurrentKeyword('');
    setIsSearching(false);
    setViewFromSearch(false);
    navigate('/', { replace: true });
  }, [collapseAll, navigate]);

  const handleSearchResultClick = useCallback((entry: SearchResult) => {
    expandToEntry(entry.slug);
    setSelectedSlug(entry.slug);
    setRightTitle(entry.categoryPath?.split('-').pop() || entry.title);
    setIsSearching(false);
    setViewFromSearch(true);
    navigate(`/entry/${entry.slug}`, { replace: true });
  }, [navigate, setSelectedSlug, expandToEntry]);

  const handleBackToSearch = useCallback(() => {
    setSelectedSlug(null);
    setViewFromSearch(false);
    navigate('/', { replace: true });
  }, [navigate, setSelectedSlug]);

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
              fontWeight: 350,
              margin: 0,
            }}>大数据中心</h1>
          </div>

          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: `${spacing.titleToCategoryGap}px 25px`,
          }}>
            {!loading && (
              <CategoryTree
                categories={categories}
                expandedIds={expandedIds}
                selectedSlug={selectedSlug}
                onToggleCategory={toggleCategory}
                onEntryClick={handleEntryClickDesktop}
              />
            )}
          </div>

          <CollapseAllButton isMobile={false} onClick={collapseAllWithSearch} />
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
            {viewFromSearch && selectedSlug && (
              <div
                onClick={handleBackToSearch}
                style={{
                  position: 'absolute',
                  left: '20px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  cursor: 'pointer',
                  padding: '4px',
                  marginTop: '4px',
                }}
              >
                <BackArrow color="#fff" size={34} />
              </div>
            )}
            <h2 style={{
              color: '#fff',
              fontSize: '20px',
              fontWeight: 350,
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
            ) : selectedSlug ? (
              <EntryDetail slug={selectedSlug} />
            ) : searchResults.length > 0 ? (
              <SearchResultList
                results={searchResults}
                onSelect={handleSearchResultClick}
              />
            ) : (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: 'rgba(255,255,255,0.6)',
                fontSize: '48px',
              fontWeight: 350,
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
