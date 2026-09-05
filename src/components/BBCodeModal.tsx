import React, { useState, useEffect } from 'react';
import { Deus, FichaPersonagem, Poder, Ramo } from '../types';
import { calculateSheetPoints } from '../utils/calculator';
import { generateForumBBCode } from '../utils/bbcode';
import { BBCodeRenderer } from './BBCodeRenderer';
import { X, Copy, Check, Download, FileCode, Eye } from 'lucide-react';

interface BBCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSheet: FichaPersonagem;
  deuses: Deus[];
  ramos: Ramo[];
  poderes: Poder[];
}

export const BBCodeModal: React.FC<BBCodeModalProps> = ({
  isOpen,
  onClose,
  activeSheet,
  deuses,
  ramos,
  poderes
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [previewMode, setPreviewMode] = useState<'raw' | 'preview'>('raw');

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

  const selectedDeus = deuses.find((d) => d.id === activeSheet.deus_id);
  const godRamos = ramos.filter((r) => r.deus_id === selectedDeus?.id);
  const godBranchIds = new Set(godRamos.map((r) => r.id));
  const godPoderes = poderes.filter((p) => godBranchIds.has(p.ramo_id));

  const calcResult = calculateSheetPoints(
    activeSheet.nivel,
    activeSheet.poderes_comprados,
    godPoderes,
    godRamos
  );

  const bbcodeText = generateForumBBCode(
    activeSheet,
    selectedDeus,
    godRamos,
    godPoderes,
    calcResult
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(bbcodeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const blob = new Blob([bbcodeText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Atualizacao_Ficha_${activeSheet.nome.replace(/[^a-z0-9]/gi, '_') || 'Personagem'}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[var(--fundo2)] border border-[var(--bordadg)] w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[var(--bordadg)] flex items-center justify-between bg-[var(--fundo1)]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-900/30 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <FileCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-cinzel font-bold text-sm sm:text-base text-[var(--ctexto1)]">
                BBCode de Atualização de Ficha (Fórum)
              </h3>
              <p className="text-[10px] text-[var(--ctexto2)] uppercase tracking-wider font-mono">
                Formatado exatamente para o tópico de atualização do fórum
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--ctexto2)] hover:text-[var(--ctexto1)] hover:bg-[var(--fundo3)] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action controls */}
        <div className="px-5 py-3 bg-[var(--fundo1)] border-b border-[var(--bordadg)] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPreviewMode('raw')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                previewMode === 'raw'
                  ? 'bg-[var(--fundo3)] text-blue-500 border border-[var(--bordadg)]'
                  : 'text-[var(--ctexto2)] hover:text-[var(--ctexto1)]'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              Código BBCode
            </button>

            <button
              onClick={() => setPreviewMode('preview')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                previewMode === 'preview'
                  ? 'bg-[var(--fundo3)] text-blue-500 border border-[var(--bordadg)]'
                  : 'text-[var(--ctexto2)] hover:text-[var(--ctexto1)]'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              Pré-visualização
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownload}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--fundo3)] hover:bg-[var(--fundo4)] text-[var(--ctexto2)] hover:text-[var(--ctexto1)] border border-[var(--bordadg)] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Baixar .txt</span>
            </button>

            <button
              id="btn-copy-bbcode"
              onClick={handleCopy}
              className="px-4 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 shadow-lg shadow-blue-900/20 transition-all active:scale-95 uppercase tracking-wider cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado!' : 'Copiar BBCode'}</span>
            </button>
          </div>
        </div>

        {/* Content Box */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto bg-[var(--fundo1)]">
          {previewMode === 'raw' ? (
            <textarea
              id="textarea-bbcode-output"
              readOnly
              value={bbcodeText}
              onClick={(e) => (e.target as HTMLTextAreaElement).select()}
              className="w-full h-80 sm:h-96 p-4 bg-[var(--fundo2)] font-mono text-xs text-blue-400 dark:text-blue-300 border border-[var(--bordadg)] rounded-xl focus:outline-none focus:border-blue-500 leading-relaxed selection:bg-blue-600 selection:text-white"
            />
          ) : (
            <div className="p-5 bg-[var(--fundo2)] border border-[var(--bordadg)] rounded-xl space-y-6 text-xs text-[var(--ctexto1)] leading-relaxed font-sans">
              <div>
                <strong className="text-[var(--ctexto1)]">Nome do personagem:</strong> {activeSheet.nome || 'Håkon Varg'}
              </div>

              <div>
                <h4 className="font-bold text-blue-500 mb-2 uppercase text-[11px] tracking-wider">
                  Investimento dos pontos:
                </h4>
                <div className="bg-[var(--fundo1)] p-3.5 rounded-xl border border-[var(--bordadg)] font-mono text-[11px] text-[var(--ctexto2)] space-y-1">
                  {Object.entries(calcResult.powerDetails)
                    .filter(([_, info]) => info.pointsSpentOnThisPower > 0)
                    .map(([pId, info]) => {
                      const p = godPoderes.find((item) => item.id === pId);
                      const r = godRamos.find((ramo) => ramo.id === p?.ramo_id);
                      let rLabel = 'Tronco';
                      if (r?.tipo === 'ramo1') rLabel = 'Ramo 1';
                      else if (r?.tipo === 'ramo2') rLabel = 'Ramo 2';
                      else if (r?.tipo === 'ramo3') rLabel = 'Ramo 3';

                      let lvlText = '';
                      if (info.isFreeLvl1) {
                        if (info.effectiveLevel === 2) lvlText = 'o nível 2';
                        else if (info.effectiveLevel === 3) lvlText = 'os níveis 2 e 3';
                      } else {
                        if (info.effectiveLevel === 1) lvlText = 'o nível 1';
                        else if (info.effectiveLevel === 2) lvlText = 'os níveis 1 e 2';
                        else if (info.effectiveLevel === 3) lvlText = 'os níveis 1, 2 e 3';
                      }

                      return (
                        <div key={pId}>
                          {info.pointsSpentOnThisPower} {info.pointsSpentOnThisPower === 1 ? 'ponto' : 'pontos'} para {lvlText} do poder {p?.nome} ({rLabel})
                        </div>
                      );
                    })}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-blue-500 mb-2 uppercase text-[11px] tracking-wider">
                  Poderes no template:
                </h4>
                <div className="space-y-4">
                  {godRamos.map((r) => {
                    const rPowers = godPoderes.filter((p) => p.ramo_id === r.id && (calcResult.powerDetails[p.id]?.effectiveLevel || 0) > 0);
                    if (rPowers.length === 0) return null;

                    return (
                      <div key={r.id} className="space-y-3">
                        <div className="font-cinzel text-sm font-bold text-blue-500 pb-1 border-b border-[var(--bordadg)]">
                          {r.tipo === 'tronco' ? 'Tronco' : r.nome.toUpperCase()}
                        </div>
                        {rPowers.map((p) => {
                          const eff = calcResult.powerDetails[p.id]?.effectiveLevel || 1;
                          return (
                            <div key={p.id} className="p-3.5 bg-[var(--fundo1)] border border-[var(--bordadg)] rounded-xl space-y-1.5">
                              <div className="font-bold text-[var(--ctexto1)] text-xs">
                                {p.numero}. {p.nome}
                              </div>
                              <div className="text-[11px] text-[var(--ctexto2)]">
                                <strong className="text-[var(--ctexto1)]">Descrição:</strong> <BBCodeRenderer text={p.descricao_base || ''} />
                              </div>
                              {eff >= 1 && (
                                <div className="text-[11px] text-[var(--ctexto1)]">
                                  <strong className="text-blue-500">Nível 1:</strong> <BBCodeRenderer text={p.nivel_1_desc || ''} />
                                </div>
                              )}
                              {eff >= 2 && (
                                <div className="text-[11px] text-[var(--ctexto1)]">
                                  <strong className="text-blue-500">Nível 2:</strong> <BBCodeRenderer text={p.nivel_2_desc || ''} />
                                </div>
                              )}
                              {eff >= 3 && (
                                <div className="text-[11px] text-[var(--ctexto1)]">
                                  <strong className="text-blue-500">Nível 3:</strong> <BBCodeRenderer text={p.nivel_3_desc || ''} />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[var(--bordadg)] bg-[var(--fundo1)] flex items-center justify-between text-xs text-[var(--ctexto2)]">
          <span className="font-mono text-[11px]">{Object.values(activeSheet.poderes_comprados).filter((lvl: number) => lvl > 0).length} poderes investidos ({calcResult.totalPointsSpent} / {calcResult.totalPointsAvailable} pts)</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[var(--fundo3)] hover:bg-[var(--fundo4)] text-[var(--ctexto2)] hover:text-[var(--ctexto1)] transition-colors text-xs font-semibold cursor-pointer"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
