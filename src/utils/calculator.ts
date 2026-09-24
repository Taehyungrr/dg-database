import { AtributosPersonagem, Poder, Ramo, StatusCalculados, Deus, LegadoTipo } from '../types';
import { normalizeSearchText } from './textUtils';

/**
 * Combines the main attributes of two deities for a Legado character.
 * e.g., God 1: "Poder Mágico / Intelecto", God 2: "Natureza / Destreza"
 * Result: "Poder Mágico / Intelecto / Natureza / Destreza"
 * For "Deus + Semideus", returns only the main attributes of God 1 (Divindade Principal).
 */
export function getLegadoCombinedAtributos(
  legado1Id: string | undefined,
  legado2Id: string | undefined,
  allDeuses: Deus[],
  legadoTipo: LegadoTipo = 'semideus_semideus'
): string {
  const g1 = allDeuses.find((d) => d.id === legado1Id);
  if (legadoTipo === 'deus_semideus') {
    return g1?.atributos_principais || 'Linhagem Divina';
  }

  const g2 = allDeuses.find((d) => d.id === legado2Id);

  const raw1 = g1?.atributos_principais || '';
  const raw2 = g2?.atributos_principais || '';

  const parts1 = raw1.split(/[/,]/).map((s) => s.trim()).filter(Boolean);
  const parts2 = raw2.split(/[/,]/).map((s) => s.trim()).filter(Boolean);

  const uniqueParts: string[] = [];
  const seenLower = new Set<string>();

  for (const item of [...parts1, ...parts2]) {
    const key = normalizeSearchText(item);
    if (!seenLower.has(key)) {
      seenLower.add(key);
      uniqueParts.push(item);
    }
  }

  return uniqueParts.length > 0 ? uniqueParts.join(' / ') : 'Linhagem Dupla';
}

export interface PowerCostInfo {
  isTronco: boolean;
  isFreeLvl1: boolean;
  effectiveLevel: number;
  purchasedLevel: number;
  pointsSpentOnThisPower: number;
  costToNextLevel: number | null; // null if already at max (3)
  costToReachLevel: {
    1: number;
    2: number;
    3: number;
  };
}

/**
 * Determines which power IDs qualify for Free Level 1 Tronco status.
 *
 * For Normal God & "Deus + Semideus":
 *   - Powers 1, 2, 3, 4 of the single Tronco branch get free Level 1 at character levels >= 1, 2, 3, 4.
 *
 * For "Semideus + Semideus":
 *   - Legado has 2 Tronco branches (one per chosen divinity).
 *   - Unlocks 1 free slot per level up to level 4 (max 4 slots total, max 2 per god's tronco).
 *   - Selected by user investment (purchased powers take priority), up to 2 per tronco and up to maxFreeSlots total.
 */
export function getFreeTroncoPowerIds(
  characterLevel: number,
  purchasedPowers: Record<string, number>,
  allPowers: Poder[],
  allRamos: Ramo[],
  isLegado: boolean = false,
  legadoTipo: LegadoTipo = 'semideus_semideus'
): Set<string> {
  const freeSet = new Set<string>();

  if (!isLegado || legadoTipo === 'deus_semideus') {
    // Normal God / Deus + Semideus Logic: Powers 1, 2, 3, 4 of tronco at levels >= 1, 2, 3, 4
    const troncoRamos = allRamos.filter((r) => r.tipo === 'tronco');
    const troncoBranchIds = new Set(troncoRamos.map((r) => r.id));

    allPowers.forEach((power) => {
      if (troncoBranchIds.has(power.ramo_id)) {
        if (power.numero === 1 && characterLevel >= 1) freeSet.add(power.id);
        if (power.numero === 2 && characterLevel >= 2) freeSet.add(power.id);
        if (power.numero === 3 && characterLevel >= 3) freeSet.add(power.id);
        if (power.numero === 4 && characterLevel >= 4) freeSet.add(power.id);
      }
    });

    return freeSet;
  }

  // Semideus + Semideus Logic:
  const maxFreeSlots = Math.min(4, Math.max(0, characterLevel));
  if (maxFreeSlots <= 0) return freeSet;

  const troncoRamos = allRamos.filter((r) => r.tipo === 'tronco');
  if (troncoRamos.length === 0) return freeSet;

  // Group powers by tronco branch id
  const branchPowersMap = new Map<string, Poder[]>();
  troncoRamos.forEach((r) => branchPowersMap.set(r.id, []));

  allPowers.forEach((p) => {
    if (branchPowersMap.has(p.ramo_id)) {
      branchPowersMap.get(p.ramo_id)!.push(p);
    }
  });

  let slotsRemaining = maxFreeSlots;
  const branchPurchasedAssigned = new Map<string, number>();

  // Pass 1: Assign free slots to powers that the user HAS purchased (up to 2 per tronco branch)
  branchPowersMap.forEach((powers, branchId) => {
    powers.sort((a, b) => a.numero - b.numero);
    let countInBranch = 0;
    for (const p of powers) {
      if ((purchasedPowers[p.id] || 0) > 0 && countInBranch < 2 && slotsRemaining > 0) {
        freeSet.add(p.id);
        countInBranch++;
        slotsRemaining--;
      }
    }
    branchPurchasedAssigned.set(branchId, countInBranch);
  });

  // Pass 2: If there are still free slots remaining, mark unpurchased powers as eligible preview (up to 2 per tronco branch total)
  if (slotsRemaining > 0) {
    branchPowersMap.forEach((powers, branchId) => {
      powers.sort((a, b) => a.numero - b.numero);
      let currentCount = branchPurchasedAssigned.get(branchId) || 0;
      for (const p of powers) {
        if ((purchasedPowers[p.id] || 0) === 0 && currentCount < 2 && slotsRemaining > 0) {
          freeSet.add(p.id);
          currentCount++;
          slotsRemaining--;
        }
      }
    });
  }

  return freeSet;
}

