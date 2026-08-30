import React, { useState, useEffect, useMemo } from 'react';
import { Deus, Ramo, Poder, FichaPersonagem, AtributosPersonagem } from '../types';
import { INITIAL_DEUSES } from '../data/defaultData';
import { 
  calculateSheetPoints, 
  getAttributePointsBudget, 
  getSpentAttributePoints, 
  normalizeAttributes, 
  calculateCombatStatus,
  getEffectivePowerType
} from '../utils/calculator';
import { generateForumBBCode } from '../utils/bbcode';
import { matchesAnySearchQuery } from '../utils/textUtils';
import { PowerIcon } from './PowerIcon';
import { GameIcon } from './GameIcon';
import { BBCodeRenderer } from './BBCodeRenderer';
import { DifficultyIndicator } from './DifficultyIndicator';
import { InventoryManager } from './InventoryManager';
import { 
  X, 
  Save, 
  Sparkles, 
  Shield, 
  Zap, 
  Heart, 
  Brain, 
  Flame, 
  Plus, 
  Minus, 
  RotateCcw, 
  Copy, 
  Check, 
  FileCode, 
  Swords, 
  ChevronRight,
  Activity,
  Award,
  Search,
  Leaf,
  Target,
  AlertTriangle,
  CheckCircle2,
  User,
  BicepsFlexed,
  Package
} from 'lucide-react';

interface CharacterSheetEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  sheet: FichaPersonagem;
  deuses: Deus[];
  ramos: Ramo[];
  poderes: Poder[];
  onSave: (updatedSheet: FichaPersonagem) => void;
  isNew?: boolean;
}

