import { Deus, FichaPersonagem, Poder, Ramo } from '../types';
import { SheetCalculationResult } from './calculator';

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
 * [h2]Tronco[/h2]
 * [b]1. Consequência[/b]
 * [b]Descrição:[/b] ...
 * [b]Nível 1:[/b] ...
 * [b]Nível 2:[/b] ...
 * 
 * [h2]RAMO 1:  ARAUTO DA DESTRUIÇÃO[/h2]
 * ...
 */
export function generateForumBBCode(
  ficha: FichaPersonagem,
  _deus: Deus | undefined,
  ramos: Ramo[],
  poderes: Poder[],
  calcResult: SheetCalculationResult
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

  // 1. GATHER MANUAL POINT INVESTMENTS
  const investmentLines: string[] = [];

  sortedRamos.forEach((ramo) => {
    const ramoPowers = poderes
      .filter((p) => p.ramo_id === ramo.id)
      .sort((a, b) => a.numero - b.numero);

    ramoPowers.forEach((poder) => {
      const costInfo = calcResult.powerDetails[poder.id];
      if (!costInfo || costInfo.pointsSpentOnThisPower <= 0) return;

      const spent = costInfo.pointsSpentOnThisPower;
      const effLevel = costInfo.effectiveLevel;
      const isFreeLvl1 = costInfo.isFreeLvl1;

      // Determine Ramo display label
      let ramoLabel = 'Tronco';
      if (ramo.tipo === 'ramo1') ramoLabel = 'Ramo 1';
      else if (ramo.tipo === 'ramo2') ramoLabel = 'Ramo 2';
      else if (ramo.tipo === 'ramo3') ramoLabel = 'Ramo 3';
      else if (ramo.tipo !== 'tronco') ramoLabel = ramo.nome;

      let levelText = '';
      if (isFreeLvl1) {
        if (effLevel === 2) {
          levelText = `o nível 2`;
        } else if (effLevel === 3) {
          levelText = `os níveis 2 e 3`;
        }
      } else {
        if (effLevel === 1) {
          levelText = `o nível 1`;
        } else if (effLevel === 2) {
          levelText = `os níveis 1 e 2`;
        } else if (effLevel === 3) {
          levelText = `os níveis 1, 2 e 3`;
        }
      }

      const pontoWord = spent === 1 ? '1 ponto' : `${spent} pontos`;
      investmentLines.push(`${pontoWord} para ${levelText} do poder ${poder.nome} (${ramoLabel})`);
    });
  });

  const investimentoSection = investmentLines.length > 0
    ? investmentLines.join('\n')
    : 'Nenhum ponto de poder investido manualmente.';

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
      let cleanBaseDesc = poder.descricao_base
        .replace(/^\[b\]\[b\]Descrição:\[\/b\]\[\/b\]\s*/i, '')
        .replace(/^\[b\]Descrição:\[\/b\]\s*/i, '')
        .replace(/^Descrição:\s*/i, '')
        .trim();

      let levelsSection = '';
      if (effLevel >= 1) {
        let cleanLvl1 = poder.nivel_1_desc
          .replace(/^\[b\]Nível 1\[\/b\]\s*/i, '')
          .replace(/^Nível 1:\s*/i, '')
          .trim();
        levelsSection += `\n[b]Nível 1:[/b] ${cleanLvl1}`;
      }
      if (effLevel >= 2) {
        let cleanLvl2 = poder.nivel_2_desc
          .replace(/^\[b\]Nível 2\[\/b\]\s*/i, '')
          .replace(/^Nível 2:\s*/i, '')
          .trim();
        levelsSection += `\n[b]Nível 2:[/b] ${cleanLvl2}`;
      }
      if (effLevel >= 3) {
        let cleanLvl3 = poder.nivel_3_desc
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
${poderesTemplateSection}`;

  return output;
}
