import React from 'react';
import { spacing } from './spacingConfig';

interface CollapseAllButtonProps {
  isMobile: boolean;
  onClick: () => void;
}

const CollapseAllButton: React.FC<CollapseAllButtonProps> = ({ isMobile, onClick }) => {
  if (isMobile) {
    return (
      <div style={{
        padding: '18px 22px 18px 16px',
        display: 'flex',
        justifyContent: 'flex-end',
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
