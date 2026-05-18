import React from 'react';
import { useParams } from 'react-router-dom';
import LocationPin from '../../../components/icons/LocationPin';
import { mockEntryDetail } from '../../home/mockData';

interface EntryDetailProps {
  entryId?: string;
}

const EntryDetail: React.FC<EntryDetailProps> = ({ entryId }) => {
  const { id: routeId } = useParams();
  const id = entryId || routeId;
  const detail = mockEntryDetail[id || ''] || mockEntryDetail.default;

  return (
    <div style={{
      position: 'relative',
      color: '#fff',
      minHeight: 'calc(100vh - 80px)',
      overflow: 'hidden',
    }}>
      {/* Content */}
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
            {detail.title || '未知词条'}
          </h2>
        </div>

        <div style={{
          fontSize: '16px',
          lineHeight: 1.8,
          color: 'rgba(255,255,255,0.9)',
        }}>
          <p>{detail.content}</p>
        </div>
      </div>

      {/* Skyline background */}
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
