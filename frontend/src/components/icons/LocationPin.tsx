import React from 'react';

interface LocationPinProps {
  color?: string;
  size?: number;
  className?: string;
}

const LocationPin: React.FC<LocationPinProps> = ({ color = 'currentColor', size = 24, className }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 1024 1024"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M801.28 424.96c0-151.04-122.88-273.92-273.92-273.92-151.04 0-273.92 122.88-273.92 273.92 0 56.32 15.36 107.52 43.52 151.04l204.8 327.68c5.12 10.24 12.8 15.36 25.6 15.36 10.24 0 20.48-5.12 25.6-15.36l204.8-327.68c28.16-46.08 43.52-97.28 43.52-151.04m-273.92-125.44c69.12 0 125.44 56.32 125.44 125.44s-56.32 125.44-125.44 125.44-125.44-56.32-125.44-125.44 56.32-125.44 125.44-125.44m0 0z"
        fill={color}
      />
    </svg>
  );
};

export default LocationPin;