import { useState, useEffect } from 'react';

export type DeviceType = 'mobile' | 'desktop';

function getScale(width: number): number {
  if (width <= 480) return 0.72;
  if (width <= 768) return 0.85;
  return 1;
}

export function useResponsive() {
  const [deviceType, setDeviceType] = useState<DeviceType>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth <= 768 ? 'mobile' : 'desktop';
    }
    return 'desktop';
  });

  const [scale, setScale] = useState(() => getScale(window.innerWidth));

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      setDeviceType(w <= 768 ? 'mobile' : 'desktop');
      setScale(getScale(w));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    scale,
    deviceType,
    isMobile: deviceType === 'mobile',
    isDesktop: deviceType === 'desktop',
  };
}
