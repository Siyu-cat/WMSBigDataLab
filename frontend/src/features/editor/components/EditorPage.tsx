import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import InternalLinkExtension from '../extensions/InternalLinkExtension';
import Toolbar from './Toolbar';
import { getEntry, createEntry, updateEntry } from '../editorService';
import type { EntryData } from '../editorService';
import { getCategoryTree } from '../../home/homeService';
import type { CategoryTreeNode } from '../../home/types';

interface FlatCategory {
  id: number;
  name: string;
  depth: number;
}

const EditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [flatCategories, setFlatCategories] = useState<FlatCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: '开始编辑词条内容...' }),
      Image.configure({ inline: true }),
      InternalLinkExtension,
    ],
    content: '',
  });

  const loadEntry = useCallback(async () => {
    if (!id) return;
    setFetching(true);
    try {
      const data = await getEntry(Number(id));
      setTitle(data.title || '');
      setCategoryId(data.categoryId);
      if (editor && data.content) {
        editor.commands.setContent(data.content);
      }
    } catch {
      setError('加载词条失败');
    } finally {
      setFetching(false);
    }
  }, [id, editor]);

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

  const loadCategories = useCallback(async () => {
    try {
      const tree = await getCategoryTree();
      setFlatCategories(buildFlatCategories(tree, 0));
      setCategoriesError(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setCategoriesError(`加载分类失败: ${msg}`);
    }
  }, []);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    if (id && editor) {
      loadEntry();
    }
  }, [id, editor, loadEntry]);

  const handleSave = async () => {
    setError(null);
    console.log('DEBUG save - categoryId:', categoryId, 'type:', typeof categoryId);
    if (!title.trim()) {
      setError('请输入标题');
      return;
    }
    if (!categoryId) {
      setError('请选择分类');
      return;
    }
    if (!editor) return;

    setLoading(true);
    try {
      const data: EntryData = {
        title: title.trim(),
        content: editor.getHTML(),
        categoryId,
      };

      if (isEditing) {
        await updateEntry(Number(id), data);
        setSuccess('词条保存成功');
      } else {
        await createEntry(data);
        setSuccess('词条创建成功');
        navigate('/admin/entries');
      }
    } catch (err: unknown) {
      let msg = '保存失败，请稍后重试';
      if (err && typeof err === 'object') {
        const e = err as { response?: { data?: { message?: string } }; message?: string };
        msg = e.response?.data?.message || e.message || msg;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' as const, color: '#999' }}>
        加载中...
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
      {error && (
        <div style={{ marginBottom: '16px', padding: '12px 16px', background: '#fff2f0', border: '1px solid #ffccc7', borderRadius: '6px', color: '#ff4d4f' }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ marginBottom: '16px', padding: '12px 16px', background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: '6px', color: '#52c41a' }}>
          {success}
        </div>
      )}
      <div style={{ marginBottom: '16px' }}>
        <input
          type="text"
          placeholder="输入词条标题..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px',
            fontSize: '20px',
            fontWeight: 'bold' as const,
            border: '1px solid #d9d9d9',
            borderRadius: '8px',
            outline: 'none',
            boxSizing: 'border-box' as const,
          }}
        />
      </div>

      <div style={{ marginBottom: '16px' }}>
        {categoriesError && (
          <div style={{ marginBottom: '8px', padding: '8px 12px', background: '#fff2f0', border: '1px solid #ffccc7', borderRadius: '4px', color: '#ff4d4f', fontSize: '13px' }}>
            {categoriesError}
          </div>
        )}
        <select
          value={categoryId ? String(categoryId) : ''}
          onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : undefined)}
          style={{
            padding: '8px 12px',
            border: '1px solid #d9d9d9',
            borderRadius: '6px',
            fontSize: '14px',
            minWidth: '200px',
          }}
        >
          <option value="">选择分类</option>
          {flatCategories.map(cat => (
            <option key={cat.id} value={String(cat.id)}>
              {cat.depth > 0 ? '\u00A0\u00A0'.repeat(cat.depth) + '├ ' + cat.name : cat.name}
            </option>
          ))}
        </select>
      </div>

      <div style={{
        border: '1px solid #d9d9d9',
        borderRadius: '8px',
        overflow: 'hidden',
        marginBottom: '16px',
      }}>
        <Toolbar editor={editor} />
        <EditorContent
          editor={editor}
          style={{
            minHeight: '400px',
            padding: '16px',
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
        <button
          onClick={() => navigate('/admin/entries')}
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
          onClick={handleSave}
          disabled={loading}
          style={{
            padding: '8px 20px',
            border: 'none',
            borderRadius: '6px',
            background: loading ? '#ccc' : '#1890ff',
            color: '#fff',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
          }}
        >
          {loading ? '保存中...' : isEditing ? '保存修改' : '创建词条'}
        </button>
      </div>
    </div>
  );
};

export default EditorPage;