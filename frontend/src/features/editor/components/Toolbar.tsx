import React, { useState, useEffect, useRef } from 'react';
import type { Editor } from '@tiptap/react';
import { getAllEntries, uploadMedia } from '../editorService';

interface ToolbarProps {
  editor: Editor | null;
}

const Toolbar: React.FC<ToolbarProps> = ({ editor }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [linkSearch, setLinkSearch] = useState('');
  const [linkEntries, setLinkEntries] = useState<{ id: number; name: string }[]>([]);
  const [showLinkDropdown, setShowLinkDropdown] = useState(false);
  const [linkLoading, setLinkLoading] = useState(false);

  const fetchEntries = async (keyword?: string) => {
    setLinkLoading(true);
    try {
      const res = await getAllEntries(keyword);
      setLinkEntries(res.records.map(e => ({ id: e.id, name: e.name })));
    } catch {
      setLinkEntries([]);
    } finally {
      setLinkLoading(false);
    }
  };

  useEffect(() => {
    if (showLinkDropdown) {
      fetchEntries(linkSearch);
    }
  }, [showLinkDropdown, linkSearch]);

  if (!editor) return null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const media = await uploadMedia(file);
      editor.chain().focus().setImage({ src: media.filePath, alt: file.name }).run();
    } catch {
      alert('图片上传失败');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleInsertLink = (entry: { id: number; name: string }) => {
    editor.chain().focus().setInternalLink({
      entryId: String(entry.id),
      entryTitle: entry.name,
    }).run();
    setShowLinkDropdown(false);
    setLinkSearch('');
  };

  const btnStyle = (isActive = false): React.CSSProperties => ({
    padding: '4px 8px',
    border: '1px solid',
    borderColor: isActive ? '#1890ff' : '#d9d9d9',
    background: isActive ? '#e6f7ff' : '#fff',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
    color: isActive ? '#1890ff' : '#333',
    minWidth: '28px',
    textAlign: 'center' as const,
  });

  const separatorStyle: React.CSSProperties = {
    width: '1px',
    height: '24px',
    background: '#d9d9d9',
    margin: '0 4px',
  };

  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap' as const,
      alignItems: 'center',
      gap: '4px',
      padding: '8px 12px',
      borderBottom: '1px solid #e8e8e8',
      background: '#fafafa',
    }}>
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        style={btnStyle(editor.isActive('bold'))}
      >
        <b>B</b>
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        style={btnStyle(editor.isActive('italic'))}
      >
        <i>I</i>
      </button>
      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        style={btnStyle(editor.isActive('strike'))}
      >
        <s>S</s>
      </button>
      <button
        onClick={() => editor.chain().focus().toggleCode().run()}
        style={btnStyle(editor.isActive('code'))}
      >
        {'</>'}
      </button>

      <div style={separatorStyle} />

      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        style={btnStyle(editor.isActive('heading', { level: 1 }))}
      >
        H1
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        style={btnStyle(editor.isActive('heading', { level: 2 }))}
      >
        H2
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        style={btnStyle(editor.isActive('heading', { level: 3 }))}
      >
        H3
      </button>

      <div style={separatorStyle} />

      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        style={btnStyle(editor.isActive('bulletList'))}
      >
        • 列表
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        style={btnStyle(editor.isActive('orderedList'))}
      >
        1. 列表
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        style={btnStyle(editor.isActive('blockquote'))}
      >
        引用
      </button>
      <button
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        style={btnStyle(editor.isActive('codeBlock'))}
      >
        代码块
      </button>

      <div style={separatorStyle} />

      <button
        onClick={() => fileInputRef.current?.click()}
        style={btnStyle()}
      >
        🖼 图片
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleImageUpload}
      />

      <div style={{ position: 'relative' as const }}>
        <button
          onClick={() => setShowLinkDropdown(!showLinkDropdown)}
          style={btnStyle()}
        >
          🔗 关联词条
        </button>

        {showLinkDropdown && (
          <div style={{
            position: 'absolute' as const,
            top: '100%',
            left: 0,
            marginTop: '4px',
            background: '#fff',
            border: '1px solid #d9d9d9',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            width: '240px',
            zIndex: 100,
            overflow: 'hidden',
          }}>
            <div style={{ padding: '8px' }}>
              <input
                type="text"
                placeholder="搜索词条..."
                value={linkSearch}
                onChange={(e) => setLinkSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  border: '1px solid #d9d9d9',
                  borderRadius: '4px',
                  fontSize: '13px',
                  boxSizing: 'border-box' as const,
                }}
              />
            </div>
            <div style={{ maxHeight: '200px', overflowY: 'auto' as const }}>
              {linkLoading ? (
                <div style={{ padding: '12px', textAlign: 'center' as const, color: '#999' }}>加载中...</div>
              ) : linkEntries.length === 0 ? (
                <div style={{ padding: '12px', textAlign: 'center' as const, color: '#999' }}>无匹配词条</div>
              ) : (
                linkEntries.map(entry => (
                  <div
                    key={entry.id}
                    onClick={() => handleInsertLink(entry)}
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      borderBottom: '1px solid #f0f0f0',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#f5f5f5';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#fff';
                    }}
                  >
                    {entry.name}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Toolbar;