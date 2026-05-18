import React from 'react';

interface SearchIconProps {
  color?: string;
  size?: number;
  className?: string;
}

const SearchIcon: React.FC<SearchIconProps> = ({ color = 'currentColor', size = 20, className }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="11"
        cy="11"
        r="7"
        stroke={color}
        strokeWidth="2"
      />
      <path
        d="M16 16L20 20"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
};

export default SearchIcon;