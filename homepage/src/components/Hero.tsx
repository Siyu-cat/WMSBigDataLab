import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '../hooks/useIsMobile';
import { searchAll } from '../services/searchService';
import type { SearchAggregateItem } from '../services/searchService';

const Hero: React.FC = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [keyword, setKeyword] = useState('');
  const [suggestions, setSuggestions] = useState<SearchAggregateItem[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const blurTimer = useRef<number | undefined>(undefined);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    window.clearTimeout(blurTimer.current);
    const q = keyword.trim();
    if (!q) return;
    setShowPanel(false);
    navigate(`/s?keyword=${encodeURIComponent(q)}`);
  };

  /* 输入防抖：280ms 后拉取全站建议 */
  useEffect(() => {
    const q = keyword.trim();
    window.clearTimeout(blurTimer.current);
    if (!q) {
      setSuggestions([]);
      setShowPanel(false);
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(() => {
      searchAll(q)
        .then((data) => {
          if (cancelled) return;
          setSuggestions(data.slice(0, 6));
          setShowPanel(true);
        })
        .catch(() => {
          if (!cancelled) {
            setSuggestions([]);
            setShowPanel(false);
          }
        });
    }, 280);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [keyword]);

  const handleBlur = useCallback(() => {
    /* 延迟收起，保证面板内点击能完成 */
    window.clearTimeout(blurTimer.current);
    blurTimer.current = window.setTimeout(() => setShowPanel(false), 180);
  }, []);

  const handleFocus = () => {
    window.clearTimeout(blurTimer.current);
    if (keyword.trim() && suggestions.length > 0) setShowPanel(true);
  };

  useEffect(() => () => window.clearTimeout(blurTimer.current), []);

  return (
    <section style={{
      width: '100%',
      minHeight: isMobile ? 480 : 900,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: isMobile ? '96px 20px 160px' : '160px 24px 280px',
      gap: isMobile ? 24 : 32,
      position: 'relative',
      overflow: 'hidden',
      /* Hero 区背景：纯色兜底，底图在独立图层上可调透明度 */
      backgroundColor: '#F0F1F5',
    }}>
      {/* 底图层：仅图片受透明度影响，下方透出 #F0F1F5 底色 */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'url(/bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.2,
          pointerEvents: 'none',
        }}
      />
      <div style={{
        fontSize: isMobile ? 24 : 32,
        fontWeight: 400,
        lineHeight: 1.2,
        textAlign: 'center',
        color: '#0C0C0D',
        position: 'relative',
        zIndex: 1,
      }}>
        未名市大数据中心
      </div>

      <form
        onSubmit={submit}
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          width: isMobile ? 300 : 540,
          maxWidth: '92vw',
          height: 40,
          background: '#FFFFFF',
          borderRadius: 20,
          padding: '0 6px 0 20px',
          gap: 8,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
        }}
      >
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder="搜索词条、世界观、事件簿……"
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
            width: 32,
            height: 32,
            border: 'none',
            background: 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            flexShrink: 0,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#757575" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" />
            <line x1="16.5" y1="16.5" x2="21" y2="21" />
          </svg>
        </button>

        {/* 全站搜索建议下拉 */}
        {showPanel && suggestions.length > 0 && (
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            right: 0,
            background: '#FFFFFF',
            borderRadius: 12,
            border: '1px solid #E8E8E8',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
            overflow: 'hidden',
            zIndex: 30,
          }}>
            {suggestions.map((item, idx) => (
              <a
                key={`${item.type}-${idx}`}
                href={item.url}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 16px',
                  borderBottom: idx < suggestions.length - 1 ? '1px solid #F0F0F0' : 'none',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#F5F5F5'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{
                  fontSize: 11,
                  color: '#5B6B7A',
                  background: '#EEF3F7',
                  border: '1px solid #DCE5EC',
                  borderRadius: 4,
                  padding: '1px 6px',
                  flexShrink: 0,
                }}>
                  {item.source}
                </span>
                <span style={{
                  fontSize: 14,
                  color: '#1E1E1E',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {item.title}
                </span>
              </a>
            ))}
            <button
              type="submit"
              style={{
                width: '100%',
                padding: '10px 16px',
                border: 'none',
                borderTop: '1px solid #F0F0F0',
                background: '#FAFAFA',
                fontSize: 13,
                color: '#757575',
                textAlign: 'center',
              }}
            >
              查看全部结果
            </button>
          </div>
        )}
      </form>

      {/* 背景网格纹理（等价于设计稿 .hero::after） */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          backgroundImage:
            'linear-gradient(rgba(255, 255, 255, 0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.18) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
    </section>
  );
};

export default Hero;
