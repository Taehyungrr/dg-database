import { AtributosPersonagem } from '../types';
import { MATERIAIS_ARMA, METAIS_CANALIZACAO } from '../data/combatData';
import { ATTR_NOME_EXIBICAO } from './combatUtils';

export const FULL_TO_SHORT: Record<keyof AtributosPersonagem, string> = {
  forca: 'str',
  destreza: 'dex',
  agilidade: 'agi',
  constituicao: 'con',
  inteligencia: 'int',
  carisma: 'cha',
  natureza: 'nat',
  magia: 'mag',
  espiritualidade: 'spi'
};

export const SHORT_TO_FULL: Record<string, keyof AtributosPersonagem> = {
  str: 'forca',
  dex: 'destreza',
  agi: 'agilidade',
  con: 'constituicao',
  int: 'inteligencia',
  cha: 'carisma',
  nat: 'natureza',
  mag: 'magia',
  spi: 'espiritualidade'
};

export interface WeaponMaterialInput {
  materialKey: string;
  customMat?: number;
  customBonus?: number;
  customPercent?: number;
  applyEffect: boolean;
}

export interface ChannelingMetalInput {
  metalKey: string;
  applyEffect: boolean;
}

export interface DamageCalculationParams {
  attackerAttributes: AtributosPersonagem;
  damageType: 'unarmed' | 'melee' | 'ranged' | 'crossbow' | 'energy' | 'especial';
  especialBase?: number;
  especialAttributeKey?: keyof AtributosPersonagem;
  attributeSub?: {
    firstAttr?: keyof AtributosPersonagem | '';
    applyBonusFirst?: boolean;
    secondAttr?: keyof AtributosPersonagem | '';
    applyBonusSecond?: boolean;
  };
  weaponMaterials?: WeaponMaterialInput[];
  channelingMetals?: ChannelingMetalInput[];
  forgeBonus?: number;
  energyAttributeKey?: keyof AtributosPersonagem;
  abilityDB?: number;
  customVar?: {
    type: 'none' | 'flat' | 'attribute' | 'halfAttribute';
    attributeKey?: keyof AtributosPersonagem;
    flatValue?: number;
  };
  attrBonuses?: Partial<Record<keyof AtributosPersonagem, number>>;
  extraMultipliers?: Array<{ valor: number; descricao: string }>;
  critical?: {
    enable: boolean;
    bonusPercent: number;
  };
  conversion?: {
    enable: boolean;
    type: 'single' | 'split';
    singleAttr?: keyof AtributosPersonagem;
    singlePercent?: number;
    splitAttr1?: keyof AtributosPersonagem;
    splitPercent1?: number;
    splitAttr2?: keyof AtributosPersonagem;
    splitPercent2?: number;
  };
  defenderAttributes: AtributosPersonagem;
  defenseBonuses?: Array<{ valor: number; descricao: string }>;
  effects?: {
    vampirismPercent?: number;
    enableVampirism?: boolean;
    areaPercent?: number;
    enableArea?: boolean;
    trueDamagePercent?: number;
    enableTrueDamage?: boolean;
  };
}

export interface DamageCalculationResult {
  baseDamage: number;
  totalMultiplierPercent: number;
  rawDamage: number;
  defenseValue: number;
  normalDamage: number;
  criticalDamage: number;
  vampirismHeal: number;
  areaDamage: number;
  breakdownLines: string[];
}

/**
 * Dano base concedido pelo atributo segundo o script de referência:
 * str: 20 + 5*(val-1)
 * dex: 10 + 5*(val-1)
 * int, nat, mag, spi: 10 + 10*(val-1)
 * agi, con, cha: 0
 */
export function getAttributeBaseDamage(attrShort: string, value: number): number {
  const baseValues: Record<string, number> = {
    str: 20,
    dex: 10,
    agi: 0,
    con: 0,
    int: 10,
    cha: 0,
    nat: 10,
    mag: 10,
    spi: 10
  };

  const increments: Record<string, number> = {
    str: 5,
    dex: 5,
    int: 10,
    nat: 10,
    mag: 10,
    spi: 10
  };

  if (attrShort in baseValues) {
    const base = baseValues[attrShort] ?? 0;
    const inc = increments[attrShort] ?? 0;
    return base + inc * (value - 1);
  }
  return 0;
}

