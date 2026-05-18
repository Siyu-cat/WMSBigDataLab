import React from 'react';

const LoginPage: React.FC = () => {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#fff',
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.1)',
        backdropFilter: 'blur(10px)',
        borderRadius: '12px',
        padding: '40px',
        width: '100%',
        maxWidth: '400px',
      }}>
        <h2 style={{ textAlign: 'center', marginBottom: '24px' }}>管理后台登录</h2>
        <input
          type="text"
          placeholder="用户名"
          style={{
            width: '100%',
            padding: '12px',
            marginBottom: '16px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '16px',
          }}
        />
        <input
          type="password"
          placeholder="密码"
          style={{
            width: '100%',
            padding: '12px',
            marginBottom: '24px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '16px',
          }}
        />
        <button style={{
          width: '100%',
          padding: '12px',
          background: '#1890ff',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          fontSize: '16px',
          cursor: 'pointer',
        }}>登录</button>
      </div>
    </div>
  );
};

export default LoginPage;