export function isPowerEligibleForFreeTroncoLvl1(
  power: Poder,
  ramo: Ramo | undefined,
  characterLevel: number,
  isLegado: boolean = false,
  legadoTipo: LegadoTipo = 'semideus_semideus'
): boolean {
  if (!ramo || ramo.tipo !== 'tronco') return false;

  if (isLegado && legadoTipo === 'semideus_semideus') {
    const maxFreeSlots = Math.min(4, Math.max(0, characterLevel));
    return maxFreeSlots > 0;
  } else {
    if (power.numero === 1 && characterLevel >= 1) return true;
    if (power.numero === 2 && characterLevel >= 2) return true;
    if (power.numero === 3 && characterLevel >= 3) return true;
    if (power.numero === 4 && characterLevel >= 4) return true;
    return false;
  }
}

/**
 * Calculate the point cost for a power given its target level, whether it has free level 1.
 */
export function calculatePointsForPower(
  targetLevel: number,
  isFreeLvl1: boolean
): number {
  if (targetLevel <= 0) return 0;

  if (isFreeLvl1) {
    // Level 1 is free (0 pts)
    // Level 2 adds 2 pts (total 2 pts)
    // Level 3 adds 3 pts (total 5 pts)
    if (targetLevel === 1) return 0;
    if (targetLevel === 2) return 2;
    if (targetLevel >= 3) return 5;
  } else {
    // Standard: Level 1 = 1 pt, Level 2 = 3 pts (1+2), Level 3 = 6 pts (1+2+3)
    if (targetLevel === 1) return 1;
    if (targetLevel === 2) return 3;
    if (targetLevel >= 3) return 6;
  }
  return 0;
}

/**
 * Calculate cost to upgrade from currentLevel to next level (currentLevel + 1)
 */
export function getUpgradeCost(
  currentLevel: number,
  isFreeLvl1: boolean
): number | null {
  if (currentLevel >= 3) return null;
  const nextLevel = currentLevel + 1;
  const currentCost = calculatePointsForPower(currentLevel, isFreeLvl1);
  const nextCost = calculatePointsForPower(nextLevel, isFreeLvl1);
  return nextCost - currentCost;
}

/**
 * Calculates complete cost information for a single power
 */