export const CharacterSheetEditorModal: React.FC<CharacterSheetEditorModalProps> = ({
  isOpen,
  onClose,
  sheet,
  deuses,
  ramos,
  poderes,
  onSave,
  isNew = false
}) => {
  const [formData, setFormData] = useState<FichaPersonagem>(sheet);
  const [editorMode, setEditorMode] = useState<'evolucao' | 'planejamento'>('evolucao');
  const [activeSubTab, setActiveSubTab] = useState<'atributos' | 'poderes' | 'inventario' | 'bbcode'>('atributos');
  const [bbcodeMode, setBbcodeMode] = useState<'delta' | 'full'>(isNew ? 'full' : 'delta');
  const [activeBranchFilter, setActiveBranchFilter] = useState<string>('all');
  const [searchPowerQuery, setSearchPowerQuery] = useState<string>('');
  const [copiedBBCode, setCopiedBBCode] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Pop-ups states
  const [suggestPlanningModal, setSuggestPlanningModal] = useState<{
    open: boolean;
    reason: string;
    pendingAction?: () => void;
  } | null>(null);

  const [planConflictModal, setPlanConflictModal] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Alphabetically sorted deuses
  const sortedDeuses = [...deuses].sort((a, b) =>
    a.nome_grego_romano.localeCompare(b.nome_grego_romano, 'pt-BR')
  );

  useEffect(() => {
    if (isOpen) {
      const normalizedAttrs = normalizeAttributes(sheet.atributos);
      const planAttrs = sheet.planejamento?.atributos_planejados 
        ? normalizeAttributes(sheet.planejamento.atributos_planejados)
        : undefined;

      setFormData({
        ...sheet,
        atributos: normalizedAttrs,
        planejamento: {
          poderes_planejados: sheet.planejamento?.poderes_planejados || { ...(sheet.poderes_comprados || {}) },
          atributos_planejados: planAttrs || { ...normalizedAttrs }
        }
      });
      setEditorMode('evolucao'); // Modo evolução é sempre o default
      setBbcodeMode(isNew ? 'full' : 'delta');
      setCopiedBBCode(false);
      setSuggestPlanningModal(null);
      setPlanConflictModal(null);
    }
  }, [isOpen, sheet, isNew]);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const selectedDeus = deuses.find((d) => d.id === formData.deus_id) || deuses[0] || {
    id: 'poseidon',
    nome_grego_romano: 'Poseidon / Netuno',
    cor_hex: '#0ea5e9',
    atributos_principais: 'Natureza / Força',
    descricao: 'Senhor dos Mares'
  };

  const godColor = selectedDeus.cor_hex || '#3b82f6';
  const godIcon = (selectedDeus?.icone_url || selectedDeus?.icone_css || selectedDeus?.simbolo || (selectedDeus as any)?.game_icon || (selectedDeus as any)?.icone || '').trim();
  const godRamos = ramos.filter((r) => r.deus_id === selectedDeus.id);
  const godBranchIds = new Set(godRamos.map((r) => r.id));
  const godPoderes = poderes.filter((p) => godBranchIds.has(p.ramo_id));

  // Active Data Resolution depending on Mode
  const isPlanningMode = editorMode === 'planejamento';

  // Evolution Data
  const evolutionAttributes: AtributosPersonagem = normalizeAttributes(formData.atributos);
  const evolutionPowers: Record<string, number> = formData.poderes_comprados || {};
  const evolutionAttrBudget = getAttributePointsBudget(formData.nivel);
  const evolutionAttrSpent = getSpentAttributePoints(evolutionAttributes);
  const evolutionAttrRemaining = evolutionAttrBudget - evolutionAttrSpent;
  const evolutionPowersCalc = calculateSheetPoints(
    formData.nivel,
    evolutionPowers,
    godPoderes,
    godRamos
  );

  // Planning Data (Simulated at Level 40, max 20 attribute points and 40 power points)
  const planningAttributes: AtributosPersonagem = normalizeAttributes(
    formData.planejamento?.atributos_planejados || formData.atributos
  );
  const planningPowers: Record<string, number> = formData.planejamento?.poderes_planejados || { ...evolutionPowers };
  const planningAttrBudget = 20; // 40 / 2 = 20 pts max
  const planningAttrSpent = getSpentAttributePoints(planningAttributes);
  const planningAttrRemaining = planningAttrBudget - planningAttrSpent;
  const planningPowersCalc = calculateSheetPoints(
    40,
    planningPowers,
    godPoderes,
    godRamos
  );

  // Active references based on current mode
  const currentAttributes = isPlanningMode ? planningAttributes : evolutionAttributes;
  const attributePointsBudget = isPlanningMode ? planningAttrBudget : evolutionAttrBudget;
  const attributePointsSpent = isPlanningMode ? planningAttrSpent : evolutionAttrSpent;
  const attributePointsRemaining = isPlanningMode ? planningAttrRemaining : evolutionAttrRemaining;
  const calcResult = isPlanningMode ? planningPowersCalc : evolutionPowersCalc;

  // Combat Status Calculations (Vida, Mana, Vigor) - calculated based on character's actual level & current active attributes
  const statusLevel = isPlanningMode ? 40 : formData.nivel;
  const statusValues = calculateCombatStatus(statusLevel, currentAttributes);
  const baseStatus = 100 + (10 * Math.max(1, Math.min(70, statusLevel)));
  const constBonus = Math.max(0, (currentAttributes.constituicao || 1) - 1) * 25;
  const forcaBonus = Math.max(0, (currentAttributes.forca || 1) - 1) * 25;
  const magiaBonus = Math.max(0, (currentAttributes.magia || 1) - 1) * 25;
  const espirBonus = Math.max(0, (currentAttributes.espiritualidade || 1) - 1) * 25;

  // Check if a real planning has been configured (meaning it has higher points or custom distribution than current evolution)
  const hasActiveAttributePlanning = useMemo(() => {
    if (planningAttrSpent === 0) return false;
    const stats: (keyof AtributosPersonagem)[] = [
      'forca', 'destreza', 'agilidade', 'constituicao',
      'inteligencia', 'carisma', 'natureza', 'magia', 'espiritualidade'
    ];
    return stats.some((s) => (planningAttributes[s] || 1) > (evolutionAttributes[s] || 1));
  }, [planningAttrSpent, planningAttributes, evolutionAttributes]);

  const hasActivePowerPlanning = useMemo(() => {
    return Object.entries(planningPowers).some(([pid, lvl]) => lvl > (evolutionPowers[pid] || 0));
  }, [planningPowers, evolutionPowers]);

  // --- Attribute Handlers ---
  const applyAttributeChange = (stat: keyof AtributosPersonagem, targetLevel: number, forcePlanningMode?: boolean) => {
    const isPlan = forcePlanningMode !== undefined ? forcePlanningMode : isPlanningMode;

    if (isPlan) {
      // In planning mode, ONLY edit formData.planejamento.atributos_planejados
      setFormData((prev) => {
        const currentPlanAttrs = normalizeAttributes(prev.planejamento?.atributos_planejados || prev.atributos);
        const updatedPlanAttrs = {
          ...currentPlanAttrs,
          [stat]: targetLevel
        };
        return {
          ...prev,
          planejamento: {
            ...prev.planejamento,
            atributos_planejados: updatedPlanAttrs,
            poderes_planejados: prev.planejamento?.poderes_planejados || { ...(prev.poderes_comprados || {}) }
          }
        };
      });
    } else {
      // In evolution mode, edit formData.atributos and automatically ensure planning is at least this level
      setFormData((prev) => {
        const currentEvolAttrs = normalizeAttributes(prev.atributos);
        const currentPlanAttrs = normalizeAttributes(prev.planejamento?.atributos_planejados || prev.atributos);
        const updatedEvolAttrs = {
          ...currentEvolAttrs,
          [stat]: targetLevel
        };
        const updatedPlanAttrs = {
          ...currentPlanAttrs,
          [stat]: Math.max(currentPlanAttrs[stat] || 1, targetLevel)
        };

        return {
          ...prev,
          atributos: updatedEvolAttrs,
          planejamento: {
            ...prev.planejamento,
            atributos_planejados: updatedPlanAttrs,
            poderes_planejados: prev.planejamento?.poderes_planejados || { ...(prev.poderes_comprados || {}) }
          }
        };
      });
    }
  };

  const handleSetAttributeLevel = (stat: keyof AtributosPersonagem, targetLevel: number) => {
    const currentVal = currentAttributes[stat] || 1;
    const clampedTarget = Math.min(5, Math.max(1, targetLevel));

    // If clicking on dot 1 when already at 1, do nothing
    if (clampedTarget === 1 && currentVal === 1) {
      return;
    }

    // Determine intended new level
    const intendedLevel = (clampedTarget === currentVal) ? Math.max(1, currentVal - 1) : clampedTarget;

    // In Evolution Mode: Check if exceeding points budget
    if (!isPlanningMode) {
      if (intendedLevel > currentVal) {
        const pointsNeeded = intendedLevel - currentVal;
        if (attributePointsRemaining < pointsNeeded) {
          // Trigger Suggest Planning Mode Popup instead of simple block!
          setSuggestPlanningModal({
            open: true,
            reason: `Você precisa de ${pointsNeeded} ponto(s) de atributo, mas possui apenas ${attributePointsRemaining} disponível(is) no Nível ${formData.nivel}.`,
            pendingAction: () => {
              // Action to perform in planning mode
              setEditorMode('planejamento');
              const planRemaining = 20 - getSpentAttributePoints(planningAttributes);
              if (planRemaining >= pointsNeeded) {
                applyAttributeChange(stat, intendedLevel, true);
                showToast(`Entrou no Modo Planejamento e definiu ${stat.toUpperCase()} para Nível ${intendedLevel}!`);
              } else {
                showToast('Entrou no Modo Planejamento.');
              }
            }
          });
          return;
        }

        // Check if combining this evolution choice with active planning exceeds 20 points
        if (hasActiveAttributePlanning) {
          const mergedPlanAttrs: AtributosPersonagem = {
            ...planningAttributes,
            [stat]: Math.max(planningAttributes[stat] || 1, intendedLevel)
          };
          const mergedAttrSpent = getSpentAttributePoints(mergedPlanAttrs);

          if (mergedAttrSpent > 20) {
            setPlanConflictModal({
              open: true,
              title: 'Limite do Planejamento Excedido',
              message: `Definir ${stat.toUpperCase()} para o Nível ${intendedLevel} fará com que a soma da evolução com os atributos planejados ultrapasse o limite total de 20 pontos de atributos (${mergedAttrSpent}/20 pts). Deseja prosseguir e ajustar o planejamento?`,
              onConfirm: () => {
                applyAttributeChange(stat, intendedLevel);
                setPlanConflictModal(null);
                showToast(`${stat.toUpperCase()} atualizado para Nível ${intendedLevel} (planejamento sincronizado).`);
              }
            });
            return;
          }
        }
      }
    } else {
      // In Planning Mode: Check if exceeding 20 points budget
      if (intendedLevel > currentVal) {
        const pointsNeeded = intendedLevel - currentVal;
        if (attributePointsRemaining < pointsNeeded) {
          showToast(`Limite de 20 pontos de atributos no planejamento atingido!`);
          return;
        }
      }
    }

    applyAttributeChange(stat, intendedLevel);
  };

  const handleModifyAttribute = (stat: keyof AtributosPersonagem, delta: number) => {
    const currentVal = currentAttributes[stat] || 1;
    const newVal = Math.min(5, Math.max(1, currentVal + delta));
    if (newVal === currentVal) return;
    handleSetAttributeLevel(stat, newVal);
  };

  const handleResetAttributes = () => {
    const baseAttrs: AtributosPersonagem = {
      forca: 1,
      destreza: 1,
      agilidade: 1,
      constituicao: 1,
      inteligencia: 1,
      carisma: 1,
      natureza: 1,
      magia: 1,
      espiritualidade: 1
    };

    if (isPlanningMode) {
      setFormData((prev) => ({
        ...prev,
        planejamento: {
          ...prev.planejamento,
          atributos_planejados: { ...baseAttrs },
          poderes_planejados: prev.planejamento?.poderes_planejados || { ...(prev.poderes_comprados || {}) }
        }
      }));
      showToast('Planejamento de atributos resetado para a base.');
    } else {
      setFormData((prev) => ({
        ...prev,
        atributos: { ...baseAttrs }
      }));
      showToast('Atributos de evolução restaurados para a base.');
    }
  };

  // --- Power Handlers ---
  const applyPowerChange = (poderId: string, targetLevel: number, forcePlanningMode?: boolean) => {
    const isPlan = forcePlanningMode !== undefined ? forcePlanningMode : isPlanningMode;

    if (isPlan) {
      setFormData((prev) => {
        const updatedPlanPowers = { ...(prev.planejamento?.poderes_planejados || { ...(prev.poderes_comprados || {}) }) };
        if (targetLevel <= 0) {
          delete updatedPlanPowers[poderId];
        } else {
          updatedPlanPowers[poderId] = targetLevel;
        }

        return {
          ...prev,
          planejamento: {
            ...prev.planejamento,
            poderes_planejados: updatedPlanPowers,
            atributos_planejados: prev.planejamento?.atributos_planejados || { ...normalizeAttributes(prev.atributos) }
          }
        };
      });
    } else {
      setFormData((prev) => {
        const updatedEvolPowers = { ...(prev.poderes_comprados || {}) };
        if (targetLevel <= 0) {
          delete updatedEvolPowers[poderId];
        } else {
          updatedEvolPowers[poderId] = targetLevel;
        }

        const updatedPlanPowers = { ...(prev.planejamento?.poderes_planejados || { ...(prev.poderes_comprados || {}) }) };
        if (targetLevel > (updatedPlanPowers[poderId] || 0)) {
          updatedPlanPowers[poderId] = targetLevel;
        }

        return {
          ...prev,
          poderes_comprados: updatedEvolPowers,
          planejamento: {
            ...prev.planejamento,
            poderes_planejados: updatedPlanPowers,
            atributos_planejados: prev.planejamento?.atributos_planejados || { ...normalizeAttributes(prev.atributos) }
          }
        };
      });
    }
  };

  const handleSetPowerLevel = (poderId: string, targetLevel: number) => {
    const activePowers = isPlanningMode ? planningPowers : evolutionPowers;
    const currentPurchased = activePowers[poderId] || 0;

    // Lowering or removing power level -> always allowed immediately
    if (targetLevel <= currentPurchased) {
      applyPowerChange(poderId, targetLevel);
      return;
    }

    // Increasing level check
    const testPurchased = { ...activePowers };
    testPurchased[poderId] = targetLevel;

    const testResult = calculateSheetPoints(
      isPlanningMode ? 40 : formData.nivel,
      testPurchased,
      godPoderes,
      godRamos
    );

    if (testResult.pointsRemaining < 0) {
      if (!isPlanningMode) {
        // Trigger Suggest Planning Mode Popup instead of simple block!
        const powerObj = godPoderes.find((p) => p.id === poderId);
        setSuggestPlanningModal({
          open: true,
          reason: `Você não possui pontos de poder suficientes no seu nível atual (Nível ${formData.nivel}) para adquirir o Nível ${targetLevel} de "${powerObj?.nome || 'Poder'}".`,
          pendingAction: () => {
            setEditorMode('planejamento');
            const testPlan = { ...planningPowers, [poderId]: targetLevel };
            const testPlanResult = calculateSheetPoints(40, testPlan, godPoderes, godRamos);
            if (testPlanResult.pointsRemaining >= 0) {
              applyPowerChange(poderId, targetLevel, true);
              showToast(`Entrou no Modo Planejamento e adicionou Nível ${targetLevel} de "${powerObj?.nome || 'Poder'}"!`);
            } else {
              showToast('Entrou no Modo Planejamento.');
            }
          }
        });
        return;
      } else {
        showToast('Limite de 40 pontos de poder do planejamento atingido!');
        return;
      }
    }

    // If in Evolution Mode and an active power planning exists, check if combining evolution + planned powers exceeds 40 points
    if (!isPlanningMode && hasActivePowerPlanning) {
      const mergedPlanPowers: Record<string, number> = {
        ...planningPowers,
        [poderId]: Math.max(planningPowers[poderId] || 0, targetLevel)
      };

      const testMerged = calculateSheetPoints(40, mergedPlanPowers, godPoderes, godRamos);
      if (testMerged.pointsRemaining < 0) {
        const powerObj = godPoderes.find((p) => p.id === poderId);
        setPlanConflictModal({
          open: true,
          title: 'Limite do Planejamento Excedido',
          message: `Adquirir o Nível ${targetLevel} de "${powerObj?.nome || 'Poder'}" fará com que a soma da evolução com os poderes planejados ultrapasse o limite total de 40 pontos de poder (${testMerged.totalPointsSpent}/40 pts). Deseja prosseguir e ajustar o planejamento?`,
          onConfirm: () => {
            applyPowerChange(poderId, targetLevel);
            setPlanConflictModal(null);
            showToast(`Poder "${powerObj?.nome || 'Poder'}" atualizado para Nível ${targetLevel} (planejamento sincronizado).`);
          }
        });
        return;
      }
    }

    applyPowerChange(poderId, targetLevel);
  };

  const handleResetPowers = () => {
    if (isPlanningMode) {
      setFormData((prev) => ({
        ...prev,
        planejamento: {
          ...prev.planejamento,
          poderes_planejados: { ...(prev.poderes_comprados || {}) },
          atributos_planejados: prev.planejamento?.atributos_planejados || { ...evolutionAttributes }
        }
      }));
      showToast('Planejamento de poderes resetado para a evolução atual.');
    } else {
      setFormData((prev) => ({
        ...prev,
        poderes_comprados: {}
      }));
      showToast('Investimentos de poderes da evolução resetados.');
    }
  };

  const handleSyncPlanningWithEvolution = () => {
    setFormData((prev) => ({
      ...prev,
      planejamento: {
        poderes_planejados: { ...(prev.poderes_comprados || {}) },
        atributos_planejados: { ...normalizeAttributes(prev.atributos) }
      }
    }));
    showToast('Planejamento sincronizado com a evolução atual!');
  };

  const handleLevelChange = (lvl: number) => {
    const clamped = Math.min(70, Math.max(1, isNaN(lvl) ? 1 : lvl));
    setFormData((prev) => ({
      ...prev,
      nivel: clamped
    }));
  };

  const handleDeusChange = (deusId: string) => {
    setFormData((prev) => ({
      ...prev,
      deus_id: deusId,
      poderes_comprados: {}, // Reset power investments when changing deity
      planejamento: {
        poderes_planejados: {},
        atributos_planejados: prev.planejamento?.atributos_planejados || { ...prev.atributos }
      }
    }));
  };

  const handleSave = () => {
    if (!formData.nome.trim()) {
      showToast('Por favor, informe o nome do semideus.');
      return;
    }

    const finalSheet: FichaPersonagem = {
      ...formData,
      nome: formData.nome.trim(),
      atributos: evolutionAttributes,
      poderes_comprados: evolutionPowers,
      planejamento: {
        poderes_planejados: planningPowers,
        atributos_planejados: planningAttributes
      },
      atualizado_em: new Date().toISOString()
    };

    onSave(finalSheet);
    onClose();
  };

  const bbcodeContent = useMemo(() => {
    return generateForumBBCode(
      formData,
      selectedDeus,
      godRamos,
      godPoderes,
      evolutionPowersCalc,
      isNew ? null : sheet,
      { onlyDelta: bbcodeMode === 'delta' }
    );
  }, [formData, selectedDeus, godRamos, godPoderes, evolutionPowersCalc, isNew, sheet, bbcodeMode]);

  const handleCopyBBCode = () => {
    navigator.clipboard.writeText(bbcodeContent);
    setCopiedBBCode(true);
    setTimeout(() => setCopiedBBCode(false), 2500);
  };

  // Branch Sorting
  const branchOrderMap: Record<string, number> = { tronco: 0, ramo1: 1, ramo2: 2, ramo3: 3 };
  const sortedGodRamos = [...godRamos].sort((a, b) => {
    const oA = branchOrderMap[a.tipo] ?? 99;
    const oB = branchOrderMap[b.tipo] ?? 99;
    return oA - oB;
  });

  const displayedRamos = activeBranchFilter === 'all'
    ? sortedGodRamos
    : sortedGodRamos.filter((r) => r.tipo === activeBranchFilter || r.id === activeBranchFilter);

  // 9 RPG Attributes Definitions with Dot Color Styling (Max 5 points)
  const attributeDefinitions: {
    key: keyof AtributosPersonagem;
    sigla: string;
    name: string;
    color: string;
    badgeBg: string;
    borderActive: string;
    dotFilledClass: string;
    dotGlowClass: string;
    icon: React.FC<{ className?: string }>;
  }[] = [
    {
      key: 'forca',
      sigla: 'FOR',
      name: 'Força',
      color: 'text-rose-400',
      badgeBg: 'bg-rose-950/40 text-rose-300 border-rose-800/50',
      borderActive: 'border-rose-500/40',
      dotFilledClass: 'bg-rose-500 text-black border-rose-400 shadow-rose-500/40 shadow-sm font-black',
      dotGlowClass: 'shadow-[0_0_10px_rgba(244,63,94,0.5)]',
      icon: BicepsFlexed
    },
    {
      key: 'destreza',
      sigla: 'DES',
      name: 'Destreza',
      color: 'text-orange-400',
      badgeBg: 'bg-orange-950/40 text-orange-300 border-orange-800/50',
      borderActive: 'border-orange-500/40',
      dotFilledClass: 'bg-orange-500 text-black border-orange-400 shadow-orange-500/40 shadow-sm font-black',
      dotGlowClass: 'shadow-[0_0_10px_rgba(249,115,22,0.5)]',
      icon: Swords
    },
    {
      key: 'agilidade',
      sigla: 'AGI',
      name: 'Agilidade',
      color: 'text-amber-400',
      badgeBg: 'bg-amber-950/40 text-amber-300 border-amber-800/50',
      borderActive: 'border-amber-500/40',
      dotFilledClass: 'bg-amber-500 text-black border-amber-400 shadow-amber-500/40 shadow-sm font-black',
      dotGlowClass: 'shadow-[0_0_10px_rgba(245,158,11,0.5)]',
      icon: Zap
    },
    {
      key: 'constituicao',
      sigla: 'CON',
      name: 'Constituição',
      color: 'text-emerald-400',
      badgeBg: 'bg-emerald-950/40 text-emerald-300 border-emerald-800/50',
      borderActive: 'border-emerald-500/40',
      dotFilledClass: 'bg-emerald-500 text-black border-emerald-400 shadow-emerald-500/40 shadow-sm font-black',
      dotGlowClass: 'shadow-[0_0_10px_rgba(16,185,129,0.5)]',
      icon: Shield
    },
    {
      key: 'inteligencia',
      sigla: 'INT',
      name: 'Inteligência',
      color: 'text-sky-400',
      badgeBg: 'bg-sky-950/40 text-sky-300 border-sky-800/50',
      borderActive: 'border-sky-500/40',
      dotFilledClass: 'bg-sky-500 text-black border-sky-400 shadow-sky-500/40 shadow-sm font-black',
      dotGlowClass: 'shadow-[0_0_10px_rgba(14,165,233,0.5)]',
      icon: Brain
    },
    {
      key: 'carisma',
      sigla: 'CAR',
      name: 'Carisma',
      color: 'text-pink-400',
      badgeBg: 'bg-pink-950/40 text-pink-300 border-pink-800/50',
      borderActive: 'border-pink-500/40',
      dotFilledClass: 'bg-pink-500 text-black border-pink-400 shadow-pink-500/40 shadow-sm font-black',
      dotGlowClass: 'shadow-[0_0_10px_rgba(236,72,153,0.5)]',
      icon: Heart
    },
    {
      key: 'natureza',
      sigla: 'NAT',
      name: 'Natureza',
      color: 'text-lime-400',
      badgeBg: 'bg-lime-950/40 text-lime-300 border-lime-800/50',
      borderActive: 'border-lime-500/40',
      dotFilledClass: 'bg-lime-500 text-black border-lime-400 shadow-lime-500/40 shadow-sm font-black',
      dotGlowClass: 'shadow-[0_0_10px_rgba(132,204,22,0.5)]',
      icon: Leaf
    },
    {
      key: 'magia',
      sigla: 'MAG',
      name: 'Magia',
      color: 'text-purple-400',
      badgeBg: 'bg-purple-950/40 text-purple-300 border-purple-800/50',
      borderActive: 'border-purple-500/40',
      dotFilledClass: 'bg-purple-500 text-black border-purple-400 shadow-purple-500/40 shadow-sm font-black',
      dotGlowClass: 'shadow-[0_0_10px_rgba(168,85,247,0.5)]',
      icon: Sparkles
    },
    {
      key: 'espiritualidade',
      sigla: 'ESP',
      name: 'Espiritualidade',
      color: 'text-cyan-400',
      badgeBg: 'bg-cyan-950/40 text-cyan-300 border-cyan-800/50',
      borderActive: 'border-cyan-500/40',
      dotFilledClass: 'bg-cyan-500 text-black border-cyan-400 shadow-cyan-500/40 shadow-sm font-black',
      dotGlowClass: 'shadow-[0_0_10px_rgba(6,182,212,0.5)]',
      icon: Flame
    }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md animate-fadeIn overflow-hidden">
      <div className="bg-[var(--fundo2)] text-[var(--ctexto1)] w-full max-w-7xl h-full max-h-[96vh] rounded-2xl border border-[var(--bordadg)] shadow-2xl overflow-hidden flex flex-col">
        
        {/* Toast */}
        {toastMsg && (
          <div className="fixed top-4 right-4 z-[110] px-3.5 py-2 bg-[var(--fundo3)] border border-blue-500/50 text-[var(--ctexto1)] rounded-xl shadow-2xl text-xs font-semibold flex items-center gap-2 animate-fadeIn">
            <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* POP-UP: SUGERIR MODO PLANEJAMENTO QUANDO ATINGE LIMITE DE PONTOS          */}
        {/* ========================================================================= */}
        {suggestPlanningModal?.open && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-fadeIn">
            <div className="bg-[var(--fundo2)] border border-blue-500/50 rounded-2xl p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 mx-auto">
                <Target className="w-6 h-6" />
              </div>

              <div className="text-center space-y-1.5">
                <h3 className="font-cinzel text-base font-bold text-[var(--ctexto1)]">
                  Limite de Pontos do Nível {formData.nivel} Atingido
                </h3>
                <p className="text-xs text-[var(--ctexto2)] leading-relaxed">
                  {suggestPlanningModal.reason}
                </p>
                <div className="p-3 bg-[var(--fundo1)] rounded-xl border border-[var(--bordadg)] text-xs text-[var(--ctexto1)] mt-2">
                  <p className="font-semibold text-blue-400 mb-1 flex items-center justify-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    Gostaria de entrar no Modo Planejamento?
                  </p>
                  <p className="text-[11px] text-[var(--ctexto2)]">
                    No Modo Planejamento você pode simular sua build completa até o <strong>Nível 40</strong> (40 pontos de poder e 20 atributos), mantendo sua evolução atual salva.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSuggestPlanningModal(null)}
                  className="flex-1 px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--fundo3)] hover:bg-[var(--fundo4)] text-[var(--ctexto2)] hover:text-[var(--ctexto1)] border border-[var(--bordadg)] transition-colors cursor-pointer"
                >
                  Continuar no Modo Evolução
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const action = suggestPlanningModal.pendingAction;
                    setSuggestPlanningModal(null);
                    if (action) {
                      action();
                    } else {
                      setEditorMode('planejamento');
                      showToast('Modo Planejamento ativado!');
                    }
                  }}
                  className="flex-1 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Target className="w-3.5 h-3.5" />
                  <span>Ir para Planejamento</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* POP-UP: CONFIRMAÇÃO DE DIVERGÊNCIA COM O PLANEJAMENTO                     */}
        {/* ========================================================================= */}
        {planConflictModal?.open && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-fadeIn">
            <div className="bg-[var(--fundo2)] border border-amber-500/50 rounded-2xl p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <div className="text-center space-y-1.5">
                <h3 className="font-cinzel text-base font-bold text-[var(--ctexto1)]">
                  {planConflictModal.title}
                </h3>
                <p className="text-xs text-[var(--ctexto2)] leading-relaxed">
                  {planConflictModal.message}
                </p>
                <p className="text-[11px] text-amber-400/90 font-medium">
                  Se você prosseguir, o planejamento será automaticamente atualizado para incorporar esta evolução.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPlanConflictModal(null)}
                  className="flex-1 px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--fundo3)] hover:bg-[var(--fundo4)] text-[var(--ctexto2)] hover:text-[var(--ctexto1)] border border-[var(--bordadg)] transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={planConflictModal.onConfirm}
                  className="flex-1 px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-500/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Sim, Prosseguir</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL HEADER: CLEAN, UNIFIED WIDESCREEN TOP BAR                           */}
        {/* ========================================================================= */}
        <div 
          className="shrink-0 px-3 sm:px-6 py-2.5 sm:py-3 border-b flex flex-wrap items-center justify-between gap-2.5 sm:gap-4 bg-[var(--fundo1)] z-20"
          style={{ borderColor: `${godColor}35` }}
        >
          {/* Left: Character Identity and Level */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div 
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-white shadow-md shrink-0 font-cinzel font-bold text-xs sm:text-base border"
              style={{ 
                backgroundColor: `${godColor}20`,
                borderColor: `${godColor}80`
              }}
            >
              {godIcon ? (
                <GameIcon icon={godIcon} className="text-lg sm:text-xl" style={{ color: godColor }} />
              ) : (
                <Swords className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: godColor }} />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-cinzel text-xs sm:text-sm md:text-base font-bold text-[var(--ctexto1)] truncate leading-tight">
                  {isNew ? 'Nova Ficha de Semideus' : (formData.nome ? formData.nome : 'Semideus Sem Nome')}
                </h2>
                {isNew && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    NOVA
                  </span>
                )}
              </div>
              <p className="text-[10px] sm:text-xs text-[var(--ctexto2)] font-mono truncate leading-none mt-0.5 flex items-center gap-1.5">
                <span className="font-bold" style={{ color: godColor }}>{selectedDeus.nome_grego_romano}</span>
                <span>•</span>
                <span>Nv. {formData.nivel} {isPlanningMode ? '(Simulando Nv. 40)' : 'Real'}</span>
              </p>
            </div>
          </div>

          {/* Center: Mode Segmented Control & Subtabs */}
          <div className="flex items-center gap-2 flex-wrap justify-center">
            {/* Mode Switcher */}
            <div className="flex items-center p-0.5 rounded-xl bg-[var(--fundo2)] border border-[var(--bordadg)]">
              <button
                type="button"
                onClick={() => setEditorMode('evolucao')}
                className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all cursor-pointer flex items-center gap-1 sm:gap-1.5 ${
                  !isPlanningMode
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-[var(--ctexto2)] hover:text-[var(--ctexto1)]'
                }`}
              >
                <Swords className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                <span>Evolução ({formData.nivel})</span>
              </button>

              <button
                type="button"
                onClick={() => setEditorMode('planejamento')}
                className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all cursor-pointer flex items-center gap-1 sm:gap-1.5 ${
                  isPlanningMode
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-[var(--ctexto2)] hover:text-[var(--ctexto1)]'
                }`}
              >
                <Target className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-300 shrink-0" />
                <span>Planejamento (40)</span>
              </button>
            </div>

            {/* Subtabs Selector */}
            <div className="flex items-center gap-1 bg-[var(--fundo2)] p-0.5 rounded-xl border border-[var(--bordadg)]">
              <button
                type="button"
                onClick={() => setActiveSubTab('atributos')}
                className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all cursor-pointer flex items-center gap-1 sm:gap-1.5 ${
                  activeSubTab === 'atributos'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-[var(--ctexto2)] hover:text-[var(--ctexto1)]'
                }`}
              >
                <Shield className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                <span>1. Atributos</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSubTab('poderes')}
                className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all cursor-pointer flex items-center gap-1 sm:gap-1.5 ${
                  activeSubTab === 'poderes'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-[var(--ctexto2)] hover:text-[var(--ctexto1)]'
                }`}
              >
                <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                <span>2. Poderes</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSubTab('inventario')}
                className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all cursor-pointer flex items-center gap-1 sm:gap-1.5 ${
                  activeSubTab === 'inventario'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-[var(--ctexto2)] hover:text-[var(--ctexto1)]'
                }`}
              >
                <Package className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                <span>3. Inventário</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSubTab('bbcode')}
                className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all cursor-pointer flex items-center gap-1 sm:gap-1.5 ${
                  activeSubTab === 'bbcode'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-[var(--ctexto2)] hover:text-[var(--ctexto1)]'
                }`}
              >
                <FileCode className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                <span>4. BBCode</span>
              </button>
            </div>
          </div>

          {/* Right: Real-Time Points Badges & Quick Save */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Attribute Points Badge */}
            <div 
              className={`px-2 sm:px-2.5 py-1 rounded-lg border text-[10px] sm:text-xs font-mono font-bold flex items-center gap-1 ${
                attributePointsRemaining > 0
                  ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-300'
                  : attributePointsRemaining === 0
                  ? 'bg-blue-950/40 border-blue-500/40 text-blue-300'
                  : 'bg-rose-950/50 border-rose-500/50 text-rose-300 animate-pulse'
              }`}
              title="Pontos de Atributos Livres / Total"
            >
              <Shield className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400 shrink-0" />
              <span>Atrib:</span>
              <strong className="text-[11px] sm:text-xs">{attributePointsRemaining}</strong>
              <span className="text-[9px] opacity-70">/{attributePointsBudget}</span>
            </div>

            {/* Power Points Badge */}
            <div 
              className={`px-2 sm:px-2.5 py-1 rounded-lg border text-[10px] sm:text-xs font-mono font-bold flex items-center gap-1 ${
                calcResult.pointsRemaining > 0
                  ? 'bg-purple-950/50 border-purple-500/50 text-purple-300'
                  : calcResult.pointsRemaining === 0
                  ? 'bg-[var(--fundo2)] border-[var(--bordadg)] text-[var(--ctexto2)]'
                  : 'bg-rose-950/50 border-rose-500/50 text-rose-300 animate-pulse'
              }`}
              title="Pontos de Poderes Livres / Total"
            >
              <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-purple-400 shrink-0" />
              <span>Pod:</span>
              <strong className="text-[11px] sm:text-xs">{calcResult.pointsRemaining}</strong>
              <span className="text-[9px] opacity-70">/{calcResult.totalPointsAvailable}</span>
            </div>

            <button
              type="button"
              onClick={handleSave}
              className="px-3 sm:px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-900/30 transition-all cursor-pointer uppercase tracking-wider shrink-0"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Salvar</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-[var(--ctexto2)] hover:text-[var(--ctexto1)] rounded-xl hover:bg-[var(--fundo3)] border border-transparent hover:border-[var(--bordadg)] transition-colors cursor-pointer shrink-0"
              title="Fechar editor de ficha"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Full-Width Scrollable Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-5 md:p-6 bg-[var(--fundo1)] relative">
          
          {/* ========================================================================= */}
          {/* TAB 1: DADOS, ATRIBUTOS E STATUS DE COMBATE (LAYOUT WIDESCREEN 2 COLUNAS) */}
          {/* ========================================================================= */}
          {activeSubTab === 'atributos' && (
            <div className="animate-fadeIn">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                
                {/* --------------------------------------------------------------------- */}
                {/* COLUNA ESQUERDA: IDENTIFICAÇÃO, PROGENITOR E STATUS DE COMBATE       */}
                {/* --------------------------------------------------------------------- */}
                <div className="lg:col-span-4 xl:col-span-4 space-y-4">
                  
                  {/* Card 1: Identificação Básica e Nível */}
                  <div className="bg-[var(--fundo2)] border border-[var(--bordadg)] rounded-2xl p-4 space-y-3.5 shadow-sm">
                    <div className="flex items-center justify-between pb-2 border-b border-[var(--bordadg)]">
                      <h3 className="font-cinzel text-xs font-bold uppercase tracking-wider text-[var(--ctexto1)] flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-blue-400" />
                        <span>Dados do Semideus</span>
                      </h3>
                      <span className="text-[10px] font-mono text-[var(--ctexto2)]">Passo 1/2</span>
                    </div>

                    {/* Nome do Personagem */}
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--ctexto2)]">
                        Nome do Semideus *
                      </label>
                      <input
                        type="text"
                        value={formData.nome}
                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                        placeholder="Ex: Perseus Jackson"
                        className="w-full px-3 py-2 bg-[var(--fundo1)] border border-[var(--bordadg)] rounded-xl text-xs sm:text-sm text-[var(--ctexto1)] focus:outline-none focus:border-blue-500 font-semibold"
                      />
                    </div>

                    {/* Progenitor Divino */}
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--ctexto2)]">
                        Linhagem Divina (Progenitor)
                      </label>
                      <select
                        value={formData.deus_id}
                        onChange={(e) => handleDeusChange(e.target.value)}
                        className="w-full px-3 py-2 bg-[var(--fundo1)] border border-[var(--bordadg)] rounded-xl text-xs sm:text-sm text-[var(--ctexto1)] focus:outline-none focus:border-blue-500 font-semibold cursor-pointer"
                      >
                        {sortedDeuses.map((d) => (
                          <option key={d.id} value={d.id} className="bg-[var(--fundo2)] text-[var(--ctexto1)]">
                            {d.nome_grego_romano}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Nível Real e Pontos de Atributo Ganhos */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[var(--ctexto2)]">
                        <span>Nível Real (1 a 70)</span>
                        <span className="font-mono text-blue-400 font-bold">
                          {formData.nivel <= 40 ? `${Math.floor(formData.nivel / 2)}/20 pts de atrib.` : 'Max 20 pts'}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => handleLevelChange(formData.nivel - 1)}
                          disabled={formData.nivel <= 1}
                          className="w-9 h-9 rounded-xl bg-[var(--fundo1)] hover:bg-[var(--fundo3)] border border-[var(--bordadg)] flex items-center justify-center text-[var(--ctexto1)] disabled:opacity-30 cursor-pointer shrink-0 transition-colors"
                          title="Diminuir nível em 1"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        
                        <input
                          type="number"
                          min={1}
                          max={70}
                          value={formData.nivel}
                          onChange={(e) => handleLevelChange(parseInt(e.target.value, 10))}
                          className="flex-1 h-9 px-2 text-center bg-[var(--fundo1)] border border-[var(--bordadg)] focus:border-blue-500 rounded-xl font-mono text-sm font-bold text-[var(--ctexto1)] focus:outline-none"
                        />

                        <button
                          type="button"
                          onClick={() => handleLevelChange(formData.nivel + 1)}
                          disabled={formData.nivel >= 70}
                          className="w-9 h-9 rounded-xl bg-[var(--fundo1)] hover:bg-[var(--fundo3)] border border-[var(--bordadg)] flex items-center justify-center text-[var(--ctexto1)] disabled:opacity-30 cursor-pointer shrink-0 transition-colors"
                          title="Aumentar nível em 1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Experiência (EXP) & Barra de Progresso Integrada */}
                    <div className="pt-3 border-t border-[var(--bordadg)] space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span className="text-[var(--ctexto2)] uppercase tracking-wider flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5 shrink-0" style={{ color: godColor }} />
                          <span style={{ color: godColor }}>Nível {formData.nivel} • Progresso EXP ({Math.min(100, Math.round(((formData.exp || 0) / (formData.nivel * 100)) * 100))}%)</span>
                        </span>
                        <span className="font-mono text-xs font-bold text-[var(--ctexto1)]">
                          {formData.exp || 0} / {formData.nivel * 100}
                        </span>
                      </div>

                      {/* Barra Visual de Progresso */}
                      <div className="w-full bg-[var(--fundo1)] h-3 rounded-full overflow-hidden border border-[var(--bordadg)] p-0.5">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(100, Math.round(((formData.exp || 0) / (formData.nivel * 100)) * 100))}%`,
                            backgroundColor: godColor
                          }}
                        />
                      </div>

                      <div className="flex items-center justify-between gap-2 text-[10px] font-mono">
                        <span className="text-[var(--ctexto2)]">
                          <strong className="font-bold text-[var(--ctexto1)]">{formData.exp || 0}</strong> / <strong className="font-bold text-[var(--ctexto2)]">{formData.nivel * 100}</strong> EXP (para Nível {formData.nivel + 1})
                        </span>

                        <div className="flex items-center gap-1">
                          <span className="text-[var(--ctexto2)] font-bold">Ajustar EXP:</span>
                          <input
                            type="number"
                            min={0}
                            value={formData.exp || 0}
                            onChange={(e) => {
                              const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                              setFormData({ ...formData, exp: val });
                            }}
                            className="w-16 h-6 px-1.5 bg-[var(--fundo1)] border border-[var(--bordadg)] rounded text-center text-xs font-mono font-bold text-[var(--ctexto1)] focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Lore e Foco do Progenitor Divino */}
                  <div 
                    className="p-3.5 rounded-2xl border space-y-2 relative overflow-hidden"
                    style={{ 
                      backgroundColor: `${godColor}10`, 
                      borderColor: `${godColor}40` 
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 border shadow-md"
                        style={{ 
                          backgroundColor: `${godColor}25`,
                          borderColor: godColor 
                        }}
                      >
                        {godIcon ? (
                          <GameIcon icon={godIcon} className="text-xl" style={{ color: godColor }} />
                        ) : (
                          <Swords className="w-5 h-5" style={{ color: godColor }} />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-cinzel text-xs sm:text-sm font-bold truncate" style={{ color: godColor }}>
                            {selectedDeus.nome_grego_romano}
                          </span>
                          <DifficultyIndicator level={selectedDeus.dificuldade} size="sm" showLabel />
                        </div>
                        {selectedDeus.titulo_mitologico && (
                          <span className="text-[11px] text-[var(--ctexto2)] italic block truncate">
                            {selectedDeus.titulo_mitologico}
                          </span>
                        )}
                      </div>
                    </div>

                    {selectedDeus.atributos_principais && (
                      <div className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-[var(--fundo2)]/90 border border-[var(--bordadg)] text-[var(--ctexto1)] flex items-center justify-between">
                        <span className="text-[var(--ctexto2)] uppercase text-[9px] font-bold">Atributos Principais:</span>
                        <strong className="text-[var(--ctexto1)] font-mono">{selectedDeus.atributos_principais}</strong>
                      </div>
                    )}
                  </div>

                  {/* Card 3: Status Calculados de Combate */}
                  <div className="bg-[var(--fundo2)] border border-[var(--bordadg)] rounded-2xl p-4 space-y-3 shadow-sm">
                    <div className="flex items-center justify-between pb-2 border-b border-[var(--bordadg)]">
                      <div>
                        <h3 className="font-cinzel text-xs font-bold uppercase tracking-wider text-[var(--ctexto1)] flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5 text-rose-400" />
                          <span>Status de Combate</span>
                        </h3>
                      </div>
                      <span className="text-[10px] font-mono text-[var(--ctexto2)] bg-[var(--fundo1)] px-2 py-0.5 rounded border border-[var(--bordadg)]">
                        Base: {baseStatus}
                      </span>
                    </div>

                    {/* 3 Status Cards (Vida, Mana, Vigor) */}
                    <div className="space-y-2.5">
                      
                      {/* VIDA */}
                      <div className="p-2.5 rounded-xl bg-[var(--fundo1)] border border-emerald-900/40 flex items-center justify-between gap-3">
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <Heart className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span className="text-xs font-bold uppercase tracking-wider text-[var(--ctexto1)] leading-none">Vida</span>
                          </div>
                          <div className="text-[10px] text-[var(--ctexto2)] font-mono pl-6">
                            {baseStatus} (nível) + {constBonus} (con)
                          </div>
                        </div>
                        <span className="text-xl font-mono font-black text-emerald-500 tracking-tight shrink-0">
                          {statusValues.vida}
                        </span>
                      </div>

                      {/* MANA */}
                      <div className="p-2.5 rounded-xl bg-[var(--fundo1)] border border-purple-900/40 flex items-center justify-between gap-3">
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
                            <span className="text-xs font-bold uppercase tracking-wider text-[var(--ctexto1)] leading-none">Mana</span>
                          </div>
                          <div className="text-[10px] text-[var(--ctexto2)] font-mono pl-6">
                            {baseStatus} (nível) + {magiaBonus} (mag) + {espirBonus} (esp)
                          </div>
                        </div>
                        <span className="text-xl font-mono font-black text-purple-500 tracking-tight shrink-0">
                          {statusValues.mana}
                        </span>
                      </div>

                      {/* VIGOR */}
                      <div className="p-2.5 rounded-xl bg-[var(--fundo1)] border border-rose-900/40 flex items-center justify-between gap-3">
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <Flame className="w-4 h-4 text-rose-400 shrink-0" />
                            <span className="text-xs font-bold uppercase tracking-wider text-[var(--ctexto1)] leading-none">Vigor</span>
                          </div>
                          <div className="text-[10px] text-[var(--ctexto2)] font-mono pl-6">
                            {baseStatus} (nível) + {forcaBonus} (for)
                          </div>
                        </div>
                        <span className="text-xl font-mono font-black text-rose-500 tracking-tight shrink-0">
                          {statusValues.vigor}
                        </span>
                      </div>

                    </div>
                  </div>

                  {/* Advance to Powers CTA */}
                  <button
                    type="button"
                    onClick={() => setActiveSubTab('poderes')}
                    className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-900/30 transition-all cursor-pointer uppercase tracking-wider"
                  >
                    <span>Ir para Distribuição de Poderes</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>

                </div>

                {/* --------------------------------------------------------------------- */}
                {/* COLUNA DIREITA: GRID COMPLETO DOS 9 ATRIBUTOS OFICIAIS               */}
                {/* --------------------------------------------------------------------- */}
                <div className="lg:col-span-8 xl:col-span-8 space-y-4">
                  
                  <div className={`bg-[var(--fundo2)] border rounded-2xl p-4 sm:p-5 space-y-4 transition-all ${
                    isPlanningMode ? 'border-amber-500/40' : 'border-[var(--bordadg)]'
                  }`}>
                    
                    {/* Header with Points Placar and Reset */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--bordadg)]">
                      <div>
                        <h3 className="font-cinzel text-sm sm:text-base font-bold text-[var(--ctexto1)] flex items-center gap-2">
                          <Shield className="w-4 h-4 text-blue-400" />
                          <span>{isPlanningMode ? 'Planejamento de Atributos (Teto Nível 40)' : 'Distribuição de Atributos do Semideus'}</span>
                        </h3>
                        <p className="text-xs text-[var(--ctexto2)]">
                          {isPlanningMode
                            ? 'Defina a meta de até 20 pontos de atributo distribuídos até o nível 40.'
                            : 'Invista pontos concedidos nos níveis pares (1 ponto a cada 2 níveis, máx 20).'}
                        </p>
                      </div>

                      {/* Points Scoreboard & Reset */}
                      <div className="flex items-center gap-2.5">
                        <div className="px-3 py-1.5 rounded-xl bg-[var(--fundo1)] border border-[var(--bordadg)] text-center">
                          <span className="text-[9px] text-[var(--ctexto2)] uppercase font-bold block">
                            {isPlanningMode ? 'Planejados' : 'Pontos Livres'}
                          </span>
                          <span className={`text-sm sm:text-base font-mono font-black ${attributePointsRemaining > 0 ? 'text-emerald-500' : attributePointsRemaining === 0 ? 'text-blue-500' : 'text-rose-500'}`}>
                            {attributePointsRemaining} / {attributePointsBudget} <span className="text-[10px] font-normal text-[var(--ctexto2)]">pts</span>
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={handleResetAttributes}
                          className="p-2 rounded-xl bg-[var(--fundo1)] hover:bg-rose-950/40 border border-[var(--bordadg)] hover:border-rose-800 text-[var(--ctexto2)] hover:text-rose-400 transition-colors cursor-pointer"
                          title={isPlanningMode ? 'Resetar Planejamento de Atributos' : 'Resetar Atributos para o Padrão (Base 1)'}
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* 3x3 Grid of the 9 RPG Attributes with 5 Interactive Clickable Dots */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                      {attributeDefinitions.map((attr) => {
                        const currentVal = currentAttributes[attr.key] || 1;
                        const plannedVal = planningAttributes[attr.key] || 1;
                        const IconComp = attr.icon;
                        const isSpent = currentVal > 1;
                        const hasHigherPlanning = !isPlanningMode && plannedVal > currentVal;

                        return (
                          <div 
                            key={attr.key}
                            className={`p-3.5 rounded-2xl bg-[var(--fundo1)] border transition-all flex flex-col justify-between space-y-3 ${
                              isSpent ? attr.borderActive : 'border-[var(--bordadg)]'
                            }`}
                          >
                            {/* Attribute Card Header */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <IconComp className={`w-4 h-4 ${attr.color} shrink-0`} />
                                <span className="text-xs font-bold text-[var(--ctexto1)] uppercase tracking-wider">
                                  {attr.name}
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-1">
                                {!isPlanningMode && plannedVal > 1 && (
                                  <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-950/50 text-amber-300 border border-amber-500/40 flex items-center gap-0.5" title={`Meta planejada: ${plannedVal}/5`}>
                                    <Target className="w-2 h-2" />
                                    <span>{plannedVal}</span>
                                  </span>
                                )}
                                <span className="text-[9px] font-mono text-[var(--ctexto2)] font-bold px-1.5 py-0.5 rounded bg-[var(--fundo2)] border border-[var(--bordadg)]">
                                  {attr.sigla}
                                </span>
                              </div>
                            </div>

                            {/* 5 Interactive Clickable Dots Matrix */}
                            <div className="py-2 px-2 bg-[var(--fundo2)] rounded-xl border border-[var(--bordadg)] flex flex-col items-center gap-1.5">
                              <div className="flex items-center justify-between w-full px-1">
                                <span className="text-[8px] font-mono text-[var(--ctexto2)] opacity-75 uppercase font-bold">
                                  {isPlanningMode ? 'Planejado' : 'Nível Atual'}
                                </span>
                                <span className={`text-xs font-mono font-black ${attr.color}`}>
                                  {currentVal} <span className="text-[9px] opacity-75">/ 5 pts</span>
                                </span>
                              </div>

                              {/* 5 Clickable Dots */}
                              <div className="flex items-center justify-between gap-1 w-full">
                                {[1, 2, 3, 4, 5].map((dotLevel) => {
                                  const isFilled = dotLevel <= currentVal;
                                  const isCurrentVal = dotLevel === currentVal;
                                  const isPlannedSpot = !isPlanningMode && dotLevel > currentVal && dotLevel <= plannedVal;

                                  return (
                                    <button
                                      key={dotLevel}
                                      type="button"
                                      onClick={() => handleSetAttributeLevel(attr.key, dotLevel)}
                                      title={`Definir ${attr.name} para nível ${dotLevel}/5 ${
                                        dotLevel === 1 ? '(Base inicial)' : `(+${dotLevel - 1} pontos gastos)`
                                      }${isPlannedSpot ? ' [Meta Planejada]' : ''}`}
                                      className="group relative flex-1 flex items-center justify-center py-0.5 cursor-pointer focus:outline-none transition-transform active:scale-90"
                                    >
                                      <div
                                        className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full border flex items-center justify-center text-[10px] sm:text-[11px] font-mono font-black transition-all ${
                                          isFilled
                                            ? `${attr.dotFilledClass} ${isCurrentVal ? attr.dotGlowClass : ''}`
                                            : isPlannedSpot
                                            ? 'bg-amber-950/30 border-dashed border-amber-400 text-amber-300 group-hover:border-amber-300'
                                            : 'bg-[var(--fundo3)] border-[var(--bordadg)] text-[var(--ctexto2)] group-hover:border-blue-400 group-hover:text-[var(--ctexto1)]'
                                        }`}
                                      >
                                        {dotLevel}
                                      </div>
                                      
                                      {isCurrentVal && (
                                        <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-blue-500 border border-[var(--fundo1)]" />
                                      )}

                                      {isPlannedSpot && dotLevel === plannedVal && (
                                        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-400 border border-[var(--fundo1)]" title="Meta planejada" />
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Quick -1 / +1 Buttons */}
                            <div className="flex items-center justify-between gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleModifyAttribute(attr.key, -1)}
                                disabled={currentVal <= 1}
                                className="flex-1 py-1 rounded-lg bg-[var(--fundo2)] hover:bg-[var(--fundo3)] border border-[var(--bordadg)] text-[var(--ctexto1)] text-[10px] font-mono font-bold disabled:opacity-20 cursor-pointer transition-colors"
                                title="Diminuir 1 ponto"
                              >
                                -1 pt
                              </button>
                              <button
                                type="button"
                                onClick={() => handleModifyAttribute(attr.key, 1)}
                                disabled={currentVal >= 5}
                                className="flex-1 py-1 rounded-lg bg-[var(--fundo2)] hover:bg-[var(--fundo3)] border border-[var(--bordadg)] text-[var(--ctexto1)] text-[10px] font-mono font-bold disabled:opacity-20 cursor-pointer transition-colors"
                                title="Aumentar 1 ponto"
                              >
                                +1 pt
                              </button>
                            </div>

                          </div>
                        );
                      })}
                    </div>

                  </div>

                </div>

              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: DISTRIBUIÇÃO DE PODERES COM DESCRIÇÕES COMPLETAS DOS NÍVEIS        */}
          {/* ========================================================================= */}
          {activeSubTab === 'poderes' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Points Scoreboard for Powers */}
              <div className={`p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-[var(--fundo2)] border grid grid-cols-3 gap-1.5 sm:gap-3 text-center transition-all ${
                isPlanningMode ? 'border-amber-500/40' : 'border-[var(--bordadg)]'
              }`}>
                <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-[var(--fundo1)] border border-[var(--bordadg)] flex flex-col justify-center">
                  <span className="text-[9px] sm:text-[10px] text-[var(--ctexto2)] uppercase font-bold block truncate">Disponíveis</span>
                  <span className="text-base sm:text-xl font-mono font-black text-[var(--ctexto1)]">{calcResult.totalPointsAvailable} <span className="text-[10px] font-normal text-[var(--ctexto2)]">pts</span></span>
                  <span className="text-[8px] sm:text-[9px] text-[var(--ctexto2)] opacity-75 hidden sm:block">
                    {isPlanningMode ? '(Meta Nv. 40)' : `(Nv. Real ${Math.min(40, formData.nivel)})`}
                  </span>
                </div>

                <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-[var(--fundo1)] border border-[var(--bordadg)] flex flex-col justify-center">
                  <span className="text-[9px] sm:text-[10px] text-[var(--ctexto2)] uppercase font-bold block truncate">
                    {isPlanningMode ? 'Planejados' : 'Investidos'}
                  </span>
                  <span className="text-base sm:text-xl font-mono font-black" style={{ color: godColor }}>
                    {calcResult.totalPointsSpent} <span className="text-[10px] font-normal text-[var(--ctexto2)]">pts</span>
                  </span>
                  <span className="text-[8px] sm:text-[9px] text-[var(--ctexto2)] opacity-75 hidden sm:block">{calcResult.poderesCount} habilidades</span>
                </div>

                <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-[var(--fundo1)] border border-[var(--bordadg)] flex flex-col justify-between items-center">
                  <div>
                    <span className="text-[9px] sm:text-[10px] text-[var(--ctexto2)] uppercase font-bold block truncate">
                      {isPlanningMode ? 'Planejamento' : 'Livres'}
                    </span>
                    <span className={`text-base sm:text-xl font-mono font-black ${calcResult.pointsRemaining >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {calcResult.pointsRemaining}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetPowers}
                    className="mt-0.5 text-[9px] sm:text-[10px] text-rose-500 hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <RotateCcw className="w-2.5 h-2.5" /> <span className="hidden sm:inline">{isPlanningMode ? 'Resetar Planejamento' : 'Resetar'}</span><span className="sm:hidden">Reset</span>
                  </button>
                </div>
              </div>

              {/* Branch Filter Tabs and Search Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 pb-2 border-b border-[var(--bordadg)]">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveBranchFilter('all')}
                    className={`px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer shrink-0 border ${
                      activeBranchFilter === 'all'
                        ? 'shadow-sm'
                        : 'bg-[var(--fundo2)] text-[var(--ctexto2)] hover:text-[var(--ctexto1)] border-[var(--bordadg)]'
                    }`}
                    style={{
                      backgroundColor: activeBranchFilter === 'all' ? `${godColor}25` : undefined,
                      borderColor: activeBranchFilter === 'all' ? `${godColor}70` : undefined,
                      color: activeBranchFilter === 'all' ? godColor : undefined,
                    }}
                  >
                    Todos ({godPoderes.length})
                  </button>

                  {sortedGodRamos.map((r) => {
                    const isActive = activeBranchFilter === r.tipo || activeBranchFilter === r.id;
                    const count = godPoderes.filter((p) => p.ramo_id === r.id).length;
                    const label = r.tipo === 'tronco' ? 'Tronco' : r.nome;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setActiveBranchFilter(r.tipo)}
                        className={`px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer shrink-0 border flex items-center gap-1 sm:gap-1.5 ${
                          isActive
                            ? 'shadow-sm'
                            : 'bg-[var(--fundo2)] text-[var(--ctexto2)] hover:text-[var(--ctexto1)] border-[var(--bordadg)]'
                        }`}
                        style={{
                          backgroundColor: isActive ? `${godColor}25` : undefined,
                          borderColor: isActive ? `${godColor}70` : undefined,
                          color: isActive ? godColor : undefined,
                        }}
                      >
                        <span className="truncate max-w-[120px] sm:max-w-none">{label}</span>
                        <span className="px-1 py-0.2 rounded text-[9px] sm:text-[10px] font-mono bg-[var(--fundo1)] text-[var(--ctexto2)]">
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Accent-insensitive Search */}
                <div className="relative shrink-0 w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-[var(--ctexto2)] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchPowerQuery}
                    onChange={(e) => setSearchPowerQuery(e.target.value)}
                    placeholder="Filtrar poderes e efeitos..."
                    className="w-full pl-8 pr-3 py-1.5 bg-[var(--fundo2)] border border-[var(--bordadg)] rounded-xl text-xs text-[var(--ctexto1)] placeholder-[var(--ctexto2)] focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Powers by Branch with FULL LEVEL DESCRIPTIONS */}
              <div className="space-y-6">
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

                  if (branchPowers.length === 0) return null;

                  return (
                    <div key={ramo.id} className="space-y-3">
                      <div className="flex items-center justify-between pb-1.5 border-b border-[var(--bordadg)]">
                        <h4 className="font-cinzel text-xs font-bold uppercase tracking-wider text-[var(--ctexto1)] flex items-center gap-2">
                          <span 
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: godColor }}
                          />
                          {ramo.tipo === 'tronco' ? 'Tronco' : ramo.nome}
                        </h4>
                        <span className="text-[10px] text-[var(--ctexto2)] font-mono">
                          {branchPowers.length} poderes
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        {branchPowers.map((poder) => {
                          const activePurchased = isPlanningMode
                            ? (planningPowers[poder.id] || 0)
                            : (evolutionPowers[poder.id] || 0);

                          const plannedLevel = (formData.planejamento?.poderes_planejados || {})[poder.id] || 0;
                          const costInfo = calcResult.powerDetails[poder.id];
                          const effLevel = costInfo ? costInfo.effectiveLevel : 0;
                          const isTroncoP1 = ramo.tipo === 'tronco' && [1, 2, 3, 4].includes(poder.numero);

                          // Clean base and level descriptions
                          const cleanDesc = (poder.descricao_base || '')
                            .replace(/^\[b\]\[b\]Descrição:\[\/b\]\[\/b\]\s*/i, '')
                            .replace(/^\[b\]Descrição:\[\/b\]\s*/i, '')
                            .replace(/^Descrição:\s*/i, '')
                            .trim();

                          const cleanLvl1 = (poder.nivel_1_desc || '')
                            .replace(/^\[b\]Nível 1\[\/b\]\s*/i, '')
                            .replace(/^Nível 1:\s*/i, '')
                            .trim();

                          const cleanLvl2 = (poder.nivel_2_desc || '')
                            .replace(/^\[b\]Nível 2\[\/b\]\s*/i, '')
                            .replace(/^Nível 2:\s*/i, '')
                            .trim();

                          const cleanLvl3 = (poder.nivel_3_desc || '')
                            .replace(/^\[b\]Nível 3\[\/b\]\s*/i, '')
                            .replace(/^Nível 3:\s*/i, '')
                            .trim();

                          return (
                            <div
                              key={poder.id}
                              className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                                effLevel > 0
                                  ? 'bg-[var(--fundo2)] shadow-lg'
                                  : 'bg-[var(--fundo2)] border-[var(--bordadg)]'
                              }`}
                              style={{
                                borderColor: effLevel > 0 ? `${godColor}80` : undefined,
                                boxShadow: effLevel > 0 ? `0 4px 20px ${godColor}15` : undefined
                              }}
                            >
                              {/* Power Header */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--bordadg)]">
                                <div className="flex items-center gap-3">
                                  <div 
                                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 border"
                                    style={{ 
                                      backgroundColor: effLevel > 0 ? `${godColor}25` : 'var(--fundo1)',
                                      borderColor: effLevel > 0 ? godColor : 'var(--bordadg)'
                                    }}
                                  >
                                    <PowerIcon name={poder.icone_url || 'zap'} className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <h5 className="text-sm font-bold text-[var(--ctexto1)] flex items-center gap-2 font-cinzel flex-wrap">
                                      <span>#{poder.numero}</span>
                                      <span>{poder.nome}</span>

                                      {/* Ativo / Passivo Tag */}
                                      <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold tracking-wide uppercase border shrink-0 ${
                                        getEffectivePowerType(poder) === 'ativo'
                                          ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                                          : 'bg-sky-500/15 text-sky-400 border-sky-500/30'
                                      }`}>
                                        {getEffectivePowerType(poder) === 'ativo' ? 'Ativo' : 'Passivo'}
                                      </span>

                                      {/* Tronco Level 1 Free Badge when eligible */}
                                      {isTroncoP1 && (
                                        <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold tracking-wide uppercase border shrink-0 bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
                                          {(isPlanningMode ? 40 : formData.nivel) >= poder.numero ? 'Nível 1 Grátis' : 'Nível 1 (Grátis no Nv. ' + poder.numero + ')'}
                                        </span>
                                      )}

                                      {/* Planning Guide Tag in Evolution Mode */}
                                      {!isPlanningMode && plannedLevel > 0 && (
                                        <span 
                                          className="px-2 py-0.5 rounded text-[9px] font-mono font-bold tracking-wide uppercase border shrink-0 bg-amber-500/15 text-amber-300 border-amber-500/40 flex items-center gap-1"
                                          title={`Planejado para Nível ${plannedLevel}`}
                                        >
                                          <Target className="w-2.5 h-2.5" />
                                          <span>Planejado: Nv {plannedLevel}</span>
                                        </span>
                                      )}
                                    </h5>
                                  </div>
                                </div>

                                {/* Current Level Badge & Level Select Buttons */}
                                <div className="flex items-center gap-2 self-start sm:self-auto">
                                  <div className="flex items-center gap-1 bg-[var(--fundo1)] p-1 rounded-xl border border-[var(--bordadg)]">
                                    {[1, 2, 3].map((lvl) => {
                                      const isCurrentOrPassed = effLevel >= lvl;
                                      const isDirectLevel = effLevel === lvl;
                                      const isPlannedLevel = !isPlanningMode && plannedLevel === lvl;

                                      return (
                                        <button
                                          key={lvl}
                                          type="button"
                                          onClick={() => {
                                            if (activePurchased === lvl) {
                                              handleSetPowerLevel(poder.id, lvl - 1);
                                            } else {
                                              handleSetPowerLevel(poder.id, lvl);
                                            }
                                          }}
                                          className={`relative px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer border ${
                                            isDirectLevel
                                              ? 'text-white shadow-md'
                                              : isCurrentOrPassed
                                              ? ''
                                              : isPlannedLevel
                                              ? 'bg-amber-950/20 text-amber-300 border-dashed border-amber-400'
                                              : 'bg-[var(--fundo2)] text-[var(--ctexto2)] hover:text-[var(--ctexto1)] border-[var(--bordadg)]'
                                          }`}
                                          style={{
                                            backgroundColor: isDirectLevel ? godColor : isCurrentOrPassed ? `${godColor}25` : undefined,
                                            borderColor: isDirectLevel ? godColor : isCurrentOrPassed ? `${godColor}60` : undefined,
                                            color: isDirectLevel ? '#ffffff' : isCurrentOrPassed ? godColor : undefined,
                                          }}
                                          title={isPlannedLevel ? `Meta planejada: Nível ${lvl}` : undefined}
                                        >
                                          <span>Nv {lvl}</span>
                                          {isPlannedLevel && !isDirectLevel && (
                                            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400" />
                                          )}
                                        </button>
                                      );
                                    })}
                                  </div>

                                  {effLevel > 0 && (
                                    <button
                                      type="button"
                                      onClick={() => handleSetPowerLevel(poder.id, 0)}
                                      className="p-1.5 text-[var(--ctexto2)] hover:text-rose-400 rounded-lg hover:bg-rose-950/30 transition-colors"
                                      title="Remover investimento deste poder"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Base Description */}
                              <div className="mt-3 text-[15px] sm:text-[14px] text-[var(--ctexto2)] leading-relaxed bg-[var(--fundo1)] p-3 rounded-xl border border-[var(--bordadg)]">
                                <span className="font-bold text-[var(--ctexto1)] uppercase text-xs tracking-wider block mb-1">
                                  Descrição Geral:
                                </span>
                                <div className="text-justify whitespace-pre-line break-words">
                                  {cleanDesc ? <BBCodeRenderer text={cleanDesc} /> : 'Sem descrição cadastrada.'}
                                </div>
                              </div>

                              {/* FULL LEVEL DESCRIPTIONS (NÍVEL 1, 2, 3) */}
                              <div className="mt-3 space-y-2">
                                {/* Level 1 */}
                                <div 
                                  className={`p-3 rounded-xl border transition-all ${
                                    effLevel >= 1 
                                      ? '' 
                                      : 'bg-[var(--fundo1)] border-[var(--bordadg)] opacity-85'
                                  }`}
                                  style={{
                                    backgroundColor: effLevel >= 1 ? `${godColor}14` : undefined,
                                    borderColor: effLevel >= 1 ? `${godColor}60` : undefined,
                                  }}
                                >
                                  <div className="flex items-center justify-between gap-2 mb-1">
                                    <span 
                                      className="text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5"
                                      style={{
                                        color: effLevel >= 1 ? godColor : 'var(--ctexto1)'
                                      }}
                                    >
                                      <span 
                                        className="w-1.5 h-1.5 rounded-full"
                                        style={{
                                          backgroundColor: effLevel >= 1 ? godColor : '#9ca3af'
                                        }}
                                      />
                                      Nível 1
                                    </span>
                                  </div>
                                  <div className="text-[15px] sm:text-[14px] leading-relaxed text-[var(--ctexto1)] text-justify whitespace-pre-line break-words">
                                    {cleanLvl1 ? <BBCodeRenderer text={cleanLvl1} /> : 'Efeito inicial da habilidade.'}
                                  </div>
                                </div>

                                {/* Level 2 */}
                                <div 
                                  className={`p-3 rounded-xl border transition-all ${
                                    effLevel >= 2 
                                      ? '' 
                                      : 'bg-[var(--fundo1)] border-[var(--bordadg)] opacity-85'
                                  }`}
                                  style={{
                                    backgroundColor: effLevel >= 2 ? `${godColor}14` : undefined,
                                    borderColor: effLevel >= 2 ? `${godColor}60` : undefined,
                                  }}
                                >
                                  <div className="flex items-center justify-between gap-2 mb-1">
                                    <span 
                                      className="text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5"
                                      style={{
                                        color: effLevel >= 2 ? godColor : 'var(--ctexto1)'
                                      }}
                                    >
                                      <span 
                                        className="w-1.5 h-1.5 rounded-full"
                                        style={{
                                          backgroundColor: effLevel >= 2 ? godColor : '#9ca3af'
                                        }}
                                      />
                                      Nível 2
                                    </span>
                                  </div>
                                  <div className="text-[15px] sm:text-[14px] leading-relaxed text-[var(--ctexto1)] text-justify whitespace-pre-line break-words">
                                    {cleanLvl2 ? <BBCodeRenderer text={cleanLvl2} /> : 'Aprimoramento intermediário da habilidade.'}
                                  </div>
                                </div>

                                {/* Level 3 */}
                                <div 
                                  className={`p-3 rounded-xl border transition-all ${
                                    effLevel >= 3 
                                      ? '' 
                                      : 'bg-[var(--fundo1)] border-[var(--bordadg)] opacity-85'
                                  }`}
                                  style={{
                                    backgroundColor: effLevel >= 3 ? `${godColor}14` : undefined,
                                    borderColor: effLevel >= 3 ? `${godColor}60` : undefined,
                                  }}
                                >
                                  <div className="flex items-center justify-between gap-2 mb-1">
                                    <span 
                                      className="text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5"
                                      style={{
                                        color: effLevel >= 3 ? godColor : 'var(--ctexto1)'
                                      }}
                                    >
                                      <span 
                                        className="w-1.5 h-1.5 rounded-full"
                                        style={{
                                          backgroundColor: effLevel >= 3 ? godColor : '#9ca3af'
                                        }}
                                      />
                                      Nível 3
                                    </span>
                                  </div>
                                  <div className="text-[15px] sm:text-[14px] leading-relaxed text-[var(--ctexto1)] text-justify whitespace-pre-line break-words">
                                    {cleanLvl3 ? <BBCodeRenderer text={cleanLvl3} /> : 'Potência máxima e maestria da habilidade.'}
                                  </div>
                                </div>
                              </div>

                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: INVENTÁRIO & BÔNUS DE COMBATE                                     */}
          {/* ========================================================================= */}
          {activeSubTab === 'inventario' && (
            <InventoryManager formData={formData} setFormData={setFormData} />
          )}

          {/* ========================================================================= */}
          {/* TAB 4: BBCODE FÓRUM PREVIEW & COPY                                       */}
          {/* ========================================================================= */}
          {activeSubTab === 'bbcode' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-cinzel text-sm font-bold text-[var(--ctexto1)] flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-emerald-400" />
                    Código BBCode Formatado para o Fórum
                  </h3>
                  <p className="text-xs text-[var(--ctexto2)]">
                    Copie e cole diretamente no tópico de fichas e atualizações de semideuses.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {!isNew && (
                    <div className="flex items-center bg-[var(--fundo1)] p-1 rounded-xl border border-[var(--bordadg)] gap-1">
                      <button
                        type="button"
                        onClick={() => setBbcodeMode('delta')}
                        className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                          bbcodeMode === 'delta'
                            ? 'bg-emerald-600 text-white shadow'
                            : 'text-[var(--ctexto2)] hover:text-[var(--ctexto1)]'
                        }`}
                      >
                        Apenas Alterações (Delta)
                      </button>
                      <button
                        type="button"
                        onClick={() => setBbcodeMode('full')}
                        className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                          bbcodeMode === 'full'
                            ? 'bg-emerald-600 text-white shadow'
                            : 'text-[var(--ctexto2)] hover:text-[var(--ctexto1)]'
                        }`}
                      >
                        Ficha Completa
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleCopyBBCode}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-900/30 transition-all active:scale-95 cursor-pointer uppercase tracking-wider"
                  >
                    {copiedBBCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedBBCode ? 'BBCode Copiado!' : 'Copiar BBCode'}</span>
                  </button>
                </div>
              </div>

              <textarea
                readOnly
                value={bbcodeContent}
                onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                className="w-full flex-1 min-h-[380px] p-4 bg-[var(--fundo1)] border border-[var(--bordadg)] rounded-xl font-mono text-xs text-emerald-500 focus:outline-none focus:border-emerald-500 leading-relaxed selection:bg-emerald-700 selection:text-white"
              />
            </div>
          )}

        </div>

        {/* Modal Footer Actions */}
        <div className="shrink-0 p-3.5 sm:p-4 border-t border-[var(--bordadg)] bg-[var(--fundo1)] flex items-center justify-between gap-2 z-20">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 sm:px-4 py-2 rounded-xl bg-[var(--fundo2)] hover:bg-[var(--fundo3)] text-xs font-semibold text-[var(--ctexto2)] hover:text-[var(--ctexto1)] transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveSubTab('bbcode')}
              className={`px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                activeSubTab === 'bbcode'
                  ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/40'
                  : 'bg-[var(--fundo2)] hover:bg-[var(--fundo3)] text-[var(--ctexto2)] hover:text-emerald-400 border-[var(--bordadg)]'
              }`}
              title="Ir para o BBCode formatado"
            >
              <FileCode className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">BBCode</span>
              <span className="sm:hidden">BBCode</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="px-4 sm:px-6 py-2 rounded-xl text-xs font-bold text-white shadow-lg transition-all active:scale-95 flex items-center gap-1.5 sm:gap-2 cursor-pointer uppercase tracking-wider"
              style={{
                backgroundColor: godColor,
                boxShadow: `0 4px 14px 0 ${godColor}40`
              }}
            >
              <Save className="w-4 h-4" />
              <span>Salvar Ficha</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
