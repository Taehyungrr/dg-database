import React from 'react';

interface GameIconProps {
  name?: string;
  icon?: string;
  className?: string;
  style?: React.CSSProperties;
  size?: number | string;
}

export function cleanGameIconCode(name?: string): string {
  if (!name) return '';
  return name
    .trim()
    .replace(/^\./, '')
    .replace(/^game-icon\s+game-icon-/, '')
    .replace(/^game-icon\s+/, '')
    .replace(/^game-icon-/, '')
    .trim();
}

export const GameIcon: React.FC<GameIconProps> = ({ 
  name, 
  icon,
  className = '', 
  style,
  size
}) => {
  const iconCode = cleanGameIconCode(name || icon);
  if (!iconCode) return null;

  const combinedStyle: React.CSSProperties = {
    ...style,
    fontSize: size ? (typeof size === 'number' ? `${size}px` : size) : style?.fontSize,
  };

  return (
    <i 
      className={`game-icon game-icon-${iconCode} inline-block leading-none not-italic select-none ${className}`}
      style={combinedStyle}
      aria-hidden="true"
    />
  );
};
