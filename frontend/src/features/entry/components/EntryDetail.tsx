import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { get } from '../../../services/request';
import LocationPin from '../../../components/icons/LocationPin';
import BackArrow from '../../../components/icons/BackArrow';

interface EntryDetailProps {
  slug?: string;
  onBack?: () => void;
}

interface Entry {
  id: number;
  title: string;
  summary: string;
  content: string;
  categoryId: number;
}

const EntryDetail: React.FC<EntryDetailProps> = ({ slug: propSlug, onBack }) => {
  const { slug: routeSlug } = useParams<{ slug: string }>();
  const slug = propSlug || routeSlug;
  const [entry, setEntry] = useState<Entry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEntry = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    try {
      const res = await get<Entry>(`/entry/slug/${slug}`);
      if (res.code === 200) {
        setEntry(res.data);
      } else {
        setError(res.message || '加载词条失败');
      }
    } catch {
      setError('加载词条失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    loadEntry();
  }, [loadEntry]);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        color: 'rgba(255,255,255,0.6)',
        fontSize: '18px',
      }}>
        加载中...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        color: 'rgba(255,255,255,0.8)',
        fontSize: '16px',
      }}>
        {error}
      </div>
    );
  }

  if (!entry) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        color: 'rgba(255,255,255,0.6)',
        fontSize: '18px',
      }}>
        词条不存在
      </div>
    );
  }

  return (
    <div style={{
      position: 'relative',
      color: '#fff',
      minHeight: 'calc(100vh - 80px)',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'relative',
        zIndex: 2,
        padding: '40px',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          marginBottom: '33px',
          marginTop: '-2px',
        }}>
          {onBack && (
            <div
              onClick={onBack}
              style={{
                cursor: 'pointer',
                padding: '4px',
                flexShrink: 0,
                marginTop: '8px',
              }}
            >
              <BackArrow color="#fff" size={34} />
            </div>
          )}
          <div style={{ marginLeft: '-5.5px', marginTop: '6px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.25))' }}>
            <LocationPin color="#fff" size={38} />
          </div>
          <h2 style={{ fontSize: '26px', fontWeight: 350, margin: 0 }}>
            {entry.title || '未知词条'}
          </h2>
        </div>

        <div style={{
          fontSize: '18px',
          fontWeight: 350,
          lineHeight: 1.75,
          color: '#fff',
        }}>
          <div dangerouslySetInnerHTML={{ __html: entry.content || '<p>暂无内容</p>' }} />
        </div>
      </div>

      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '70%',
        backgroundImage: 'url(/skyline.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center bottom',
        backgroundRepeat: 'no-repeat',
        zIndex: 1,
        pointerEvents: 'none',
      }} />
    </div>
  );
};

export default EntryDetail;