export function getPowerCostInfo(
  power: Poder,
  ramo: Ramo | undefined,
  characterLevel: number,
  purchasedLevel: number, // 0, 1, 2, or 3
  isLegado: boolean = false,
  isFreeLvl1Override?: boolean,
  legadoTipo: LegadoTipo = 'semideus_semideus'
): PowerCostInfo {
  const isTronco = ramo?.tipo === 'tronco';
  const isFreeLvl1 = isFreeLvl1Override ?? isPowerEligibleForFreeTroncoLvl1(power, ramo, characterLevel, isLegado, legadoTipo);
  
  // Effective level:
  // For normal gods and Deus + Semideus, free tronco level 1 powers are granted automatically at character levels >= power.numero.
  // For Semideus + Semideus, NO power is active unless explicitly chosen/purchased by the user (purchasedLevel > 0).
  const isDoubleLegado = isLegado && legadoTipo === 'semideus_semideus';
  const effectiveLevel = (isFreeLvl1 && !isDoubleLegado) ? Math.max(1, purchasedLevel) : purchasedLevel;
  const pointsSpentOnThisPower = calculatePointsForPower(effectiveLevel, isFreeLvl1);
  const costToNextLevel = getUpgradeCost(effectiveLevel, isFreeLvl1);

  return {
    isTronco,
    isFreeLvl1,
    effectiveLevel,
    purchasedLevel,
    pointsSpentOnThisPower,
    costToNextLevel,
    costToReachLevel: {
      1: calculatePointsForPower(1, isFreeLvl1),
      2: calculatePointsForPower(2, isFreeLvl1),
      3: calculatePointsForPower(3, isFreeLvl1)
    }
  };
}

export interface SheetCalculationResult {
  totalPointsAvailable: number; // Equals character level (1-40, max 40 pts, +1 with power item)
  totalPointsSpent: number;
  pointsRemaining: number;
  isOverspent: boolean;
  isOverLimit: boolean;
  poderesCount: number;
  powerDetails: Record<string, PowerCostInfo>;
  god1PointsSpent?: number;
  god2PointsSpent?: number;
  god1OverLimit?: boolean;
  god2OverLimit?: boolean;
}

/**
 * Calculates entire sheet points, spent points, and remaining balance.
 */
export function calculateSheetPoints(
  characterLevel: number,
  purchasedPowers: Record<string, number>,
  allPowers: Poder[],
  allRamos: Ramo[],
  hasPowerPointItem: boolean = false,
  isLegado: boolean = false,
  legadoTipo: LegadoTipo = 'semideus_semideus',
  legado1Id?: string,
  legado2Id?: string
): SheetCalculationResult {
  const maxLvl = 40;
  const clampedLevel = Math.min(maxLvl, Math.max(1, characterLevel));
  
  // Both normal god and legados (Semideus + Semideus or Deus + Semideus) gain 1 pt per level (1 to 40)
  const basePoints = clampedLevel;
  const totalPointsAvailable = basePoints + (hasPowerPointItem ? 1 : 0);
  let totalPointsSpent = 0;
  let activePowersCount = 0;
  const powerDetails: Record<string, PowerCostInfo> = {};

  const freeTroncoSet = getFreeTroncoPowerIds(clampedLevel, purchasedPowers, allPowers, allRamos, isLegado, legadoTipo);

  const ramosMap = new Map<string, Ramo>();
  allRamos.forEach((r) => ramosMap.set(r.id, r));

  let god1PointsSpent = 0;
  let god2PointsSpent = 0;

  allPowers.forEach((power) => {
    const ramo = ramosMap.get(power.ramo_id);
    const rawPurchased = purchasedPowers[power.id] || 0;
    const isFreeLvl1 = freeTroncoSet.has(power.id);

    const costInfo = getPowerCostInfo(power, ramo, clampedLevel, rawPurchased, isLegado, isFreeLvl1, legadoTipo);
    powerDetails[power.id] = costInfo;
    totalPointsSpent += costInfo.pointsSpentOnThisPower;
    if (costInfo.effectiveLevel > 0) {
      activePowersCount += 1;
    }

    if (isLegado && legadoTipo === 'semideus_semideus' && ramo) {
      if (legado1Id && ramo.deus_id === legado1Id) {
        god1PointsSpent += costInfo.pointsSpentOnThisPower;
      } else if (legado2Id && ramo.deus_id === legado2Id) {
        god2PointsSpent += costInfo.pointsSpentOnThisPower;
      }
    }
  });

  const pointsRemaining = totalPointsAvailable - totalPointsSpent;
  const isOverspent = pointsRemaining < 0;
  const isSemideusSemideus = isLegado && legadoTipo === 'semideus_semideus';
  const god1OverLimit = isSemideusSemideus ? god1PointsSpent > 20 : false;
  const god2OverLimit = isSemideusSemideus ? god2PointsSpent > 20 : false;
  const isOverLimit = isOverspent || god1OverLimit || god2OverLimit;

  return {
    totalPointsAvailable,
    totalPointsSpent,
    pointsRemaining,
    isOverspent,
    isOverLimit,
    poderesCount: activePowersCount,
    powerDetails,
    god1PointsSpent,
    god2PointsSpent,
    god1OverLimit,
    god2OverLimit
  };
}

