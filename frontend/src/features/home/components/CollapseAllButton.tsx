import React from 'react';
import { spacing } from './spacingConfig';
import { useResponsive } from '../../../hooks/useResponsive';

interface CollapseAllButtonProps {
  isMobile: boolean;
  onClick: () => void;
}

const CollapseAllButton: React.FC<CollapseAllButtonProps> = ({ isMobile, onClick }) => {
  const { scale } = useResponsive();

  if (isMobile) {
    return (
      <div style={{
        padding: `${18 * scale}px ${22 * scale}px ${18 * scale}px ${16 * scale}px`,
        display: 'flex',
        justifyContent: 'flex-end',
        borderTop: '1px solid rgba(255,255,255,0.3)',
      }}>
        <button
          onClick={onClick}
          style={{
            padding: `${10 * scale}px ${20 * scale}px`,
            background: 'rgba(53,54,59,1)',
            color: '#fff',
            border: 'none',
            borderRadius: `${24 * scale}px`,
            fontSize: `${18 * scale}px`,
            fontWeight: 350,
            cursor: 'pointer',
            boxShadow: spacing.buttonShadow,
          }}
        >全部收起</button>
      </div>
    );
  }

  return (
    <div style={{
      padding: '18px',
      display: 'flex',
      justifyContent: 'flex-end',
      paddingRight: '30px',
      borderTop: '1px solid rgba(255,255,255,0.3)',
    }}>
      <button
        onClick={onClick}
        style={{
          padding: '10px 20px',
          background: 'rgba(53,54,59,1)',
          color: '#fff',
          border: 'none',
          borderRadius: '24px',
          fontSize: '18px',
          fontWeight: 350,
          cursor: 'pointer',
          boxShadow: spacing.buttonShadow,
        }}
      >全部收起</button>
    </div>
  );
};

export default CollapseAllButton;
