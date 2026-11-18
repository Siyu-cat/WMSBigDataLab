import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useIsMobile } from '../hooks/useIsMobile';
import { pastEvents } from '../data/story';
import type { StoryArc, StoryChapter, PastEvent } from '../data/story';
import { getStoryChapters, groupChaptersByArc } from '../services/storyService';

type Tab = 'main' | 'past';

const StoryPage: React.FC = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();
  const tab: Tab = location.pathname === '/pastevent' ? 'past' : 'main';
  const [toast, setToast] = useState<string | null>(null);
  const [arcs, setArcs] = useState<StoryArc[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let alive = true;
    getStoryChapters()
      .then((list) => {
        if (alive) setArcs(groupChaptersByArc(list));
      })
      .catch((err) => {
        if (alive) setLoadError(err instanceof Error ? err.message : '章节加载失败');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const showToast = useCallback((label: string) => {
    setToast(`「${label}」建设中，敬请期待`);
  }, []);

  const renderChapter = (chapter: StoryChapter) => (
    <div
      key={chapter.tag}
      onClick={() => navigate(`/mainstory/${chapter.slug}`)}
      style={{
        padding: isMobile ? '16px 16px' : '20px 16px',
        borderBottom: '1px solid #E8E8E8',
        cursor: 'pointer',
        transition: 'background 0.15s',
        gridColumn: chapter.tag === 'Prelude' ? '1 / -1' : undefined,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = '#F7F7F7'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
    >
      <div style={{
        fontSize: 13,
        color: '#9E9E9E',
        letterSpacing: '0.02em',
        marginBottom: 4,
      }}>
        {chapter.tag}
      </div>
      <div style={{
        fontSize: isMobile ? 16 : 18,
        fontWeight: 600,
        color: '#1E1E1E',
      }}>
        {chapter.title}
      </div>
    </div>
  );

  const renderEvent = (event: PastEvent) => (
    <div
      key={event.title}
      onClick={() => showToast(event.title)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        padding: isMobile ? '16px 16px' : '20px 16px',
        borderBottom: '1px solid #E8E8E8',
        cursor: 'pointer',
        transition: 'background 0.15s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = '#F7F7F7'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
    >
      <div style={{
        fontSize: isMobile ? 16 : 18,
        fontWeight: 600,
        color: '#1E1E1E',
      }}>
        {event.title}
      </div>
      <div style={{
        fontSize: 13,
        color: '#9E9E9E',
        flexShrink: 0,
      }}>
        {event.date}
      </div>
    </div>
  );

  const tabs: { key: Tab; label: string; path: string }[] = [
    { key: 'main', label: '主线', path: '/mainstory' },
    { key: 'past', label: '往期活动', path: '/pastevent' },
  ];

  return (
    <main style={{ width: '100%', minHeight: 'calc(100vh - 90px)', background: '#FFFFFF' }}>
      {/* Tabs */}
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: isMobile ? '20px 28px 0' : '32px 32px 0',
        display: 'flex',
        gap: 32,
        borderBottom: '1px solid #E8E8E8',
      }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => navigate(t.path)}
            style={{
              border: 'none',
              background: 'transparent',
              padding: '10px 4px 12px',
              fontSize: isMobile ? 15 : 16,
              fontWeight: tab === t.key ? 600 : 400,
              color: tab === t.key ? '#1E1E1E' : '#9E9E9E',
              borderBottom: tab === t.key ? '2px solid #1E1E1E' : '2px solid transparent',
              marginBottom: -1,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 内容区 */}
      <section style={{
        marginTop: 8,
      }}>
        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: isMobile ? '20px 28px 48px' : '28px 32px 64px',
        }}>
          {tab === 'main' ? (
            loading ? (
              <div style={{ padding: '48px 0', textAlign: 'center', color: '#9E9E9E', fontSize: 15 }}>
                加载中...
              </div>
            ) : loadError ? (
              <div style={{ padding: '48px 0', textAlign: 'center', color: '#D93025', fontSize: 15 }}>
                {loadError}
              </div>
            ) : arcs.length === 0 ? (
              <div style={{ padding: '48px 0', textAlign: 'center', color: '#9E9E9E', fontSize: 15 }}>
                暂无已导入的主线章节
              </div>
            ) : (
              arcs.map((arc) => (
              <div key={arc.key} style={{ marginBottom: isMobile ? 32 : 48 }}>
                <h2 style={{
                  fontSize: isMobile ? 22 : 28,
                  fontWeight: 600,
                  color: '#1E1E1E',
                  margin: 0,
                  marginBottom: 12,
                }}>
                  {arc.name}
                </h2>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                  columnGap: 48,
                  margin: '0 -16px',
                }}>
                  {arc.chapters.map(renderChapter)}
                </div>
              </div>
              ))
            )
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
              columnGap: 48,
              margin: '0 -16px',
            }}>
              {pastEvents.map(renderEvent)}
            </div>
          )}
        </div>
      </section>

      {toast && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(0, 0, 0, 0.78)',
          color: '#fff',
          padding: '14px 28px',
          borderRadius: '8px',
          fontSize: 16,
          zIndex: 1000,
          pointerEvents: 'none',
        }}>
          {toast}
        </div>
      )}
    </main>
  );
};

export default StoryPage;
