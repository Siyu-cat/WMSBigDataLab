import React from 'react';

interface EntryCardProps {
  id: string;
  name: string;
  isSelected: boolean;
  paddingLeft: number;
  onClick: () => void;
}

const EntryCard: React.FC<EntryCardProps> = ({ id, name, isSelected, paddingLeft, onClick }) => {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        paddingLeft: `${paddingLeft}px`,
        marginBottom: '8px',
        cursor: 'pointer',
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        marginRight: '8px',
        flexShrink: 0,
      }}>
        <span style={{
          display: 'inline-block',
          width: '28px',
          height: '1px',
          background: 'rgba(255,255,255,0.6)',
        }} />
        <span style={{
          display: 'inline-block',
          width: '5px',
          height: '5px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.6)',
        }} />
      </div>
      <div
        style={{
          flex: 1,
          padding: '12px 20px',
          background: isSelected ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.85)',
          borderRadius: '24px',
          boxShadow: '0 1px 6px rgba(0,0,0,0.08)',
          transition: 'background 0.2s',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.95)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.background = isSelected ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.85)';
        }}
      >
        <span style={{ color: '#333', fontSize: '15px' }}>{name}</span>
      </div>
    </div>
  );
};

export default EntryCard;
