import React, { useRef, useEffect } from 'react';
import { spacing } from './spacingConfig';

interface EntryCardProps {
  id: string | number;
  name: string;
  isSelected: boolean;
  paddingLeft: number;
  onClick: () => void;
  gap: number;
}

const EntryCard: React.FC<EntryCardProps> = ({ name, isSelected, paddingLeft, onClick, gap }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isSelected && ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [isSelected]);

  return (
    <div
      ref={ref}
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        paddingLeft: `${paddingLeft}px`,
        marginBottom: `${gap}px`,
        cursor: 'pointer',
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        marginRight: '10px',
        flexShrink: 0,
      }}>
        <span style={{
          display: 'inline-block',
          width: '30px',
          height: '1px',
          background: 'rgba(255,255,255,1)',
        }} />
        <span style={{
          display: 'inline-block',
          width: '3px',
          height: '4px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,1)',
        }} />
      </div>
      <div
        style={{
          padding: '9px 28px',
          width: '365px',
          height: '49px',
          minWidth: '365px',
          background: isSelected ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,1)',
          borderRadius: '24px',
          boxShadow: spacing.entryShadow,
        }}
      >
        <span style={{ color: '#26272e', fontSize: '19px', fontWeight: 400 }}>{name}</span>
      </div>
    </div>
  );
};

export default EntryCard;