/**
 * Calcula o dano de um atributo aplicando seu bônus percentual.
 */
export function getAttributeDamage(
  attrShort: string,
  attrs: AtributosPersonagem,
  attrBonuses: Partial<Record<keyof AtributosPersonagem, number>> = {},
  applyBonus: boolean = true
): number {
  const fullKey = SHORT_TO_FULL[attrShort] || (attrShort as keyof AtributosPersonagem);
  const rawVal = attrs[fullKey] ?? 1;
  const baseDamage = getAttributeBaseDamage(attrShort, rawVal);
  if (applyBonus) {
    const bonusPct = attrBonuses[fullKey] || 0;
    return baseDamage * (1 + bonusPct / 100);
  }
  return baseDamage;
}

/**
 * Retorna a porcentagem de redução de defesa conforme o atributo do defensor.
 */
export function getDefenseReduction(attrValue: number, isConstitution: boolean = false): number {
  if (isConstitution) {
    if (attrValue <= 1) return 10;
    if (attrValue === 2) return 15;
    if (attrValue === 3) return 20;
    if (attrValue === 4) return 25;
    return 30;
  } else {
    if (attrValue <= 1) return 10;
    if (attrValue === 2) return 15;
    if (attrValue === 3 || attrValue === 4) return 20;
    return 25;
  }
}

