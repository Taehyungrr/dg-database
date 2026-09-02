import { Deus, FichaPersonagem, Poder, Ramo, MonstroPoder } from '../types';
import { calculateSheetPoints, SheetCalculationResult } from './calculator';

export interface BBCodeOptions {
  onlyDelta?: boolean;
}

/**
 * Generates the official Percy Jackson RPG forum BBCode update format
 * based exactly on the forum template structure:
 * 
 * Nome do personagem: {Nome}
 * 
 * Investimento dos pontos:
 * {5 pontos para os níveis 2 e 3 do poder Aptidão para Lanças (Tronco)}
 * {2 pontos para o nível 2 do poder Consequência (Tronco)}
 * ...
 * 
 * Poderes no template:
 * [code]
 * [h2]Tronco[/h2]
 * [b]1. Consequência[/b]
 * [b]Descrição:[/b] ...
 * [b]Nível 1:[/b] ...
 * [b]Nível 2:[/b] ...
 * 
 * [h2]RAMO 1:  ARAUTO DA DESTRUIÇÃO[/h2]
 * ...
 * [/code]
 */
export function generateForumBBCode(
  ficha: FichaPersonagem,
  _deus: Deus | undefined,
  ramos: Ramo[],
  poderes: Poder[],
  calcResult: SheetCalculationResult,
  baseFicha?: FichaPersonagem | null,
  options?: BBCodeOptions
): string {
  // Sort ramos in standard order: tronco, ramo1, ramo2, ramo3
  const branchOrder: Record<string, number> = {
    tronco: 0,
    ramo1: 1,
    ramo2: 2,
    ramo3: 3
  };

  const sortedRamos = [...ramos].sort((a, b) => {
    const ordA = branchOrder[a.tipo] ?? 99;
    const ordB = branchOrder[b.tipo] ?? 99;
    return ordA - ordB;
  });

  const isDeltaMode = options?.onlyDelta !== false && !!baseFicha;
  let baseCalcResult: SheetCalculationResult | null = null;
  if (isDeltaMode && baseFicha) {
    baseCalcResult = calculateSheetPoints(
      baseFicha.nivel || 1,
      baseFicha.poderes_comprados || {},
      poderes,
      ramos
    );
  }

  // 1. GATHER MANUAL POINT INVESTMENTS (Delta if editing saved state, or Full if new/requested)
  const investmentLines: string[] = [];

  sortedRamos.forEach((ramo) => {
    const ramoPowers = poderes
      .filter((p) => p.ramo_id === ramo.id)
      .sort((a, b) => a.numero - b.numero);

    ramoPowers.forEach((poder) => {
      const currentCostInfo = calcResult.powerDetails[poder.id];
      if (!currentCostInfo) return;

      const currEff = currentCostInfo.effectiveLevel;
      const isFreeLvl1 = currentCostInfo.isFreeLvl1;

      // Determine Ramo display label
      let ramoLabel = 'Tronco';
      if (ramo.tipo === 'ramo1') ramoLabel = 'Ramo 1';
      else if (ramo.tipo === 'ramo2') ramoLabel = 'Ramo 2';
      else if (ramo.tipo === 'ramo3') ramoLabel = 'Ramo 3';
      else if (ramo.tipo !== 'tronco') ramoLabel = ramo.nome;

      if (isDeltaMode && baseCalcResult) {
        const baseCostInfo = baseCalcResult.powerDetails[poder.id];
        const baseEff = baseCostInfo ? baseCostInfo.effectiveLevel : 0;

        if (currEff > baseEff) {
          const baseSpent = baseCostInfo ? baseCostInfo.pointsSpentOnThisPower : 0;
          const currentSpent = currentCostInfo.pointsSpentOnThisPower;
          const deltaSpent = Math.max(0, currentSpent - baseSpent);

          if (deltaSpent > 0) {
            let levelText = '';
            if (baseEff === 0) {
              if (currEff === 1) {
                levelText = 'o nível 1';
              } else if (currEff === 2) {
                levelText = isFreeLvl1 ? 'o nível 2' : 'os níveis 1 e 2';
              } else if (currEff === 3) {
                levelText = isFreeLvl1 ? 'os níveis 2 e 3' : 'os níveis 1, 2 e 3';
              }
            } else if (baseEff === 1) {
              if (currEff === 2) {
                levelText = 'o nível 2';
              } else if (currEff === 3) {
                levelText = 'os níveis 2 e 3';
              }
            } else if (baseEff === 2) {
              if (currEff === 3) {
                levelText = 'o nível 3';
              }
            }

            const pontoWord = deltaSpent === 1 ? '1 ponto' : `${deltaSpent} pontos`;
            investmentLines.push(`${pontoWord} para ${levelText} do poder ${poder.nome} (${ramoLabel})`);
          }
        }
      } else {
        // Full investment list mode
        if (currentCostInfo.pointsSpentOnThisPower <= 0) return;

        const spent = currentCostInfo.pointsSpentOnThisPower;
        let levelText = '';
        if (isFreeLvl1) {
          if (currEff === 2) {
            levelText = `o nível 2`;
          } else if (currEff === 3) {
            levelText = `os níveis 2 e 3`;
          }
        } else {
          if (currEff === 1) {
            levelText = `o nível 1`;
          } else if (currEff === 2) {
            levelText = `os níveis 1 e 2`;
          } else if (currEff === 3) {
            levelText = `os níveis 1, 2 e 3`;
          }
        }

        const pontoWord = spent === 1 ? '1 ponto' : `${spent} pontos`;
        investmentLines.push(`${pontoWord} para ${levelText} do poder ${poder.nome} (${ramoLabel})`);
      }
    });
  });

  const investimentoSection = investmentLines.length > 0
    ? investmentLines.join('\n')
    : (isDeltaMode ? 'Nenhum novo ponto de poder investido nesta atualização.' : 'Nenhum ponto de poder investido manualmente.');

  // 2. GATHER POWERS IN FORUM TEMPLATE FORMAT (Grouped by Branch)
  const templateBranches: string[] = [];

  sortedRamos.forEach((ramo, index) => {
    const ramoPowers = poderes
      .filter((p) => p.ramo_id === ramo.id)
      .sort((a, b) => a.numero - b.numero);

    // Filter powers that are active/unlocked (effectiveLevel > 0)
    const activePowers = ramoPowers.filter((p) => {
      const costInfo = calcResult.powerDetails[p.id];
      return costInfo && costInfo.effectiveLevel > 0;
    });

    if (activePowers.length === 0) return;

    let branchHeader = '';
    if (ramo.tipo === 'tronco') {
      branchHeader = '[h2]Tronco[/h2]';
    } else {
      let cleanBranchName = ramo.nome
        .replace(/^Ramo\s*\d+\s*:\s*/i, '')
        .replace(/^Tronco\s*:\s*/i, '')
        .trim();
      const ramoNum = ramo.tipo === 'ramo1' ? '1' : ramo.tipo === 'ramo2' ? '2' : ramo.tipo === 'ramo3' ? '3' : `${index}`;
      branchHeader = `[h2]RAMO ${ramoNum}:  ${cleanBranchName.toUpperCase()}[/h2]`;
    }

    const powerBlocks = activePowers.map((poder) => {
      const costInfo = calcResult.powerDetails[poder.id];
      const effLevel = costInfo ? costInfo.effectiveLevel : 1;

      // Clean base description formatting
      let cleanBaseDesc = (poder.descricao_base || '')
        .replace(/^\[b\]\[b\]Descrição:\[\/b\]\[\/b\]\s*/i, '')
        .replace(/^\[b\]Descrição:\[\/b\]\s*/i, '')
        .replace(/^Descrição:\s*/i, '')
        .trim();

      let levelsSection = '';
      if (effLevel >= 1) {
        let cleanLvl1 = (poder.nivel_1_desc || '')
          .replace(/^\[b\]Nível 1\[\/b\]\s*/i, '')
          .replace(/^Nível 1:\s*/i, '')
          .trim();
        levelsSection += `\n[b]Nível 1:[/b] ${cleanLvl1}`;
      }
      if (effLevel >= 2) {
        let cleanLvl2 = (poder.nivel_2_desc || '')
          .replace(/^\[b\]Nível 2\[\/b\]\s*/i, '')
          .replace(/^Nível 2:\s*/i, '')
          .trim();
        levelsSection += `\n[b]Nível 2:[/b] ${cleanLvl2}`;
      }
      if (effLevel >= 3) {
        let cleanLvl3 = (poder.nivel_3_desc || '')
          .replace(/^\[b\]Nível 3\[\/b\]\s*/i, '')
          .replace(/^Nível 3:\s*/i, '')
          .trim();
        levelsSection += `\n[b]Nível 3:[/b] ${cleanLvl3}`;
      }

      return `[b]${poder.numero}. ${poder.nome}[/b]\n[b]Descrição:[/b] ${cleanBaseDesc}${levelsSection}`;
    });

    templateBranches.push(`${branchHeader}\n\n${powerBlocks.join('\n\n')}`);
  });

  const poderesTemplateSection = templateBranches.length > 0
    ? templateBranches.join('\n\n')
    : '[i]Nenhum poder ativo selecionado.[/i]';

  const output = `Nome do personagem: ${ficha.nome || 'Håkon Varg'}
Investimento dos pontos:
${investimentoSection}

Poderes no template:
[code]${poderesTemplateSection}
[/code]`;

  return output;
}

