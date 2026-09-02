import React, { useState, useEffect } from 'react';
import { FichaPersonagem, AtributosPersonagem } from '../types';
import { 
  Sparkles, 
  TrendingUp, 
  User, 
  Award, 
  CheckCircle2, 
  RotateCcw, 
  Shield, 
  Zap, 
  Heart, 
  Activity, 
  ChevronRight,
  ArrowRight,
  Save
} from 'lucide-react';

interface EvolutionViewProps {
  sheets: FichaPersonagem[];
  onUpdateSheet?: (updatedSheet: FichaPersonagem) => void;
  hideHeader?: boolean;
  selectedSheetId?: string;
  onSelectSheetId?: (id: string) => void;
}

export const EvolutionView: React.FC<EvolutionViewProps> = ({
  sheets,
  onUpdateSheet,
  hideHeader = false,
  selectedSheetId: externalSelectedSheetId,
  onSelectSheetId: externalOnSelectSheetId
}) => {
  const [internalSelectedSheetId, setInternalSelectedSheetId] = useState<string>('');

  const selectedSheetId = externalSelectedSheetId !== undefined ? externalSelectedSheetId : internalSelectedSheetId;
  const setSelectedSheetId = (id: string) => {
    if (externalOnSelectSheetId) {
      externalOnSelectSheetId(id);
    } else {
      setInternalSelectedSheetId(id);
    }
  };

  // Evolution Fields
  const [nivelAtual, setNivelAtual] = useState<number | string>(1);
  const [expAtual, setExpAtual] = useState<number | string>(0);
  const [expGanha, setExpGanha] = useState<number | string>(0);

  // Status Attributes
  const [forca, setForca] = useState<number | string>(1);
  const [vigorStat, setVigorStat] = useState<number | string>(1);
  const [magia, setMagia] = useState<number | string>(1);
  const [espiritualidade, setEspiritualidade] = useState<number | string>(1);

  // Helper numeric values
  const nNivelAtual = Math.max(1, typeof nivelAtual === 'number' ? nivelAtual : (parseInt(nivelAtual, 10) || 1));
  const nExpAtual = Math.max(0, typeof expAtual === 'number' ? expAtual : (parseInt(expAtual, 10) || 0));
  const nExpGanha = Math.max(0, typeof expGanha === 'number' ? expGanha : (parseInt(expGanha, 10) || 0));

  const nForca = Math.min(5, Math.max(1, typeof forca === 'number' ? forca : (parseInt(forca, 10) || 1)));
  const nVigorStat = Math.min(5, Math.max(1, typeof vigorStat === 'number' ? vigorStat : (parseInt(vigorStat, 10) || 1)));
  const nMagia = Math.min(5, Math.max(1, typeof magia === 'number' ? magia : (parseInt(magia, 10) || 1)));
  const nEspiritualidade = Math.min(5, Math.max(1, typeof espiritualidade === 'number' ? espiritualidade : (parseInt(espiritualidade, 10) || 1)));

  // Success Feedback Toast
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Sync selected character sheet
  useEffect(() => {
    if (!selectedSheetId) return;
    const sheet = sheets.find((s) => s.id === selectedSheetId);
    if (!sheet) return;

    setNivelAtual(sheet.nivel || 1);
    setExpAtual(sheet.exp || 0);
    setForca(Math.min(5, Math.max(1, sheet.atributos.forca || 1)));
    setVigorStat(Math.min(5, Math.max(1, sheet.atributos.constituicao || 1)));
    setMagia(Math.min(5, Math.max(1, sheet.atributos.magia || 1)));
    setEspiritualidade(Math.min(5, Math.max(1, sheet.atributos.espiritualidade || 1)));
  }, [selectedSheetId, sheets]);

  // Status calculation helper
  const calcularValoresStatus = (nivel: number, str: number, con: number, mag: number, spi: number) => {
    const base = 100 + 10 * nivel;
    return {
      vida: base + Math.max(0, con - 1) * 25,
      vigor: base + Math.max(0, str - 1) * 25,
      mana: base + (Math.max(0, mag - 1) + Math.max(0, spi - 1)) * 25
    };
  };

  // Evolution Calculation Logic
  let nivelFinal = nNivelAtual;
  let expTemp = nExpAtual + nExpGanha;
  const nivelInicial = nNivelAtual;

  while (expTemp >= nivelFinal * 100) {
    expTemp -= nivelFinal * 100;
    nivelFinal++;
  }

  const expNecessariaAtual = nNivelAtual * 100;
  const pctExpAtual = Math.min(100, Math.round((nExpAtual / expNecessariaAtual) * 100));

  const expNecessariaFinal = nivelFinal * 100;
  const pctExpFinal = Math.min(100, Math.round((expTemp / expNecessariaFinal) * 100));

  const ganhosNivel = nivelFinal - nivelInicial;
  const ganhosTexto = `+${ganhosNivel} níveis, +${ganhosNivel * 10} vida, +${ganhosNivel * 10} mana, +${ganhosNivel * 10} vigor`;

  const statusAtual = calcularValoresStatus(nivelInicial, nForca, nVigorStat, nMagia, nEspiritualidade);
  const statusFinal = calcularValoresStatus(nivelFinal, nForca, nVigorStat, nMagia, nEspiritualidade);

  // Handler to apply evolution directly to the selected character sheet
  const handleApplyToSheet = () => {
    if (!selectedSheetId || !onUpdateSheet) return;
    const sheet = sheets.find((s) => s.id === selectedSheetId);
    if (!sheet) return;

    const updatedSheet: FichaPersonagem = {
      ...sheet,
      nivel: nivelFinal,
      exp: expTemp,
      atualizado_em: new Date().toISOString()
    };

    onUpdateSheet(updatedSheet);
    setSaveToast(`Evolução salva na ficha de ${sheet.nome}! Nível ${nivelFinal}`);
    setTimeout(() => setSaveToast(null), 3500);
  };

  const selectedSheet = sheets.find((s) => s.id === selectedSheetId);

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      
      {/* HEADER */}
      {!hideHeader && (
        <div className="bg-[var(--fundo2)] rounded-2xl p-4 sm:p-6 border border-[var(--bordadg)] shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-cinzel text-lg sm:text-xl font-bold text-[var(--ctexto1)] flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                Evolução e Calculadora de EXP
              </h2>
              <p className="text-xs text-[var(--ctexto2)]">
                Acompanhe o ganho de experiência, subida de nível e projeção de atributos do seu semideus.
              </p>
            </div>
          </div>

          {/* Character Sheet Selector */}
          <div className="bg-[var(--fundo3)] p-3 rounded-xl border border-[var(--bordadg)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <User className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-xs font-bold text-[var(--ctexto1)] whitespace-nowrap">Carregar Ficha:</span>
              <select
                value={selectedSheetId}
                onChange={(e) => setSelectedSheetId(e.target.value)}
                className="w-full sm:w-64 bg-[var(--fundo1)] px-2.5 py-1.5 rounded-lg text-xs font-bold text-[var(--ctexto1)] border border-[var(--bordadg)] focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="">-- Preenchimento Manual --</option>
                {sheets.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nome} (Nível {s.nivel})
                  </option>
                ))}
              </select>
            </div>

            {selectedSheetId && (
              <button
                type="button"
                onClick={() => setSelectedSheetId('')}
                className="text-xs text-rose-400 hover:text-rose-300 font-semibold cursor-pointer underline flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Limpar Seleção (Modo Manual)</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* SAVE TOAST NOTIFICATION */}
      {saveToast && (
        <div className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 p-3 rounded-xl text-xs font-bold flex items-center gap-2 animate-fadeIn shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* VISUAL EXP PROGRESS BAR (CURRENT STATE) */}
      <div className="bg-[var(--fundo2)] rounded-2xl p-5 border border-[var(--bordadg)] space-y-3">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-[var(--ctexto1)] flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-400" />
            Progresso Atual de EXP (Nível {nivelAtual})
          </span>
          <span className="text-amber-400 font-mono">
            {expAtual} / {expNecessariaAtual} EXP ({pctExpAtual}%)
          </span>
        </div>

        <div className="w-full bg-[var(--fundo1)] h-4 rounded-full overflow-hidden border border-[var(--bordadg)] p-0.5">
          <div
            className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full rounded-full transition-all duration-300"
            style={{ width: `${pctExpAtual}%` }}
          />
        </div>
        <p className="text-[11px] text-[var(--ctexto2)]">
          * Para subir para o nível {nivelAtual + 1}, são necessários {expNecessariaAtual} pontos de EXP.
        </p>
      </div>

      {/* MAIN CARDS GRID: INPUTS & PROJECTION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* CARD 1: INPUTS (NÍVEL, EXP, ATRIBUTOS) */}
        <div className="bg-[var(--fundo2)] rounded-2xl p-5 border border-[var(--bordadg)] space-y-4">
          <h3 className="font-cinzel text-sm font-bold text-[var(--ctexto1)] border-b border-[var(--bordadg)] pb-2">
            Configuração de Experiência
          </h3>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-[var(--ctexto2)] uppercase block mb-1">Nível Atual:</label>
              <input
                type="number"
                min="1"
                max="100"
                value={nivelAtual}
                onFocus={(e) => e.target.select()}
                onChange={(e) => {
                  const v = e.target.value;
                  setNivelAtual(v === '' ? '' : parseInt(v, 10));
                }}
                onBlur={() => {
                  if (nivelAtual === '' || typeof nivelAtual !== 'number' || isNaN(nivelAtual)) {
                    setNivelAtual(1);
                  }
                }}
                className="w-full bg-[var(--fundo3)] px-3 py-2 rounded-xl text-sm font-bold text-[var(--ctexto1)] border border-[var(--bordadg)] focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[var(--ctexto2)] uppercase block mb-1">EXP Atual:</label>
              <input
                type="number"
                min="0"
                value={expAtual}
                onFocus={(e) => e.target.select()}
                onChange={(e) => {
                  const v = e.target.value;
                  setExpAtual(v === '' ? '' : parseInt(v, 10));
                }}
                onBlur={() => {
                  if (expAtual === '' || typeof expAtual !== 'number' || isNaN(expAtual)) {
                    setExpAtual(0);
                  }
                }}
                className="w-full bg-[var(--fundo3)] px-3 py-2 rounded-xl text-sm font-bold text-[var(--ctexto1)] border border-[var(--bordadg)] focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-emerald-400 uppercase block mb-1">EXP Ganha nesta Ação:</label>
              <input
                type="number"
                min="0"
                value={expGanha}
                onFocus={(e) => e.target.select()}
                onChange={(e) => {
                  const v = e.target.value;
                  setExpGanha(v === '' ? '' : parseInt(v, 10));
                }}
                onBlur={() => {
                  if (expGanha === '' || typeof expGanha !== 'number' || isNaN(expGanha)) {
                    setExpGanha(0);
                  }
                }}
                placeholder="Digite os pontos de EXP recebidos"
                className="w-full bg-[var(--fundo3)] px-3 py-2 rounded-xl text-sm font-bold text-emerald-400 border border-emerald-500/40 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          <h4 className="font-cinzel text-xs font-bold text-[var(--ctexto1)] pt-2 border-t border-[var(--bordadg)]">
            Atributos
          </h4>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-[10px] font-bold text-[var(--ctexto2)] uppercase block mb-1">Força:</label>
              <input
                type="number"
                min="1"
                max="5"
                value={forca}
                onFocus={(e) => e.target.select()}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === '') {
                    setForca('');
                  } else {
                    const num = parseInt(v, 10);
                    setForca(isNaN(num) ? 1 : Math.min(5, Math.max(1, num)));
                  }
                }}
                onBlur={() => {
                  if (forca === '' || typeof forca !== 'number' || isNaN(forca) || forca < 1) {
                    setForca(1);
                  } else if (forca > 5) {
                    setForca(5);
                  }
                }}
                className="w-full bg-[var(--fundo3)] px-2.5 py-1.5 rounded-lg text-xs font-bold text-[var(--ctexto1)] border border-[var(--bordadg)] focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-[var(--ctexto2)] uppercase block mb-1">Vigor / Constituição:</label>
              <input
                type="number"
                min="1"
                max="5"
                value={vigorStat}
                onFocus={(e) => e.target.select()}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === '') {
                    setVigorStat('');
                  } else {
                    const num = parseInt(v, 10);
                    setVigorStat(isNaN(num) ? 1 : Math.min(5, Math.max(1, num)));
                  }
                }}
                onBlur={() => {
                  if (vigorStat === '' || typeof vigorStat !== 'number' || isNaN(vigorStat) || vigorStat < 1) {
                    setVigorStat(1);
                  } else if (vigorStat > 5) {
                    setVigorStat(5);
                  }
                }}
                className="w-full bg-[var(--fundo3)] px-2.5 py-1.5 rounded-lg text-xs font-bold text-[var(--ctexto1)] border border-[var(--bordadg)] focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-[var(--ctexto2)] uppercase block mb-1">Magia:</label>
              <input
                type="number"
                min="1"
                max="5"
                value={magia}
                onFocus={(e) => e.target.select()}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === '') {
                    setMagia('');
                  } else {
                    const num = parseInt(v, 10);
                    setMagia(isNaN(num) ? 1 : Math.min(5, Math.max(1, num)));
                  }
                }}
                onBlur={() => {
                  if (magia === '' || typeof magia !== 'number' || isNaN(magia) || magia < 1) {
                    setMagia(1);
                  } else if (magia > 5) {
                    setMagia(5);
                  }
                }}
                className="w-full bg-[var(--fundo3)] px-2.5 py-1.5 rounded-lg text-xs font-bold text-[var(--ctexto1)] border border-[var(--bordadg)] focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-[var(--ctexto2)] uppercase block mb-1">Espiritualidade:</label>
              <input
                type="number"
                min="1"
                max="5"
                value={espiritualidade}
                onFocus={(e) => e.target.select()}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === '') {
                    setEspiritualidade('');
                  } else {
                    const num = parseInt(v, 10);
                    setEspiritualidade(isNaN(num) ? 1 : Math.min(5, Math.max(1, num)));
                  }
                }}
                onBlur={() => {
                  if (espiritualidade === '' || typeof espiritualidade !== 'number' || isNaN(espiritualidade) || espiritualidade < 1) {
                    setEspiritualidade(1);
                  } else if (espiritualidade > 5) {
                    setEspiritualidade(5);
                  }
                }}
                className="w-full bg-[var(--fundo3)] px-2.5 py-1.5 rounded-lg text-xs font-bold text-[var(--ctexto1)] border border-[var(--bordadg)] focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* CARD 2: RESULTADO DA EVOLUÇÃO & PROJEÇÃO DE STATUS */}
        <div className="bg-[var(--fundo2)] rounded-2xl p-5 border border-[var(--bordadg)] space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="font-cinzel text-sm font-bold text-emerald-400 border-b border-[var(--bordadg)] pb-2 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              Resultado da Evolução
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[var(--fundo3)] p-3 rounded-xl border border-[var(--bordadg)]">
                <span className="text-[10px] font-bold text-[var(--ctexto2)] uppercase block mb-1">Nível Final:</span>
                <div className="text-xl font-black text-amber-400 flex items-center gap-1.5">
                  <span>{nivelFinal}</span>
                  {ganhosNivel > 0 && (
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/15 px-1.5 py-0.5 rounded-full">
                      +{ganhosNivel}
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-[var(--fundo3)] p-3 rounded-xl border border-[var(--bordadg)]">
                <span className="text-[10px] font-bold text-[var(--ctexto2)] uppercase block mb-1">EXP Restante:</span>
                <div className="text-xs font-mono font-bold text-emerald-400">
                  {expTemp} / {expNecessariaFinal}
                </div>
              </div>
            </div>

            {/* Summary Tag */}
            <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-xl text-center text-xs font-bold text-emerald-300 shadow-sm">
              ✨ Ganhos: {ganhosTexto}
            </div>

            {/* Status Breakdown (Vida, Mana, Vigor) */}
            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-bold uppercase text-[var(--ctexto1)]">
                Status após evolução
              </h4>

              <div className="space-y-2">
                
                {/* Vida */}
                <div className="bg-[var(--fundo3)] p-2.5 rounded-xl border border-[var(--bordadg)] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-rose-500 shrink-0" />
                    <span className="text-xs font-bold text-[var(--ctexto1)]">Vida</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono font-bold">
                    <span className="text-[var(--ctexto2)]">{statusAtual.vida}</span>
                    <ArrowRight className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">{statusFinal.vida}</span>
                  </div>
                </div>

                {/* Mana */}
                <div className="bg-[var(--fundo3)] p-2.5 rounded-xl border border-[var(--bordadg)] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-blue-500 shrink-0" />
                    <span className="text-xs font-bold text-[var(--ctexto1)]">Mana</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono font-bold">
                    <span className="text-[var(--ctexto2)]">{statusAtual.mana}</span>
                    <ArrowRight className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">{statusFinal.mana}</span>
                  </div>
                </div>

                {/* Vigor */}
                <div className="bg-[var(--fundo3)] p-2.5 rounded-xl border border-[var(--bordadg)] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-amber-500 shrink-0" />
                    <span className="text-xs font-bold text-[var(--ctexto1)]">Vigor</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono font-bold">
                    <span className="text-[var(--ctexto2)]">{statusAtual.vigor}</span>
                    <ArrowRight className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">{statusFinal.vigor}</span>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* SAVE BUTTON IF SHEET SELECTED */}
          {selectedSheetId && onUpdateSheet && (
            <button
              type="button"
              onClick={handleApplyToSheet}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-cinzel text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 mt-4"
            >
              <Save className="w-4 h-4" />
              <span>Aplicar Evolução na Ficha de {selectedSheet?.nome}</span>
            </button>
          )}

        </div>

      </div>

    </div>
  );
};
