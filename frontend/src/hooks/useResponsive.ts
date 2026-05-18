import { useState, useEffect } from 'react';

export type DeviceType = 'mobile' | 'desktop';

export function useResponsive() {
  const [deviceType, setDeviceType] = useState<DeviceType>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth <= 768 ? 'mobile' : 'desktop';
    }
    return 'desktop';
  });

  useEffect(() => {
    const handleResize = () => {
      setDeviceType(window.innerWidth <= 768 ? 'mobile' : 'desktop');
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    deviceType,
    isMobile: deviceType === 'mobile',
    isDesktop: deviceType === 'desktop',
  };
}