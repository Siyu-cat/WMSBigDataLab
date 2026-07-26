import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { get, del, post } from '../../../services/request';
import type { CategoryTreeNode } from '../../home/types';

interface Entry {
  id: number;
  slug: string;
  name: string;
  title: string;
  content?: string;
  categoryId?: number;
  categoryPath?: string;
  contentSnippet?: string;
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

interface WordImportEntry {
  level1Category: string;
  level2Category: string;
  title: string;
  content: string;
  skipped: boolean;
  skipReason: string;
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
  const [sortBy, setSortBy] = useState('slug');
  const [jumpPage, setJumpPage] = useState('');
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreviewData, setImportPreviewData] = useState<WordImportEntry[]>([]);
  const [importPreviewLoading, setImportPreviewLoading] = useState(false);
  const [importSaving, setImportSaving] = useState(false);
  const [importResult, setImportResult] = useState<{ created: number; updated: number; skipped: number; errors: number } | null>(null);

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
        params.append('sortBy', sortBy);
        
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
  }, [page, size, selectedCategory, keyword, sortBy]);

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

  const handleJump = () => {
    const p = parseInt(jumpPage, 10);
    if (p >= 1 && p <= totalPages) {
      setPage(p);
      setJumpPage('');
    }
  };

  const handleImportClick = () => {
    setImportModalVisible(true);
    setImportFile(null);
    setImportPreviewData([]);
    setImportResult(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportFile(file);
      setImportPreviewData([]);
      setImportResult(null);
    }
  };

  const handlePreview = async () => {
    if (!importFile) return;
    setImportPreviewLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', importFile);
      const res = await post<WordImportEntry[]>('/entry/import/preview', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
      });
      if (res.code === 200) {
        setImportPreviewData(res.data);
      } else {
        alert(res.message || '解析失败');
      }
    } catch {
      alert('文件解析失败，请检查文件格式');
    } finally {
      setImportPreviewLoading(false);
    }
  };

  const handleImportConfirm = async () => {
    if (importPreviewData.length === 0) return;
    setImportSaving(true);
    try {
      const res = await post<{ created: number; updated: number; skipped: number; errors: number }>(
        '/entry/import/save',
        importPreviewData,
        { timeout: 120000 }
      );
      if (res.code === 200) {
        setImportResult(res.data);
        fetchEntries();
      } else {
        alert(res.message || '导入失败');
      }
    } catch {
      alert('导入失败，请稍后重试');
    } finally {
      setImportSaving(false);
    }
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

        <select
          value={sortBy}
          onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #d9d9d9',
            minWidth: '120px',
          }}
        >
          <option value="slug">拼音排序</option>
          <option value="createdAt">创建时间排序</option>
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

        <button
          onClick={handleImportClick}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: 'none',
            background: '#722ed1',
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          批量导入Word
        </button>
      </div>

      <div style={{ background: '#fff', borderRadius: '8px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th style={{ padding: '12px', textAlign: 'left' }}>拼音标识</th>
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
                  <td style={{ padding: '12px' }}>{entry.slug || '-'}</td>
                  <td style={{ padding: '12px' }}>{entry.title || entry.name || '-'}</td>
                  <td style={{ padding: '12px' }}>{entry.categoryPath || entry.categoryId || '-'}</td>
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
          <span style={{ padding: '6px 4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            第
            <input
              type="number"
              min={1}
              max={totalPages}
              value={jumpPage}
              onChange={(e) => setJumpPage(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleJump() }}
              style={{ width: '50px', padding: '4px', textAlign: 'center', border: '1px solid #d9d9d9', borderRadius: '4px' }}
            />
            / {totalPages} 页 (共 {total} 条)
            <button onClick={handleJump} disabled={!jumpPage} style={{ padding: '4px 8px', border: '1px solid #d9d9d9', borderRadius: '4px', background: '#fff', cursor: 'pointer' }}>
              跳转
            </button>
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

      {importModalVisible && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '8px',
            padding: '24px',
            width: '800px',
            maxHeight: '80vh',
            overflow: 'auto',
          }}>
            <h3 style={{ margin: '0 0 16px 0' }}>批量导入Word词条</h3>

            <div style={{ marginBottom: '16px' }}>
              <input
                type="file"
                accept=".docx"
                onChange={handleFileSelect}
                style={{ marginBottom: '8px' }}
              />
              {importFile && (
                <div style={{ color: '#666', fontSize: '14px' }}>
                  已选择: {importFile.name}
                </div>
              )}
            </div>

            <div style={{ marginBottom: '16px', display: 'flex', gap: '12px' }}>
              <button
                onClick={handlePreview}
                disabled={!importFile || importPreviewLoading}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#1890ff',
                  color: '#fff',
                  cursor: !importFile || importPreviewLoading ? 'not-allowed' : 'pointer',
                }}
              >
                {importPreviewLoading ? '解析中...' : '解析文件'}
              </button>

              {importPreviewData.length > 0 && !importResult && (
                <button
                  onClick={handleImportConfirm}
                  disabled={importSaving}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: 'none',
                    background: '#52c41a',
                    color: '#fff',
                    cursor: importSaving ? 'not-allowed' : 'pointer',
                  }}
                >
                  {importSaving ? '导入中...' : '确认导入'}
                </button>
              )}

              <button
                onClick={() => setImportModalVisible(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: '1px solid #d9d9d9',
                  background: '#fff',
                  cursor: 'pointer',
                }}
              >
                关闭
              </button>
            </div>

            {importResult && (
              <div style={{
                padding: '12px',
                background: '#f6ffed',
                border: '1px solid #b7eb8f',
                borderRadius: '6px',
                marginBottom: '16px',
              }}>
                导入完成：新增 {importResult.created} 条，更新 {importResult.updated} 条，跳过 {importResult.skipped} 条，错误 {importResult.errors} 条
              </div>
            )}

            {importPreviewData.length > 0 && (
              <div>
                <h4 style={{ margin: '0 0 8px 0' }}>
                  预览 ({importPreviewData.length} 条)
                </h4>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ background: '#f5f5f5' }}>
                      <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #d9d9d9' }}>一级分类</th>
                      <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #d9d9d9' }}>二级分类</th>
                      <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #d9d9d9' }}>标题</th>
                      <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #d9d9d9' }}>内容摘要</th>
                      <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #d9d9d9' }}>状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importPreviewData.map((item, index) => (
                      <tr key={index} style={{ borderBottom: '1px solid #f0f0f0' }}>
                        <td style={{ padding: '8px' }}>{item.level1Category}</td>
                        <td style={{ padding: '8px' }}>{item.level2Category}</td>
                        <td style={{ padding: '8px' }}>{item.title || '-'}</td>
                        <td style={{ padding: '8px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.content ? item.content.substring(0, 50) + (item.content.length > 50 ? '...' : '') : '-'}
                        </td>
                        <td style={{ padding: '8px', color: item.skipped ? '#ff4d4f' : '#52c41a' }}>
                          {item.skipped ? item.skipReason : '正常'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EntryManager;