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
      viewBox="0 0 1024 1024"
      fill={color}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M615.958 216.958c13.278-13.277 34.806-13.277 48.084 0 13.145 13.145 13.276 34.376 0.394 47.683l-0.394 0.4L416.083 513l247.959 247.958c13.145 13.145 13.276 34.376 0.394 47.683l-0.394 0.4c-13.145 13.146-34.376 13.277-47.683 0.395l-0.4-0.394-272-272c-13.146-13.145-13.277-34.376-0.395-47.683l0.394-0.4 272-272z" />
    </svg>
  );
};

export default BackArrow;