/**
 * Generates BBCode for monster powers matching the semideuses format,
 * up to a specified maximum level (1, 2, 3, or 4).
 * (Monsters do not have base descriptions and have up to 4 levels).
 */
export function generateMonstroPoderesBBCode(
  powers: MonstroPoder[],
  maxLevel: number = 4
): string {
  if (!powers || powers.length === 0) return '';

  const sortedPowers = [...powers].sort((a, b) => (a.numero || 0) - (b.numero || 0));

  const powerBlocks = sortedPowers.map((poder, index) => {
    const num = poder.numero ?? (index + 1);
    const lines: string[] = [`[b]${num}. ${poder.nome}[/b]`];

    if (maxLevel >= 1 && poder.nivel_1_desc) {
      const clean1 = poder.nivel_1_desc
        .replace(/^\[b\]Nível\s*1\[\/b\]\s*:?\s*/i, '')
        .replace(/^Nível\s*1\s*:?\s*/i, '')
        .trim();
      if (clean1) lines.push(`[b]Nível 1:[/b] ${clean1}`);
    }

    if (maxLevel >= 2 && poder.nivel_2_desc) {
      const clean2 = poder.nivel_2_desc
        .replace(/^\[b\]Nível\s*2\[\/b\]\s*:?\s*/i, '')
        .replace(/^Nível\s*2\s*:?\s*/i, '')
        .trim();
      if (clean2) lines.push(`[b]Nível 2:[/b] ${clean2}`);
    }

    if (maxLevel >= 3 && poder.nivel_3_desc) {
      const clean3 = poder.nivel_3_desc
        .replace(/^\[b\]Nível\s*3\[\/b\]\s*:?\s*/i, '')
        .replace(/^Nível\s*3\s*:?\s*/i, '')
        .trim();
      if (clean3) lines.push(`[b]Nível 3:[/b] ${clean3}`);
    }

    if (maxLevel >= 4 && poder.nivel_4_desc) {
      const clean4 = poder.nivel_4_desc
        .replace(/^\[b\]Nível\s*4\[\/b\]\s*:?\s*/i, '')
        .replace(/^Nível\s*4\s*:?\s*/i, '')
        .trim();
      if (clean4) lines.push(`[b]Nível 4:[/b] ${clean4}`);
    }

    return lines.join('\n');
  });

  return powerBlocks.join('\n\n');
}

