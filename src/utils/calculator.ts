import { AtributosPersonagem, Poder, Ramo, StatusCalculados } from '../types';

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
 * Checks if a specific power qualifies for the Free Level 1 Tronco rule.
 * Rule: At levels >= 1, Tronco Power 1 gets free lvl 1
 *       At levels >= 2, Tronco Power 2 gets free lvl 1
 *       At levels >= 3, Tronco Power 3 gets free lvl 1
 *       At levels >= 4, Tronco Power 4 gets free lvl 1
 */
export function isPowerEligibleForFreeTroncoLvl1(
  power: Poder,
  ramo: Ramo | undefined,
  characterLevel: number
): boolean {
  if (!ramo || ramo.tipo !== 'tronco') return false;
  if (power.numero === 1 && characterLevel >= 1) return true;
  if (power.numero === 2 && characterLevel >= 2) return true;
  if (power.numero === 3 && characterLevel >= 3) return true;
  if (power.numero === 4 && characterLevel >= 4) return true;
  return false;
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
  purchasedLevel: number // 0, 1, 2, or 3
): PowerCostInfo {
  const isTronco = ramo?.tipo === 'tronco';
  const isFreeLvl1 = isPowerEligibleForFreeTroncoLvl1(power, ramo, characterLevel);
  
  // Effective level is at least 1 if free tronco rule applies
  const effectiveLevel = isFreeLvl1 ? Math.max(1, purchasedLevel) : purchasedLevel;
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
  totalPointsAvailable: number; // Equals character level (1-40)
  totalPointsSpent: number;
  pointsRemaining: number;
  isOverspent: boolean;
  isOverLimit: boolean;
  poderesCount: number;
  powerDetails: Record<string, PowerCostInfo>;
}

/**
 * Calculates entire sheet points, spent points, and remaining balance.
 */
export function calculateSheetPoints(
  characterLevel: number,
  purchasedPowers: Record<string, number>,
  allPowers: Poder[],
  allRamos: Ramo[]
): SheetCalculationResult {
  const clampedLevel = Math.min(40, Math.max(1, characterLevel));
  const totalPointsAvailable = clampedLevel;
  let totalPointsSpent = 0;
  let activePowersCount = 0;
  const powerDetails: Record<string, PowerCostInfo> = {};

  const ramosMap = new Map<string, Ramo>();
  allRamos.forEach((r) => ramosMap.set(r.id, r));

  allPowers.forEach((power) => {
    const ramo = ramosMap.get(power.ramo_id);
    const rawPurchased = purchasedPowers[power.id] || 0;
    const costInfo = getPowerCostInfo(power, ramo, clampedLevel, rawPurchased);
    powerDetails[power.id] = costInfo;
    totalPointsSpent += costInfo.pointsSpentOnThisPower;
    if (costInfo.effectiveLevel > 0) {
      activePowersCount += 1;
    }
  });

  const pointsRemaining = totalPointsAvailable - totalPointsSpent;
  const isOverspent = pointsRemaining < 0;

  return {
    totalPointsAvailable,
    totalPointsSpent,
    pointsRemaining,
    isOverspent,
    isOverLimit: isOverspent,
    poderesCount: activePowersCount,
    powerDetails
  };
}

/**
 * Calculates attribute points available (earned at even levels from 1 to 40, max 20).
 */
export function getAttributePointsBudget(characterLevel: number): number {
  const cappedLevel = Math.min(40, Math.max(1, characterLevel));
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
  if (power.tipo_poder === 'ativo' || power.tipo_poder === 'passivo') {
    return power.tipo_poder;
  }
  const num = Number(power.numero) || 1;
  return num % 2 !== 0 ? 'ativo' : 'passivo';
}

