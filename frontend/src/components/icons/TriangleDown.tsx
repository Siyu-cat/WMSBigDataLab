import React from 'react';

interface TriangleDownProps {
  color?: string;
  size?: number;
  className?: string;
}

const TriangleDown: React.FC<TriangleDownProps> = ({ color = 'currentColor', size = 12, className }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M2 4L6 9L10 4H2Z"
        fill={color}
      />
    </svg>
  );
};

export default TriangleDown;