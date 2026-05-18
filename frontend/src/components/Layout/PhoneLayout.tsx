import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import BackArrow from '../icons/BackArrow';
import SearchIcon from '../icons/SearchIcon';
import FloatingBlocks from '../../features/background/FloatingBlocks';

const PhoneLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isSubPage = location.pathname !== '/' && !location.pathname.startsWith('/category');

  const getTitle = () => {
    if (isSubPage) {
      const pathParts = location.pathname.split('/');
      if (pathParts[1] === 'entry') return '当代人物';
      if (pathParts[1] === 'search') return '搜索';
    }
    return '大数据中心';
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      zIndex: 1,
    }}>
      <FloatingBlocks />

      {/* Header */}
      <div style={{
        padding: '16px',
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
            onClick={() => navigate(-1)}
            style={{
              position: 'absolute',
              left: '16px',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <BackArrow color="#fff" size={24} />
          </div>
        ) : null}

        <h1 style={{
          color: '#fff',
          fontSize: '18px',
          fontWeight: 500,
          margin: 0,
        }}>{getTitle()}</h1>

        {!isSubPage && (
          <div
            onClick={() => navigate('/search')}
            style={{
              position: 'absolute',
              right: '16px',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <SearchIcon color="#fff" size={22} />
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        position: 'relative',
        zIndex: 5,
      }}>
        <Outlet />
      </div>
    </div>
  );
};

export default PhoneLayout;
