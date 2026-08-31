import React, { useState, useEffect } from 'react';
import { FichaPersonagem, AtributosPersonagem } from '../types';
import { INITIAL_DEUSES } from '../data/defaultData';
import { saveSheet } from '../services/characterSheets';
import { MATERIAIS_ARMA, METAIS_CANALIZACAO, NOMES_ACOES_ACERTO } from '../data/combatData';
import { montarFaixas, ATTR_NOME_EXIBICAO, erroCritico, bonusCriticoFisico, aplicarTeto, progressaoEnergetica, clamp } from '../utils/combatUtils';
import { calculateDamage, DamageCalculationParams, DamageCalculationResult, WeaponMaterialInput, ChannelingMetalInput } from '../utils/damageCalculator';
import { 
  Swords, 
  Crosshair, 
  User, 
  Sparkles, 
  Shield, 
  Plus, 
  Trash2, 
  Zap, 
  Flame, 
  Target, 
  RotateCcw, 
  Check, 
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Award,
  BicepsFlexed,
  Wind,
  Brain,
  Leaf,
  Wand2,
  Moon,
  Hammer,
  Layers,
  Heart,
  Droplet,
  Percent,
  Activity,
  ShieldAlert,
  Save,
  Copy,
  BookmarkCheck
} from 'lucide-react';

