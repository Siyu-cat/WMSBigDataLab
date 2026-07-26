import React, { useState, useEffect } from 'react';
import { get } from '../../../services/request';
import type { CategoryTreeNode } from '../../home/types';

interface Entry {
  id: number;
  name: string;
}

interface PageData {
  records: Entry[];
  total: number;
}

const Dashboard: React.FC = () => {
  const [entryCount, setEntryCount] = useState(0);
  const [categoryCount, setCategoryCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [pageRes, categoryRes] = await Promise.all([
          get<PageData>('/entry/page?page=1&size=1'),
          get<CategoryTreeNode[]>('/category/tree'),
        ]);

        if (pageRes.code === 200) {
          setEntryCount(pageRes.data.total);
        }
        if (categoryRes.code === 200) {
          setCategoryCount(categoryRes.data.length);
        }
      } catch (err) {
        console.error('获取数据失败', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div style={{ padding: '24px' }}>
      <h2 style={{ marginBottom: '24px', color: '#333' }}>数据概览</h2>
      
      <div style={{ display: 'flex', gap: '24px', marginBottom: '32px', flexWrap: 'wrap' }}>
        <div style={{
          flex: '1',
          minWidth: '200px',
          padding: '24px',
          background: '#1890ff',
          borderRadius: '8px',
          color: '#fff',
        }}>
          <div style={{ fontSize: '14px', marginBottom: '8px' }}>词条总数</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{loading ? '-' : entryCount}</div>
        </div>
        
        <div style={{
          flex: '1',
          minWidth: '200px',
          padding: '24px',
          background: '#52c41a',
          borderRadius: '8px',
          color: '#fff',
        }}>
          <div style={{ fontSize: '14px', marginBottom: '8px' }}>分类总数</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{loading ? '-' : categoryCount}</div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;