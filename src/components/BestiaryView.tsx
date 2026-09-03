import React, { useState, useEffect, useMemo } from 'react';
import { Monstro, MonstroPoder, TipoMonstro } from '../types';
import { matchesAnySearchQuery } from '../utils/textUtils';
import { generateMonstroPoderesBBCode } from '../utils/bbcode';
import { BBCodeRenderer } from './BBCodeRenderer';
import { MinotaurIcon } from './icons/MinotaurIcon';
import { 
  Search, 
  Flame, 
  Waves, 
  Mountain, 
  Feather, 
  Eye, 
  Info, 
  Swords, 
  AlertTriangle,
  Compass,
  X,
  Copy,
  Check
} from 'lucide-react';

interface BestiaryViewProps {
  monstros: Monstro[];
  monstroPoderes: MonstroPoder[];
}

interface CategoryFilter {
  id: string;
  name: string;
  color: string;
  icon: React.ElementType;
}

const CATEGORIES: CategoryFilter[] = [
  { id: 'terrestre', name: 'Terrestre', color: '#eab308', icon: Mountain },
  { id: 'voador', name: 'Voador', color: '#38bdf8', icon: Feather },
  { id: 'aquatico', name: 'Aquático', color: '#14b8a6', icon: Waves },
  { id: 'ctonico', name: 'Ctônico', color: '#ef4444', icon: Flame }
];

const DEFAULT_CATEGORY_COLORS: Record<string, string> = {
  terrestre: '#eab308',
  voador: '#38bdf8',
  aquatico: '#14b8a6',
  ctonico: '#ef4444'
};

