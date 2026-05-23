import React, { useState, useEffect, useCallback } from 'react';
import { get, post, put, del } from '../../../services/request';

interface Category {
  id: number;
  name: string;
  parentId: number | null;
  sortOrder: number;
  children?: Category[];
}

const CategoryManager: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: '', parentId: null as number | null, sortOrder: 0 });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await get<Category[]>('/category/tree');
      if (res.code === 200) {
        setCategories(res.data);
      }
    } catch {
      setError('获取分类失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const flattenCategories = (cats: Category[], depth = 0): { id: number; name: string; depth: number }[] => {
    const result: { id: number; name: string; depth: number }[] = [];
    for (const cat of cats) {
      result.push({ id: cat.id, name: cat.name, depth });
      if (cat.children && cat.children.length > 0) {
        result.push(...flattenCategories(cat.children, depth + 1));
      }
    }
    return result;
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setError('请输入分类名称');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (editingCategory) {
        await put('/category', { ...formData, id: editingCategory.id });
      } else {
        await post('/category', formData);
      }
      setShowModal(false);
      setEditingCategory(null);
      setFormData({ name: '', parentId: null, sortOrder: 0 });
      fetchCategories();
    } catch {
      setError(editingCategory ? '更新分类失败' : '创建分类失败');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({ name: category.name, parentId: category.parentId, sortOrder: category.sortOrder });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('确定要删除这个分类吗？')) return;
    try {
      const res = await del(`/category/${id}`);
      if (res.code === 200) {
        fetchCategories();
      } else {
        setError(res.message || '删除失败');
      }
    } catch {
      setError('删除分类失败');
    }
  };

  const renderCategoryTree = (cats: Category[], depth = 0): React.ReactNode => {
    return cats.map(cat => (
      <div key={cat.id}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '12px 16px',
          borderBottom: '1px solid #f0f0f0',
          background: '#fff',
        }}>
          <span style={{ marginLeft: `${depth * 24}px`, flex: 1 }}>
            {depth > 0 && <span style={{ color: '#999', marginRight: '8px' }}>└</span>}
            {cat.name}
          </span>
          <span style={{ color: '#999', marginRight: '16px', fontSize: '13px' }}>
            排序: {cat.sortOrder}
          </span>
          <button
            onClick={() => handleEdit(cat)}
            style={{
              padding: '4px 12px',
              marginRight: '8px',
              border: '1px solid #1890ff',
              borderRadius: '4px',
              background: '#fff',
              color: '#1890ff',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            编辑
          </button>
          <button
            onClick={() => handleDelete(cat.id)}
            style={{
              padding: '4px 12px',
              border: '1px solid #ff4d4f',
              borderRadius: '4px',
              background: '#fff',
              color: '#ff4d4f',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            删除
          </button>
        </div>
        {cat.children && cat.children.length > 0 && renderCategoryTree(cat.children, depth + 1)}
      </div>
    ));
  };

  const flatCategories = flattenCategories(categories);

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>分类管理</h2>
        <button
          onClick={() => {
            setEditingCategory(null);
            setFormData({ name: '', parentId: null, sortOrder: 0 });
            setShowModal(true);
          }}
          style={{
            padding: '8px 16px',
            border: 'none',
            borderRadius: '6px',
            background: '#52c41a',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          + 新增分类
        </button>
      </div>

      {error && (
        <div style={{
          marginBottom: '16px',
          padding: '12px 16px',
          background: '#fff2f0',
          border: '1px solid #ffccc7',
          borderRadius: '6px',
          color: '#ff4d4f',
        }}>
          {error}
          <span onClick={() => setError(null)} style={{ float: 'right', cursor: 'pointer' }}>×</span>
        </div>
      )}

      <div style={{ background: '#fff', borderRadius: '8px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>加载中...</div>
        ) : categories.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>暂无分类</div>
        ) : (
          renderCategoryTree(categories)
        )}
      </div>

      {showModal && (
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
            width: '400px',
            maxWidth: '90%',
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px' }}>
              {editingCategory ? '编辑分类' : '新增分类'}
            </h3>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>分类名称 *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="请输入分类名称"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d9d9d9',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>父级分类</label>
              <select
                value={formData.parentId ? String(formData.parentId) : ''}
                onChange={(e) => setFormData({ ...formData, parentId: e.target.value ? Number(e.target.value) : null })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d9d9d9',
                  borderRadius: '6px',
                  fontSize: '14px',
                }}
              >
                <option value="">无（顶级分类）</option>
                {flatCategories.map(cat => (
                  <option key={cat.id} value={String(cat.id)}>
                    {cat.depth > 0 ? '\u00A0\u00A0'.repeat(cat.depth) + '├ ' + cat.name : cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>排序</label>
              <input
                type="number"
                value={formData.sortOrder}
                onChange={(e) => setFormData({ ...formData, sortOrder: Number(e.target.value) })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d9d9d9',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingCategory(null);
                  setError(null);
                }}
                style={{
                  padding: '8px 20px',
                  border: '1px solid #d9d9d9',
                  borderRadius: '6px',
                  background: '#fff',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                style={{
                  padding: '8px 20px',
                  border: 'none',
                  borderRadius: '6px',
                  background: saving ? '#ccc' : '#1890ff',
                  color: '#fff',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                }}
              >
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManager;
