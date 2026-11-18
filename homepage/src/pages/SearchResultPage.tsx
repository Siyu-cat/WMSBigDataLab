import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { searchAll } from '../services/searchService';
import type { SearchAggregateItem } from '../services/searchService';

const SearchResultPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const keyword = searchParams.get('keyword') ?? '';
  const [input, setInput] = useState(keyword);
  const [results, setResults] = useState<SearchAggregateItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setInput(keyword);
    if (!keyword.trim()) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    searchAll(keyword)
      .then((data) => {
        if (!cancelled) setResults(data);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : '搜索失败');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [keyword]);

  const submit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const q = input.trim();
    if (!q) return;
    navigate(`/s?keyword=${encodeURIComponent(q)}`);
  }, [input, navigate]);

  return (
    <main style={{
      width: '100%',
      maxWidth: 960,
      margin: '0 auto',
      padding: '40px 20px 80px',
      boxSizing: 'border-box',
    }}>
      <form
        onSubmit={submit}
        style={{
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          height: 44,
          background: '#F5F5F5',
          border: '1px solid #D9D9D9',
          borderRadius: 22,
          padding: '0 6px 0 20px',
          gap: 8,
          marginBottom: 32,
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="搜索全站内容……"
          aria-label="全站搜索"
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontSize: 15,
            color: '#1E1E1E',
            minWidth: 0,
          }}
        />
        <button
          type="submit"
          aria-label="搜索"
          style={{
            height: 32,
            padding: '0 14px',
            border: 'none',
            background: '#1E1E1E',
            color: '#fff',
            fontSize: 14,
            borderRadius: 16,
            flexShrink: 0,
          }}
        >
          搜索
        </button>
      </form>

      <div style={{ fontSize: 15, color: '#757575', marginBottom: 20 }}>
        {loading ? '搜索中……' : error ? null : <>“{keyword}” 的搜索结果，共 {results.length} 条</>}
      </div>

      {error && (
        <div style={{ color: '#D93025', fontSize: 15 }}>{error}</div>
      )}

      {!loading && !error && keyword.trim() && results.length === 0 && (
        <div style={{ color: '#757575', fontSize: 16, padding: '40px 0' }}>
          没有找到相关内容，换个关键词试试？
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {results.map((item, idx) => (
          <a
            key={`${item.type}-${idx}`}
            href={item.url}
            style={{
              display: 'block',
              padding: '18px 20px',
              background: '#FFFFFF',
              border: '1px solid #E8E8E8',
              borderRadius: 10,
              transition: 'box-shadow 0.15s, border-color 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#BFBFBF';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#E8E8E8';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{
                fontSize: 12,
                color: '#5B6B7A',
                background: '#EEF3F7',
                border: '1px solid #DCE5EC',
                borderRadius: 4,
                padding: '2px 8px',
              }}>
                {item.source}
              </span>
              <span style={{ fontSize: 17, fontWeight: 600, color: '#1E1E1E' }}>
                {item.title}
              </span>
            </div>
            {item.summary && (
              <div style={{
                fontSize: 14,
                lineHeight: 1.6,
                color: '#757575',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}>
                {item.summary}
              </div>
            )}
          </a>
        ))}
      </div>
    </main>
  );
};

export default SearchResultPage;
