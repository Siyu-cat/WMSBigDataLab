import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { get, del } from '../../../services/request';
import type { CategoryTreeNode } from '../../home/types';

interface Entry {
  id: number;
  name: string;
  title: string;
  content?: string;
  categoryId?: number;
  createTime?: string;
  createdAt?: string;
  updateTime?: string;
  updatedAt?: string;
}

interface FlatCategory {
  id: number;
  name: string;
  depth: number;
}

interface PageData {
  records: Entry[];
  total: number;
  current: number;
  size: number;
}

const EntryManager: React.FC = () => {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [size] = useState(10);
  const [total, setTotal] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [flatCategories, setFlatCategories] = useState<FlatCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);

  const buildFlatCategories = (nodes: CategoryTreeNode[], depth: number): FlatCategory[] => {
    const result: FlatCategory[] = [];
    for (const node of nodes) {
      result.push({ id: Number(node.id), name: node.name, depth });
      if (node.children && node.children.length > 0) {
        result.push(...buildFlatCategories(node.children, depth + 1));
      }
    }
    return result;
  };

  const fetchCategories = useCallback(async () => {
    try {
      const res = await get<CategoryTreeNode[]>('/category/tree');
      if (res.code === 200) {
        setFlatCategories(buildFlatCategories(res.data, 0));
      }
    } catch (err) {
      console.error('获取分类失败', err);
    }
  }, []);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      if (keyword.trim()) {
        const res = await get<Entry[]>(`/entry/search?keyword=${encodeURIComponent(keyword.trim())}`);
        if (res.code === 200) {
          setEntries(res.data);
          setTotal(res.data.length);
        }
      } else {
        const params = new URLSearchParams();
        params.append('page', String(page));
        params.append('size', String(size));
        if (selectedCategory) {
          params.append('categoryId', String(selectedCategory));
        }
        
        const res = await get<PageData>(`/entry/page?${params.toString()}`);
        if (res.code === 200) {
          setEntries(res.data.records);
          setTotal(res.data.total);
        }
      }
    } catch (err) {
      console.error('获取词条失败', err);
    } finally {
      setLoading(false);
    }
  }, [page, size, selectedCategory, keyword]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const handleDelete = async (id: number) => {
    if (!window.confirm('确定要删除这个词条吗？')) return;
    
    setDeleteLoading(id);
    try {
      const res = await del(`/entry/${id}`);
      if (res.code === 200) {
        fetchEntries();
      } else {
        alert(res.message || '删除失败');
      }
    } catch (err) {
      alert('删除失败');
    } finally {
      setDeleteLoading(null);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const totalPages = Math.ceil(total / size);

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="搜索词条名称..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #d9d9d9',
            width: '200px',
          }}
        />
        
        <select
          value={selectedCategory || ''}
          onChange={(e) => setSelectedCategory(e.target.value ? Number(e.target.value) : null)}
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #d9d9d9',
            minWidth: '150px',
          }}
        >
          <option value="">全部分类</option>
          {flatCategories.map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.depth > 0 ? '\u00A0\u00A0'.repeat(cat.depth) + '├ ' + cat.name : cat.name}
            </option>
          ))}
        </select>

        <button
          onClick={() => { setPage(1); fetchEntries(); }}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: 'none',
            background: '#1890ff',
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          搜索
        </button>

        <button
          onClick={() => navigate('/admin/editor')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: 'none',
            background: '#52c41a',
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          + 新增词条
        </button>
      </div>

      <div style={{ background: '#fff', borderRadius: '8px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th style={{ padding: '12px', textAlign: 'left' }}>ID</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>名称</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>分类</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>创建时间</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                  加载中...
                </td>
              </tr>
            ) : entries.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                  暂无数据
                </td>
              </tr>
            ) : (
              entries.map(entry => (
                <tr key={entry.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '12px' }}>{entry.id}</td>
                  <td style={{ padding: '12px' }}>{entry.title || entry.name || '-'}</td>
                  <td style={{ padding: '12px' }}>{entry.categoryId || '-'}</td>
                  <td style={{ padding: '12px' }}>{entry.createTime || entry.createdAt || '-'}</td>
                  <td style={{ padding: '12px', display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => navigate(`/admin/editor/${entry.id}`)}
                      style={{
                        padding: '4px 12px',
                        borderRadius: '4px',
                        border: '1px solid #1890ff',
                        background: '#fff',
                        color: '#1890ff',
                        cursor: 'pointer',
                      }}
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      disabled={deleteLoading === entry.id}
                      style={{
                        padding: '4px 12px',
                        borderRadius: '4px',
                        border: '1px solid #ff4d4f',
                        background: '#fff',
                        color: '#ff4d4f',
                        cursor: deleteLoading === entry.id ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {deleteLoading === entry.id ? '删除中...' : '删除'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page <= 1}
            style={{
              padding: '6px 12px',
              borderRadius: '4px',
              border: '1px solid #d9d9d9',
              background: '#fff',
              cursor: page <= 1 ? 'not-allowed' : 'pointer',
            }}
          >
            上一页
          </button>
          <span style={{ padding: '6px 12px' }}>
            第 {page} / {totalPages} 页 (共 {total} 条)
          </span>
          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= totalPages}
            style={{
              padding: '6px 12px',
              borderRadius: '4px',
              border: '1px solid #d9d9d9',
              background: '#fff',
              cursor: page >= totalPages ? 'not-allowed' : 'pointer',
            }}
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
};

export default EntryManager;