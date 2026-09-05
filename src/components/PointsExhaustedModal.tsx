import React, { useEffect } from 'react';
import { AlertTriangle, X, Award, ArrowUpCircle } from 'lucide-react';

interface PointsExhaustedModalProps {
  isOpen: boolean;
  onClose: () => void;
  characterLevel: number;
  totalPointsSpent: number;
  pointsNeeded: number;
  onIncreaseLevel?: () => void;
  godColor?: string;
}

export const PointsExhaustedModal: React.FC<PointsExhaustedModalProps> = ({
  isOpen,
  onClose,
  characterLevel,
  totalPointsSpent,
  pointsNeeded,
  onIncreaseLevel,
  godColor = '#ef4444'
}) => {
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-5 bg-black/40 backdrop-blur-sm animate-fadeIn overflow-hidden">
      <div className="relative w-full max-w-md bg-[var(--fundo2)] border border-red-500/50 rounded-2xl shadow-2xl p-6 space-y-5 text-center text-[var(--ctexto1)] max-h-[calc(100vh-2.5rem)] overflow-y-auto">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-[var(--ctexto2)] hover:text-[var(--ctexto1)] rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Warning Icon */}
        <div className="w-14 h-14 rounded-2xl bg-red-950/50 border border-red-500/60 flex items-center justify-center text-red-400 mx-auto shadow-lg shadow-red-950/50">
          <AlertTriangle className="w-7 h-7" />
        </div>

        {/* Title & Message */}
        <div className="space-y-2">
          <h2 className="font-cinzel text-lg font-bold text-[var(--ctexto1)]">
            Pontos de Poder Esgotados!
          </h2>
          <p className="text-xs text-[var(--ctexto2)] leading-relaxed">
            Você já utilizou todos os <span className="font-bold text-[var(--ctexto1)] font-mono">{characterLevel} pontos</span> disponíveis para o seu personagem de <span className="font-bold text-[var(--ctexto1)]">Nível {characterLevel}</span>.
          </p>
        </div>

        {/* Breakdown Card */}
        <div className="bg-[var(--fundo1)] border border-[var(--bordadg)] rounded-xl p-3.5 text-xs font-mono space-y-1.5 text-left">
          <div className="flex justify-between text-[var(--ctexto2)]">
            <span>Pontos Totais Disponíveis:</span>
            <span className="text-[var(--ctexto1)] font-bold">{characterLevel} pts</span>
          </div>
          <div className="flex justify-between text-[var(--ctexto2)]">
            <span>Pontos Atualmente Investidos:</span>
            <span className="text-amber-400 font-bold">{totalPointsSpent} pts</span>
          </div>
          <div className="flex justify-between text-[var(--ctexto2)] pt-1 border-t border-[var(--bordadg)]">
            <span>Pontos Faltantes para Este Poder:</span>
            <span className="text-red-400 font-bold">+{pointsNeeded} pts</span>
          </div>
        </div>

        <p className="text-[11px] text-[var(--ctexto3)] italic">
          Para desbloquear este nível de habilidade, aumente o nível do personagem ou reduza o nível de outro poder adquirido.
        </p>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-2.5 pt-2">
          {onIncreaseLevel && characterLevel < 40 && (
            <button
              type="button"
              onClick={() => {
                onIncreaseLevel();
                onClose();
              }}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-blue-900/30 transition-all cursor-pointer"
            >
              <ArrowUpCircle className="w-4 h-4" />
              <span>Aumentar Nível (+1)</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-[var(--fundo3)] hover:bg-[var(--fundo4)] text-[var(--ctexto1)] rounded-xl text-xs font-bold transition-all cursor-pointer border border-[var(--bordadg)]"
          >
            Entendido
          </button>
        </div>

      </div>
    </div>
  );
};
