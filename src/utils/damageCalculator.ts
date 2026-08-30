import { AtributosPersonagem } from '../types';
import { MATERIAIS_ARMA, METAIS_CANALIZACAO } from '../data/combatData';
import { ATTR_NOME_EXIBICAO } from './combatUtils';

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

export function calculateDamage(params: DamageCalculationParams): DamageCalculationResult {
  const breakdownLines: string[] = [];
  const attrs = params.attackerAttributes;
  const attrBonuses = params.attrBonuses || {};

  // Helper to compute an attribute value with optional % bonus
  const getAttrValue = (key: keyof AtributosPersonagem, applyBonus: boolean = true): number => {
    const rawVal = attrs[key] || 1;
    const bonusPct = applyBonus ? (attrBonuses[key] || 0) : 0;
    return rawVal * (1 + bonusPct / 100);
  };

  // 1. Calculate Base Damage depending on damageType
  let baseDamage = 0;
  const abilityDB = params.abilityDB || 0;
  const forgeBonus = params.forgeBonus || 0;

  // Material MAT calculation & flat bonuses
  let materialMatSum = 0;
  let materialFlatBonusSum = 0;
  let materialPercentBonusSum = 0;

  (params.weaponMaterials || []).forEach((matInput, idx) => {
    if (!matInput.materialKey) return;
    let matValue = 0;
    let flatBonus = 0;
    let percentBonus = 0;

    if (matInput.materialKey === 'custom') {
      matValue = matInput.customMat || 0;
      flatBonus = matInput.customBonus || 0;
      percentBonus = matInput.customPercent || 0;
    } else if (MATERIAIS_ARMA[matInput.materialKey]) {
      const def = MATERIAIS_ARMA[matInput.materialKey];
      matValue = def.mat;
      flatBonus = def.bonus;
      percentBonus = def.percent;
    }

    materialMatSum += matValue;
    if (matInput.applyEffect) {
      materialFlatBonusSum += flatBonus;
      materialPercentBonusSum += percentBonus;
    }
  });

  // Channeling Metals % Bonuses
  let channelingPercentSum = 0;
  (params.channelingMetals || []).forEach((chInput) => {
    if (chInput.metalKey && chInput.applyEffect && METAIS_CANALIZACAO[chInput.metalKey]) {
      channelingPercentSum += METAIS_CANALIZACAO[chInput.metalKey].percent;
    }
  });

  // Determine main and secondary attributes (considering substitution)
  const sub = params.attributeSub || {};

  if (params.damageType === 'unarmed') {
    const mainKey = sub.firstAttr || 'forca';
    const secKey = sub.secondAttr || 'destreza';
    const mainVal = getAttrValue(mainKey, sub.firstAttr ? sub.applyBonusFirst : true);
    const secVal = getAttrValue(secKey, sub.secondAttr ? sub.applyBonusSecond : true) / 2;
    baseDamage = mainVal + secVal + abilityDB;
    breakdownLines.push(
      `Dano Desarmado: ${ATTR_NOME_EXIBICAO[mainKey]} (${mainVal.toFixed(1)}) + ${ATTR_NOME_EXIBICAO[secKey]}/2 (${secVal.toFixed(1)}) + Poder (${abilityDB}) = ${baseDamage.toFixed(1)}`
    );
  } else if (params.damageType === 'melee') {
    const mainKey = sub.firstAttr || 'forca';
    const secKey = sub.secondAttr || 'destreza';
    const mainVal = getAttrValue(mainKey, sub.firstAttr ? sub.applyBonusFirst : true);
    const secVal = getAttrValue(secKey, sub.secondAttr ? sub.applyBonusSecond : true) / 2;
    baseDamage = materialMatSum + forgeBonus + abilityDB + mainVal + secVal;
    breakdownLines.push(
      `Dano Corpo-a-Corpo: MAT (${materialMatSum}) + FB (${forgeBonus}) + Poder (${abilityDB}) + ${ATTR_NOME_EXIBICAO[mainKey]} (${mainVal.toFixed(1)}) + ${ATTR_NOME_EXIBICAO[secKey]}/2 (${secVal.toFixed(1)}) = ${baseDamage.toFixed(1)}`
    );
  } else if (params.damageType === 'ranged') {
    const mainKey = sub.firstAttr || 'destreza';
    const secKey = sub.secondAttr || 'forca';
    const mainVal = getAttrValue(mainKey, sub.firstAttr ? sub.applyBonusFirst : true);
    const secVal = getAttrValue(secKey, sub.secondAttr ? sub.applyBonusSecond : true) / 2;
    baseDamage = materialMatSum + forgeBonus + abilityDB + mainVal + secVal;
    breakdownLines.push(
      `Dano à Distância: MAT (${materialMatSum}) + FB (${forgeBonus}) + Poder (${abilityDB}) + ${ATTR_NOME_EXIBICAO[mainKey]} (${mainVal.toFixed(1)}) + ${ATTR_NOME_EXIBICAO[secKey]}/2 (${secVal.toFixed(1)}) = ${baseDamage.toFixed(1)}`
    );
  } else if (params.damageType === 'crossbow') {
    const mainKey = sub.firstAttr || 'destreza';
    const mainVal = getAttrValue(mainKey, sub.firstAttr ? sub.applyBonusFirst : true);
    baseDamage = materialMatSum + forgeBonus + abilityDB + mainVal;
    breakdownLines.push(
      `Dano Bestas/Fogo: MAT (${materialMatSum}) + FB (${forgeBonus}) + Poder (${abilityDB}) + ${ATTR_NOME_EXIBICAO[mainKey]} (${mainVal.toFixed(1)}) = ${baseDamage.toFixed(1)}`
    );
  } else if (params.damageType === 'energy') {
    const energyKey = params.energyAttributeKey || 'natureza';
    const mainVal = getAttrValue(energyKey, true);
    baseDamage = mainVal + abilityDB;
    breakdownLines.push(
      `Dano Energético: ${ATTR_NOME_EXIBICAO[energyKey]} (${mainVal.toFixed(1)}) + Poder (${abilityDB}) = ${baseDamage.toFixed(1)}`
    );
  } else if (params.damageType === 'especial') {
    const espBase = params.especialBase || 0;
    const espKey = params.especialAttributeKey || 'forca';
    const espVal = getAttrValue(espKey, true) / 2;
    baseDamage = espBase + espVal + abilityDB;
    breakdownLines.push(
      `Dano Especial: Base (${espBase}) + ${ATTR_NOME_EXIBICAO[espKey]}/2 (${espVal.toFixed(1)}) + Poder (${abilityDB}) = ${baseDamage.toFixed(1)}`
    );
  }

  // Add Flat Material Bonus if any
  if (materialFlatBonusSum > 0) {
    baseDamage += materialFlatBonusSum;
    breakdownLines.push(`+ Bônus Fixo de Material: +${materialFlatBonusSum}`);
  }

  // Add Custom Variable
  const cVar = params.customVar;
  if (cVar && cVar.type !== 'none') {
    let customVal = 0;
    if (cVar.type === 'flat') {
      customVal = cVar.flatValue || 0;
      breakdownLines.push(`+ Variável Fixa: +${customVal}`);
    } else if (cVar.type === 'attribute' && cVar.attributeKey) {
      customVal = getAttrValue(cVar.attributeKey, true);
      breakdownLines.push(`+ Variável Atributo (${ATTR_NOME_EXIBICAO[cVar.attributeKey]}): +${customVal.toFixed(1)}`);
    } else if (cVar.type === 'halfAttribute' && cVar.attributeKey) {
      customVal = getAttrValue(cVar.attributeKey, true) / 2;
      breakdownLines.push(`+ Variável Metade de Atributo (${ATTR_NOME_EXIBICAO[cVar.attributeKey]}/2): +${customVal.toFixed(1)}`);
    }
    baseDamage += customVal;
  }

  // 2. Multiplier Calculation
  let totalMultiplierPercent = 100;

  if (materialPercentBonusSum > 0) {
    totalMultiplierPercent += materialPercentBonusSum;
    breakdownLines.push(`+ Bônus % de Materiais: +${materialPercentBonusSum}%`);
  }

  if (channelingPercentSum > 0) {
    totalMultiplierPercent += channelingPercentSum;
    breakdownLines.push(`+ Bônus % de Canalização: +${channelingPercentSum}%`);
  }

  const extraMults = params.extraMultipliers || [];
  let extraSum = 0;
  extraMults.forEach((m) => {
    extraSum += m.valor;
    if (m.descricao) {
      breakdownLines.push(`+ Bônus Extra (${m.descricao}): +${m.valor}%`);
    } else {
      breakdownLines.push(`+ Bônus Extra: +${m.valor}%`);
    }
  });
  totalMultiplierPercent += extraSum;

  const rawDamage = baseDamage * (totalMultiplierPercent / 100);
  breakdownLines.push(`Dano Bruto = Dano Base (${baseDamage.toFixed(1)}) x Multiplicador (${totalMultiplierPercent}%) = ${rawDamage.toFixed(1)}`);

  // 3. Defense Calculation
  const defAttrs = params.defenderAttributes;
  const conv = params.conversion;
  let defenseValue = 0;

  if (conv && conv.enable) {
    if (conv.type === 'single' && conv.singleAttr) {
      const defAttrVal = defAttrs[conv.singleAttr] || 1;
      const pct = (conv.singlePercent ?? 100) / 100;
      defenseValue = defAttrVal * 10 * pct;
      breakdownLines.push(`Defesa Convertida (${ATTR_NOME_EXIBICAO[conv.singleAttr]} ${pct * 100}%): ${defenseValue.toFixed(1)}`);
    } else if (conv.type === 'split' && conv.splitAttr1 && conv.splitAttr2) {
      const val1 = (defAttrs[conv.splitAttr1] || 1) * 10 * ((conv.splitPercent1 ?? 50) / 100);
      const val2 = (defAttrs[conv.splitAttr2] || 1) * 10 * ((conv.splitPercent2 ?? 50) / 100);
      defenseValue = val1 + val2;
      breakdownLines.push(`Defesa Dividida (${ATTR_NOME_EXIBICAO[conv.splitAttr1]} + ${ATTR_NOME_EXIBICAO[conv.splitAttr2]}): ${defenseValue.toFixed(1)}`);
    }
  } else {
    // Default defense attribute
    const defKey: keyof AtributosPersonagem = (params.damageType === 'energy' || params.damageType === 'especial') ? 'inteligencia' : 'constituicao';
    const defAttrVal = defAttrs[defKey] || 1;
    defenseValue = defAttrVal * 10;
    breakdownLines.push(`Defesa Base (${ATTR_NOME_EXIBICAO[defKey]}): ${defenseValue.toFixed(1)}`);
  }

  // Defense Bonuses
  const defBonuses = params.defenseBonuses || [];
  if (defBonuses.length > 0) {
    let defBonusSum = 0;
    defBonuses.forEach((b) => {
      defBonusSum += b.valor;
    });
    defenseValue = defenseValue * (1 + defBonusSum / 100);
    breakdownLines.push(`+ Bônus de Defesa (${defBonusSum}%): Defesa Final = ${defenseValue.toFixed(1)}`);
  }

  // 4. Final Damage after Defense & Effects
  const effects = params.effects || {};
  let normalDamage = 0;

  if (effects.enableTrueDamage && (effects.trueDamagePercent || 0) > 0) {
    const truePct = (effects.trueDamagePercent || 100) / 100;
    const trueDamagePortion = rawDamage * truePct;
    const normalDamagePortion = rawDamage * (1 - truePct);
    const reducedNormalPortion = Math.max(0, normalDamagePortion - defenseValue);
    normalDamage = Math.round(reducedNormalPortion + trueDamagePortion);
    breakdownLines.push(
      `Dano Verdadeiro (${truePct * 100}% ignora defesa): ${trueDamagePortion.toFixed(1)} + Dano Normal reduzido (${reducedNormalPortion.toFixed(1)}) = ${normalDamage}`
    );
  } else {
    normalDamage = Math.max(0, Math.round(rawDamage - defenseValue));
    breakdownLines.push(`Dano Final = Dano Bruto (${rawDamage.toFixed(1)}) - Defesa (${defenseValue.toFixed(1)}) = ${normalDamage}`);
  }

  // 5. Critical Damage
  let criticalDamage = 0;
  if (params.critical?.enable) {
    const critBonusPct = params.critical.bonusPercent || 0;
    const critMult = 1.5 + (critBonusPct / 100);
    criticalDamage = Math.round(normalDamage * critMult);
    breakdownLines.push(`Dano Crítico (${(critMult * 100).toFixed(0)}%): ${criticalDamage}`);
  }

  // 6. Vampirism & Area Damage
  let vampirismHeal = 0;
  if (effects.enableVampirism && (effects.vampirismPercent || 0) > 0) {
    vampirismHeal = Math.round(normalDamage * ((effects.vampirismPercent || 0) / 100));
    breakdownLines.push(`Vampirismo (${effects.vampirismPercent}%): Cura ${vampirismHeal} de Vida`);
  }

  let areaDamage = 0;
  if (effects.enableArea && (effects.areaPercent || 0) > 0) {
    areaDamage = Math.round(normalDamage * ((effects.areaPercent || 0) / 100));
    breakdownLines.push(`Dano em Área (${effects.areaPercent}%): ${areaDamage}`);
  }

  return {
    baseDamage,
    totalMultiplierPercent,
    rawDamage,
    defenseValue,
    normalDamage,
    criticalDamage,
    vampirismHeal,
    areaDamage,
    breakdownLines
  };
}
