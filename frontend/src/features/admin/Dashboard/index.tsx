import React, { useState, useEffect } from 'react';
import { get } from '../../../services/request';
import { getCategoryTree } from '../../home/homeService';
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
  const [hotEntries, setHotEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [pageRes, categoryRes, hotRes] = await Promise.all([
          get<PageData>('/entry/page?page=1&size=1'),
          get<CategoryTreeNode[]>('/category/tree'),
          get<Entry[]>('/entry/hot?limit=10'),
        ]);

        if (pageRes.code === 200) {
          setEntryCount(pageRes.data.total);
        }
        if (categoryRes.code === 200) {
          setCategoryCount(categoryRes.data.length);
        }
        if (hotRes.code === 200) {
          setHotEntries(hotRes.data);
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

      <div style={{ background: '#fff', borderRadius: '8px', padding: '24px' }}>
        <h3 style={{ marginBottom: '16px', color: '#333' }}>热门词条</h3>
        
        {loading ? (
          <div style={{ color: '#999', padding: '20px', textAlign: 'center' }}>加载中...</div>
        ) : hotEntries.length === 0 ? (
          <div style={{ color: '#999', padding: '20px', textAlign: 'center' }}>暂无数据</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {hotEntries.map((entry, index) => (
              <div
                key={entry.id}
                style={{
                  padding: '12px 16px',
                  background: '#f5f5f5',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <span style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: index < 3 ? '#ff4d4f' : '#d9d9d9',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                }}>
                  {index + 1}
                </span>
                <span style={{ color: '#333' }}>{entry.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;