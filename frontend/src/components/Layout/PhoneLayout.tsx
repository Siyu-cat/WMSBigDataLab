import React, { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import BackArrow from '../icons/BackArrow';
import SearchIcon from '../icons/SearchIcon';
import FloatingBlocks from '../../features/background/FloatingBlocks';
import { useLayout } from '../../contexts/LayoutContext';

const PhoneLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedSlug, rightTitle, setSelectedSlug, expandedIds } = useLayout();

  const isSubPage = location.pathname !== '/' && !location.pathname.startsWith('/category');

  // 当 selectedSlug 变化时，自动导航到词条详情页
  useEffect(() => {
    if (selectedSlug && !isSubPage) {
      navigate(`/entry/${selectedSlug}`, { replace: true });
    }
  }, [selectedSlug, isSubPage, navigate]);

  const getTitle = () => {
    if (isSubPage) {
      const pathParts = location.pathname.split('/');
      if (pathParts[1] === 'entry') {
        const state = location.state as any;
        return rightTitle || state?.categoryName || '词条详情';
      }
      if (pathParts[1] === 'search') return '搜索';
    }
    return '大数据中心';
  };

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      position: 'relative',
      zIndex: 1,
    }}>
      <FloatingBlocks />

      {/* Header */}
      <div style={{
        padding: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        borderBottom: '1px solid rgba(255,255,255,0.3)',
        background: 'transparent',
        zIndex: 10,
      }}>
        {isSubPage ? (
          <div
            onClick={() => {
              const state = location.state as any;
              if (state?.from === 'search') {
                navigate('/search', {
                  state: {
                    restoreKeyword: state.searchKeyword,
                    restoreResults: state.searchResults,
                  }
                });
              } else {
                setSelectedSlug(null);
                navigate('/');
              }
            }}
            style={{
              position: 'absolute',
              left: '16px',
              cursor: 'pointer',
              padding: '4px',
              marginTop: '8px',
            }}
          >
            <BackArrow color="#fff" size={34} />
          </div>
        ) : null}

        <h1 style={{
          color: '#fff',
          fontSize: '20px',
          fontWeight: 350,
          margin: 0,
        }}>{getTitle()}</h1>

        {!isSubPage && (
          <>
            <div
              onClick={() => navigate('/search')}
              style={{
                position: 'absolute',
                right: '40px',
                cursor: 'pointer',
                padding: '4px',
              }}
            >
              <SearchIcon color="#fff" size={22} />
            </div>
          </>
        )}
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        zIndex: 5,
        overflowY: 'auto',
      }}>
        <Outlet />
      </div>
    </div>
  );
};

export default PhoneLayout;