export function calculateDamage(params: DamageCalculationParams): DamageCalculationResult {
  const attrs = params.attackerAttributes;
  const attrBonuses = params.attrBonuses || {};
  const damageType = params.damageType;

  const forgeBonus =
    damageType === 'melee' || damageType === 'ranged' || damageType === 'crossbow'
      ? params.forgeBonus || 0
      : 0;

  let totalMAT = 0;
  let totalMATB = 0;
  let percentBonuses: number[] = [];

  // 1. Processamento de Materiais de Arma e Canalização
  if (damageType === 'melee' || damageType === 'ranged' || damageType === 'crossbow') {
    interface MaterialSlotResult {
      id: string;
      mat: number;
      matb: number;
      percent: number;
      applied: boolean;
    }

    const materialsSelected: MaterialSlotResult[] = [];
    const weaponMats = params.weaponMaterials || [];

    weaponMats.forEach((matInput, idx) => {
      if (!matInput.materialKey) return;
      if (matInput.materialKey === 'custom') {
        materialsSelected.push({
          id: `custom${idx + 1}`,
          mat: matInput.customMat || 0,
          matb: matInput.customBonus || 0,
          percent: matInput.customPercent || 0,
          applied: true
        });
      } else if (MATERIAIS_ARMA[matInput.materialKey]) {
        const material = MATERIAIS_ARMA[matInput.materialKey];
        materialsSelected.push({
          id: matInput.materialKey,
          mat: material.mat,
          matb: material.bonus,
          percent: material.percent || 0,
          applied: matInput.applyEffect
        });
      }
    });

    // Tratar duplicata (ex: mesmo material selecionado 2x)
    const filteredMaterials: MaterialSlotResult[] = [];
    if (materialsSelected.length > 0) {
      filteredMaterials.push(materialsSelected[0]);
      if (materialsSelected.length > 1) {
        const mat1 = materialsSelected[0];
        const mat2 = materialsSelected[1];
        const isDuplicate = mat2.id === mat1.id && mat2.id !== 'custom1' && mat2.id !== 'custom2';
        if (!isDuplicate) {
          filteredMaterials.push(mat2);
        }
      }
    }

    if (filteredMaterials.length > 0) {
      totalMAT = Math.max(...filteredMaterials.map((m) => m.mat));
    }

    const appliedBonuses = new Set<string>();
    filteredMaterials.forEach((m) => {
      if (m.applied && m.matb > 0 && !appliedBonuses.has(m.id)) {
        totalMATB += m.matb;
        appliedBonuses.add(m.id);
      }
    });

    const percentApplied = new Set<string>();
    filteredMaterials.forEach((m) => {
      if (m.applied && m.percent > 0 && !percentApplied.has(m.id)) {
        percentBonuses.push(m.percent);
        percentApplied.add(m.id);
      }
    });
  } else if (damageType === 'energy') {
    interface ChannelingSlotResult {
      id: string;
      mat: number;
      percent: number;
      applied: boolean;
    }

    const channelingSelected: ChannelingSlotResult[] = [];
    const chanMetals = params.channelingMetals || [];

    chanMetals.forEach((chInput) => {
      if (!chInput.metalKey) return;
      if (METAIS_CANALIZACAO[chInput.metalKey]) {
        const material = METAIS_CANALIZACAO[chInput.metalKey];
        channelingSelected.push({
          id: chInput.metalKey,
          mat: material.mat,
          percent: material.percent,
          applied: chInput.applyEffect
        });
      }
    });

    const filteredChanneling: ChannelingSlotResult[] = [];
    if (channelingSelected.length > 0) {
      filteredChanneling.push(channelingSelected[0]);
      if (channelingSelected.length > 1) {
        const isDuplicate = channelingSelected[1].id === channelingSelected[0].id;
        if (!isDuplicate) {
          filteredChanneling.push(channelingSelected[1]);
        }
      }
    }

    if (filteredChanneling.length > 0) {
      totalMAT = Math.max(...filteredChanneling.map((m) => m.mat));
    }

    const percentApplied = new Set<string>();
    filteredChanneling.forEach((m) => {
      if (m.applied && m.percent > 0 && !percentApplied.has(m.id)) {
        percentBonuses.push(m.percent);
        percentApplied.add(m.id);
      }
    });
  }

  // 2. Substituição de Atributos
  const sub = params.attributeSub || {};
  const firstSubShort = sub.firstAttr ? FULL_TO_SHORT[sub.firstAttr] : '';
  const secondSubShort = sub.secondAttr ? FULL_TO_SHORT[sub.secondAttr] : '';

  const getSubstitutedDamage = (
    subAttrShort: string | undefined,
    applyBonus: boolean,
    defaultValue: number,
    defaultAttrDesc: string,
    divideBy2: boolean = false
  ) => {
    let damage: number;
    let description: string;

    if (subAttrShort) {
      const fullKey = SHORT_TO_FULL[subAttrShort] || (subAttrShort as keyof AtributosPersonagem);
      const val = attrs[fullKey] ?? 1;
      const baseDmg = getAttributeBaseDamage(subAttrShort, val);
      if (applyBonus) {
        const bonusPct = attrBonuses[fullKey] || 0;
        damage = baseDmg * (1 + bonusPct / 100);
      } else {
        damage = baseDmg;
      }
      description = `${subAttrShort.toUpperCase()}${divideBy2 ? '/2' : ''}`;
    } else {
      damage = defaultValue;
      description = defaultAttrDesc;
    }

    if (divideBy2) {
      damage = damage / 2;
    }

    return { damage, description };
  };

  // 3. Cálculo do Dano Base por Modalidade
  let baseDamage = 0;
  let breakdown: string[] = [];

  switch (damageType) {
    case 'unarmed': {
      const strDamage = getAttributeDamage('str', attrs, attrBonuses, true);
      const dexDamage = getAttributeDamage('dex', attrs, attrBonuses, true) / 2;
      baseDamage = strDamage + dexDamage;
      breakdown = [`Força: ${strDamage.toFixed(2)}`, `Destreza/2: ${dexDamage.toFixed(2)}`];
      break;
    }
    case 'melee': {
      const defaultFirst = getAttributeDamage('str', attrs, attrBonuses, true);
      const firstResult = getSubstitutedDamage(
        firstSubShort,
        !!sub.applyBonusFirst,
        defaultFirst,
        'Força'
      );

      const defaultSecond = getAttributeDamage('dex', attrs, attrBonuses, true) / 2;
      const secondResult = getSubstitutedDamage(
        secondSubShort,
        !!sub.applyBonusSecond,
        defaultSecond,
        'Destreza/2',
        secondSubShort ? true : false
      );

      baseDamage = totalMAT + totalMATB + forgeBonus + firstResult.damage + secondResult.damage;

      breakdown = [
        `Material (Maior valor): +${totalMAT}`,
        `Bônus de forja: +${forgeBonus}`,
        `Bônus do material (MATB): +${totalMATB}`,
        `1º atributo: ${firstResult.damage.toFixed(2)} ${firstSubShort ? '(substituído por ' + firstResult.description + ')' : ''}`,
        `2º atributo/2: ${secondResult.damage.toFixed(2)} ${secondSubShort ? '(substituído por ' + secondResult.description + ')' : ''}`
      ];
      break;
    }
    case 'ranged': {
      const defaultFirstRanged = getAttributeDamage('dex', attrs, attrBonuses, true);
      const firstResultRanged = getSubstitutedDamage(
        firstSubShort,
        !!sub.applyBonusFirst,
        defaultFirstRanged,
        'Destreza'
      );

      const defaultSecondRanged = getAttributeDamage('str', attrs, attrBonuses, true) / 2;
      const secondResultRanged = getSubstitutedDamage(
        secondSubShort,
        !!sub.applyBonusSecond,
        defaultSecondRanged,
        'Força/2',
        secondSubShort ? true : false
      );

      baseDamage = totalMAT + totalMATB + forgeBonus + firstResultRanged.damage + secondResultRanged.damage;

      breakdown = [
        `Material (Maior valor): +${totalMAT}`,
        `Bônus de forja: +${forgeBonus}`,
        `Bônus do material (MATB): +${totalMATB}`,
        `1º atributo: ${firstResultRanged.damage.toFixed(2)} ${firstSubShort ? '(substituído por ' + firstResultRanged.description + ')' : ''}`,
        `2º atributo/2: ${secondResultRanged.damage.toFixed(2)} ${secondSubShort ? '(substituído por ' + secondResultRanged.description + ')' : ''}`
      ];
      break;
    }
    case 'crossbow': {
      const defaultFirstXbow = getAttributeDamage('dex', attrs, attrBonuses, true);
      const firstResultXbow = getSubstitutedDamage(
        firstSubShort,
        !!sub.applyBonusFirst,
        defaultFirstXbow,
        'Destreza'
      );

      baseDamage = totalMAT + totalMATB + forgeBonus + firstResultXbow.damage;

      breakdown = [
        `Material: +${totalMAT}`,
        `Bônus de forja: +${forgeBonus}`,
        `Bônus do material (MATB): +${totalMATB}`,
        `Destreza: ${firstResultXbow.damage.toFixed(2)} ${firstSubShort ? '(substituído por ' + firstResultXbow.description + ')' : ''}`
      ];
      break;
    }
    case 'energy': {
      const abilityDB = params.abilityDB || 0;
      const energyAttrKey = params.energyAttributeKey || 'natureza';
      const energyShort = FULL_TO_SHORT[energyAttrKey] || 'nat';
      const energyBase = getAttributeDamage(energyShort, attrs, attrBonuses, true);

      baseDamage = abilityDB + energyBase;
      breakdown = [
        `Dano base de habilidade: ${abilityDB}`,
        `${energyShort.toUpperCase()}: ${energyBase.toFixed(2)}`
      ];
      break;
    }
    case 'especial': {
      const especialBase = params.especialBase || 0;
      const especialAttrKey = params.especialAttributeKey || 'forca';
      const especialShort = FULL_TO_SHORT[especialAttrKey] || 'str';

      const attrDamage = getAttributeDamage(especialShort, attrs, attrBonuses, true);
      const attrHalfDamage = attrDamage / 2;

      baseDamage = especialBase + attrHalfDamage;

      const attrNames: Record<string, string> = {
        str: 'Força',
        dex: 'Destreza',
        agi: 'Agilidade',
        con: 'Constituição',
        int: 'Inteligência',
        cha: 'Carisma',
        nat: 'Natureza',
        mag: 'Magia',
        spi: 'Espiritualidade'
      };

      breakdown = [
        `Valor base: ${especialBase}`,
        `${attrNames[especialShort] || 'Atributo'}: ${attrDamage.toFixed(2)} / 2 = ${attrHalfDamage.toFixed(2)}`,
        `Total especial: ${especialBase} + ${attrHalfDamage.toFixed(2)} = ${baseDamage.toFixed(2)}`
      ];
      break;
    }
  }

  // 4. Variável Personalizada
  const cVar = params.customVar;
  if (cVar && cVar.type !== 'none') {
    let customVal = 0;
    if (cVar.type === 'flat') {
      customVal = cVar.flatValue || 0;
    } else if (cVar.attributeKey) {
      const customShort = FULL_TO_SHORT[cVar.attributeKey] || 'str';
      const baseVal = getAttributeDamage(customShort, attrs, attrBonuses, true);
      customVal = cVar.type === 'halfAttribute' ? baseVal / 2 : baseVal;
    }

    if (customVal !== 0) {
      breakdown.push(`Variável personalizada: +${customVal.toFixed(2)}`);
      baseDamage += customVal;
    }
  }

  // 5. Multiplicadores Bônus (%)
  let totalBonusPercent = 0;
  const bonusBreakdownParts: string[] = [];

  percentBonuses.forEach((pct) => {
    if (pct > 0) {
      totalBonusPercent += pct;
      bonusBreakdownParts.push(`${pct}% (material)`);
    }
  });

  const extraMults = params.extraMultipliers || [];
  if (extraMults.length > 0) {
    const extraTotal = extraMults.reduce((sum, m) => sum + m.valor, 0);
    totalBonusPercent += extraTotal;
    const extraStr = extraMults
      .map((m) => (m.descricao ? `${m.valor}% (${m.descricao})` : `${m.valor}%`))
      .join(' + ');
    bonusBreakdownParts.push(extraStr);
  }

  let damageBeforeDefense = baseDamage;
  const multiplierBreakdown: string[] = [];

  if (totalBonusPercent > 0) {
    const previousDamage = damageBeforeDefense;
    damageBeforeDefense = previousDamage * (1 + totalBonusPercent / 100);
    multiplierBreakdown.push(
      `Bônus totais somados: ${bonusBreakdownParts.join(' + ')} = +${totalBonusPercent}% total → ${previousDamage.toFixed(2)} × ${(1 + totalBonusPercent / 100).toFixed(2)} = ${damageBeforeDefense.toFixed(2)}`
    );
  }

  // 6. Cálculo do Crítico (Antes das Defesas)
  const enableCritical = !!params.critical?.enable;
  const criticalBonus = enableCritical ? params.critical?.bonusPercent || 0 : 0;
  let baseCritPercent = 0;

  if (enableCritical) {
    if (damageType === 'energy') {
      const energyAttrKey = params.energyAttributeKey || 'natureza';
      const energyShort = FULL_TO_SHORT[energyAttrKey] || 'nat';
      const energyVal = attrs[energyAttrKey] || 1;
      baseCritPercent = Math.min(energyVal, 5) * 10;
    } else {
      const agiVal = attrs.agilidade || 1;
      baseCritPercent = Math.min(agiVal, 5) * 10;
    }
  }

  const totalCritPercent = baseCritPercent + criticalBonus;
  const critMultiplier = 1 + totalCritPercent / 100;
  const criticalDamageBeforeDefense = enableCritical ? damageBeforeDefense * critMultiplier : 0;

  // 7. Aplicação das Reduções do Defensor
  const defAttrs = params.defenderAttributes;
  const defenderMap: Record<string, number> = {
    con: defAttrs.constituicao || 1,
    int: defAttrs.inteligencia || 1,
    nat: defAttrs.natureza || 1,
    mag: defAttrs.magia || 1,
    spi: defAttrs.espiritualidade || 1,
    str: defAttrs.forca || 1,
    dex: defAttrs.destreza || 1,
    agi: defAttrs.agilidade || 1,
    cha: defAttrs.carisma || 1
  };

  const attrDisplayNamesShort: Record<string, string> = {
    str: 'Força',
    dex: 'Destreza',
    agi: 'Agilidade',
    con: 'Constituição',
    int: 'Inteligência',
    cha: 'Carisma',
    nat: 'Natureza',
    mag: 'Magia',
    spi: 'Espiritualidade'
  };

  const effects = params.effects || {};
  const trueDamageChecked = !!effects.enableTrueDamage;
  const trueDamagePercent = trueDamageChecked ? effects.trueDamagePercent ?? 100 : 0;

  const conv = params.conversion;
  const enableConversion = !!conv?.enable;

  let overallReductionPercent = 0;

  const applyReductions = (damageValue: number, label: string, breakdownArray: string[]): number => {
    let currentDamage = damageValue;
    const trueDamageAffected = trueDamageChecked ? trueDamagePercent / 100 : 0;
    const normalDamagePortion = 1 - trueDamageAffected;

    const damageToReduce = currentDamage * normalDamagePortion;
    const trueDamagePart = currentDamage * trueDamageAffected;

    if (normalDamagePortion > 0) {
      let totalReductionPercent = 0;
      const reductionParts: string[] = [];

      if (enableConversion && conv) {
        if (conv.type === 'single' && conv.singleAttr) {
          const convShort = FULL_TO_SHORT[conv.singleAttr] || 'con';
          const convPercent = conv.singlePercent ?? 100;
          const defenseValue = defenderMap[convShort] || 1;
          const isConstitution = convShort === 'con';
          const defenseName = attrDisplayNamesShort[convShort] || 'Constituição';

          if (convPercent < 100) {
            const convertedPortion = convPercent / 100;
            const normalPortion = 1 - convertedPortion;
            const convertedReduction = getDefenseReduction(defenseValue, isConstitution);
            const normalReduction = getDefenseReduction(defenderMap.con, true);

            totalReductionPercent = convertedReduction * convertedPortion + normalReduction * normalPortion;
            reductionParts.push(
              `Conversão ${convPercent}% (${defenseName}=${defenseValue}): ${convertedReduction}% × ${(convertedPortion * 100).toFixed(0)}% = ${(convertedReduction * convertedPortion).toFixed(1)}%`
            );
            reductionParts.push(
              `CON=${defenderMap.con}: ${normalReduction}% × ${(normalPortion * 100).toFixed(0)}% = ${(normalReduction * normalPortion).toFixed(1)}%`
            );
          } else {
            totalReductionPercent = getDefenseReduction(defenseValue, isConstitution);
            reductionParts.push(`Conversão (${defenseName}=${defenseValue}): ${totalReductionPercent}%`);
          }
        } else if (conv.type === 'split' && conv.splitAttr1 && conv.splitAttr2) {
          const s1Short = FULL_TO_SHORT[conv.splitAttr1] || 'con';
          const s2Short = FULL_TO_SHORT[conv.splitAttr2] || 'con';
          const p1Pct = conv.splitPercent1 ?? 50;
          const p2Pct = conv.splitPercent2 ?? 50;

          if (p1Pct + p2Pct === 100) {
            const portion1 = p1Pct / 100;
            const portion2 = p2Pct / 100;
            const defName1 = attrDisplayNamesShort[s1Short];
            const defName2 = attrDisplayNamesShort[s2Short];

            const reduction1 = getDefenseReduction(defenderMap[s1Short], s1Short === 'con');
            const reduction2 = getDefenseReduction(defenderMap[s2Short], s2Short === 'con');

            totalReductionPercent = reduction1 * portion1 + reduction2 * portion2;
            reductionParts.push(
              `${defName1}=${defenderMap[s1Short]}: ${reduction1}% × ${p1Pct}% = ${(reduction1 * portion1).toFixed(1)}%`
            );
            reductionParts.push(
              `${defName2}=${defenderMap[s2Short]}: ${reduction2}% × ${p2Pct}% = ${(reduction2 * portion2).toFixed(1)}%`
            );
          } else {
            totalReductionPercent = getDefenseReduction(defenderMap.con, true);
            reductionParts.push(`Constituição (padrão): ${totalReductionPercent}%`);
          }
        }
      } else {
        let relevantDefense = 0;
        if (damageType === 'energy') {
          const energyAttrKey = params.energyAttributeKey || 'natureza';
          const energyShort = FULL_TO_SHORT[energyAttrKey] || 'nat';
          switch (energyShort) {
            case 'int':
              relevantDefense = getDefenseReduction(defenderMap.int, false);
              break;
            case 'nat':
              relevantDefense = getDefenseReduction(defenderMap.nat, false);
              break;
            case 'mag':
              relevantDefense = getDefenseReduction(defenderMap.mag, false);
              break;
            case 'spi':
              relevantDefense = getDefenseReduction(defenderMap.spi, false);
              break;
            default:
              relevantDefense = getDefenseReduction(defenderMap.con, true);
              break;
          }
        } else {
          relevantDefense = getDefenseReduction(defenderMap.con, true);
        }
        totalReductionPercent = relevantDefense;
        reductionParts.push(`Redução base: ${totalReductionPercent}%`);
      }

      const defBonuses = params.defenseBonuses || [];
      if (defBonuses.length > 0) {
        const totalDefBonus = defBonuses.reduce((sum, b) => sum + b.valor, 0);
        totalReductionPercent += totalDefBonus;
        reductionParts.push(`+ Bônus de Defesa: +${totalDefBonus}%`);
      }

      overallReductionPercent = totalReductionPercent;
      const reductionValue = damageToReduce * (totalReductionPercent / 100);
      currentDamage = trueDamagePart + (damageToReduce - reductionValue);

      breakdownArray.push(
        `${label} - Reduções combinadas: ${reductionParts.join(' + ')} = ${totalReductionPercent.toFixed(1)}% total → -${reductionValue.toFixed(2)}`
      );
    }

    return currentDamage;
  };

  const reductionBreakdownNormal: string[] = [];
  const reductionBreakdownCritical: string[] = [];

  const finalNormalDamageRaw = applyReductions(damageBeforeDefense, 'Normal', reductionBreakdownNormal);
  const finalCriticalDamageRaw = enableCritical
    ? applyReductions(criticalDamageBeforeDefense, 'Crítico', reductionBreakdownCritical)
    : 0;

  const normalDamage = Math.floor(finalNormalDamageRaw);
  const criticalDamage = enableCritical ? Math.floor(finalCriticalDamageRaw) : 0;

  // 8. Montagem do Log (Full Breakdown)
  const fullBreakdown: string[] = [...breakdown];
  fullBreakdown.push(`Dano base total: ${baseDamage.toFixed(2)}`);

  if (multiplierBreakdown.length > 0) {
    fullBreakdown.push('--- Multiplicadores bônus ---');
    fullBreakdown.push(...multiplierBreakdown);
  }

  fullBreakdown.push(`Dano após multiplicadores: ${damageBeforeDefense.toFixed(2)}`);

  if (enableCritical) {
    fullBreakdown.push('--- Cálculo do crítico (antes das defesas) ---');
    if (damageType === 'energy') {
      const energyAttrKey = params.energyAttributeKey || 'natureza';
      const energyShort = FULL_TO_SHORT[energyAttrKey] || 'nat';
      const energyVal = attrs[energyAttrKey] || 1;
      fullBreakdown.push(
        `Chance base: ${Math.min(energyVal, 5) * 10}% (${energyShort.toUpperCase()}=${energyVal}, máximo 5 → 50%)`
      );
    } else {
      const agiVal = attrs.agilidade || 1;
      fullBreakdown.push(`Chance base: ${Math.min(agiVal, 5) * 10}% (AGI=${agiVal}, máximo 5 → 50%)`);
    }

    if (criticalBonus > 0) {
      fullBreakdown.push(`Bônus crítico adicional: +${criticalBonus}%`);
    }

    fullBreakdown.push(
      `Multiplicador crítico final: ${critMultiplier.toFixed(2)}x (${totalCritPercent}% total)`
    );
    fullBreakdown.push(`Dano crítico antes das defesas: ${criticalDamageBeforeDefense.toFixed(2)}`);
  } else {
    fullBreakdown.push('--- Cálculo de crítico desativado ---');
  }

  fullBreakdown.push('--- Reduções do defensor (dano normal) ---');
  fullBreakdown.push(...reductionBreakdownNormal);
  fullBreakdown.push(`Dano normal após reduções: ${finalNormalDamageRaw.toFixed(2)} → ${normalDamage} (arredondado)`);

  if (enableCritical) {
    fullBreakdown.push('--- Reduções do defensor (dano crítico) ---');
    fullBreakdown.push(...reductionBreakdownCritical);
    fullBreakdown.push(`Dano crítico após reduções: ${finalCriticalDamageRaw.toFixed(2)} → ${criticalDamage} (arredondado)`);
  }

  // 9. Efeitos Extras (Vampirismo e Dano em Área)
  let vampirismHeal = 0;
  if (effects.enableVampirism && (effects.vampirismPercent || 0) > 0) {
    vampirismHeal = Math.floor(normalDamage * ((effects.vampirismPercent || 0) / 100));
  }

  let areaDamage = 0;
  if (effects.enableArea && (effects.areaPercent || 0) > 0) {
    areaDamage = Math.floor(normalDamage * ((effects.areaPercent || 0) / 100));
  }

  return {
    baseDamage,
    totalMultiplierPercent: totalBonusPercent,
    rawDamage: damageBeforeDefense,
    defenseValue: overallReductionPercent,
    normalDamage,
    criticalDamage,
    vampirismHeal,
    areaDamage,
    breakdownLines: fullBreakdown
  };
}
