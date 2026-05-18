import React from 'react';

interface BackArrowProps {
  color?: string;
  size?: number;
  className?: string;
}

const BackArrow: React.FC<BackArrowProps> = ({ color = 'currentColor', size = 24, className }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M15 18L9 12L15 6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default BackArrow;