export const BestiaryView: React.FC<BestiaryViewProps> = ({
  monstros,
  monstroPoderes
}) => {
  // Normalize category string for comparison (e.g. "ctônico" vs "ctonico")
  const normalizeCategory = (cat?: string): string => {
    if (!cat) return 'terrestre';
    return cat
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  };

  // Active Category Filter (Default to 'terrestre')
  const [activeCategory, setActiveCategory] = useState<string>('terrestre');
  
  // Search Queries
  const [searchMonstroQuery, setSearchMonstroQuery] = useState<string>('');
  const [searchPowerQuery, setSearchPowerQuery] = useState<string>('');
  
  // Image error fallback tracking
  const [imageErrorMap, setImageErrorMap] = useState<Record<string, boolean>>({});

  // Active monster ID
  const [selectedMonstroId, setSelectedMonstroId] = useState<string>('');

  // BBCode copy level selector (1, 2, 3, or 4)
  const [bbcodeLevel, setBbcodeLevel] = useState<number>(4);
  const [copiedBBCode, setCopiedBBCode] = useState<boolean>(false);

  const isSearching = searchMonstroQuery.trim().length > 0;

  // Group powers by monster ID for rapid lookup
  const powersByMonstroId = useMemo(() => {
    const map = new Map<string, MonstroPoder[]>();
    for (const p of monstroPoderes) {
      const list = map.get(p.monstro_id) || [];
      list.push(p);
      map.set(p.monstro_id, list);
    }
    return map;
  }, [monstroPoderes]);

  // Check if monster matches search query (ONLY name and powers including levels, ignoring description, indole, and appearance)
  const checkMonstroMatches = (m: Monstro, query: string): boolean => {
    if (!query.trim()) return true;
    const powers = powersByMonstroId.get(m.id) || [];
    const fieldsToSearch: (string | undefined)[] = [
      m.nome,
      ...powers.flatMap((p) => [
        p.nome,
        p.nivel_1_desc,
        p.nivel_2_desc,
        p.nivel_3_desc,
        p.nivel_4_desc
      ])
    ];
    return matchesAnySearchQuery(fieldsToSearch, query);
  };

  // Filter and sort monstros:
  // When searching, search across ALL 4 categories.
  // Standard monsters (alphabetical A-Z) first, followed by dangerous monsters (also alphabetical A-Z) at the end.
  const filteredMonstros = useMemo(() => {
    const list = monstros.filter((m) => {
      const monstroCat = normalizeCategory(m.tipo);

      // If not searching, filter strictly by active category
      if (!isSearching) {
        const targetCat = normalizeCategory(activeCategory);
        if (monstroCat !== targetCat) return false;
      } else {
        // Search across all 4 categories, taking into account only name and powers (including levels)
        if (!checkMonstroMatches(m, searchMonstroQuery)) return false;
      }

      return true;
    });

    return list.sort((a, b) => {
      const aDanger = !!a.perigoso;
      const bDanger = !!b.perigoso;
      if (aDanger !== bDanger) {
        return aDanger ? 1 : -1; // dangerous monsters go to the end
      }
      return (a.nome || '').localeCompare(b.nome || '', 'pt-BR', { sensitivity: 'base' });
    });
  }, [monstros, activeCategory, searchMonstroQuery, isSearching, powersByMonstroId]);

  // Keep selection synchronized when category or filtered results change
  useEffect(() => {
    if (filteredMonstros.length > 0) {
      if (!selectedMonstroId || !filteredMonstros.some((m) => m.id === selectedMonstroId)) {
        setSelectedMonstroId(filteredMonstros[0].id);
      }
    } else {
      setSelectedMonstroId('');
    }
  }, [filteredMonstros, selectedMonstroId]);

  // Selected monster object (strictly null if no monsters in active filtered view)
  const selectedMonstro = useMemo(() => {
    if (filteredMonstros.length === 0) return null;
    const found = filteredMonstros.find((m) => m.id === selectedMonstroId);
    return found || filteredMonstros[0] || null;
  }, [filteredMonstros, selectedMonstroId]);

  // Effective color for the selected monster: use individual monster hex override first, then category fallback
  const monstroColor = useMemo(() => {
    if (!selectedMonstro) return '#3b82f6';
    if (selectedMonstro.cor_hex) return selectedMonstro.cor_hex;
    const cat = normalizeCategory(selectedMonstro.tipo);
    return DEFAULT_CATEGORY_COLORS[cat] || '#3b82f6';
  }, [selectedMonstro]);

  // Powers for the selected monster
  const currentMonstroPowers = useMemo(() => {
    if (!selectedMonstro) return [];
    return monstroPoderes
      .filter((p) => p.monstro_id === selectedMonstro.id)
      .sort((a, b) => (a.numero || 0) - (b.numero || 0));
  }, [monstroPoderes, selectedMonstro]);

  // Filtered powers based on power search query
  const displayedPowers = useMemo(() => {
    if (!searchPowerQuery.trim()) return currentMonstroPowers;
    return currentMonstroPowers.filter((p) => {
      return matchesAnySearchQuery(
        [
          p.nome, 
          p.tipo, 
          p.nivel_1_desc, 
          p.nivel_2_desc, 
          p.nivel_3_desc, 
          p.nivel_4_desc
        ],
        searchPowerQuery
      );
    });
  }, [currentMonstroPowers, searchPowerQuery]);

  // Copy monster powers as BBCode up to selected level
  const handleCopyPowersBBCode = async () => {
    if (!selectedMonstro || currentMonstroPowers.length === 0) return;
    const bbcode = generateMonstroPoderesBBCode(currentMonstroPowers, bbcodeLevel);
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(bbcode);
      } else {
        const ta = document.createElement('textarea');
        ta.value = bbcode;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopiedBBCode(true);
      setTimeout(() => setCopiedBBCode(false), 2500);
    } catch (err) {
      console.error('Falha ao copiar BBCode:', err);
    }
  };

  // Category counts (reflects search matches when searching, otherwise total count per category)
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    CATEGORIES.forEach((cat) => {
      counts[cat.id] = 0;
    });
    monstros.forEach((m) => {
      const cat = normalizeCategory(m.tipo);
      if (counts[cat] !== undefined) {
        if (!isSearching) {
          counts[cat] += 1;
        } else {
          if (checkMonstroMatches(m, searchMonstroQuery)) {
            counts[cat] += 1;
          }
        }
      }
    });
    return counts;
  }, [monstros, searchMonstroQuery, isSearching, checkMonstroMatches]);

  // Category label helper
  const getCategoryLabel = (tipo?: string): string => {
    const norm = normalizeCategory(tipo);
    switch (norm) {
      case 'terrestre': return 'TERRESTRE';
      case 'voador': return 'VOADOR';
      case 'aquatico': return 'AQUÁTICO';
      case 'ctonico': return 'CTÔNICO';
      default: return (tipo || 'GERAL').toUpperCase();
    }
  };

  return (
    <div className="flex-1 flex flex-col space-y-6 pb-12 w-full">
      
      {/* ========================================================================= */}
      {/* BESTIARY SELECTOR & CATEGORY FILTERS                                      */}
      {/* ========================================================================= */}
      <div className="bg-[var(--fundo2)] border border-[var(--bordadg)] rounded-2xl p-4 sm:p-5 shadow-xl space-y-4 transition-colors">
        
        {/* Header with Title & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--bordadg)]">
          <div>
            <h2 className="text-lg sm:text-xl md:text-2xl font-cinzel font-bold text-[var(--ctexto1)] tracking-wide flex items-center gap-2">
              <MinotaurIcon className="w-6 h-6 text-blue-500" />
              <span>Bestiário</span>
            </h2>
            <p className="text-xs text-[var(--ctexto2)] mt-0.5">
              Enciclopédia de criaturas, monstros lendários e suas características de combate
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Search Input for Monstros */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[var(--ctexto2)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchMonstroQuery}
                onChange={(e) => setSearchMonstroQuery(e.target.value)}
                placeholder="Buscar monstro..."
                className="pl-8 pr-8 py-1.5 bg-[var(--fundo1)] border border-[var(--bordadg)] rounded-xl text-xs text-[var(--ctexto1)] placeholder-[var(--ctexto2)] focus:outline-none focus:border-blue-500 w-48 sm:w-60"
              />
              {searchMonstroQuery && (
                <button
                  type="button"
                  onClick={() => setSearchMonstroQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--ctexto2)] hover:text-[var(--ctexto1)] p-0.5 transition-colors cursor-pointer"
                  title="Limpar busca"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full">
          {CATEGORIES.map((cat) => {
            const isCategoryActive = activeCategory === cat.id;
            const count = categoryCounts[cat.id] || 0;
            const Icon = cat.icon;

            return (
              <button
                key={cat.id}
                type="button"
                id={`filter-cat-${cat.id}`}
                onClick={() => {
                  setActiveCategory(cat.id);
                  if (isSearching) {
                    setSearchMonstroQuery('');
                  }
                }}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 border cursor-pointer w-full ${
                  isCategoryActive
                    ? 'bg-[var(--fundo3)] text-[var(--ctexto1)] shadow-md font-bold'
                    : 'bg-[var(--fundo1)] text-[var(--ctexto2)] hover:text-[var(--ctexto1)] hover:bg-[var(--fundo3)] border-[var(--bordadg)]'
                }`}
                style={{
                  borderColor: isCategoryActive ? cat.color : undefined,
                  boxShadow: isCategoryActive ? `0 0 12px 0 ${cat.color}30` : undefined
                }}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: cat.color }} />
                <span>{cat.name}</span>
                <span 
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    isCategoryActive 
                      ? 'font-bold' 
                      : 'bg-[var(--fundo2)] text-[var(--ctexto2)]'
                  }`}
                  style={
                    isCategoryActive
                      ? { backgroundColor: `${cat.color}25`, color: cat.color }
                      : undefined
                  }
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Monster Selector Badges */}
        <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-2 pt-1 w-full">
          {filteredMonstros.length === 0 ? (
            <div className="p-4 text-center w-full col-span-full bg-[var(--fundo1)] rounded-xl border border-[var(--bordadg)] text-xs text-[var(--ctexto2)]">
              {isSearching 
                ? `Nenhum monstro encontrado para "${searchMonstroQuery}".` 
                : 'Nenhum monstro encontrado para a categoria selecionada.'}
            </div>
          ) : (
            filteredMonstros.map((m) => {
              const isSelected = m.id === selectedMonstro?.id;
              const cardColor = m.cor_hex || DEFAULT_CATEGORY_COLORS[normalizeCategory(m.tipo)] || '#3b82f6';

              return (
                <button
                  key={m.id}
                  type="button"
                  id={`monstro-select-${m.id}`}
                  onClick={() => {
                    setSelectedMonstroId(m.id);
                    const mCat = normalizeCategory(m.tipo);
                    if (mCat && mCat !== activeCategory) {
                      setActiveCategory(mCat);
                    }
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 border cursor-pointer w-full ${
                    isSelected
                      ? 'bg-[var(--fundo3)] text-[var(--ctexto1)] shadow-lg font-bold'
                      : 'bg-[var(--fundo1)] text-[var(--ctexto2)] hover:text-[var(--ctexto1)] hover:bg-[var(--fundo3)] border-[var(--bordadg)]'
                  }`}
                  style={{
                    borderColor: isSelected ? cardColor : undefined,
                    boxShadow: isSelected ? `0 0 15px 0 ${cardColor}30` : undefined
                  }}
                >
                  {isSearching && (
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: cardColor }}
                    />
                  )}
                  <span className="font-medium whitespace-nowrap">
                    {m.nome}
                  </span>
                  {m.perigoso && (
                    <span 
                      title="Criatura Perigosa"
                      className="px-1 py-0.2 rounded text-[8px] font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-0.5 shrink-0"
                    >
                      <AlertTriangle className="w-2.5 h-2.5" />
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SELECTED MONSTER SHOWCASE BANNER (Rendered ONLY if monsters exist)        */}
      {/* ========================================================================= */}
      {selectedMonstro && filteredMonstros.length > 0 && (
        <>
          <div 
            className="rounded-2xl border p-5 sm:p-6 shadow-xl relative overflow-hidden transition-all bg-[var(--fundo2)]"
            style={{
              borderColor: `${monstroColor}40`,
              boxShadow: `0 8px 30px 0 ${monstroColor}15`
            }}
          >
            {/* Background glow accent */}
            <div 
              className="absolute -right-20 -top-20 w-72 h-72 rounded-full blur-3xl opacity-15 pointer-events-none"
              style={{ backgroundColor: monstroColor }}
            />

            <div className="relative z-10 flex flex-col md:flex-row items-start gap-6">
              
              {/* Left Column: Monster Portrait (250x400 size cover, position center) */}
              <div className="w-full md:w-auto shrink-0 flex flex-col items-center">
                <div 
                  className="w-[250px] h-[400px] rounded-2xl border shadow-2xl overflow-hidden relative bg-[var(--fundo1)] flex items-center justify-center group shrink-0"
                  style={{
                    borderColor: `${monstroColor}50`,
                    boxShadow: `0 10px 25px -5px ${monstroColor}30`
                  }}
                >
                  {selectedMonstro.imagem_url && !imageErrorMap[selectedMonstro.id] ? (
                    <img
                      src={selectedMonstro.imagem_url}
                      alt={selectedMonstro.nome}
                      referrerPolicy="no-referrer"
                      onError={() => {
                        setImageErrorMap((prev) => ({ ...prev, [selectedMonstro.id]: true }));
                      }}
                      className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                      style={{ objectFit: 'cover', objectPosition: 'center center' }}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center p-4 text-center space-y-2">
                      <MinotaurIcon className="w-20 h-20 opacity-40" style={{ color: monstroColor }} />
                      <span className="text-xs font-cinzel font-bold text-[var(--ctexto2)]">
                        {selectedMonstro.nome}
                      </span>
                    </div>
                  )}

                  {/* Subtle bottom gradient overlay on artwork without any tags on top */}
                  <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-[var(--fundo2)]/80 via-[var(--fundo2)]/20 to-transparent pointer-events-none" />
                </div>
              </div>

              {/* Right Column: Monster Lore & Information */}
              <div className="flex-1 min-w-0 space-y-4 w-full">
                
                {/* Header: Name, Tags & Danger Status */}
                <div className="space-y-2">
                  <div className="flex items-center flex-wrap gap-2.5">
                    <h1 className="font-cinzel text-2xl sm:text-3xl font-bold text-[var(--ctexto1)] tracking-wide">
                      {selectedMonstro.nome}
                    </h1>

                    {/* Category Tag (Placed here instead of on image) */}
                    <span 
                      className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider border shadow-sm flex items-center gap-1.5"
                      style={{
                        backgroundColor: `${monstroColor}20`,
                        borderColor: `${monstroColor}60`,
                        color: monstroColor
                      }}
                    >
                      <span 
                        className="w-2 h-2 rounded-full" 
                        style={{ backgroundColor: monstroColor }} 
                      />
                      <span>{getCategoryLabel(selectedMonstro.tipo)}</span>
                    </span>

                    {/* Danger Indicator Badge */}
                    {selectedMonstro.perigoso && (
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center gap-1 shadow-sm">
                        <AlertTriangle className="w-3 h-3 text-rose-400" />
                        <span>PERIGOSO</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Informational Blocks */}
                <div className="space-y-3.5 pt-1">
                  
                  {/* 1. Descrição */}
                  {selectedMonstro.descricao && (
                    <div className="p-3.5 bg-[var(--fundo1)] rounded-xl border border-[var(--bordadg)] space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-[var(--ctexto1)]">
                        <Info className="w-3.5 h-3.5" style={{ color: monstroColor }} />
                        <span>Descrição</span>
                      </div>
                      <div className="text-xs sm:text-sm text-[var(--ctexto2)] leading-relaxed text-justify whitespace-pre-line">
                        <BBCodeRenderer text={selectedMonstro.descricao} />
                      </div>
                    </div>
                  )}

                  {/* 2. Índole */}
                  {selectedMonstro.indole && (
                    <div className="p-3.5 bg-[var(--fundo1)] rounded-xl border border-[var(--bordadg)] space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-[var(--ctexto1)]">
                        <Compass className="w-3.5 h-3.5" style={{ color: monstroColor }} />
                        <span>Índole</span>
                      </div>
                      <div className="text-xs sm:text-sm text-[var(--ctexto2)] leading-relaxed text-justify whitespace-pre-line">
                        <BBCodeRenderer text={selectedMonstro.indole} />
                      </div>
                    </div>
                  )}

                  {/* 3. Aparência */}
                  {selectedMonstro.aparencia && (
                    <div className="p-3.5 bg-[var(--fundo1)] rounded-xl border border-[var(--bordadg)] space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-[var(--ctexto1)]">
                        <Eye className="w-3.5 h-3.5" style={{ color: monstroColor }} />
                        <span>Aparência</span>
                      </div>
                      <div className="text-xs sm:text-sm text-[var(--ctexto2)] leading-relaxed text-justify whitespace-pre-line">
                        <BBCodeRenderer text={selectedMonstro.aparencia} />
                      </div>
                    </div>
                  )}

                  {/* 4. Atributos Principais (se houver) */}
                  {selectedMonstro.atributos_principais && (
                    <div className="p-3 bg-[var(--fundo1)] rounded-xl border border-[var(--bordadg)] text-xs text-[var(--ctexto2)] flex items-center gap-2">
                      <strong className="text-[var(--ctexto1)] font-mono uppercase">Atributos:</strong>
                      <span>{selectedMonstro.atributos_principais}</span>
                    </div>
                  )}

                </div>

              </div>

            </div>
          </div>

          {/* ========================================================================= */}
          {/* MONSTER POWERS & ABILITIES LIST                                           */}
          {/* ========================================================================= */}
          <div className="space-y-4">
            
            {/* Powers Section Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[var(--bordadg)]">
              <div>
                <h3 className="font-cinzel text-base sm:text-lg font-bold text-[var(--ctexto1)] flex items-center gap-2">
                  <Swords className="w-4 h-4" style={{ color: monstroColor }} />
                  <span>Poderes e Habilidades</span>
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                {/* Level selector & Copy BBCode */}
                {currentMonstroPowers.length > 0 && (
                  <div className="flex items-center gap-1.5 bg-[var(--fundo3)] p-1 rounded-xl border border-[var(--bordadg)]">
                    <label htmlFor="bbcode-level-select" className="text-[11px] font-semibold text-[var(--ctexto2)] pl-1 hidden sm:inline">
                      Nível:
                    </label>
                    <select
                      id="bbcode-level-select"
                      value={bbcodeLevel}
                      onChange={(e) => setBbcodeLevel(Number(e.target.value))}
                      className="bg-[var(--fundo1)] text-[var(--ctexto1)] text-xs font-bold px-2 py-1 rounded-lg border border-[var(--bordadg)] focus:outline-none focus:border-blue-500 cursor-pointer"
                      title="Selecione o nível máximo dos poderes para o BBCode"
                    >
                      <option value={1}>Nível 1</option>
                      <option value={2}>Nível 2</option>
                      <option value={3}>Nível 3</option>
                      <option value={4}>Nível 4</option>
                    </select>

                    <button
                      type="button"
                      id="btn-copy-monster-bbcode"
                      onClick={handleCopyPowersBBCode}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm ${
                        copiedBBCode
                          ? 'bg-emerald-600 text-white'
                          : 'bg-blue-600 hover:bg-blue-500 text-white'
                      }`}
                      title="Copiar poderes do monstro em formato BBCode"
                    >
                      {copiedBBCode ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar BBCode</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Search Input for Powers */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-[var(--ctexto2)] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchPowerQuery}
                    onChange={(e) => setSearchPowerQuery(e.target.value)}
                    placeholder="Filtrar habilidades..."
                    className="pl-8 pr-3 py-1.5 bg-[var(--fundo1)] border border-[var(--bordadg)] rounded-xl text-xs text-[var(--ctexto1)] placeholder-[var(--ctexto2)] focus:outline-none focus:border-blue-500 w-36 sm:w-44"
                  />
                </div>
              </div>
            </div>

            {/* Powers Grid */}
            {displayedPowers.length === 0 ? (
              <div className="p-8 text-center bg-[var(--fundo2)] border border-[var(--bordadg)] rounded-2xl text-xs text-[var(--ctexto2)]">
                Nenhuma habilidade encontrada para este monstro.
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
                {displayedPowers.map((poder) => {
                  const isAtivo = (poder.tipo || 'ativo').toLowerCase() === 'ativo';

                  return (
                    <div
                      key={poder.id}
                      className="flex flex-col justify-start h-full bg-[var(--fundo2)] border border-[var(--bordadg)] hover:border-[var(--bordadg)] rounded-2xl p-5 space-y-4 transition-all shadow-sm"
                      style={{
                        boxShadow: `0 2px 10px -2px ${monstroColor}10`
                      }}
                    >
                      {/* Top: Skill Header */}
                      <div className="flex items-center justify-between gap-3 pb-3 border-b border-[var(--bordadg)]">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span 
                            className="px-2.5 py-1 rounded-xl text-xs font-mono font-bold tracking-tight border shrink-0 shadow-sm"
                            style={{
                              backgroundColor: `${monstroColor}18`,
                              borderColor: `${monstroColor}45`,
                              color: monstroColor
                            }}
                          >
                            #{poder.numero}
                          </span>
                          <h4 className="font-cinzel text-base sm:text-lg font-bold text-[var(--ctexto1)] leading-tight truncate">
                            {poder.nome}
                          </h4>
                        </div>

                        {/* Ativo / Passivo Badge */}
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold tracking-wide uppercase border shrink-0 ${
                          isAtivo
                            ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                            : 'bg-sky-500/15 text-sky-400 border-sky-500/30'
                        }`}>
                          {isAtivo ? 'Ativo' : 'Passivo'}
                        </span>
                      </div>

                      {/* Levels Progression (Nível 1, Nível 2, Nível 3, Nível 4) */}
                      <div className="space-y-2.5 flex-1">
                        
                        {/* Nível 1 */}
                        {poder.nivel_1_desc && (
                          <div className="p-3 bg-[var(--fundo1)] rounded-xl border border-[var(--bordadg)] text-[14px] leading-relaxed">
                            <span className="text-xs font-mono font-bold text-blue-500 uppercase tracking-wider block mb-1">
                              Nível 1
                            </span>
                            <div className="text-[var(--ctexto1)] text-justify whitespace-pre-line break-words">
                              <BBCodeRenderer text={poder.nivel_1_desc} />
                            </div>
                          </div>
                        )}

                        {/* Nível 2 */}
                        {poder.nivel_2_desc && (
                          <div className="p-3 bg-[var(--fundo1)] rounded-xl border border-[var(--bordadg)] text-[14px] leading-relaxed">
                            <span className="text-xs font-mono font-bold text-purple-500 uppercase tracking-wider block mb-1">
                              Nível 2
                            </span>
                            <div className="text-[var(--ctexto1)] text-justify whitespace-pre-line break-words">
                              <BBCodeRenderer text={poder.nivel_2_desc} />
                            </div>
                          </div>
                        )}

                        {/* Nível 3 */}
                        {poder.nivel_3_desc && (
                          <div className="p-3 bg-[var(--fundo1)] rounded-xl border border-[var(--bordadg)] text-[14px] leading-relaxed">
                            <span className="text-xs font-mono font-bold text-amber-500 uppercase tracking-wider block mb-1">
                              Nível 3
                            </span>
                            <div className="text-[var(--ctexto1)] text-justify whitespace-pre-line break-words">
                              <BBCodeRenderer text={poder.nivel_3_desc} />
                            </div>
                          </div>
                        )}

                        {/* Nível 4 */}
                        {poder.nivel_4_desc && (
                          <div className="p-3 bg-[var(--fundo1)] rounded-xl border border-[var(--bordadg)] text-[14px] leading-relaxed">
                            <span className="text-xs font-mono font-bold text-rose-500 uppercase tracking-wider block mb-1">
                              Nível 4
                            </span>
                            <div className="text-[var(--ctexto1)] text-justify whitespace-pre-line break-words">
                              <BBCodeRenderer text={poder.nivel_4_desc} />
                            </div>
                          </div>
                        )}

                      </div>

                    </div>
                  );
                })}
              </div>
            )}

          </div>
        </>
      )}

    </div>
  );
};

