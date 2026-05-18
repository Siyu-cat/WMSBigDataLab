import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { get } from '../../../services/request';
import LocationPin from '../../../components/icons/LocationPin';

interface EntryDetailProps {
  entryId?: string;
}

interface Entry {
  id: number;
  title: string;
  summary: string;
  content: string;
  categoryId: number;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

const EntryDetail: React.FC<EntryDetailProps> = ({ entryId }) => {
  const { id: routeId } = useParams<{ id: string }>();
  const id = entryId || routeId;
  const [entry, setEntry] = useState<Entry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEntry = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await get<Entry>(`/entry/${id}`);
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
  }, [id]);

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
        padding: '24px',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '24px',
        }}>
          <LocationPin color="#fff" size={28} />
          <h2 style={{ fontSize: '28px', fontWeight: 500, margin: 0 }}>
            {entry.title || '未知词条'}
          </h2>
        </div>

        <div style={{
          fontSize: '14px',
          color: 'rgba(255,255,255,0.5)',
          marginBottom: '16px',
          display: 'flex',
          gap: '16px',
        }}>
          <span>浏览: {entry.viewCount || 0}</span>
          <span>创建: {entry.createdAt ? new Date(entry.createdAt).toLocaleString('zh-CN') : '-'}</span>
        </div>

        {entry.summary && (
          <div style={{
            padding: '12px 16px',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '15px',
            color: 'rgba(255,255,255,0.8)',
            borderLeft: '3px solid rgba(255,255,255,0.3)',
          }}>
            {entry.summary}
          </div>
        )}

        <div style={{
          fontSize: '16px',
          lineHeight: 1.8,
          color: 'rgba(255,255,255,0.9)',
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