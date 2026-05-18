import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { post } from '../../../services/request';
import { setToken, setUser } from '../../../services/auth';

interface LoginResponse {
  token: string;
  username: string;
}

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError('请输入用户名和密码');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await post<LoginResponse>('/admin/login', { username, password });
      if (res.code === 200) {
        setToken(res.data.token);
        setUser({ id: '', username: res.data.username, role: 'admin' });
        navigate('/admin');
      } else {
        setError(res.message || '登录失败');
      }
    } catch (err) {
      setError('用户名或密码错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#fff',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
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
        
        {error && (
          <div style={{
            padding: '12px',
            marginBottom: '16px',
            background: 'rgba(255,77,79,0.2)',
            borderRadius: '8px',
            color: '#ff4d4f',
            textAlign: 'center',
          }}>
            {error}
          </div>
        )}
        
        <input
          type="text"
          placeholder="用户名"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          style={{
            width: '100%',
            padding: '12px',
            marginBottom: '16px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '16px',
            boxSizing: 'border-box',
          }}
        />
        <input
          type="password"
          placeholder="密码"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          style={{
            width: '100%',
            padding: '12px',
            marginBottom: '24px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '16px',
            boxSizing: 'border-box',
          }}
        />
        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            background: loading ? '#ccc' : '#1890ff',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? '登录中...' : '登录'}
        </button>
      </div>
    </div>
  );
};

export default LoginPage;