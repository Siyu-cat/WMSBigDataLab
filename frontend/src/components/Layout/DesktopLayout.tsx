import React from 'react';
import { Outlet } from 'react-router-dom';
import FloatingBlocks from '../../features/background/FloatingBlocks';

const DesktopLayout: React.FC = () => {
  return (
    <div style={{
      position: 'relative',
      zIndex: 1,
    }}>
      <FloatingBlocks />
      <Outlet />
    </div>
  );
};

export default DesktopLayout;
