import React, { useState, useEffect } from 'react';
import { Deus, Ramo, Poder } from '../types';
import { INITIAL_DEUSES } from '../data/defaultData';
import { matchesAnySearchQuery } from '../utils/textUtils';
import { getEffectivePowerType } from '../utils/calculator';
import { PowerIcon } from './PowerIcon';
import { GameIcon } from './GameIcon';
import { 
  Shield, 
  Search,
  Swords,
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface PowerTreeCalculatorProps {
  deuses: Deus[];
  ramos: Ramo[];
  poderes: Poder[];
  onOpenCreateSheetWithDeus?: (deusId: string) => void;
}

export const PowerTreeCalculator: React.FC<PowerTreeCalculatorProps> = ({
  deuses,
  ramos,
  poderes,
  onOpenCreateSheetWithDeus
}) => {
  // Selected God ID for viewing
  const [selectedDeusId, setSelectedDeusId] = useState<string>(() => deuses[0]?.id || 'poseidon');
  const [searchDeusQuery, setSearchDeusQuery] = useState<string>('');
  const [searchPowerQuery, setSearchPowerQuery] = useState<string>('');
  const [activeBranchTab, setActiveBranchTab] = useState<string>('all');

  const selectedDeus = deuses.find((d) => d.id === selectedDeusId) || deuses[0] || INITIAL_DEUSES[0] || {
    id: 'poseidon',
    nome_grego_romano: 'Poseidon / Netuno',
    cor_hex: '#0ea5e9',
    atributos_principais: 'Natureza / Força',
    descricao: 'Senhor dos Mares'
  };

  const defaultGod = INITIAL_DEUSES.find((initD) => initD.id === selectedDeus?.id) || 
    INITIAL_DEUSES.find((initD) => selectedDeus?.nome_grego_romano && String(selectedDeus.nome_grego_romano).toLowerCase().includes(initD.id));
  const godIcon = (selectedDeus?.icone_css || selectedDeus?.simbolo || defaultGod?.icone_css || defaultGod?.simbolo || '').trim();
  const godColor = selectedDeus?.cor_hex || defaultGod?.cor_hex || '#3b82f6';
  const godRamos = ramos.filter((r) => r.deus_id === selectedDeus?.id);
  const godBranchIds = new Set(godRamos.map((r) => r.id));
  const godPoderes = poderes.filter((p) => godBranchIds.has(p.ramo_id));

  // Dynamically update the CSS variable for the scrollbars and accents
  useEffect(() => {
    if (godColor) {
      document.documentElement.style.setProperty('--god-color', godColor);
    }
  }, [godColor]);

  // Branch Sorting
  const branchOrderMap: Record<string, number> = { tronco: 0, ramo1: 1, ramo2: 2, ramo3: 3 };
  const sortedGodRamos = [...godRamos].sort((a, b) => {
    const oA = branchOrderMap[a.tipo] ?? 99;
    const oB = branchOrderMap[b.tipo] ?? 99;
    return oA - oB;
  });

  const filteredDeuses = [...deuses]
    .filter((d) => {
      return matchesAnySearchQuery(
        [d.nome_grego_romano, d.atributos_principais],
        searchDeusQuery
      );
    })
    .sort((a, b) => a.nome_grego_romano.localeCompare(b.nome_grego_romano, 'pt-BR'));

  const displayedRamos = activeBranchTab === 'all'
    ? sortedGodRamos
    : sortedGodRamos.filter((r) => r.tipo === activeBranchTab || r.id === activeBranchTab);

  return (
    <div className="flex-1 flex flex-col space-y-6 pb-12 w-full">
      
      {/* ========================================================================= */}
      {/* DEITY SELECTOR CAROUSEL / GRID                                           */}
      {/* ========================================================================= */}
      <div className="bg-[var(--fundo2)] border border-[var(--bordadg)] rounded-2xl p-4 sm:p-5 shadow-xl space-y-4 transition-colors">
        
        {/* Selector Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--bordadg)]">
          <div>
            <h2 className="text-lg sm:text-xl md:text-2xl font-cinzel font-bold text-[var(--ctexto1)] tracking-wide">
              Poderes e Habilidades Divinas
            </h2>
            <p className="text-xs text-[var(--ctexto2)] mt-0.5">
              Consulte a árvore mitológica e selecione uma divindade para explorar suas linhagens
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Search Input for Deuses */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[var(--ctexto2)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchDeusQuery}
                onChange={(e) => setSearchDeusQuery(e.target.value)}
                placeholder="Buscar divindade..."
                className="pl-8 pr-3 py-1.5 bg-[var(--fundo1)] border border-[var(--bordadg)] rounded-xl text-xs text-[var(--ctexto1)] placeholder-[var(--ctexto2)] focus:outline-none focus:border-blue-500 w-48 sm:w-56"
              />
            </div>
          </div>
        </div>

        {/* Deity Badges Wrapped Grid */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {filteredDeuses.map((d) => {
            const isSelected = d.id === selectedDeusId;
            const cardColor = d.cor_hex || '#3b82f6';

            return (
              <button
                key={d.id}
                type="button"
                id={`deus-select-${d.id}`}
                onClick={() => {
                  setSelectedDeusId(d.id);
                  setActiveBranchTab('all');
                }}
                className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 border cursor-pointer ${
                  isSelected
                    ? 'bg-[var(--fundo3)] text-[var(--ctexto1)] shadow-lg'
                    : 'bg-[var(--fundo1)] text-[var(--ctexto2)] hover:text-[var(--ctexto1)] hover:bg-[var(--fundo3)] border-[var(--bordadg)]'
                }`}
                style={{
                  borderColor: isSelected ? cardColor : undefined,
                  boxShadow: isSelected ? `0 0 15px 0 ${cardColor}30` : undefined
                }}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: cardColor }}
                />
                <span className="font-medium whitespace-nowrap">
                  {d.nome_grego_romano}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SELECTED DEITY BANNER & QUICK ACTIONS                                     */}
      {/* ========================================================================= */}
      <div 
        className="rounded-2xl border p-5 sm:p-6 shadow-xl relative overflow-hidden transition-all bg-[var(--fundo2)]"
        style={{
          borderColor: `${godColor}40`,
          boxShadow: `0 8px 30px 0 ${godColor}15`
        }}
      >
        {/* Background glow accent */}
        <div 
          className="absolute -right-20 -top-20 w-64 h-64 rounded-full blur-3xl opacity-15 pointer-events-none"
          style={{ backgroundColor: godColor }}
        />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          
          {/* Left group: Deity Icon & Info */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5 max-w-3xl">
            {/* Deity Icon */}
            {godIcon && (
              <div 
                className="shrink-0 select-none pointer-events-none flex items-center justify-center transition-all"
                style={{ color: godColor, opacity: 0.75 }}
                aria-hidden="true"
              >
                <GameIcon 
                  icon={godIcon} 
                  className="text-5xl sm:text-6xl md:text-7xl leading-none drop-shadow-md" 
                />
              </div>
            )}

            {/* Deity Info */}
            <div className="space-y-2">
              <div className="flex items-center flex-wrap gap-2.5">
                <h1 className="font-cinzel text-xl sm:text-2xl font-bold text-[var(--ctexto1)] tracking-wide">
                  {selectedDeus.nome_grego_romano}
                </h1>
                {selectedDeus.titulo_mitologico && (
                  <span 
                    className="px-2.5 py-0.5 rounded-full text-xs font-cinzel font-semibold border"
                    style={{
                      backgroundColor: `${godColor}15`,
                      borderColor: `${godColor}40`,
                      color: godColor
                    }}
                  >
                    {selectedDeus.titulo_mitologico}
                  </span>
                )}
              </div>

              <p className="text-xs sm:text-sm text-[var(--ctexto2)] leading-relaxed text-justify whitespace-pre-line break-words">
                {selectedDeus.descricao || 'Árvore de poderes e aptidões mitológicas exclusivas dos semideuses desta linhagem.'}
              </p>

              <div className="flex items-center flex-wrap gap-4 pt-1 text-xs text-[var(--ctexto2)]">
                {selectedDeus.atributos_principais && (
                  <div className="flex items-center gap-1.5 font-medium">
                    <Shield className="w-3.5 h-3.5 shrink-0" style={{ color: godColor }} />
                    <span>Atributos Principais: <strong className="text-[var(--ctexto1)] ml-1">{selectedDeus.atributos_principais}</strong></span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Button: Create Sheet with This God */}
          {onOpenCreateSheetWithDeus && (
            <div className="shrink-0">
              <button
                type="button"
                id="btn-create-sheet-with-god"
                onClick={() => onOpenCreateSheetWithDeus(selectedDeus.id)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer uppercase tracking-wider"
                style={{
                  backgroundColor: godColor,
                  boxShadow: `0 4px 15px 0 ${godColor}40`
                }}
              >
                <Swords className="w-4 h-4" />
                <span>Criar Ficha com este Deus</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

        </div>
      </div>

      {/* ========================================================================= */}
      {/* BRANCH TABS & POWERS SEARCH                                              */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        
        {/* Branch Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveBranchTab('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 border ${
              activeBranchTab === 'all'
                ? 'bg-[var(--fundo3)] text-[var(--ctexto1)] border-[var(--bordadg)] shadow-md'
                : 'bg-[var(--fundo2)] text-[var(--ctexto2)] hover:text-[var(--ctexto1)] border-[var(--bordadg)]'
            }`}
          >
            Todos os Ramos ({godPoderes.length})
          </button>

          {sortedGodRamos.map((r) => {
            const isActive = activeBranchTab === r.tipo || activeBranchTab === r.id;
            const count = godPoderes.filter((p) => p.ramo_id === r.id).length;
            const label = r.tipo === 'tronco' ? 'Tronco' : r.nome;

            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setActiveBranchTab(r.tipo)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 border flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-[var(--fundo3)] text-[var(--ctexto1)] border-[var(--bordadg)] shadow-md'
                    : 'bg-[var(--fundo2)] text-[var(--ctexto2)] hover:text-[var(--ctexto1)] border-[var(--bordadg)]'
                }`}
              >
                <span>{label}</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-[var(--fundo1)] text-[var(--ctexto2)]">
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Powers Keyword Filter */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[var(--ctexto2)] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchPowerQuery}
            onChange={(e) => setSearchPowerQuery(e.target.value)}
            placeholder="Filtrar poderes e efeitos..."
            className="pl-8 pr-3 py-1.5 bg-[var(--fundo1)] border border-[var(--bordadg)] rounded-xl text-xs text-[var(--ctexto1)] placeholder-[var(--ctexto2)] focus:outline-none focus:border-blue-500 w-full sm:w-64"
          />
        </div>

      </div>

      {/* ========================================================================= */}
      {/* POWER CARDS BY BRANCH                                                    */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col space-y-8 w-full min-h-[500px]">
        {displayedRamos.map((ramo) => {
          let branchPowers = godPoderes
            .filter((p) => p.ramo_id === ramo.id)
            .sort((a, b) => a.numero - b.numero);

          if (searchPowerQuery.trim()) {
            branchPowers = branchPowers.filter((p) => 
              matchesAnySearchQuery(
                [
                  p.nome,
                  p.descricao_base,
                  p.nivel_1_desc,
                  p.nivel_2_desc,
                  p.nivel_3_desc
                ],
                searchPowerQuery
              )
            );
          }

          const isTronco = ramo.tipo === 'tronco';

          return (
            <div key={ramo.id} className="flex-1 flex flex-col space-y-4">
              
              {/* Branch Header */}
              <div className="flex items-center justify-between pb-2 border-b border-[var(--bordadg)]">
                <div className="flex items-center gap-2.5">
                  <div 
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: godColor }}
                  />
                  <div>
                    <h3 className="font-cinzel text-sm sm:text-base font-bold text-[var(--ctexto1)]">
                      {isTronco ? 'Tronco Principal' : ramo.nome}
                    </h3>
                  </div>
                </div>

                <span className="text-xs font-mono text-[var(--ctexto2)]">
                  {branchPowers.length} {branchPowers.length === 1 ? 'poder' : 'poderes'}
                </span>
              </div>

              {/* Powers Grid */}
              {branchPowers.length === 0 ? (
                <div className="p-6 text-center bg-[var(--fundo2)] border border-[var(--bordadg)] rounded-xl text-xs text-[var(--ctexto2)]">
                  Nenhum poder encontrado com o filtro atual.
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 flex-1 items-stretch">
                  {branchPowers.map((poder) => {
                    return (
                      <div
                        key={poder.id}
                        className="flex flex-col justify-between h-full bg-[var(--fundo2)] border border-[var(--bordadg)] hover:border-[var(--god-color)] rounded-2xl p-5 space-y-4 transition-all shadow-sm"
                      >
                        {/* Top: 75x75 Showcase & Power Header Details */}
                        <div className="flex items-center gap-3.5">
                          
                          {/* 75x75 Skill Artwork / Icon Frame */}
                          <div 
                            className="w-[75px] h-[75px] min-w-[75px] max-w-[75px] rounded-xl flex items-center justify-center shrink-0 border shadow-md overflow-hidden bg-[var(--fundo1)] transition-transform hover:scale-[1.02]"
                            style={{ 
                              backgroundColor: `${godColor}15`,
                              borderColor: `${godColor}45`,
                              color: godColor,
                              boxShadow: `0 4px 12px -2px ${godColor}25`
                            }}
                          >
                            <PowerIcon 
                              name={poder.icone_url || 'zap'} 
                              godColor={godColor}
                              className="w-full h-full object-cover" 
                              size={32} 
                            />
                          </div>

                          {/* Header Info */}
                          <div className="flex-1 min-w-0">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span 
                                  className="px-2 py-0.5 rounded-lg text-xs font-mono font-bold tracking-tight border shrink-0 shadow-sm"
                                  style={{
                                    backgroundColor: `${godColor}18`,
                                    borderColor: `${godColor}45`,
                                    color: godColor
                                  }}
                                >
                                  #{poder.numero}
                                </span>
                                <h4 className="font-cinzel text-base sm:text-lg font-bold text-[var(--ctexto1)] leading-tight">
                                  {poder.nome}
                                </h4>
                                
                                {/* Ativo / Passivo Tag */}
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold tracking-wide uppercase border shrink-0 ${
                                  getEffectivePowerType(poder) === 'ativo'
                                    ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                                    : 'bg-sky-500/15 text-sky-400 border-sky-500/30'
                                }`}>
                                  {getEffectivePowerType(poder) === 'ativo' ? 'Ativo' : 'Passivo'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Description */}
                        {poder.descricao_base && (
                          <div className="p-3 bg-[var(--fundo1)] rounded-xl border border-[var(--bordadg)] text-xs text-[var(--ctexto2)] leading-relaxed text-justify whitespace-pre-line break-words">
                            <strong className="text-[var(--ctexto1)] block mb-1 text-[10px] uppercase tracking-wider font-mono">
                              Descrição:
                            </strong>
                            {poder.descricao_base}
                          </div>
                        )}

                        {/* Levels Progression (Nível 1, Nível 2, Nível 3) */}
                        <div className="space-y-2 pt-1 border-t border-[var(--bordadg)]">
                          
                          {/* Nível 1 */}
                          {poder.nivel_1_desc && (
                            <div className="p-2.5 bg-[var(--fundo1)] rounded-xl border border-[var(--bordadg)] text-xs leading-relaxed">
                              <span className="text-[10px] font-mono font-bold text-blue-500 uppercase tracking-wider block mb-0.5">
                                Nível 1
                              </span>
                              <p className="text-[var(--ctexto1)] text-justify whitespace-pre-line break-words">{poder.nivel_1_desc}</p>
                            </div>
                          )}

                          {/* Nível 2 */}
                          {poder.nivel_2_desc && (
                            <div className="p-2.5 bg-[var(--fundo1)] rounded-xl border border-[var(--bordadg)] text-xs leading-relaxed">
                              <span className="text-[10px] font-mono font-bold text-purple-500 uppercase tracking-wider block mb-0.5">
                                Nível 2
                              </span>
                              <p className="text-[var(--ctexto1)] text-justify whitespace-pre-line break-words">{poder.nivel_2_desc}</p>
                            </div>
                          )}

                          {/* Nível 3 */}
                          {poder.nivel_3_desc && (
                            <div className="p-2.5 bg-[var(--fundo1)] rounded-xl border border-[var(--bordadg)] text-xs leading-relaxed">
                              <span className="text-[10px] font-mono font-bold text-amber-500 uppercase tracking-wider block mb-0.5">
                                Nível 3
                              </span>
                              <p className="text-[var(--ctexto1)] text-justify whitespace-pre-line break-words">{poder.nivel_3_desc}</p>
                            </div>
                          )}

                        </div>

                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          );
        })}
      </div>

    </div>
  );
};