/**
 * Calculates attribute points available (earned at even levels from 1 to 40, max 20).
 */
export function getAttributePointsBudget(characterLevel: number, _isLegado: boolean = false): number {
  const maxLvl = 40;
  const cappedLevel = Math.min(maxLvl, Math.max(1, characterLevel));
  return Math.floor(cappedLevel / 2);
}

/**
 * Calculates total attribute points spent (each point above base 1 costs 1 point).
 */
export function getSpentAttributePoints(atributos: AtributosPersonagem): number {
  const attrs = normalizeAttributes(atributos);
  return (
    Math.max(0, attrs.forca - 1) +
    Math.max(0, attrs.destreza - 1) +
    Math.max(0, attrs.agilidade - 1) +
    Math.max(0, attrs.constituicao - 1) +
    Math.max(0, attrs.inteligencia - 1) +
    Math.max(0, attrs.carisma - 1) +
    Math.max(0, attrs.natureza - 1) +
    Math.max(0, attrs.magia - 1) +
    Math.max(0, attrs.espiritualidade - 1)
  );
}

/**
 * Normalizes legacy or partial attribute objects to all 9 attributes with minimum 1 and maximum 5.
 */
export function normalizeAttributes(raw?: Partial<AtributosPersonagem> | Record<string, any>): AtributosPersonagem {
  if (!raw) {
    return {
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
  }

  const r = raw as Record<string, any>;

  // Handle legacy keys if present
  const forca = Number(r.forca) || 1;
  const destreza = Number(r.destreza) || 1;
  const agilidade = Number(r.agilidade) || 1;
  const constituicao = Number(r.constituicao ?? r.vitalidade) || 1;
  const inteligencia = Number(r.inteligencia ?? r.intelecto) || 1;
  const carisma = Number(r.carisma) || 1;
  const natureza = Number(r.natureza) || 1;
  const magia = Number(r.magia ?? r.poder_magico) || 1;
  const espiritualidade = Number(r.espiritualidade) || 1;

  return {
    forca: Math.min(5, Math.max(1, forca)),
    destreza: Math.min(5, Math.max(1, destreza)),
    agilidade: Math.min(5, Math.max(1, agilidade)),
    constituicao: Math.min(5, Math.max(1, constituicao)),
    inteligencia: Math.min(5, Math.max(1, inteligencia)),
    carisma: Math.min(5, Math.max(1, carisma)),
    natureza: Math.min(5, Math.max(1, natureza)),
    magia: Math.min(5, Math.max(1, magia)),
    espiritualidade: Math.min(5, Math.max(1, espiritualidade))
  };
}

/**
 * Calculates combat status: Vida, Mana, Vigor.
 * Base = 100 + (10 * nivel)
 * Vida = base + (constituicao - 1) * 25
 * Vigor = base + (forca - 1) * 25
 * Mana = base + ((magia - 1) + (espiritualidade - 1)) * 25
 */
export function calculateCombatStatus(
  characterLevel: number,
  atributos: AtributosPersonagem
): StatusCalculados {
  const lvl = Math.max(1, Math.min(70, characterLevel));
  const base = 100 + (10 * lvl);
  const attrs = normalizeAttributes(atributos);

  const vida = base + Math.max(0, attrs.constituicao - 1) * 25;
  const vigor = base + Math.max(0, attrs.forca - 1) * 25;
  const mana = base + (Math.max(0, attrs.magia - 1) + Math.max(0, attrs.espiritualidade - 1)) * 25;

  return {
    vida,
    vigor,
    mana
  };
}

/**
 * Returns the effective power type ('ativo' | 'passivo').
 * If power.tipo_poder is defined, uses it.
 * Otherwise, default alternation rule applies:
 * Odd numbers (#1, #3, #5, ...) = 'ativo'
 * Even numbers (#2, #4, #6, ...) = 'passivo'
 */
export function getEffectivePowerType(power: Poder): 'ativo' | 'passivo' {
  if (power) {
    const rawType = power.tipo_poder || (power as any).tipo_habilidade || (power as any).tipo || (power as any).type || (power as any).tipoPoder;
    if (rawType) {
      const tp = String(rawType).toLowerCase().trim();
      if (tp === 'ativo' || tp.includes('ativ') || tp === 'a') return 'ativo';
      if (tp === 'passivo' || tp.includes('passiv') || tp === 'p') return 'passivo';
    }
  }
  const num = Number(power?.numero) || 1;
  return num % 2 !== 0 ? 'ativo' : 'passivo';
}