export const ATTR_CONFIG: Record<keyof AtributosPersonagem, {
  name: string;
  shortName: string;
  icon: React.FC<{ className?: string; style?: React.CSSProperties }>;
  color: string;
  bgColor: string;
  borderColor: string;
}> = {
  forca: { name: 'Força', shortName: 'FOR', icon: BicepsFlexed, color: 'text-rose-500 dark:text-rose-400', bgColor: 'bg-rose-500/10', borderColor: 'border-rose-500/30' },
  destreza: { name: 'Destreza', shortName: 'DES', icon: Swords, color: 'text-orange-500 dark:text-orange-400', bgColor: 'bg-orange-500/10', borderColor: 'border-orange-500/30' },
  agilidade: { name: 'Agilidade', shortName: 'AGI', icon: Zap, color: 'text-amber-500 dark:text-amber-400', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/30' },
  constituicao: { name: 'Constituição', shortName: 'CON', icon: Shield, color: 'text-emerald-500 dark:text-emerald-400', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/30' },
  inteligencia: { name: 'Inteligência', shortName: 'INT', icon: Brain, color: 'text-sky-500 dark:text-sky-400', bgColor: 'bg-sky-500/10', borderColor: 'border-sky-500/30' },
  carisma: { name: 'Carisma', shortName: 'CAR', icon: Heart, color: 'text-pink-500 dark:text-pink-400', bgColor: 'bg-pink-500/10', borderColor: 'border-pink-500/30' },
  natureza: { name: 'Natureza', shortName: 'NAT', icon: Leaf, color: 'text-lime-500 dark:text-lime-400', bgColor: 'bg-lime-500/10', borderColor: 'border-lime-500/30' },
  magia: { name: 'Magia', shortName: 'MAG', icon: Sparkles, color: 'text-purple-500 dark:text-purple-400', bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500/30' },
  espiritualidade: { name: 'Espiritualidade', shortName: 'ESP', icon: Flame, color: 'text-cyan-500 dark:text-cyan-400', bgColor: 'bg-cyan-500/10', borderColor: 'border-cyan-500/30' }
};

const ACTION_ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  desarmado: BicepsFlexed,
  voz: Heart,
  contra: Swords,
  esquiva: Zap,
  bloqueio: Shield,
  mental: Brain,
  convencimento: Heart,
  resistencia: ShieldAlert,
  magico: Sparkles,
  elemental: Flame,
  espiritual: Flame
};

const AttrBadge: React.FC<{ attrKey: keyof AtributosPersonagem | ''; showName?: boolean }> = ({ attrKey, showName = true }) => {
  if (!attrKey) return null;
  const cfg = ATTR_CONFIG[attrKey];
  if (!cfg) return null;
  const IconComp = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-bold border ${cfg.bgColor} ${cfg.borderColor} ${cfg.color}`}>
      <IconComp className="w-3.5 h-3.5 shrink-0" />
      {showName && <span>{cfg.name}</span>}
    </span>
  );
};

interface CombatCalculatorViewProps {
  sheets: FichaPersonagem[];
  onUpdateSheet?: (sheet: FichaPersonagem) => void;
}

export const CombatCalculatorView: React.FC<CombatCalculatorViewProps> = ({ sheets, onUpdateSheet }) => {
  const [activeSubTab, setActiveSubTab] = useState<'dano' | 'acerto'>('dano');

  // Selected Character Sheets (Default: Preenchimento Manual)
  const [selectedSheetId, setSelectedSheetId] = useState<string>('');
  const [selectedDefenderSheetId, setSelectedDefenderSheetId] = useState<string>('');
  const [saveFeedbackMsg, setSaveFeedbackMsg] = useState<string | null>(null);
  const [copiedHitResults, setCopiedHitResults] = useState<boolean>(false);

  // Active God Color from loaded attacker sheet
  const activeAttackerSheet = sheets.find(s => s.id === selectedSheetId);
  const activeAttackerDeus = activeAttackerSheet ? INITIAL_DEUSES.find(d => d.id === activeAttackerSheet.deus_id) : null;
  const activeGodColor = activeAttackerDeus?.cor_hex;

  // =========================================================================
  // DAMAGE CALCULATOR STATE
  // =========================================================================
  const [attackerAttrs, setAttackerAttrs] = useState<AtributosPersonagem>({
    forca: 1,
    destreza: 1,
    agilidade: 1,
    constituicao: 1,
    inteligencia: 1,
    carisma: 1,
    natureza: 1,
    magia: 1,
    espiritualidade: 1
  });

  const [damageType, setDamageType] = useState<'unarmed' | 'melee' | 'ranged' | 'crossbow' | 'energy' | 'especial'>('melee');
  const [selectedWeaponId, setSelectedWeaponId] = useState<string>('');

  // Especial
  const [especialBase, setEspecialBase] = useState<number>(0);
  const [especialAttr, setEspecialAttr] = useState<keyof AtributosPersonagem>('forca');

  // Attribute Substitution
  const [firstAttrSub, setFirstAttrSub] = useState<keyof AtributosPersonagem | ''>('');
  const [applyBonusToFirst, setApplyBonusToFirst] = useState<boolean>(false);
  const [secondAttrSub, setSecondAttrSub] = useState<keyof AtributosPersonagem | ''>('');
  const [applyBonusToSecond, setApplyBonusToSecond] = useState<boolean>(false);

  // Weapon Materials
  const [mat1Key, setMat1Key] = useState<string>('bronze_celestial');
  const [customMat1, setCustomMat1] = useState<{ mat: number; bonus: number; percent: number }>({ mat: 0, bonus: 0, percent: 0 });
  const [applyMat1Bonus, setApplyMat1Bonus] = useState<boolean>(true);

  const [mat2Key, setMat2Key] = useState<string>('');
  const [customMat2, setCustomMat2] = useState<{ mat: number; bonus: number; percent: number }>({ mat: 0, bonus: 0, percent: 0 });
  const [applyMat2Bonus, setApplyMat2Bonus] = useState<boolean>(false);

  // Channeling Metals
  const [chan1Key, setChan1Key] = useState<string>('');
  const [applyChan1, setApplyChan1] = useState<boolean>(false);

  const [chan2Key, setChan2Key] = useState<string>('');
  const [applyChan2, setApplyChan2] = useState<boolean>(false);

  // Forge Bonus & Ability DB
  const [forgeBonus, setForgeBonus] = useState<number>(0);
  const [energyAttr, setEnergyAttr] = useState<keyof AtributosPersonagem>('natureza');
  const [abilityDB, setAbilityDB] = useState<number>(0);

  // Custom Var
  const [customVarType, setCustomVarType] = useState<'none' | 'flat' | 'attribute' | 'halfAttribute'>('none');
  const [customVarAttr, setCustomVarAttr] = useState<keyof AtributosPersonagem>('forca');
  const [customVarFlat, setCustomVarFlat] = useState<number>(0);

  // Attr % Bonuses
  const [attrBonuses, setAttrBonuses] = useState<Record<keyof AtributosPersonagem, number>>({
    forca: 0,
    destreza: 0,
    agilidade: 0,
    constituicao: 0,
    inteligencia: 0,
    carisma: 0,
    natureza: 0,
    magia: 0,
    espiritualidade: 0
  });

  // Extra Multipliers
  const [extraMultipliers, setExtraMultipliers] = useState<Array<{ id: string; valor: number; descricao: string }>>([]);
  const [newExtraVal, setNewExtraVal] = useState<number>(0);
  const [newExtraDesc, setNewExtraDesc] = useState<string>('');

  // Critical Options
  const [enableCritical, setEnableCritical] = useState<boolean>(true);
  const [criticalBonus, setCriticalBonus] = useState<number>(0);

  // Conversion
  const [enableConversion, setEnableConversion] = useState<boolean>(false);
  const [conversionType, setConversionType] = useState<'single' | 'split'>('single');
  const [conversionAttr, setConversionAttr] = useState<keyof AtributosPersonagem>('constituicao');
  const [conversionPercent, setConversionPercent] = useState<number>(100);
  const [splitAttr1, setSplitAttr1] = useState<keyof AtributosPersonagem>('constituicao');
  const [splitPercent1, setSplitPercent1] = useState<number>(50);
  const [splitAttr2, setSplitAttr2] = useState<keyof AtributosPersonagem>('inteligencia');
  const [splitPercent2, setSplitPercent2] = useState<number>(50);

  // Defender
  const [defenderAttrs, setDefenderAttrs] = useState<AtributosPersonagem>({
    forca: 1,
    destreza: 1,
    agilidade: 1,
    constituicao: 1,
    inteligencia: 1,
    carisma: 1,
    natureza: 1,
    magia: 1,
    espiritualidade: 1
  });

  const [defenseBonuses, setDefenseBonuses] = useState<Array<{ id: string; valor: number; descricao: string }>>([]);
  const [newDefVal, setNewDefVal] = useState<number>(0);
  const [newDefDesc, setNewDefDesc] = useState<string>('');

  // Extra Effects
  const [vampirismo, setVampirismo] = useState<boolean>(false);
  const [vampirismoPercent, setVampirismoPercent] = useState<number>(10);
  const [areaDamage, setAreaDamage] = useState<boolean>(false);
  const [areaDamagePercent, setAreaDamagePercent] = useState<number>(10);
  const [trueDamage, setTrueDamage] = useState<boolean>(false);
  const [trueDamagePercent, setTrueDamagePercent] = useState<number>(100);

  // Calculation Result
  const [damageResult, setDamageResult] = useState<DamageCalculationResult | null>(null);

  // =========================================================================
  // HIT CALCULATOR STATE
  // =========================================================================
  const [hitWeapons, setHitWeapons] = useState<Array<{ id: string; nome: string; aptidao: number; bonusCritico: number }>>([
    { id: '1', nome: 'Arma Principal', aptidao: 50, bonusCritico: 0 }
  ]);

  const [hitActionOptions, setHitActionOptions] = useState<Record<string, { bonus: number; quebra: boolean; ignorar: boolean }>>({
    desarmado: { bonus: 0, quebra: false, ignorar: false },
    voz: { bonus: 0, quebra: false, ignorar: true },
    contra: { bonus: 0, quebra: false, ignorar: false },
    esquiva: { bonus: 0, quebra: false, ignorar: false },
    bloqueio: { bonus: 0, quebra: false, ignorar: false },
    mental: { bonus: 0, quebra: false, ignorar: false },
    convencimento: { bonus: 0, quebra: false, ignorar: false },
    resistencia: { bonus: 0, quebra: false, ignorar: false },
    magico: { bonus: 0, quebra: false, ignorar: false },
    elemental: { bonus: 0, quebra: false, ignorar: false },
    espiritual: { bonus: 0, quebra: false, ignorar: false }
  });

  const [hitResultsText, setHitResultsText] = useState<string>('');

  // Sync selected attacker character sheet
  useEffect(() => {
    if (!selectedSheetId) return;
    const sheet = sheets.find((s) => s.id === selectedSheetId);
    if (!sheet) return;

    // Load attributes
    setAttackerAttrs({ ...sheet.atributos });

    // Load combat bonuses
    const cb = sheet.bonus_combate;
    if (cb) {
      if (cb.bonusDanoAtributos) {
        setAttrBonuses((prev) => ({ ...prev, ...cb.bonusDanoAtributos }));
      }
      if (cb.bonusDanoExtras) {
        setExtraMultipliers(cb.bonusDanoExtras);
      }
      if (cb.bonusAcerto) {
        setHitActionOptions((prev) => {
          const updated = { ...prev };
          Object.entries(cb.bonusAcerto || {}).forEach(([k, val]) => {
            if (updated[k]) {
              updated[k] = { ...updated[k], bonus: val || 0 };
            }
          });
          return updated;
        });
      }
    }

    // Load inventory weapons
    if (sheet.inventario) {
      const invWeapons = sheet.inventario.filter((i) => i.tipo === 'arma');
      if (invWeapons.length > 0) {
        setHitWeapons(
          invWeapons.map((w, idx) => ({
            id: w.id || `w_${idx}`,
            nome: w.nome,
            aptidao: w.aptidao ?? 50,
            bonusCritico: 0
          }))
        );

        // Pre-select first weapon for damage calculator
        setSelectedWeaponId(invWeapons[0].id);
        const w1 = invWeapons[0];
        if (w1.material) setMat1Key(w1.material);
        if (w1.materialCustom) setCustomMat1(w1.materialCustom);
        if (w1.bonusForja) setForgeBonus(w1.bonusForja);
      }
    }

    // Load saved hit chances if available
    if (sheet.chances_acerto) {
      setHitResultsText(sheet.chances_acerto);
    }
  }, [selectedSheetId, sheets]);

  // Sync when selecting a specific weapon from sheet
  const handleSelectSheetWeapon = (weaponId: string) => {
    setSelectedWeaponId(weaponId);
    const sheet = sheets.find((s) => s.id === selectedSheetId);
    if (!sheet || !sheet.inventario) return;
    const weapon = sheet.inventario.find((i) => i.id === weaponId);
    if (!weapon) return;

    if (weapon.material) setMat1Key(weapon.material);
    if (weapon.materialCustom) setCustomMat1(weapon.materialCustom);
    if (weapon.bonusForja) setForgeBonus(weapon.bonusForja);
  };

  // Sync selected defender character sheet
  useEffect(() => {
    if (!selectedDefenderSheetId) return;
    const sheet = sheets.find((s) => s.id === selectedDefenderSheetId);
    if (sheet) {
      setDefenderAttrs({ ...sheet.atributos });
    }
  }, [selectedDefenderSheetId, sheets]);

  // Damage Calculation Trigger
  const handleCalculateDamage = () => {
    const materialsInput: WeaponMaterialInput[] = [];
    if (mat1Key) {
      materialsInput.push({
        materialKey: mat1Key,
        customMat: customMat1.mat,
        customBonus: customMat1.bonus,
        customPercent: customMat1.percent,
        applyEffect: applyMat1Bonus
      });
    }
    if (mat2Key) {
      materialsInput.push({
        materialKey: mat2Key,
        customMat: customMat2.mat,
        customBonus: customMat2.bonus,
        customPercent: customMat2.percent,
        applyEffect: applyMat2Bonus
      });
    }

    const channelingInput: ChannelingMetalInput[] = [];
    if (chan1Key) channelingInput.push({ metalKey: chan1Key, applyEffect: applyChan1 });
    if (chan2Key) channelingInput.push({ metalKey: chan2Key, applyEffect: applyChan2 });

    const params: DamageCalculationParams = {
      attackerAttributes: attackerAttrs,
      damageType,
      especialBase,
      especialAttributeKey: especialAttr,
      attributeSub: {
        firstAttr: firstAttrSub,
        applyBonusFirst: applyBonusToFirst,
        secondAttr: secondAttrSub,
        applyBonusSecond: applyBonusToSecond
      },
      weaponMaterials: materialsInput,
      channelingMetals: channelingInput,
      forgeBonus,
      energyAttributeKey: energyAttr,
      abilityDB,
      customVar: {
        type: customVarType,
        attributeKey: customVarAttr,
        flatValue: customVarFlat
      },
      attrBonuses,
      extraMultipliers,
      critical: {
        enable: enableCritical,
        bonusPercent: criticalBonus
      },
      conversion: {
        enable: enableConversion,
        type: conversionType,
        singleAttr: conversionAttr,
        singlePercent: conversionPercent,
        splitAttr1,
        splitPercent1,
        splitAttr2,
        splitPercent2
      },
      defenderAttributes: defenderAttrs,
      defenseBonuses,
      effects: {
        enableVampirism: vampirismo,
        vampirismPercent: vampirismoPercent,
        enableArea: areaDamage,
        areaPercent: areaDamagePercent,
        enableTrueDamage: trueDamage,
        trueDamagePercent
      }
    };

    const res = calculateDamage(params);
    setDamageResult(res);
  };

  // Hit Calculation Trigger
  const handleCalculateHit = () => {
    let output = '';

    const forca = attackerAttrs.forca || 1;
    const agilidade = attackerAttrs.agilidade || 1;
    const destreza = attackerAttrs.destreza || 1;
    const constituicao = attackerAttrs.constituicao || 1;
    const carisma = attackerAttrs.carisma || 1;
    const inteligencia = attackerAttrs.inteligencia || 1;
    const magiaAttr = attackerAttrs.magia || 1;
    const naturezaAttr = attackerAttrs.natureza || 1;
    const espiritualidadeAttr = attackerAttrs.espiritualidade || 1;

    const erroBase = erroCritico(destreza);
    const bonusCritFisico = bonusCriticoFisico(destreza);

    const montar = (nomeKey: string, base: number, teto: number, attrErro: number, extraCrit: number = 0) => {
      const opt = hitActionOptions[nomeKey];
      if (opt && opt.ignorar) return;

      const bonus = opt ? opt.bonus : 0;
      const quebra = opt ? opt.quebra : false;

      let total = aplicarTeto(base + bonus, teto, quebra);
      total = clamp(total);

      const meta = NOMES_ACOES_ACERTO[nomeKey];
      const nomeExibicao = meta ? meta.nome : nomeKey;

      const f = montarFaixas(nomeExibicao, total, erroCritico(attrErro), extraCrit);
      output += f.textoFormatado + '\n';
    };

    // 1. DESARMADO
    montar('desarmado', 50 + (forca - 1) * 10, 90, destreza, bonusCritFisico);

    // 2. ARMAS (APTIDÃO FINAL DIRETA)
    hitWeapons.forEach((w) => {
      const nome = w.nome.trim();
      const numero = w.aptidao || 0;
      const bonusCrit = w.bonusCritico || 0;

      if (nome && numero > 0) {
        const f = montarFaixas(`Chance de Acerto com ${nome}`, clamp(numero), erroBase, bonusCrit + bonusCritFisico);
        output += f.textoFormatado + '\n';
      }
    });

    // 3. DEMAIS AÇÕES
    montar('contra', 30 + (destreza - 1) * 10, 85, destreza, 0);
    montar('bloqueio', 30 + (constituicao - 1) * 10, 85, constituicao, 0);
    montar('esquiva', [25, 30, 35, 45, 50][Math.min(4, Math.max(0, agilidade - 1))], 80, agilidade, 0);

    montar('mental', progressaoEnergetica(inteligencia), 85, inteligencia, 0);
    montar('magico', progressaoEnergetica(magiaAttr), 85, magiaAttr, 0);
    montar('elemental', progressaoEnergetica(naturezaAttr), 85, naturezaAttr, 0);
    montar('espiritual', progressaoEnergetica(espiritualidadeAttr), 85, espiritualidadeAttr, 0);

    montar('convencimento', 30 + (carisma - 1) * 10, 85, carisma, 0);
    montar('resistencia', 30 + (carisma - 1) * 10, 85, carisma, 0);
    montar('voz', 30 + (carisma - 1) * 10, 85, carisma, bonusCritFisico);

    setHitResultsText(output.trim());
  };

  // Weapon helpers for Hit Calculator
  const handleAddHitWeapon = () => {
    setHitWeapons((prev) => [
      ...prev,
      { id: `hw_${Date.now()}`, nome: `Arma ${prev.length + 1}`, aptidao: 50, bonusCritico: 0 }
    ]);
  };

  const handleRemoveHitWeapon = (id: string) => {
    setHitWeapons((prev) => prev.filter((w) => w.id !== id));
  };

  const selectedSheet = sheets.find((s) => s.id === selectedSheetId);

  const handleSaveHitResultsToSheet = () => {
    if (!selectedSheet) return;
    
    // Ensure we have a calculated text, if not calculate on the fly
    let textToSave = hitResultsText;
    if (!textToSave) {
      handleCalculateHit();
      // Since setState is async, we can construct the text or wait, but user usually clicks calculate first.
      return;
    }

    const updatedSheet: FichaPersonagem = {
      ...selectedSheet,
      chances_acerto: textToSave,
      bonus_combate: {
        ...selectedSheet.bonus_combate,
        bonusAcerto: {
          ...selectedSheet.bonus_combate?.bonusAcerto,
          desarmado: hitActionOptions.desarmado?.bonus || 0,
          contra: hitActionOptions.contra?.bonus || 0,
          bloqueio: hitActionOptions.bloqueio?.bonus || 0,
          esquiva: hitActionOptions.esquiva?.bonus || 0,
          mental: hitActionOptions.mental?.bonus || 0,
          magico: hitActionOptions.magico?.bonus || 0,
          elemental: hitActionOptions.elemental?.bonus || 0,
          espiritual: hitActionOptions.espiritual?.bonus || 0,
          convencimento: hitActionOptions.convencimento?.bonus || 0,
          resistencia: hitActionOptions.resistencia?.bonus || 0,
          voz: hitActionOptions.voz?.bonus || 0
        }
      }
    };

    saveSheet(updatedSheet);
    if (onUpdateSheet) {
      onUpdateSheet(updatedSheet);
    }

    setSaveFeedbackMsg(`Chances de acerto salvas na ficha de "${selectedSheet.nome}" com sucesso!`);
    setTimeout(() => setSaveFeedbackMsg(null), 3500);
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      
      {/* HEADER WITH SHEET AUTO-FILL SELECTOR */}
      <div className="bg-[var(--fundo2)] rounded-2xl p-4 sm:p-6 border border-[var(--bordadg)] shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-cinzel text-lg sm:text-xl font-bold text-[var(--ctexto1)] flex items-center gap-2">
              <Swords className="w-5 h-5 text-rose-500" />
              Calculadora de Combate
            </h2>
            <p className="text-xs text-[var(--ctexto2)]">
              Calcule dano e acerto com precisão, manualmente ou puxando os dados de uma ficha do Minhas Fichas.
            </p>
          </div>

          {/* Subtabs Switcher */}
          <div className="flex items-center gap-1 bg-[var(--fundo3)] p-1 rounded-xl border border-[var(--bordadg)]">
            <button
              type="button"
              onClick={() => setActiveSubTab('dano')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'dano' ? 'bg-rose-600 text-white shadow' : 'text-[var(--ctexto2)] hover:text-[var(--ctexto1)]'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Calculadora de Dano</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('acerto')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'acerto' ? 'bg-blue-600 text-white shadow' : 'text-[var(--ctexto2)] hover:text-[var(--ctexto1)]'
              }`}
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span>Calculadora de Acerto</span>
            </button>
          </div>
        </div>

        {/* Character Sheet Selector for Auto-Fill */}
        <div className="bg-[var(--fundo3)] p-3 rounded-xl border border-[var(--bordadg)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <User className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-xs font-bold text-[var(--ctexto1)] whitespace-nowrap">Carregar Ficha Atacante:</span>
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

      {/* ========================================================================= */}
      {/* VIEW 1: CALCULADORA DE DANO                                              */}
      {/* ========================================================================= */}
      {activeSubTab === 'dano' && (
        <div className="space-y-6">
          
          {/* ATRIBUTOS */}
          <div className="bg-[var(--fundo2)] rounded-2xl p-4 sm:p-5 border border-[var(--bordadg)] space-y-3">
            <h3 className="font-cinzel text-sm font-bold text-[var(--ctexto1)] flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Atributos</span>
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
              {(Object.keys(attackerAttrs) as Array<keyof AtributosPersonagem>).map((attrKey) => {
                const cfg = ATTR_CONFIG[attrKey];
                const IconComp = cfg.icon;
                return (
                  <div key={attrKey} className={`p-2 rounded-xl border text-center transition-all space-y-1 ${cfg.bgColor} ${cfg.borderColor}`}>
                    <div className="flex items-center justify-center gap-1">
                      <IconComp className={`w-3.5 h-3.5 ${cfg.color} shrink-0`} />
                      <label className={`text-[10px] font-bold uppercase truncate ${cfg.color}`}>
                        {cfg.name}
                      </label>
                    </div>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={attackerAttrs[attrKey]}
                      onChange={(e) =>
                        setAttackerAttrs((prev) => ({ ...prev, [attrKey]: Math.max(1, Number(e.target.value)) }))
                      }
                      className="w-full text-center bg-[var(--fundo1)] py-1 rounded-lg font-mono font-bold text-xs text-[var(--ctexto1)] border border-[var(--bordadg)] focus:outline-none focus:border-amber-500 shadow-inner"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* MODALIDADE DE DANO & ARMA DA FICHA */}
          <div className="bg-[var(--fundo2)] rounded-2xl p-4 sm:p-5 border border-[var(--bordadg)] space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div>
                <label className="text-xs font-bold text-[var(--ctexto1)] flex items-center gap-1.5 mb-1.5">
                  <Swords className="w-3.5 h-3.5 text-rose-400" />
                  <span>Modalidade de Dano:</span>
                </label>
                <select
                  value={damageType}
                  onChange={(e) => setDamageType(e.target.value as any)}
                  className="w-full bg-[var(--fundo3)] px-3 py-2 rounded-xl text-xs font-bold text-[var(--ctexto1)] border border-[var(--bordadg)] cursor-pointer"
                >
                  <option value="unarmed">Combate Desarmado</option>
                  <option value="melee">Armas Corpo-a-corpo</option>
                  <option value="ranged">Armas à Distância</option>
                  <option value="crossbow">Bestas e Armas de Fogo</option>
                  <option value="energy">Dano Energético</option>
                  <option value="especial">Especial (Base + Atributo/2)</option>
                </select>
              </div>

              {/* Selection of sheet weapon if available */}
              {selectedSheet && selectedSheet.inventario && selectedSheet.inventario.filter((i) => i.tipo === 'arma').length > 0 && (
                <div>
                  <label className="text-xs font-bold text-[var(--ctexto1)] flex items-center gap-1.5 mb-1.5">
                    <User className="w-3.5 h-3.5 text-amber-400" />
                    <span>Arma Registrada na Ficha:</span>
                  </label>
                  <select
                    value={selectedWeaponId}
                    onChange={(e) => handleSelectSheetWeapon(e.target.value)}
                    className="w-full bg-[var(--fundo3)] px-3 py-2 rounded-xl text-xs font-bold text-[var(--ctexto1)] border border-[var(--bordadg)] cursor-pointer"
                  >
                    <option value="">-- Selecione uma arma para carregar material/FB --</option>
                    {selectedSheet.inventario
                      .filter((i) => i.tipo === 'arma')
                      .map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.nome} (Aptidão {w.aptidao}%, FB: {w.bonusForja || 0})
                        </option>
                      ))}
                  </select>
                </div>
              )}

            </div>

            {/* ESPECIAL SECTION */}
            {damageType === 'especial' && (
              <div className="bg-[var(--fundo3)] p-3.5 rounded-xl border border-[var(--bordadg)] space-y-3">
                <h4 className="text-xs font-bold text-amber-400 uppercase flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Configuração de Dano Especial</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-[var(--ctexto2)] uppercase block mb-1">Valor Base:</label>
                    <input
                      type="number"
                      min="0"
                      value={especialBase}
                      onChange={(e) => setEspecialBase(Number(e.target.value))}
                      className="w-full bg-[var(--fundo1)] px-2.5 py-1.5 rounded-lg text-xs font-bold font-mono text-[var(--ctexto1)] border border-[var(--bordadg)]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[var(--ctexto2)] uppercase block">Atributo (dividido por 2):</label>
                    <div className="flex items-center gap-2">
                      <select
                        value={especialAttr}
                        onChange={(e) => setEspecialAttr(e.target.value as keyof AtributosPersonagem)}
                        className="flex-1 bg-[var(--fundo1)] px-2.5 py-1.5 rounded-lg text-xs font-bold text-[var(--ctexto1)] border border-[var(--bordadg)]"
                      >
                        {Object.keys(attackerAttrs).map((k) => (
                          <option key={k} value={k}>
                            {ATTR_NOME_EXIBICAO[k as keyof AtributosPersonagem]}
                          </option>
                        ))}
                      </select>
                      <AttrBadge attrKey={especialAttr} showName={false} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* DANO ENERGÉTICO ATTR */}
            {damageType === 'energy' && (
              <div className="bg-[var(--fundo3)] p-3.5 rounded-xl border border-[var(--bordadg)] space-y-2">
                <label className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Atributo Correspondente ao Dano Energético:</span>
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={energyAttr}
                    onChange={(e) => setEnergyAttr(e.target.value as keyof AtributosPersonagem)}
                    className="w-full sm:w-64 bg-[var(--fundo1)] px-3 py-1.5 rounded-lg text-xs font-bold text-[var(--ctexto1)] border border-[var(--bordadg)]"
                  >
                    <option value="natureza">Natureza</option>
                    <option value="carisma">Carisma</option>
                    <option value="inteligencia">Inteligência</option>
                    <option value="espiritualidade">Espiritualidade</option>
                    <option value="magia">Magia</option>
                  </select>
                  <AttrBadge attrKey={energyAttr} />
                </div>
                <p className="text-[11px] text-[var(--ctexto2)] italic">
                  * Chance de crítico: 10% por ponto no atributo (máx 50%).
                </p>
              </div>
            )}

            {/* SUBSTITUIR ATRIBUTOS? (APENAS DANO ARMADO) */}
            {(damageType === 'melee' || damageType === 'ranged' || damageType === 'crossbow') && (
              <div className="bg-[var(--fundo3)] p-3.5 rounded-xl border border-[var(--bordadg)] space-y-3">
                <h4 className="text-xs font-bold text-[var(--ctexto1)] uppercase flex items-center gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
                  <span>Substituir Atributos de Ataque?</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[var(--ctexto2)] uppercase block">Primeiro Atributo (Principal):</label>
                    <div className="flex items-center gap-2">
                      <select
                        value={firstAttrSub}
                        onChange={(e) => setFirstAttrSub(e.target.value as any)}
                        className="flex-1 bg-[var(--fundo1)] px-2.5 py-1.5 rounded-lg text-xs text-[var(--ctexto1)] border border-[var(--bordadg)]"
                      >
                        <option value="">Não substituir</option>
                        {Object.keys(attackerAttrs).map((k) => (
                          <option key={k} value={k}>
                            {ATTR_NOME_EXIBICAO[k as keyof AtributosPersonagem]}
                          </option>
                        ))}
                      </select>
                      {firstAttrSub && <AttrBadge attrKey={firstAttrSub} showName={false} />}
                    </div>
                    <label className="inline-flex items-center gap-1.5 text-xs text-[var(--ctexto2)] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={applyBonusToFirst}
                        onChange={(e) => setApplyBonusToFirst(e.target.checked)}
                        className="rounded"
                      />
                      <span>Aplicar bônus percentual?</span>
                    </label>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[var(--ctexto2)] uppercase block">Segundo Atributo (Secundário/2):</label>
                    <div className="flex items-center gap-2">
                      <select
                        value={secondAttrSub}
                        onChange={(e) => setSecondAttrSub(e.target.value as any)}
                        className="flex-1 bg-[var(--fundo1)] px-2.5 py-1.5 rounded-lg text-xs text-[var(--ctexto1)] border border-[var(--bordadg)]"
                      >
                        <option value="">Não substituir</option>
                        {Object.keys(attackerAttrs).map((k) => (
                          <option key={k} value={k}>
                            {ATTR_NOME_EXIBICAO[k as keyof AtributosPersonagem]}
                          </option>
                        ))}
                      </select>
                      {secondAttrSub && <AttrBadge attrKey={secondAttrSub} showName={false} />}
                    </div>
                    <label className="inline-flex items-center gap-1.5 text-xs text-[var(--ctexto2)] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={applyBonusToSecond}
                        onChange={(e) => setApplyBonusToSecond(e.target.checked)}
                        className="rounded"
                      />
                      <span>Aplicar bônus percentual?</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* MATERIAIS DA ARMA (MÁX 2) */}
            {(damageType === 'melee' || damageType === 'ranged' || damageType === 'crossbow') && (
              <div className="bg-[var(--fundo3)] p-3.5 rounded-xl border border-[var(--bordadg)] space-y-3">
                <h4 className="text-xs font-bold text-[var(--ctexto1)] uppercase">Materiais da Arma (máximo 2)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Material 1 */}
                  <div className="space-y-2 bg-[var(--fundo1)] p-2.5 rounded-xl border border-[var(--bordadg)]">
                    <label className="text-[10px] font-bold text-[var(--ctexto2)] uppercase block">Material 1:</label>
                    <select
                      value={mat1Key}
                      onChange={(e) => setMat1Key(e.target.value)}
                      className="w-full bg-[var(--fundo2)] px-2.5 py-1.5 rounded-lg text-xs text-[var(--ctexto1)] border border-[var(--bordadg)]"
                    >
                      <option value="">Nenhum</option>
                      <option value="custom">Outro (Personalizado)</option>
                      {Object.values(MATERIAIS_ARMA).map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.nome} (MAT: {m.mat})
                        </option>
                      ))}
                    </select>

                    {mat1Key === 'custom' && (
                      <div className="grid grid-cols-3 gap-1.5 pt-1">
                        <div>
                          <label className="text-[9px] text-[var(--ctexto2)] block">MAT:</label>
                          <input
                            type="number"
                            value={customMat1.mat}
                            onChange={(e) => setCustomMat1((p) => ({ ...p, mat: Number(e.target.value) }))}
                            className="w-full bg-[var(--fundo2)] px-1.5 py-1 rounded text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-[var(--ctexto2)] block">Bônus:</label>
                          <input
                            type="number"
                            value={customMat1.bonus}
                            onChange={(e) => setCustomMat1((p) => ({ ...p, bonus: Number(e.target.value) }))}
                            className="w-full bg-[var(--fundo2)] px-1.5 py-1 rounded text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-[var(--ctexto2)] block">% Bônus:</label>
                          <input
                            type="number"
                            value={customMat1.percent}
                            onChange={(e) => setCustomMat1((p) => ({ ...p, percent: Number(e.target.value) }))}
                            className="w-full bg-[var(--fundo2)] px-1.5 py-1 rounded text-xs"
                          />
                        </div>
                      </div>
                    )}

                    <label className="inline-flex items-center gap-1.5 text-xs text-[var(--ctexto2)] cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={applyMat1Bonus}
                        onChange={(e) => setApplyMat1Bonus(e.target.checked)}
                        className="rounded"
                      />
                      <span>Aplicar efeito/bônus do material?</span>
                    </label>
                  </div>

                  {/* Material 2 */}
                  <div className="space-y-2 bg-[var(--fundo1)] p-2.5 rounded-xl border border-[var(--bordadg)]">
                    <label className="text-[10px] font-bold text-[var(--ctexto2)] uppercase block">Material 2:</label>
                    <select
                      value={mat2Key}
                      onChange={(e) => setMat2Key(e.target.value)}
                      className="w-full bg-[var(--fundo2)] px-2.5 py-1.5 rounded-lg text-xs text-[var(--ctexto1)] border border-[var(--bordadg)]"
                    >
                      <option value="">Nenhum</option>
                      <option value="custom">Outro (Personalizado)</option>
                      {Object.values(MATERIAIS_ARMA).map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.nome} (MAT: {m.mat})
                        </option>
                      ))}
                    </select>

                    {mat2Key === 'custom' && (
                      <div className="grid grid-cols-3 gap-1.5 pt-1">
                        <div>
                          <label className="text-[9px] text-[var(--ctexto2)] block">MAT:</label>
                          <input
                            type="number"
                            value={customMat2.mat}
                            onChange={(e) => setCustomMat2((p) => ({ ...p, mat: Number(e.target.value) }))}
                            className="w-full bg-[var(--fundo2)] px-1.5 py-1 rounded text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-[var(--ctexto2)] block">Bônus:</label>
                          <input
                            type="number"
                            value={customMat2.bonus}
                            onChange={(e) => setCustomMat2((p) => ({ ...p, bonus: Number(e.target.value) }))}
                            className="w-full bg-[var(--fundo2)] px-1.5 py-1 rounded text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-[var(--ctexto2)] block">% Bônus:</label>
                          <input
                            type="number"
                            value={customMat2.percent}
                            onChange={(e) => setCustomMat2((p) => ({ ...p, percent: Number(e.target.value) }))}
                            className="w-full bg-[var(--fundo2)] px-1.5 py-1 rounded text-xs"
                          />
                        </div>
                      </div>
                    )}

                    <label className="inline-flex items-center gap-1.5 text-xs text-[var(--ctexto2)] cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={applyMat2Bonus}
                        onChange={(e) => setApplyMat2Bonus(e.target.checked)}
                        className="rounded"
                      />
                      <span>Aplicar efeito/bônus do material?</span>
                    </label>
                  </div>

                </div>
              </div>
            )}

            {/* METAIS DE CANALIZAÇÃO */}
            <div className="bg-[var(--fundo3)] p-3.5 rounded-xl border border-[var(--bordadg)] space-y-3">
              <h4 className="text-xs font-bold text-[var(--ctexto1)] uppercase">Metais de Canalização (máximo 2)</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div className="space-y-1.5 bg-[var(--fundo1)] p-2.5 rounded-xl border border-[var(--bordadg)]">
                  <label className="text-[10px] font-bold text-[var(--ctexto2)] uppercase block">Metal de Canalização 1:</label>
                  <select
                    value={chan1Key}
                    onChange={(e) => setChan1Key(e.target.value)}
                    className="w-full bg-[var(--fundo2)] px-2.5 py-1.5 rounded-lg text-xs text-[var(--ctexto1)] border border-[var(--bordadg)]"
                  >
                    <option value="">Nenhum</option>
                    {Object.values(METAIS_CANALIZACAO).map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nome} (+{m.percent}%)
                      </option>
                    ))}
                  </select>
                  <label className="inline-flex items-center gap-1.5 text-xs text-[var(--ctexto2)] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={applyChan1}
                      onChange={(e) => setApplyChan1(e.target.checked)}
                      className="rounded"
                    />
                    <span>Aplicar efeito?</span>
                  </label>
                </div>

                <div className="space-y-1.5 bg-[var(--fundo1)] p-2.5 rounded-xl border border-[var(--bordadg)]">
                  <label className="text-[10px] font-bold text-[var(--ctexto2)] uppercase block">Metal de Canalização 2:</label>
                  <select
                    value={chan2Key}
                    onChange={(e) => setChan2Key(e.target.value)}
                    className="w-full bg-[var(--fundo2)] px-2.5 py-1.5 rounded-lg text-xs text-[var(--ctexto1)] border border-[var(--bordadg)]"
                  >
                    <option value="">Nenhum</option>
                    {Object.values(METAIS_CANALIZACAO).map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nome} (+{m.percent}%)
                      </option>
                    ))}
                  </select>
                  <label className="inline-flex items-center gap-1.5 text-xs text-[var(--ctexto2)] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={applyChan2}
                      onChange={(e) => setApplyChan2(e.target.checked)}
                      className="rounded"
                    />
                    <span>Aplicar efeito?</span>
                  </label>
                </div>

              </div>
            </div>

            {/* BÔNUS DE FORJA (APENAS DANO ARMADO) & DANO BASE DO PODER (APENAS DANO NÃO ARMADO) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(damageType === 'melee' || damageType === 'ranged' || damageType === 'crossbow') && (
                <div className="bg-[var(--fundo3)] p-3.5 rounded-xl border border-[var(--bordadg)]">
                  <label className="text-xs font-bold text-[var(--ctexto1)] block mb-1">Bônus de Forja (FB):</label>
                  <input
                    type="number"
                    min="0"
                    value={forgeBonus}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setForgeBonus(Number(e.target.value))}
                    className="w-full bg-[var(--fundo1)] px-3 py-1.5 rounded-lg text-xs font-bold text-[var(--ctexto1)] border border-[var(--bordadg)]"
                  />
                </div>
              )}

              {damageType !== 'melee' && damageType !== 'ranged' && damageType !== 'crossbow' && (
                <div className="bg-[var(--fundo3)] p-3.5 rounded-xl border border-[var(--bordadg)]">
                  <label className="text-xs font-bold text-[var(--ctexto1)] block mb-1">Dano Base do Poder:</label>
                  <input
                    type="number"
                    min="0"
                    value={abilityDB}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setAbilityDB(Number(e.target.value))}
                    className="w-full bg-[var(--fundo1)] px-3 py-1.5 rounded-lg text-xs font-bold text-[var(--ctexto1)] border border-[var(--bordadg)]"
                  />
                </div>
              )}
            </div>

            {/* VARIÁVEL PERSONALIZADA */}
            <div className="bg-[var(--fundo3)] p-3.5 rounded-xl border border-[var(--bordadg)] space-y-3">
              <h4 className="text-xs font-bold text-[var(--ctexto1)] uppercase flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                <span>Variável Personalizada</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-[var(--ctexto2)] uppercase block mb-1">Tipo:</label>
                  <select
                    value={customVarType}
                    onChange={(e) => setCustomVarType(e.target.value as any)}
                    className="w-full bg-[var(--fundo1)] px-2.5 py-1.5 rounded-lg text-xs font-bold text-[var(--ctexto1)] border border-[var(--bordadg)]"
                  >
                    <option value="none">Nenhum</option>
                    <option value="flat">Número fixo</option>
                    <option value="attribute">Atributo</option>
                    <option value="halfAttribute">Metade de atributo</option>
                  </select>
                </div>

                {(customVarType === 'attribute' || customVarType === 'halfAttribute') && (
                  <div>
                    <label className="text-[10px] font-bold text-[var(--ctexto2)] uppercase block mb-1">Escolha o Atributo:</label>
                    <div className="flex items-center gap-2">
                      <select
                        value={customVarAttr}
                        onChange={(e) => setCustomVarAttr(e.target.value as keyof AtributosPersonagem)}
                        className="flex-1 bg-[var(--fundo1)] px-2.5 py-1.5 rounded-lg text-xs font-bold text-[var(--ctexto1)] border border-[var(--bordadg)]"
                      >
                        {Object.keys(attackerAttrs).map((k) => (
                          <option key={k} value={k}>
                            {ATTR_NOME_EXIBICAO[k as keyof AtributosPersonagem]}
                          </option>
                        ))}
                      </select>
                      <AttrBadge attrKey={customVarAttr} showName={false} />
                    </div>
                  </div>
                )}

                {customVarType === 'flat' && (
                  <div>
                    <label className="text-[10px] font-bold text-[var(--ctexto2)] uppercase block mb-1">Valor Fixo:</label>
                    <input
                      type="number"
                      min="0"
                      value={customVarFlat}
                      onChange={(e) => setCustomVarFlat(Number(e.target.value))}
                      className="w-full bg-[var(--fundo1)] px-2.5 py-1.5 rounded-lg text-xs font-bold font-mono text-[var(--ctexto1)] border border-[var(--bordadg)]"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* BÔNUS DE DANO DOS ATRIBUTOS (%) */}
            <div className="bg-[var(--fundo3)] p-3.5 rounded-xl border border-[var(--bordadg)] space-y-2">
              <h4 className="text-xs font-bold text-[var(--ctexto1)] uppercase flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5 text-emerald-400" />
                <span>Bônus de dano dos atributos (%)</span>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                {[
                  'forca',
                  'destreza',
                  'inteligencia',
                  'natureza',
                  'carisma',
                  'espiritualidade',
                  'magia'
                ].map((key) => {
                  const attrKey = key as keyof AtributosPersonagem;
                  const cfg = ATTR_CONFIG[attrKey];
                  const IconComp = cfg.icon;
                  return (
                    <div key={key} className={`p-2 rounded-xl border text-center space-y-1 ${cfg.bgColor} ${cfg.borderColor}`}>
                      <div className="flex items-center justify-center gap-1">
                        <IconComp className={`w-3 h-3 ${cfg.color} shrink-0`} />
                        <label className={`text-[9px] font-bold uppercase truncate ${cfg.color}`}>{cfg.name}:</label>
                      </div>
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="number"
                          min="0"
                          value={attrBonuses[attrKey] || 0}
                          onChange={(e) =>
                            setAttrBonuses((prev) => ({ ...prev, [attrKey]: Number(e.target.value) }))
                          }
                          className="w-full bg-[var(--fundo1)] px-1.5 py-0.5 rounded text-xs font-mono font-bold text-center text-[var(--ctexto1)] border border-[var(--bordadg)]"
                        />
                        <span className="text-xs font-bold text-[var(--ctexto2)]">%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* BÔNUS EXTRAS (MULTIPLICADORES) */}
            <div className="bg-[var(--fundo3)] p-3.5 rounded-xl border border-[var(--bordadg)] space-y-3">
              <h4 className="text-xs font-bold text-[var(--ctexto1)] uppercase flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-purple-400" />
                <span>Bônus Extras (Somados ao Multiplicador Final)</span>
              </h4>
              <div className="flex flex-wrap items-center gap-2">
                {extraMultipliers.map((m) => (
                  <span key={m.id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-purple-500/20 text-purple-300 text-xs font-bold border border-purple-500/30">
                    +{m.valor}% {m.descricao && `(${m.descricao})`}
                    <button
                      type="button"
                      onClick={() => setExtraMultipliers((prev) => prev.filter((item) => item.id !== m.id))}
                      className="hover:text-rose-400 cursor-pointer ml-1"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2">
                <input
                  type="number"
                  placeholder="Valor %"
                  value={newExtraVal || ''}
                  onChange={(e) => setNewExtraVal(Number(e.target.value))}
                  className="w-full sm:w-28 bg-[var(--fundo1)] px-2.5 py-1.5 rounded-lg text-xs font-bold font-mono text-[var(--ctexto1)] border border-[var(--bordadg)]"
                />
                <input
                  type="text"
                  placeholder="Descrição (ex: 40 (Bênção de Macária))"
                  value={newExtraDesc}
                  onChange={(e) => setNewExtraDesc(e.target.value)}
                  className="w-full flex-1 bg-[var(--fundo1)] px-2.5 py-1.5 rounded-lg text-xs text-[var(--ctexto1)] border border-[var(--bordadg)]"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newExtraVal > 0) {
                      setExtraMultipliers((prev) => [
                        ...prev,
                        { id: `ext_${Date.now()}`, valor: newExtraVal, descricao: newExtraDesc }
                      ]);
                      setNewExtraVal(0);
                      setNewExtraDesc('');
                    }
                  }}
                  className="w-full sm:w-auto px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  Adicionar
                </button>
              </div>
            </div>

            {/* CRÍTICO & CONVERSÃO */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Crítico */}
              <div className="bg-[var(--fundo3)] p-3.5 rounded-xl border border-[var(--bordadg)] space-y-2">
                <label className="inline-flex items-center gap-2 text-xs font-bold text-[var(--ctexto1)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableCritical}
                    onChange={(e) => setEnableCritical(e.target.checked)}
                    className="rounded"
                  />
                  <span>Mostrar dano crítico?</span>
                </label>

                {enableCritical && (
                  <div className="pt-2 border-t border-[var(--bordadg)]">
                    <label className="text-[10px] font-bold text-[var(--ctexto2)] uppercase block mb-1">Bônus de Crítico Adicional (%):</label>
                    <input
                      type="number"
                      min="0"
                      value={criticalBonus}
                      onChange={(e) => setCriticalBonus(Number(e.target.value))}
                      className="w-full bg-[var(--fundo1)] px-2.5 py-1.5 rounded-lg text-xs font-bold font-mono text-[var(--ctexto1)] border border-[var(--bordadg)]"
                    />
                  </div>
                )}
              </div>

              {/* Conversão de Dano */}
              <div className="bg-[var(--fundo3)] p-3.5 rounded-xl border border-[var(--bordadg)] space-y-2">
                <label className="inline-flex items-center gap-2 text-xs font-bold text-[var(--ctexto1)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableConversion}
                    onChange={(e) => setEnableConversion(e.target.checked)}
                    className="rounded"
                  />
                  <span>Converter Dano (Defesa do Defensor)?</span>
                </label>

                {enableConversion && (
                  <div className="space-y-2 pt-2 border-t border-[var(--bordadg)]">
                    <select
                      value={conversionType}
                      onChange={(e) => setConversionType(e.target.value as any)}
                      className="w-full bg-[var(--fundo1)] px-2 py-1 rounded text-xs text-[var(--ctexto1)]"
                    >
                      <option value="single">Único Atributo</option>
                      <option value="split">Dividido entre Dois Atributos</option>
                    </select>

                    {conversionType === 'single' ? (
                      <div className="flex items-center gap-2">
                        <select
                          value={conversionAttr}
                          onChange={(e) => setConversionAttr(e.target.value as keyof AtributosPersonagem)}
                          className="flex-1 bg-[var(--fundo1)] px-2 py-1 rounded text-xs text-[var(--ctexto1)]"
                        >
                          {Object.keys(attackerAttrs).map((k) => (
                            <option key={k} value={k}>
                              {ATTR_NOME_EXIBICAO[k as keyof AtributosPersonagem]}
                            </option>
                          ))}
                        </select>
                        <AttrBadge attrKey={conversionAttr} showName={false} />
                        <input
                          type="number"
                          value={conversionPercent}
                          onChange={(e) => setConversionPercent(Number(e.target.value))}
                          className="w-16 bg-[var(--fundo1)] px-2 py-1 rounded text-xs text-center font-mono font-bold"
                        />
                        <span className="text-xs font-bold">%</span>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <select
                            value={splitAttr1}
                            onChange={(e) => setSplitAttr1(e.target.value as keyof AtributosPersonagem)}
                            className="flex-1 bg-[var(--fundo1)] px-2 py-1 rounded text-xs text-[var(--ctexto1)]"
                          >
                            {Object.keys(attackerAttrs).map((k) => (
                              <option key={k} value={k}>
                                {ATTR_NOME_EXIBICAO[k as keyof AtributosPersonagem]}
                              </option>
                            ))}
                          </select>
                          <AttrBadge attrKey={splitAttr1} showName={false} />
                          <input
                            type="number"
                            value={splitPercent1}
                            onChange={(e) => setSplitPercent1(Number(e.target.value))}
                            className="w-16 bg-[var(--fundo1)] px-2 py-1 rounded text-xs text-center font-mono font-bold"
                          />
                          <span className="text-xs font-bold">%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <select
                            value={splitAttr2}
                            onChange={(e) => setSplitAttr2(e.target.value as keyof AtributosPersonagem)}
                            className="flex-1 bg-[var(--fundo1)] px-2 py-1 rounded text-xs text-[var(--ctexto1)]"
                          >
                            {Object.keys(attackerAttrs).map((k) => (
                              <option key={k} value={k}>
                                {ATTR_NOME_EXIBICAO[k as keyof AtributosPersonagem]}
                              </option>
                            ))}
                          </select>
                          <AttrBadge attrKey={splitAttr2} showName={false} />
                          <input
                            type="number"
                            value={splitPercent2}
                            onChange={(e) => setSplitPercent2(Number(e.target.value))}
                            className="w-16 bg-[var(--fundo1)] px-2 py-1 rounded text-xs text-center font-mono font-bold"
                          />
                          <span className="text-xs font-bold">%</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>

          </div>

          {/* ATRIBUTOS DO DEFENSOR & DEFESA */}
          <div className="bg-[var(--fundo2)] rounded-2xl p-4 sm:p-5 border border-[var(--bordadg)] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="font-cinzel text-sm font-bold text-[var(--ctexto1)] flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-400" />
                <span>Atributos do Defensor</span>
              </h3>

              {/* Defender sheet selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[var(--ctexto2)]">Carregar Ficha Defensor:</span>
                <select
                  value={selectedDefenderSheetId}
                  onChange={(e) => setSelectedDefenderSheetId(e.target.value)}
                  className="bg-[var(--fundo3)] px-2.5 py-1 rounded-lg text-xs text-[var(--ctexto1)] border border-[var(--bordadg)] cursor-pointer"
                >
                  <option value="">-- Manual --</option>
                  {sheets.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {(['constituicao', 'inteligencia', 'natureza', 'magia', 'espiritualidade'] as Array<keyof AtributosPersonagem>).map(
                (k) => {
                  const cfg = ATTR_CONFIG[k];
                  const IconComp = cfg.icon;
                  return (
                    <div key={k} className={`p-2 rounded-xl border text-center transition-all space-y-1 ${cfg.bgColor} ${cfg.borderColor}`}>
                      <div className="flex items-center justify-center gap-1">
                        <IconComp className={`w-3.5 h-3.5 ${cfg.color} shrink-0`} />
                        <label className={`text-[10px] font-bold uppercase truncate ${cfg.color}`}>
                          {cfg.name}
                        </label>
                      </div>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={defenderAttrs[k]}
                        onChange={(e) =>
                          setDefenderAttrs((prev) => ({ ...prev, [k]: Math.max(1, Number(e.target.value)) }))
                        }
                        className="w-full text-center bg-[var(--fundo1)] py-1 rounded-lg font-mono font-bold text-xs text-[var(--ctexto1)] border border-[var(--bordadg)] shadow-inner"
                      />
                    </div>
                  );
                }
              )}
            </div>

            {/* BÔNUS DE DEFESA */}
            <div className="bg-[var(--fundo3)] p-3 rounded-xl border border-[var(--bordadg)] space-y-2">
              <label className="text-xs font-bold text-[var(--ctexto1)] flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-blue-400" />
                <span>Bônus de Defesa (% de Redução):</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {defenseBonuses.map((b) => (
                  <span key={b.id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-500/30">
                    +{b.valor}% {b.descricao && `(${b.descricao})`}
                    <button
                      type="button"
                      onClick={() => setDefenseBonuses((prev) => prev.filter((item) => item.id !== b.id))}
                      className="hover:text-rose-400 cursor-pointer ml-1"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                <input
                  type="number"
                  placeholder="Ex: 20"
                  value={newDefVal || ''}
                  onChange={(e) => setNewDefVal(Number(e.target.value))}
                  className="w-full sm:w-28 bg-[var(--fundo1)] px-2.5 py-1.5 rounded-lg text-xs font-bold font-mono text-[var(--ctexto1)] border border-[var(--bordadg)]"
                />
                <input
                  type="text"
                  placeholder="Descrição (ex: Escudo Mágico, Pele de Pedra)"
                  value={newDefDesc}
                  onChange={(e) => setNewDefDesc(e.target.value)}
                  className="w-full flex-1 bg-[var(--fundo1)] px-2.5 py-1.5 rounded-lg text-xs text-[var(--ctexto1)] border border-[var(--bordadg)]"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newDefVal > 0) {
                      setDefenseBonuses((prev) => [
                        ...prev,
                        { id: `def_${Date.now()}`, valor: newDefVal, descricao: newDefDesc }
                      ]);
                      setNewDefVal(0);
                      setNewDefDesc('');
                    }
                  }}
                  className="w-full sm:w-auto px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  Adicionar Defesa
                </button>
              </div>
            </div>

            {/* EFEITOS EXTRAS (Vampirismo, Dano em Área, Dano Verdadeiro) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="bg-[var(--fundo3)] p-3 rounded-xl border border-[var(--bordadg)] space-y-1.5">
                <label className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--ctexto1)] cursor-pointer">
                  <input type="checkbox" checked={vampirismo} onChange={(e) => setVampirismo(e.target.checked)} className="rounded" />
                  <Heart className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Vampirismo</span>
                </label>
                {vampirismo && (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={vampirismoPercent}
                      onChange={(e) => setVampirismoPercent(Number(e.target.value))}
                      className="w-20 bg-[var(--fundo1)] px-2 py-1 rounded text-xs text-center font-mono font-bold"
                    />
                    <span className="text-xs font-bold text-[var(--ctexto2)]">% Cura</span>
                  </div>
                )}
              </div>

              <div className="bg-[var(--fundo3)] p-3 rounded-xl border border-[var(--bordadg)] space-y-1.5">
                <label className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--ctexto1)] cursor-pointer">
                  <input type="checkbox" checked={areaDamage} onChange={(e) => setAreaDamage(e.target.checked)} className="rounded" />
                  <Activity className="w-3.5 h-3.5 text-purple-400" />
                  <span>Dano em Área</span>
                </label>
                {areaDamage && (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={areaDamagePercent}
                      onChange={(e) => setAreaDamagePercent(Number(e.target.value))}
                      className="w-20 bg-[var(--fundo1)] px-2 py-1 rounded text-xs text-center font-mono font-bold"
                    />
                    <span className="text-xs font-bold text-[var(--ctexto2)]">% Dano</span>
                  </div>
                )}
              </div>

              <div className="bg-[var(--fundo3)] p-3 rounded-xl border border-[var(--bordadg)] space-y-1.5">
                <label className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--ctexto1)] cursor-pointer">
                  <input type="checkbox" checked={trueDamage} onChange={(e) => setTrueDamage(e.target.checked)} className="rounded" />
                  <Flame className="w-3.5 h-3.5 text-rose-400" />
                  <span>Dano Verdadeiro</span>
                </label>
                {trueDamage && (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={trueDamagePercent}
                      onChange={(e) => setTrueDamagePercent(Number(e.target.value))}
                      className="w-20 bg-[var(--fundo1)] px-2 py-1 rounded text-xs text-center font-mono font-bold"
                    />
                    <span className="text-xs font-bold text-[var(--ctexto2)]">% Ignora</span>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* CALCULATE DAMAGE BUTTON */}
          <button
            type="button"
            onClick={handleCalculateDamage}
            style={activeGodColor ? { backgroundColor: activeGodColor } : undefined}
            className={`w-full py-3.5 ${
              activeGodColor ? 'hover:opacity-90' : 'bg-blue-600 hover:bg-blue-500'
            } text-white font-cinzel text-base font-bold rounded-2xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2`}
          >
            <Flame className="w-5 h-5" />
            <span>Calcular Dano</span>
          </button>

          {/* DAMAGE RESULTS DISPLAY */}
          {damageResult && (
            <div className="bg-[var(--fundo2)] rounded-2xl p-5 border border-rose-500/30 shadow-xl space-y-5 animate-fadeIn">
              <h3 className="font-cinzel text-lg font-bold text-rose-400 border-b border-[var(--bordadg)] pb-2 flex items-center justify-between">
                <span>Resultado do Cálculo de Dano</span>
                <span className="text-xs font-sans text-[var(--ctexto2)]">Bruto: {damageResult.rawDamage.toFixed(1)}</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[var(--fundo3)] p-4 rounded-xl border border-[var(--bordadg)] text-center space-y-1">
                  <span className="text-xs uppercase font-bold text-[var(--ctexto2)]">Dano Normal</span>
                  <div className="text-3xl font-extrabold text-rose-400">{damageResult.normalDamage}</div>
                </div>

                {enableCritical && (
                  <div className="bg-[var(--fundo3)] p-4 rounded-xl border border-amber-500/30 text-center space-y-1">
                    <span className="text-xs uppercase font-bold text-amber-400">Dano Crítico</span>
                    <div className="text-3xl font-extrabold text-amber-400">{damageResult.criticalDamage}</div>
                  </div>
                )}
              </div>

              {(damageResult.vampirismHeal > 0 || damageResult.areaDamage > 0) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-bold">
                  {damageResult.vampirismHeal > 0 && (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 p-2.5 rounded-xl text-emerald-400 text-center">
                      💚 Cura por Vampirismo: +{damageResult.vampirismHeal} Vida
                    </div>
                  )}
                  {damageResult.areaDamage > 0 && (
                    <div className="bg-purple-500/10 border border-purple-500/30 p-2.5 rounded-xl text-purple-300 text-center">
                      💥 Dano Secundário em Área: {damageResult.areaDamage}
                    </div>
                  )}
                </div>
              )}

              {/* Breakdown Logs */}
              <div className="bg-[var(--fundo1)] p-4 rounded-xl border border-[var(--bordadg)] space-y-1 font-mono text-xs text-[var(--ctexto1)] leading-relaxed">
                <div className="font-bold text-amber-400 mb-2 font-sans uppercase tracking-wider text-[11px]">
                  Detalhamento do Cálculo:
                </div>
                {damageResult.breakdownLines.map((line, idx) => (
                  <div key={idx} className="border-b border-[var(--bordadg)]/40 pb-1 last:border-0">
                    {line}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: CALCULADORA DE ACERTO                                            */}
      {/* ========================================================================= */}
      {activeSubTab === 'acerto' && (
        <div className="space-y-6">
          
          {/* ATRIBUTOS */}
          <div className="bg-[var(--fundo2)] rounded-2xl p-4 sm:p-5 border border-[var(--bordadg)] space-y-3">
            <h3 className="font-cinzel text-sm font-bold text-[var(--ctexto1)] flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-blue-400" />
              <span>Atributos</span>
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
              {(Object.keys(attackerAttrs) as Array<keyof AtributosPersonagem>).map((attrKey) => {
                const cfg = ATTR_CONFIG[attrKey];
                const IconComp = cfg.icon;
                return (
                  <div key={attrKey} className={`p-2 rounded-xl border text-center transition-all space-y-1 ${cfg.bgColor} ${cfg.borderColor}`}>
                    <div className="flex items-center justify-center gap-1">
                      <IconComp className={`w-3.5 h-3.5 ${cfg.color} shrink-0`} />
                      <label className={`text-[10px] font-bold uppercase truncate ${cfg.color}`}>
                        {cfg.name}
                      </label>
                    </div>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={attackerAttrs[attrKey]}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) =>
                        setAttackerAttrs((prev) => ({ ...prev, [attrKey]: Math.max(1, Number(e.target.value)) }))
                      }
                      className="w-full text-center bg-[var(--fundo1)] py-1 rounded-lg font-mono font-bold text-xs text-[var(--ctexto1)] border border-[var(--bordadg)] shadow-inner"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* ARMAS PARA ACERTO */}
          <div className="bg-[var(--fundo2)] rounded-2xl p-4 sm:p-5 border border-[var(--bordadg)] space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-cinzel text-sm font-bold text-[var(--ctexto1)] flex items-center gap-2">
                <Swords className="w-4 h-4 text-rose-400" />
                <span>Armas para Teste de Acerto</span>
              </h3>
              <button
                type="button"
                onClick={handleAddHitWeapon}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nova Arma</span>
              </button>
            </div>

            <div className="space-y-2">
              {hitWeapons.map((w, idx) => (
                <div key={w.id} className="flex flex-col sm:flex-row items-center gap-2 bg-[var(--fundo3)] p-2.5 rounded-xl border border-[var(--bordadg)]">
                  <input
                    type="text"
                    placeholder="Nome da Arma"
                    value={w.nome}
                    onChange={(e) => {
                      const val = e.target.value;
                      setHitWeapons((prev) => prev.map((item) => (item.id === w.id ? { ...item, nome: val } : item)));
                    }}
                    className="w-full sm:flex-1 bg-[var(--fundo1)] px-2.5 py-1.5 rounded-lg text-xs text-[var(--ctexto1)] border border-[var(--bordadg)]"
                  />
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] uppercase font-bold text-[var(--ctexto2)]">Aptidão:</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={w.aptidao}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setHitWeapons((prev) => prev.map((item) => (item.id === w.id ? { ...item, aptidao: val } : item)));
                        }}
                        className="w-16 bg-[var(--fundo1)] px-2 py-1 rounded-lg text-xs font-bold font-mono text-center border border-[var(--bordadg)]"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] uppercase font-bold text-[var(--ctexto2)]">Bônus Crítico:</span>
                      <input
                        type="number"
                        value={w.bonusCritico}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setHitWeapons((prev) => prev.map((item) => (item.id === w.id ? { ...item, bonusCritico: val } : item)));
                        }}
                        className="w-16 bg-[var(--fundo1)] px-2 py-1 rounded-lg text-xs font-bold font-mono text-center border border-[var(--bordadg)]"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveHitWeapon(w.id)}
                      className="p-1.5 text-[var(--ctexto2)] hover:text-rose-400 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* BÔNUS DE OUTRAS AÇÕES DE ACERTO */}
          <div className="bg-[var(--fundo2)] rounded-2xl p-4 sm:p-5 border border-[var(--bordadg)] space-y-4">
            <h3 className="font-cinzel text-sm font-bold text-[var(--ctexto1)] flex items-center gap-2">
              <Award className="w-4 h-4 text-purple-400" />
              <span>Bônus de Outras Ações</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(NOMES_ACOES_ACERTO).map(([tipoKey, meta]) => {
                const opt = hitActionOptions[tipoKey] || { bonus: 0, quebra: false, ignorar: false };
                const ActionIcon = ACTION_ICON_MAP[tipoKey] || Crosshair;

                return (
                  <div key={tipoKey} className="bg-[var(--fundo3)] p-3 rounded-xl border border-[var(--bordadg)] space-y-2">
                    <label className="text-xs font-bold text-[var(--ctexto1)] flex items-center gap-1.5 truncate">
                      <ActionIcon className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span className="truncate">{meta.nome}</span>
                    </label>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold text-[var(--ctexto2)]">Bônus:</span>
                      <input
                        type="number"
                        value={opt.bonus}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setHitActionOptions((prev) => ({
                            ...prev,
                            [tipoKey]: { ...prev[tipoKey], bonus: val }
                          }));
                        }}
                        className="w-20 bg-[var(--fundo1)] px-2 py-1 rounded-lg text-xs font-mono font-bold text-center border border-[var(--bordadg)]"
                      />
                    </div>

                    <div className="flex items-center gap-3 pt-1 text-xs text-[var(--ctexto2)]">
                      <label className="inline-flex items-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={opt.quebra}
                          onChange={(e) => {
                            const val = e.target.checked;
                            setHitActionOptions((prev) => ({
                              ...prev,
                              [tipoKey]: { ...prev[tipoKey], quebra: val }
                            }));
                          }}
                          className="rounded"
                        />
                        <span>Quebrar teto</span>
                      </label>

                      <label className="inline-flex items-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={opt.ignorar}
                          onChange={(e) => {
                            const val = e.target.checked;
                            setHitActionOptions((prev) => ({
                              ...prev,
                              [tipoKey]: { ...prev[tipoKey], ignorar: val }
                            }));
                          }}
                          className="rounded"
                        />
                        <span>Não incluir</span>
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* TOAST / FEEDBACK NOTIFICATION */}
          {saveFeedbackMsg && (
            <div className="bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between shadow-lg animate-fadeIn">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{saveFeedbackMsg}</span>
              </div>
              <button
                type="button"
                onClick={() => setSaveFeedbackMsg(null)}
                className="text-emerald-400 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* CALCULATE & SAVE ACTIONS */}
          <div className="flex flex-col sm:flex-row gap-2.5">
            <button
              type="button"
              onClick={handleCalculateHit}
              style={activeGodColor ? { backgroundColor: activeGodColor } : undefined}
              className={`flex-1 py-3.5 ${
                activeGodColor ? 'hover:opacity-90' : 'bg-blue-600 hover:bg-blue-500'
              } text-white font-cinzel text-base font-bold rounded-2xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2`}
            >
              <Crosshair className="w-5 h-5" />
              <span>Calcular Acertos</span>
            </button>

            {selectedSheet && hitResultsText && (
              <button
                type="button"
                onClick={handleSaveHitResultsToSheet}
                className="px-5 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-cinzel text-sm font-bold rounded-2xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0"
                title={`Salvar resultado na ficha de ${selectedSheet.nome}`}
              >
                <BookmarkCheck className="w-5 h-5" />
                <span>Salvar na Ficha ({selectedSheet.nome})</span>
              </button>
            )}
          </div>

          {/* HIT RESULTS DISPLAY */}
          {hitResultsText && (
            <div className="bg-[var(--fundo2)] rounded-2xl p-5 border border-blue-500/30 shadow-xl space-y-3 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--bordadg)] pb-2">
                <h3 className="font-cinzel text-base font-bold text-blue-400 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  <span>Resultado das Faixas de Acerto</span>
                </h3>

                <div className="flex items-center gap-2 flex-wrap">
                  {selectedSheet && (
                    <button
                      type="button"
                      onClick={handleSaveHitResultsToSheet}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Salvar na Ficha ({selectedSheet.nome})</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      if (hitResultsText) {
                        navigator.clipboard.writeText(hitResultsText);
                        setCopiedHitResults(true);
                        setTimeout(() => setCopiedHitResults(false), 2000);
                      }
                    }}
                    className="px-3 py-1.5 bg-[var(--fundo3)] hover:bg-[var(--fundo4)] text-[var(--ctexto2)] hover:text-[var(--ctexto1)] border border-[var(--bordadg)] text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    {copiedHitResults ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="bg-[#111827] p-4 rounded-xl border border-gray-800 font-mono text-xs text-emerald-400 leading-relaxed whitespace-pre-wrap select-all">
                {hitResultsText}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
