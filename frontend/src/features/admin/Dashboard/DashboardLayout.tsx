import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { clearToken } from '../../../services/auth';

const DashboardLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const currentPath = location.pathname.split('/admin/')[1] || 'dashboard';
  
  const menuItems = [
    { key: 'dashboard', label: '数据概览', path: '/admin/dashboard' },
    { key: 'entries', label: '词条管理', path: '/admin/entries' },
  ];

  const handleLogout = () => {
    clearToken();
    navigate('/admin/login');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <div style={{
        width: '200px',
        background: '#001529',
        padding: '20px 0',
      }}>
        <div style={{
          padding: '0 24px',
          marginBottom: '24px',
          color: '#fff',
          fontSize: '18px',
          fontWeight: 'bold',
        }}>
          管理后台
        </div>
        
        {menuItems.map(item => (
          <div
            key={item.key}
            onClick={() => navigate(item.path)}
            style={{
              padding: '12px 24px',
              color: currentPath === item.key ? '#1890ff' : 'rgba(255,255,255,0.65)',
              background: currentPath === item.key ? 'rgba(24,144,255,0.1)' : 'transparent',
              cursor: 'pointer',
              transition: 'all 0.3s',
            }}
          >
            {item.label}
          </div>
        ))}
        
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '0',
          width: '200px',
        }}>
          <div
            onClick={handleLogout}
            style={{
              padding: '12px 24px',
              color: 'rgba(255,255,255,0.65)',
              cursor: 'pointer',
            }}
          >
            退出登录
          </div>
        </div>
      </div>
      
      <div style={{ flex: 1, background: '#f0f2f5', overflowY: 'auto' }}>
        <Outlet />
      </div>
    </div>
  );
};

export default DashboardLayout;