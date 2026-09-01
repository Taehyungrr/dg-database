import React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
}

export const HornedDemonIcon: React.FC<IconProps> = ({ 
  size = 24, 
  className = '', 
  style, 
  strokeWidth = 2,
  ...props 
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      {...props}
    >
      {/* Left Horn */}
      <path d="M 7 9 C 5 5 2.5 4 2 2 C 2.5 5.5 5 8 7 10" />
      {/* Right Horn */}
      <path d="M 17 9 C 19 5 21.5 4 22 2 C 21.5 5.5 19 8 17 10" />
      
      {/* Head / Face Contour */}
      <path d="M 7 10 C 6.5 14 8 18 12 21 C 16 18 17.5 14 17 10" />
      
      {/* Forehead Brow Crest */}
      <path d="M 7 10 Q 12 12.5 17 10" />
      
      {/* Fierce Demon Eyes */}
      <path d="M 8.5 13.5 L 10.5 14.5" />
      <path d="M 15.5 13.5 L 13.5 14.5" />
      
      {/* Snout / Muzzle & Fangs */}
      <path d="M 10 17 Q 12 16 14 17" />
      <path d="M 10.5 17 L 11 18.5" />
      <path d="M 13.5 17 L 13 18.5" />
    </svg>
  );
};
