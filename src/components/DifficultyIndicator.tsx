import React from 'react';

export interface DifficultyIndicatorProps {
  level?: number | string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  fullLabel?: boolean;
  className?: string;
}

/**
  * Safely parses difficulty level into 1 (Easy), 2 (Medium), or 3 (Hard)
  */
export function parseDifficulty(val?: number | string): 1 | 2 | 3 {
  if (val === undefined || val === null || val === '') return 1;
  if (typeof val === 'number') {
    if (val >= 3) return 3;
    if (val === 2) return 2;
    return 1;
  }
  const str = String(val).toLowerCase().trim();
  if (str === '3' || str.includes('dif') || str.includes('alt') || str.includes('hard') || str.includes('alto')) return 3;
  if (str === '2' || str.includes('med') || str.includes('méd') || str.includes('interm')) return 2;
  return 1;
}

export const DifficultyIndicator: React.FC<DifficultyIndicatorProps> = ({
  level,
  size = 'md',
  showLabel = false,
  fullLabel = false,
  className = ''
}) => {
  const diff = parseDifficulty(level);

  const levelConfigs = {
    1: {
      activeColor: 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]',
      textColor: 'text-emerald-400',
      shortLabel: 'Fácil',
      fullLabel: 'Dificuldade Fácil',
    },
    2: {
      activeColor: 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.5)]',
      textColor: 'text-amber-400',
      shortLabel: 'Médio',
      fullLabel: 'Dificuldade Média',
    },
    3: {
      activeColor: 'bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.5)]',
      textColor: 'text-rose-400',
      shortLabel: 'Difícil',
      fullLabel: 'Dificuldade Difícil',
    },
  };

  const current = levelConfigs[diff];
  const displayLabel = fullLabel ? current.fullLabel : current.shortLabel;

  // Specific dimensions for small, medium, and large modes
  const sizeStyles = {
    sm: {
      barWidth: 'w-[3px]',
      heights: ['h-[5px]', 'h-[8px]', 'h-[11px]'],
      gap: 'gap-[2px]',
      fontSize: 'text-[9px]',
      padding: 'px-1.5 py-0.5',
      containerHeight: 'h-3.5'
    },
    md: {
      barWidth: 'w-1', // 4px
      heights: ['h-1.5', 'h-2.5', 'h-3.5'], // 6px, 10px, 14px
      gap: 'gap-0.5',
      fontSize: 'text-[11px]',
      padding: 'px-2 py-0.5',
      containerHeight: 'h-4'
    },
    lg: {
      barWidth: 'w-1.5', // 6px
      heights: ['h-2', 'h-3.5', 'h-4.5'], // 8px, 14px, 18px
      gap: 'gap-1',
      fontSize: 'text-xs',
      padding: 'px-2.5 py-1',
      containerHeight: 'h-5'
    },
  }[size];

  return (
    <div
      className={`inline-flex items-center gap-1.5 ${sizeStyles.padding} rounded-md bg-[var(--fundo1)]/90 border border-[var(--bordadg)] shrink-0 select-none ${className}`}
      title={`Dificuldade de Jogabilidade: Nível ${diff} (${current.shortLabel})`}
    >
      {/* Wifi / Signal strength indicator bars */}
      <div className={`flex items-end ${sizeStyles.gap} ${sizeStyles.containerHeight}`}>
        <span
          className={`${sizeStyles.barWidth} ${sizeStyles.heights[0]} rounded-xs transition-all duration-300 ${
            diff >= 1 ? current.activeColor : 'bg-[var(--ctexto2)]/20'
          }`}
        />
        <span
          className={`${sizeStyles.barWidth} ${sizeStyles.heights[1]} rounded-xs transition-all duration-300 ${
            diff >= 2 ? current.activeColor : 'bg-[var(--ctexto2)]/20'
          }`}
        />
        <span
          className={`${sizeStyles.barWidth} ${sizeStyles.heights[2]} rounded-xs transition-all duration-300 ${
            diff >= 3 ? current.activeColor : 'bg-[var(--ctexto2)]/20'
          }`}
        />
      </div>

      {showLabel && (
        <span className={`font-mono font-bold uppercase tracking-wider ${sizeStyles.fontSize} ${current.textColor}`}>
          {displayLabel}
        </span>
      )}
    </div>
  );
};
