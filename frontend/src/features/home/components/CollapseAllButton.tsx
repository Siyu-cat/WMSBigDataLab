import React from 'react';

interface CollapseAllButtonProps {
  isMobile: boolean;
  onClick: () => void;
}

const CollapseAllButton: React.FC<CollapseAllButtonProps> = ({ isMobile, onClick }) => {
  if (isMobile) {
    return (
      <div style={{
        padding: '20px 0',
        display: 'flex',
        justifyContent: 'flex-end',
      }}>
        <button
          onClick={onClick}
          style={{
            padding: '10px 24px',
            background: 'rgba(50,50,50,0.75)',
            color: '#fff',
            border: 'none',
            borderRadius: '20px',
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(50,50,50,0.9)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(50,50,50,0.75)'; }}
        >全部收起</button>
      </div>
    );
  }

  return (
    <div style={{
      padding: '16px',
      display: 'flex',
      justifyContent: 'center',
    }}>
      <button
        onClick={onClick}
        style={{
          padding: '10px 24px',
          background: 'rgba(50,50,50,0.75)',
          color: '#fff',
          border: 'none',
          borderRadius: '20px',
          fontSize: '14px',
          cursor: 'pointer',
          transition: 'background 0.2s',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(50,50,50,0.9)'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(50,50,50,0.75)'; }}
      >全部收起</button>
    </div>
  );
};

export default CollapseAllButton;
