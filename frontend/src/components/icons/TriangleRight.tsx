import React from 'react';

interface TriangleRightProps {
  color?: string;
  size?: number;
  className?: string;
}

const TriangleRight: React.FC<TriangleRightProps> = ({ color = 'currentColor', size = 12, className }) => {
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
        d="M4 2L9 6L4 10V2Z"
        fill={color}
      />
    </svg>
  );
};

export default TriangleRight;