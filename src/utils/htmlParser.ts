import { Deus, Ramo, Poder, RamoTipo } from '../types';

export interface ParsedForumData {
  deus: Partial<Deus>;
  ramos: Partial<Ramo>[];
  poderes: Partial<Poder>[];
  logs: string[];
}

/**
 * Extracts and normalizes God name from forum titles like:
 * "Poderes dos Filhos de Ares e Marte" -> "Ares / Marte"
 * "Poseidon / Netuno" -> "Poseidon / Netuno"
 */
function normalizeGodName(rawTitle: string): string {
  let clean = rawTitle
    .replace(/^\[(?:titulo|h1|h2|b|size=[^\]]+)\]/i, '')
    .replace(/\[\/(?:titulo|h1|h2|b|size)\]$/i, '')
    .replace(/^Poderes\s+dos\s+Filhos\s+de\s+/i, '')
    .replace(/^Poderes\s+das\s+Filhas\s+de\s+/i, '')
    .replace(/^Poderes\s+de\s+/i, '')
    .replace(/^Árvore\s+de\s+Poderes\s*:\s*/i, '')
    .replace(/^Arvore\s+de\s+Poderes\s*:\s*/i, '')
    .trim();

  // If contains "e", e.g. "Ares e Marte" -> "Ares / Marte"
  if (clean.includes(' e ') && !clean.includes('/')) {
    clean = clean.replace(' e ', ' / ');
  }

  return clean || 'Deus do Olimpo';
}

/**
 * Normalizes multi-line text preserving intentional linebreaks (\n, \n\n)
 * while collapsing excessive empty spacing (> 2 newlines).
 */
function normalizePreservedText(text: string): string {
  if (!text) return '';
  return text
    .replace(/\u00a0/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\[br\]/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .split('\n')
    .map((line) => line.trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Extracts text content from a DOM Element while faithfully converting
 * <br>, <p>, <div>, <li>, and block elements to linebreaks.
 */
function extractHtmlTextWithLineBreaks(el: Element | null): string {
  if (!el) return '';
  const clone = el.cloneNode(true) as HTMLElement;

  // 1. Replace all <br> with newline text nodes
  clone.querySelectorAll('br').forEach((br) => {
    br.replaceWith(document.createTextNode('\n'));
  });

  // 2. Add linebreaks around paragraphs and blocks
  clone.querySelectorAll('p, div, li, blockquote, tr, h1, h2, h3, h4, h5, h6').forEach((block) => {
    block.prepend(document.createTextNode('\n'));
    block.append(document.createTextNode('\n'));
  });

  const raw = clone.textContent || '';
  return normalizePreservedText(raw);
}

/**
 * Cleans BBCode tags and prefixes from base description while keeping internal newlines.
 */
function cleanBaseDescription(text: string): string {
  let clean = text
    .replace(/^\[b\]\[b\]Descriç(?:ã|a)o:?\[\/b\]\[\/b\]\s*/i, '')
    .replace(/^\[b\]Descriç(?:ã|a)o:?\[\/b\]\s*/i, '')
    .replace(/^Descriç(?:ã|a)o:\s*/i, '')
    .trim();

  return normalizePreservedText(clean);
}

/**
 * Cleans BBCode level headers (e.g. "[b]Nível 1[/b]") while keeping all multi-line content inside the level.
 */
function cleanLevelDescription(text: string, defaultFallback: string): string {
  if (!text || !text.trim()) return defaultFallback;

  let clean = text
    .replace(/^\[b\]\[b\]N[ií]vel\s*\d+\[\/b\]\[\/b\]\s*:?/i, '')
    .replace(/^\[b\]N[ií]vel\s*\d+\[\/b\]\s*:?/i, '')
    .replace(/^N[ií]vel\s*\d+\s*:\s*/i, '')
    .replace(/^N[ií]vel\s*\d+\s*/i, '')
    .trim();

  clean = normalizePreservedText(clean);
  // If the result is just a Roman numeral or a single digit button label, treat as empty
  if (!clean || /^(I|II|III|IV|V|1|2|3|4|5)$/i.test(clean.trim())) {
    return defaultFallback;
  }

  return clean;
}

/**
 * Searches for a power's level description element while strictly ignoring button toggles.
 */
function findLevelElement(pCard: Element, levelNum: number): Element | null {
  const selectors = [
    `.info div#poder${levelNum}`,
    `.desc div#poder${levelNum}`,
    `div.desc #poder${levelNum}`,
    `div#poder${levelNum}.nivelp`,
    `div.nivelp[id="poder${levelNum}"]`,
    `div.nivelp[name="poder${levelNum}"]`,
    `div#poder${levelNum}`,
    `div.nivelp#poder${levelNum}`,
    `div.nivelp:nth-of-type(${levelNum})`,
    `div#nivel${levelNum}`,
    `div.nivel${levelNum}`,
    `div[data-nivel="${levelNum}"]`,
    `div[data-level="${levelNum}"]`,
    `.dg-nivel-${levelNum}`,
    `#poder${levelNum}`,
    `#nivel${levelNum}`
  ];

  for (const sel of selectors) {
    const candidates = Array.from(pCard.querySelectorAll(sel));
    for (const el of candidates) {
      if (el.tagName.toLowerCase() === 'button') continue;
      if (el.closest('.botoes') || el.closest('.controle') || el.closest('.nav-ramos') || el.closest('.niveis')) continue;
      const text = el.textContent?.trim() || '';
      // If the text is purely a button index (e.g. "I", "II", "III"), ignore it
      if (/^(I|II|III|IV|V|1|2|3|4|5)$/i.test(text)) continue;
      if (text.length > 0) {
        return el;
      }
    }
  }

  return null;
}

/**
 * HTML Parser for Forum Tree structures.
 */
function parseHtmlTreeInternal(rawHtml: string): ParsedForumData {
  const logs: string[] = [];
  const ramos: Partial<Ramo>[] = [];
  const poderes: Partial<Poder>[] = [];

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(rawHtml, 'text/html');

    // 1. Detect God Name and Theme Color and Background Image
    let godName = '';
    let godColor = '#8b5cf6';
    let godImage = '';

    const titleEl = doc.querySelector('titulo, .topo titulo, .topo, #dg-deus, .dg-deus-nome, .nome-deus, h1, h2');
    if (titleEl && titleEl.textContent?.trim()) {
      godName = normalizeGodName(titleEl.textContent.trim());
      logs.push(`Identificado título do Deus: "${godName}"`);
    } else {
      godName = 'Divindade';
    }

    // Detect color & image from style attributes
    const mainContainer = doc.querySelector('#dg-arvore, [style*="--cor"], [style*="--imagem"], [style*="background"]');
    if (mainContainer) {
      const styleAttr = mainContainer.getAttribute('style') || '';

      const imgMatch = styleAttr.match(/--imagem:\s*url\(['"]?(.*?)['"]?\)/i);
      if (imgMatch) {
        godImage = imgMatch[1];
        logs.push(`Imagem de fundo extraída: ${godImage}`);
      }

      const hexMatch = styleAttr.match(/#(?:[0-9a-fA-F]{3}){1,2}\b/);
      if (hexMatch) {
        godColor = hexMatch[0];
        logs.push(`Cor característica extraída: ${godColor}`);
      } else if (styleAttr.includes('--ares')) {
        godColor = '#ef4444';
      } else if (styleAttr.includes('--poseidon')) {
        godColor = '#0ea5e9';
      } else if (styleAttr.includes('--zeus')) {
        godColor = '#38bdf8';
      } else if (styleAttr.includes('--eter') || styleAttr.includes('--aether')) {
        godColor = '#0284c7';
      } else if (styleAttr.includes('--orfeu') || styleAttr.includes('--orpheus')) {
        godColor = '#d97706';
      } else if (styleAttr.includes('--hades') || styleAttr.includes('--macaria') || styleAttr.includes('--hecate')) {
        godColor = '#a855f7';
      } else if (styleAttr.includes('--nyx')) {
        godColor = '#4338ca';
      } else if (styleAttr.includes('--thanatos')) {
        godColor = '#475569';
      } else if (styleAttr.includes('--hypnos')) {
        godColor = '#6366f1';
      } else if (styleAttr.includes('--erebo')) {
        godColor = '#1e1b4b';
      } else if (styleAttr.includes('--persefone')) {
        godColor = '#059669';
      } else if (styleAttr.includes('--atena')) {
        godColor = '#f59e0b';
      } else if (styleAttr.includes('--apolo')) {
        godColor = '#eab308';
      } else if (styleAttr.includes('--artemis')) {
        godColor = '#10b981';
      } else if (styleAttr.includes('--afrodite')) {
        godColor = '#ec4899';
      } else if (styleAttr.includes('--hermes')) {
        godColor = '#06b6d4';
      } else if (styleAttr.includes('--hefesto')) {
        godColor = '#f97316';
      } else if (styleAttr.includes('--demeter')) {
        godColor = '#84cc16';
      } else if (styleAttr.includes('--dionisio')) {
        godColor = '#9333ea';
      }
    }

    const godId = godName
      .toLowerCase()
      .split('/')[0]
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '_')
      .trim() || 'deus_' + Date.now();

    const parsedDeus: Partial<Deus> = {
      id: godId,
      nome_grego_romano: godName,
      cor_hex: godColor,
      imagem_url: godImage,
      simbolo: '',
      atributos_principais: '',
      descricao: '',
      titulo_mitologico: ''
    };

    // 2. Read branch button labels from .controle if available
    const branchNamesMap: Record<string, string> = {
      tronco: 'Tronco',
      ramo1: 'Ramo 1',
      ramo2: 'Ramo 2',
      ramo3: 'Ramo 3'
    };

    const controlButtons = doc.querySelectorAll('.controle button, .nav-ramos button');
    controlButtons.forEach((btn) => {
      const nameAttr = btn.getAttribute('name');
      const text = btn.textContent?.trim();
      if (nameAttr && text) {
        branchNamesMap[nameAttr] = text;
        logs.push(`Nome de ramo mapeado [${nameAttr}]: "${text}"`);
      }
    });

    // 3. Detect Ramos
    let rawBranchElements = Array.from(
      doc.querySelectorAll('div.ramo, div[class*="dg-ramo"], div#dg-tronco, div#dg-ramo1, div#dg-ramo2, div#dg-ramo3, div[name="tronco"], div[name="ramo1"], div[name="ramo2"], div[name="ramo3"]')
    ).filter((el) => {
      if (el.tagName.toLowerCase() === 'button') return false;
      if (el.closest('.controle') || el.closest('.nav-ramos')) return false;
      return true;
    });

    if (rawBranchElements.length === 0) {
      rawBranchElements = Array.from(doc.querySelectorAll('#dg-arvore > div.ramo, #dg-arvore > div[name]')).filter((el) => {
        return !el.classList.contains('controle') && !el.classList.contains('topo');
      });
    }

    const branchTypeKeys: RamoTipo[] = ['tronco', 'ramo1', 'ramo2', 'ramo3'];
    const seenBranchTypes = new Set<RamoTipo>();

    if (rawBranchElements.length > 0) {
      rawBranchElements.forEach((ramoEl, rIndex) => {
        const nameAttr = (ramoEl.getAttribute('name') || '').toLowerCase();
        const idAttr = (ramoEl.getAttribute('id') || '').toLowerCase();
        const classAttr = (ramoEl.getAttribute('class') || '').toLowerCase();

        let branchType: RamoTipo = 'tronco';
        if (nameAttr === 'tronco' || idAttr.includes('tronco') || classAttr.includes('tronco')) {
          branchType = 'tronco';
        } else if (nameAttr === 'ramo1' || idAttr.includes('ramo1') || classAttr.includes('ramo1')) {
          branchType = 'ramo1';
        } else if (nameAttr === 'ramo2' || idAttr.includes('ramo2') || classAttr.includes('ramo2')) {
          branchType = 'ramo2';
        } else if (nameAttr === 'ramo3' || idAttr.includes('ramo3') || classAttr.includes('ramo3')) {
          branchType = 'ramo3';
        } else {
          branchType = branchTypeKeys[rIndex] || 'ramo3';
        }

        if (seenBranchTypes.has(branchType)) {
          return;
        }
        seenBranchTypes.add(branchType);

        const branchId = `${godId}_${branchType}`;
        const branchTitle = branchNamesMap[branchType] || (branchType === 'tronco' ? 'Tronco' : `Ramo ${rIndex}`);

        ramos.push({
          id: branchId,
          deus_id: godId,
          tipo: branchType,
          nome: branchTitle,
          descricao: `Ramo de habilidades de ${godName}.`
        });

        // 4. Extract Powers inside this Branch
        const powerCards = ramoEl.querySelectorAll('.poder, .dg-poder, [class*="card-poder"]');
        powerCards.forEach((pCard, pIndex) => {
          const nameEl = pCard.querySelector('.nome, .dg-poder-nome, .nome-poder, h3, h4, strong');
          const rawName = (nameEl?.textContent || `Poder ${pIndex + 1}`).replace(/\u00a0/g, ' ').trim();

          let pNum = pIndex + 1;
          let pCleanName = rawName;
          const numMatch = rawName.match(/^(\d+)\.\s*(.*)/);
          if (numMatch) {
            pNum = parseInt(numMatch[1], 10);
            pCleanName = numMatch[2].trim();
          }

          // Extract Icon URL
          let iconUrl = 'zap';
          const iconDiv = pCard.querySelector('.iconic, [style*="--icon"], [style*="background"], img, .icon, .fashion');
          if (iconDiv) {
            if (iconDiv.tagName.toLowerCase() === 'img') {
              iconUrl = (iconDiv as HTMLImageElement).src || (iconDiv as HTMLImageElement).getAttribute('src') || 'zap';
            } else {
              const fullStyle = iconDiv.getAttribute('style') || '';
              const urlMatch = fullStyle.match(/url\(['"]?(.*?)['"]?\)/i);
              if (urlMatch && urlMatch[1] && urlMatch[1].trim()) {
                iconUrl = urlMatch[1].trim();
              }
            }
          }

          if (iconUrl === 'zap') {
            const pCardHtml = pCard.innerHTML || '';
            const inlineMatch = pCardHtml.match(/--icon:\s*url\(['"]?(.*?)['"]?\)/i) ||
                               pCardHtml.match(/background(?:-image)?:\s*url\(['"]?(.*?)['"]?\)/i) ||
                               pCardHtml.match(/<img[^>]+src=['"]([^'"]+)['"]/i) ||
                               pCardHtml.match(/\[img\](.*?)\[\/img\]/i);
            if (inlineMatch && inlineMatch[1] && inlineMatch[1].trim()) {
              iconUrl = inlineMatch[1].trim();
            }
          }

          // Extract Base Description with LINE BREAKS PRESERVED
          const descContainer = pCard.querySelector('.desc, .dg-poder-desc, .info');
          let baseDesc = '';
          if (descContainer) {
            const clone = descContainer.cloneNode(true) as HTMLElement;
            const levelDivs = clone.querySelectorAll('.nivelp, #poder1, #poder2, #poder3, [id^="poder"], [name^="poder"], .nivel1, .nivel2, .nivel3, #nivel1, #nivel2, #nivel3');
            levelDivs.forEach((d) => d.remove());
            baseDesc = extractHtmlTextWithLineBreaks(clone);
          }

          baseDesc = cleanBaseDescription(baseDesc);

          // Extract Levels 1, 2, 3 with LINE BREAKS PRESERVED and MULTIPLE SELECTORS
          const lvl1El = findLevelElement(pCard, 1);
          const lvl2El = findLevelElement(pCard, 2);
          const lvl3El = findLevelElement(pCard, 3);

          let lvl1 = cleanLevelDescription(extractHtmlTextWithLineBreaks(lvl1El), '');
          let lvl2 = cleanLevelDescription(extractHtmlTextWithLineBreaks(lvl2El), '');
          let lvl3 = cleanLevelDescription(extractHtmlTextWithLineBreaks(lvl3El), '');

          // Fallback if levels were not in separate containers but inline in text
          if ((!lvl1 || !lvl2 || !lvl3) && descContainer) {
            const fullDescText = extractHtmlTextWithLineBreaks(descContainer);
            const l1Match = fullDescText.match(/N[ií]vel\s*1\s*[:\n]?(.*?)(?=N[ií]vel\s*2|$)/is);
            const l2Match = fullDescText.match(/N[ií]vel\s*2\s*[:\n]?(.*?)(?=N[ií]vel\s*3|$)/is);
            const l3Match = fullDescText.match(/N[ií]vel\s*3\s*[:\n]?(.*?)$/is);

            if (!lvl1 && l1Match) lvl1 = cleanLevelDescription(l1Match[1], 'Efeito de nível 1.');
            if (!lvl2 && l2Match) lvl2 = cleanLevelDescription(l2Match[1], 'Efeito de nível 2.');
            if (!lvl3 && l3Match) lvl3 = cleanLevelDescription(l3Match[1], 'Efeito de nível 3.');
          }

          if (!lvl1) lvl1 = 'Efeito de nível 1.';
          if (!lvl2) lvl2 = 'Efeito de nível 2.';
          if (!lvl3) lvl3 = 'Efeito de nível 3.';

          poderes.push({
            id: `${branchId}_p${pNum}`,
            ramo_id: branchId,
            numero: pNum,
            nome: pCleanName,
            descricao_base: baseDesc || 'Habilidade concedida aos semideuses.',
            icone_url: iconUrl,
            nivel_1_desc: lvl1,
            nivel_2_desc: lvl2,
            nivel_3_desc: lvl3
          });
        });
      });
    }

    logs.push(`Raspagem HTML finalizada: Deus "${godName}", ${ramos.length} ramos e ${poderes.length} poderes carregados (quebras de linha preservadas).`);
    return { deus: parsedDeus, ramos, poderes, logs };
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : String(error);
    logs.push(`Erro durante a raspagem do HTML: ${errMessage}`);
    return { deus: {}, ramos: [], poderes: [], logs };
  }
}

/**
 * BBCode / Plain Text Tree Parser with Full Line Break Sensitivity.
 */
function parseForumBbcodeTree(rawText: string): ParsedForumData {
  const logs: string[] = [];
  const ramos: Partial<Ramo>[] = [];
  const poderes: Partial<Poder>[] = [];

  const normalized = normalizePreservedText(rawText);
  const lines = normalized.split('\n');

  // 1. Detect Deity Name
  let godName = 'Divindade';
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.toLowerCase().includes('poderes dos filhos de') || 
        trimmed.toLowerCase().includes('poderes de') ||
        trimmed.toLowerCase().startsWith('[titulo]') || 
        trimmed.toLowerCase().startsWith('[h1]')) {
      godName = normalizeGodName(trimmed);
      logs.push(`Identificado título do Deus (BBCode): "${godName}"`);
      break;
    }
  }

  const godId = godName
    .toLowerCase()
    .split('/')[0]
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '_')
    .trim() || 'deus_' + Date.now();

  const parsedDeus: Partial<Deus> = {
    id: godId,
    nome_grego_romano: godName,
    cor_hex: '#8b5cf6',
    imagem_url: '',
    simbolo: '',
    atributos_principais: '',
    descricao: '',
    titulo_mitologico: ''
  };

  // 2. Identify Branches and Powers by Sections
  let currentBranchType: RamoTipo = 'tronco';
  let currentBranchId = `${godId}_tronco`;
  let currentBranchTitle = 'Tronco';
  let branchIndex = 0;

  const branchTypeKeys: RamoTipo[] = ['tronco', 'ramo1', 'ramo2', 'ramo3'];

  // Helper to ensure branch exists in ramos array
  const ensureBranch = (tipo: RamoTipo, title: string) => {
    currentBranchType = tipo;
    currentBranchId = `${godId}_${tipo}`;
    currentBranchTitle = title;
    if (!ramos.some((r) => r.id === currentBranchId)) {
      ramos.push({
        id: currentBranchId,
        deus_id: godId,
        tipo: tipo,
        nome: title,
        descricao: `Ramo de habilidades de ${godName}.`
      });
      logs.push(`Ramo identificado: [${tipo}] "${title}"`);
    }
  };

  // Ensure initial Tronco branch
  ensureBranch('tronco', 'Tronco');

  let currentPower: Partial<Poder> | null = null;
  let currentSection: 'desc' | 'lvl1' | 'lvl2' | 'lvl3' | null = null;
  let descBuffer: string[] = [];
  let lvl1Buffer: string[] = [];
  let lvl2Buffer: string[] = [];
  let lvl3Buffer: string[] = [];

  const flushCurrentPower = () => {
    if (currentPower && currentPower.nome) {
      currentPower.descricao_base = cleanBaseDescription(descBuffer.join('\n'));
      currentPower.nivel_1_desc = cleanLevelDescription(lvl1Buffer.join('\n'), 'Efeito de nível 1.');
      currentPower.nivel_2_desc = cleanLevelDescription(lvl2Buffer.join('\n'), 'Efeito de nível 2.');
      currentPower.nivel_3_desc = cleanLevelDescription(lvl3Buffer.join('\n'), 'Efeito de nível 3.');

      poderes.push(currentPower as Poder);
    }
    currentPower = null;
    currentSection = null;
    descBuffer = [];
    lvl1Buffer = [];
    lvl2Buffer = [];
    lvl3Buffer = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Check for Branch Header: [h2]...[/h2], [b]Tronco[/b], [b]RAMO 1: ...[/b]
    const isBranchHeader = 
      /^\[h2\](.*?)\[\/h2\]/i.test(trimmed) ||
      /^\[b\](Tronco|Ramo\s*\d+[^\]]*)\[\/b\]/i.test(trimmed) ||
      /^(Tronco|RAMO\s*\d+\s*:.*)$/i.test(trimmed);

    if (isBranchHeader) {
      flushCurrentPower();
      const rawBranchName = trimmed
        .replace(/^\[h2\]/i, '')
        .replace(/\[\/h2\]$/i, '')
        .replace(/^\[b\]/i, '')
        .replace(/\[\/b\]$/i, '')
        .trim();

      const lowerBranch = rawBranchName.toLowerCase();
      let tipo: RamoTipo = 'tronco';
      if (lowerBranch.includes('tronco')) {
        tipo = 'tronco';
      } else if (lowerBranch.includes('ramo 1') || lowerBranch.includes('ramo1')) {
        tipo = 'ramo1';
      } else if (lowerBranch.includes('ramo 2') || lowerBranch.includes('ramo2')) {
        tipo = 'ramo2';
      } else if (lowerBranch.includes('ramo 3') || lowerBranch.includes('ramo3')) {
        tipo = 'ramo3';
      } else {
        branchIndex++;
        tipo = branchTypeKeys[branchIndex] || 'ramo3';
      }

      ensureBranch(tipo, rawBranchName);
      continue;
    }

    // Check for Power Title: [b]1. Consequência[/b] or 1. Consequência
    const powerTitleMatch = trimmed.match(/^(?:\[b\])?(\d+)\.\s*(.*?)(?:\[\/b\])?$/i);
    if (powerTitleMatch && !trimmed.toLowerCase().startsWith('[b]nível') && !trimmed.toLowerCase().startsWith('nível')) {
      flushCurrentPower();

      const pNum = parseInt(powerTitleMatch[1], 10);
      const pName = powerTitleMatch[2].replace(/\[\/b\]/gi, '').trim();

      currentPower = {
        id: `${currentBranchId}_p${pNum}`,
        ramo_id: currentBranchId,
        numero: pNum,
        nome: pName,
        icone_url: 'zap'
      };
      currentSection = 'desc';
      continue;
    }

    // Check for Section Tags: Descrição, Nível 1, Nível 2, Nível 3
    if (/^(?:\[b\])?(?:\[b\])?Descriç(?:ã|a)o:?(?:\[\/b\])?/i.test(trimmed)) {
      currentSection = 'desc';
      const content = trimmed.replace(/^(?:\[b\])?(?:\[b\])?Descriç(?:ã|a)o:?(?:\[\/b\])?(?:\[\/b\])?\s*/i, '');
      if (content) descBuffer.push(content);
      continue;
    }

    if (/^(?:\[b\])?(?:\[b\])?N[ií]vel\s*1:?(?:\[\/b\])?/i.test(trimmed)) {
      currentSection = 'lvl1';
      const content = trimmed.replace(/^(?:\[b\])?(?:\[b\])?N[ií]vel\s*1:?(?:\[\/b\])?(?:\[\/b\])?\s*/i, '');
      if (content) lvl1Buffer.push(content);
      continue;
    }

    if (/^(?:\[b\])?(?:\[b\])?N[ií]vel\s*2:?(?:\[\/b\])?/i.test(trimmed)) {
      currentSection = 'lvl2';
      const content = trimmed.replace(/^(?:\[b\])?(?:\[b\])?N[ií]vel\s*2:?(?:\[\/b\])?(?:\[\/b\])?\s*/i, '');
      if (content) lvl2Buffer.push(content);
      continue;
    }

    if (/^(?:\[b\])?(?:\[b\])?N[ií]vel\s*3:?(?:\[\/b\])?/i.test(trimmed)) {
      currentSection = 'lvl3';
      const content = trimmed.replace(/^(?:\[b\])?(?:\[b\])?N[ií]vel\s*3:?(?:\[\/b\])?(?:\[\/b\])?\s*/i, '');
      if (content) lvl3Buffer.push(content);
      continue;
    }

    // Append line to current active section buffer (preserving empty lines or paragraphs)
    if (currentPower && currentSection) {
      if (currentSection === 'desc') descBuffer.push(rawLine);
      else if (currentSection === 'lvl1') lvl1Buffer.push(rawLine);
      else if (currentSection === 'lvl2') lvl2Buffer.push(rawLine);
      else if (currentSection === 'lvl3') lvl3Buffer.push(rawLine);
    }
  }

  flushCurrentPower();

  logs.push(`Parser BBCode finalizado: Deus "${godName}", ${ramos.length} ramos e ${poderes.length} poderes carregados (quebras de linha preservadas).`);
  return { deus: parsedDeus, ramos, poderes, logs };
}

/**
 * Universal Forum Tree Parser (automatically selects HTML or BBCode).
 */
export function parseForumHtmlTree(rawInput: string): ParsedForumData {
  if (!rawInput || !rawInput.trim()) {
    return { deus: {}, ramos: [], poderes: [], logs: ['Texto vazio fornecido.'] };
  }

  const isHtml = /<\/?(?:div|span|p|h[1-6]|table|body|html|titulo|button)[^>]*>/i.test(rawInput);
  if (!isHtml) {
    return parseForumBbcodeTree(rawInput);
  }

  const htmlResult = parseHtmlTreeInternal(rawInput);
  if (htmlResult.poderes.length === 0) {
    const bbcodeResult = parseForumBbcodeTree(rawInput);
    if (bbcodeResult.poderes.length > 0) {
      return bbcodeResult;
    }
  }
  return htmlResult;
}

export const SAMPLE_FORUM_TEMPLATES = [
  {
    nome: 'Template Real DG: Ares / Marte (Completo)',
    codigo: `<div id="dg-arvore" style="--imagem: url(https://2img.net/i.imgur.com/8QEx6DG.png); --cor: var(--ares);"><div class="topo"><titulo>Poderes dos Filhos de Ares e Marte</titulo></div><div class="controle"><button type="button" name="tronco">Tronco</button><button type="button" name="ramo1">Ramo 1:  Arauto da Destruição</button><button type="button" name="ramo2">Ramo 2:  Guerra Sem Fim</button><button type="button" name="ramo3" style="border-right: none;">Ramo 3:  O Festim dos Abutres</button></div><div class="ramo" name="tronco"><div class="poder"><div class="niveis"><div class="nome">1. Consequência</div><div class="botoes"><button type="button" name="poder1" title="Nível 1">I</button><button type="button" name="poder2" title="Nível 2">II</button><button type="button" name="poder3" title="Nível 3">III</button></div></div><div class="fashion"><div class="iconic" style="--icon: url('https://2img.net/i.imgur.com/I4LtUnK.jpeg');"></div></div><div class="info"><div class="desc">Habilidade básica de dano puro que todo filho de Ares/Marte desenvolve logo em seus primeiros combates. Com esse poder, ele é capaz de melhorar o dano físico causado por um de seus ataques, a fim de destruir seus inimigos.

<div id="poder1" class="nivelp">[b]Nível 1[/b]
Nesse nível, um ataque físico realizado pelo semideus tem um aumento de 30 pontos no dano antes do cálculo de resistência da vítima, ao custo de 30 pontos de vigor. Esse poder possui um intervalo de dois turnos entre cada uso.</div><div id="poder2" class="nivelp">[b]Nível 2[/b]
Nesse nível, um ataque físico realizado pelo semideus tem um aumento de 50 pontos no dano antes do cálculo de resistência da vítima, ao custo de 50 pontos de vigor. Esse poder possui um intervalo de dois turnos entre cada uso.</div><div id="poder3" class="nivelp">[b]Nível 3[/b]Nesse nível, um ataque físico realizado pelo semideus tem um aumento de 70 pontos no dano antes do cálculo de resistência da vítima, ao custo de 70 pontos de vigor. Esse poder possui um intervalo de dois turnos entre cada uso.</div></div></div></div>

<div class="poder"><div class="niveis"><div class="nome">2. Aptidão para Espadas ou Lanças</div><div class="botoes"><button type="button" name="poder1" title="Nível 1">I</button><button type="button" name="poder2" title="Nível 2">II</button><button type="button" name="poder3" title="Nível 3">III</button></div></div><div class="fashion"><div class="iconic" style="--icon: url('https://2img.net/i.imgur.com/oJCwJsM.jpeg');"></div></div><div class="info"><div class="desc">Desde o início de sua jornada, filhos de Ares/Marte desenvolvem mais aptidão para um armamento que remete ao deus. Ao comprar esse poder, o meio-sangue escolhe na hora da atualização se quer para espadas ou lanças.

<div id="poder1" class="nivelp">[b]Nível 1[/b]
O primeiro nível garante 50% de aptidão para a arma escolhida do filho de Ares/Marte.</div><div id="poder2" class="nivelp">[b]Nível 2[/b]
No segundo nível, o filho de Ares/Marte recebe mais 20% de aptidão na arma escolhida. Além disso, enquanto estiver usando uma arma da categoria escolhida nesse poder, ele recebe 20% a mais de dano em seus ataques com ela e aumenta em 5 números de dados todas as chances de acertos críticos com a arma em questão. Se sua chance de acertar um ataque crítico, por exemplo, era de 1 a 8, por exemplo, passa a ser de 1 a 13.</div><div id="poder3" class="nivelp">[b]Nível 3[/b]
No terceiro nível, o filho de Ares/Marte recebe mais 20% de aptidão na arma escolhida. Além dos bônus do nível anterior, o aumento de números de dados para chances de acerto crítico sobe para 10. Por fim, ele recebe uma ação curta extra envolvendo a arma em questão.</div></div></div></div>

<div class="poder"><div class="niveis"><div class="nome">3. Força Excessiva</div><div class="botoes"><button type="button" name="poder1" title="Nível 1">I</button><button type="button" name="poder2" title="Nível 2">II</button><button type="button" name="poder3" title="Nível 3">III</button></div></div><div class="fashion"><div class="iconic" style="--icon: url('https://2img.net/i.imgur.com/j20sbpj.jpeg');"></div></div><div class="info"><div class="desc">Habilidade desenvolvida por todo filho de Ares/Marte. Com ela, o meio-sangue é capaz de aumentar ainda mais sua força destrutiva, a fim de atropelar seus inimigos.

<div id="poder1" class="nivelp">[b]Nível 1[/b]
Nesse nível, o filho de Ares/Marte pode aumentar sua força em até 20% ao custo de 30 pontos de vigor, por até dois turnos. Após o fim do buff, é preciso aguardar dois turnos para usar o poder novamente.</div><div id="poder2" class="nivelp">[b]Nível 2[/b]
Já nesse nível, o bônus em força aumenta para 40% em até dois turnos e não é cumulativo com o nível anterior. O custo é de 50 pontos de vigor. Após o fim do buff, é preciso aguardar dois turnos para usar o poder novamente.</div><div id="poder3" class="nivelp">[b]Nível 3[/b]Por fim, nesse nível o bônus em força aumenta para 60% em até dois turnos e não é cumulativo com os níveis anteriores. O custo é de 70 pontos de vigor. Após o fim do buff, é preciso aguardar dois turnos para usar o poder novamente.</div></div></div></div>

<div class="poder"><div class="niveis"><div class="nome">4. Corpo Forte</div><div class="botoes"><button type="button" name="poder1" title="Nível 1">I</button><button type="button" name="poder2" title="Nível 2">II</button><button type="button" name="poder3" title="Nível 3">III</button></div></div><div class="fashion"><div class="iconic" style="--icon: url('https://2img.net/i.imgur.com/7usfNWM.jpeg');"></div></div><div class="info"><div class="desc">[b][b]Descrição:[/b][/b] Os filhos de Ares/Marte são semideuses que estão sempre buscando o treinamento e aperfeiçoamento corporal. A sua genética divina, no entanto, os favorece nesse sentido, lhe proporcionando corpos naturalmente fortes.

<div id="poder1" class="nivelp">[b]Nível 1[/b]
Nesse nível, o semideus recebe 20% de bônus no atributo força, além disso o semideus aguenta mais 50kg pela tabela de força.</div><div id="poder2" class="nivelp">[b]Nível 2[/b]
Nesse nível, o bônus em força sobe para 40%, o agora passa a carregar 100kg.</div><div id="poder3" class="nivelp">[b]Nível 3[/b]
No nível final, o bônus em força sobe para 60%, no nível final carrega 150kg.</div></div></div></div></div><div class="ramo" name="ramo1"><div class="poder"><div class="niveis"><div class="nome">5. Dilacerar</div><div class="botoes"><button type="button" name="poder1" title="Nível 1">I</button><button type="button" name="poder2" title="Nível 2">II</button><button type="button" name="poder3" title="Nível 3">III</button></div></div><div class="fashion"><div class="iconic" style="--icon: url('https://2img.net/i.imgur.com/uxIZwjp.jpeg');"></div></div><div class="info"><div class="desc">Alguns dos filhos de Ares/Marte podem abençoar suas armas com uma aura de letalidade semelhante à que seu pai usava em batalha. Isso torna as suas armas mais perigosas, causando mais dano enquanto o poder estiver ativo e aplicando efeito de gangrena.

<div id="poder1" class="nivelp">[b]Nível 1[/b]
Nesse nível, o próximo ataque armado realizado pelo semideus tem um aumento de 20 pontos no dano antes do cálculo de resistência da vítima, provocando um efeito de sangramento nela que a faz perder 10 pontos de vida durante dois turnos, ao custo de 40 pontos de mana. O ferimento provocado por esse poder é acompanhado do efeito de gangrena, que impede que ele seja curado no turno seguinte e ainda aplica um efeito de redução de 25% em curas sobre o ferido durante o sangramento. Caso esse ataque seja crítico, ele aplica o efeito de corta-cura para o resto do tópico. É preciso aguardar dois turnos entre cada uso desse poder.</div><div id="poder2" class="nivelp">[b]Nível 2[/b]
Nesse nível, o próximo ataque armado realizado pelo semideus tem um aumento de 40 pontos no dano antes do cálculo de resistência da vítima, provocando um efeito de sangramento nela que a faz perder 10 pontos de vida durante três turnos, ao custo de 60 pontos de mana. O ferimento provocado por esse poder é acompanhado do efeito de gangrena, que impede que ele seja curado no turno seguinte e ainda aplica um efeito de redução de 50% em curas sobre o ferido durante o sangramento. Caso esse ataque seja crítico, ele aplica o efeito de corta-cura para o resto do tópico. É preciso aguardar dois turnos entre cada uso desse poder.</div><div id="poder3" class="nivelp">[b]Nível 3[/b]
Nesse nível, o próximo ataque armado realizado pelo semideus tem um aumento de 60 pontos no dano antes do cálculo de resistência da vítima, provocando um efeito de sangramento nela que a faz perder 10 pontos de vida durante quatro turnos, ao custo de 80 pontos de mana. O ferimento provocado por esse poder é acompanhado do efeito de gangrena, que impede que ele seja curado de qualquer forma durante o sangramento. Caso esse ataque seja crítico, ele aplica o efeito de corta-cura para o resto do tópico. É preciso aguardar dois turnos entre cada uso desse poder.</div></div></div></div>

<div class="poder"><div class="niveis"><div class="nome">6. Reflexos do Javali</div><div class="botoes"><button type="button" name="poder1" title="Nível 1">I</button><button type="button" name="poder2" title="Nível 2">II</button><button type="button" name="poder3" title="Nível 3">III</button></div></div><div class="fashion"><div class="iconic" style="--icon: url('https://2img.net/i.imgur.com/Di3wxAC.jpeg');"></div></div><div class="info"><div class="desc">Marte é conhecido como o ‘’mensageiro da guerra’’, ou mesmo ‘’benfeitor do digladium’’, especificamente dizendo, famoso em Nova Roma como o pai dos guerreiros e das amazonas, sendo este, o símbolo de um lutador. Mesmo que seja diferente, a sua contraparte grega não foge muito disso. Sendo frutos do deus literal da guerra, seus filhos sempre vão saber manusear armas com tamanha propriedade e habilidade, que dificilmente perderão o equilíbrio ao empunhar uma.

<div id="poder1" class="nivelp">[b]Nível 1[/b]
Nesse nível, o semideus recebe 20% de bônus no atributo Destreza. Esse poder também eleva em 5% as chances de contra-ataque pelo atributo destreza.</div><div id="poder2" class="nivelp">[b]Nível 2[/b]
Nesse nível, o bônus em Destreza sobe para 40%. Esse poder também eleva em 10% as chances de contra-ataque pelo atributo destreza.</div><div id="poder3" class="nivelp">[b]Nível 3[/b]
Nesse nível, o bônus em Destreza sobe para 60%. Esse poder também eleva em 15% as chances de contra-ataque pelo atributo destreza.</div></div></div></div>

<div class="poder"><div class="niveis"><div class="nome">7. Sobrecarga</div><div class="botoes"><button type="button" name="poder1" title="Nível 1">I</button><button type="button" name="poder2" title="Nível 2">II</button><button type="button" name="poder3" title="Nível 3">III</button></div></div><div class="fashion"><div class="iconic" style="--icon: url('https://2img.net/i.imgur.com/5PgHtcy.jpeg');"></div></div><div class="info"><div class="desc">Sobrecarga é um estado de fúria de batalha no qual o corpo do filho de Ares/Marte ganha uma maior velocidade e, por isso, seus ataques são extremamente mais rápidos. Uma aura avermelhada cobre o corpo do semideus, aumentando a precisão e estabilidade dos seus golpes, assim como sua velocidade.

<div id="poder1" class="nivelp">[b]Nível 1[/b]
Inicialmente, ao custo de 40 pontos de vigor, o semideus aumenta drasticamente a velocidade e habilidade dos seus golpes por três turnos. Esse efeito garante a ele uma ação curta extra por cada um desses turnos. Com sobrecarga ativada, o semideus recebe um aumento de cinco números nos dados para acertos críticos em seus ataques e, também, reduz em 10% as chances de defesa de seus alvos, não acostumados à velocidade dos ataques. Após esses dois turnos, o poder entra em recarga por mais dois turnos.</div><div id="poder2" class="nivelp">[b]Nível 2[/b]
No segundo nível, ao custo de 60 pontos de vigor, Sobrecarga alcança um novo patamar. Aqui, ele recebe uma ação curta e uma de movimento em cada um dos turnos e melhora suas chances de críticos em dados em dez números, reduzindo as chances de defesas dos inimigos em 15%. Após esses dois turnos, o poder entra em recarga por mais dois turnos.</div><div id="poder3" class="nivelp">[b]Nível 3[/b]
Finalmente, no terceiro turno, ao custo de 80 pontos de vigor, Sobrecarga chega ao seu potencial máximo. O aumento das chances de acertos críticos de dados em seus ataques sobe para quinze números e a redução de defesas inimigas aumenta para 20%. Aqui, ele pode escolher entre receber as ações curtas extras ou, no mesmo turno em que ativar esse poder, ativar todos e quaisquer poderes de suporte (ações curtas) dessa árvore, e apenas essa árvore, ao mesmo tempo, pegando seus custos e respeitando demais regras. Contudo, ao fim da duração dos poderes (caso algum dure menos, ou mais que o estado de Sobrecarga), eles entram em um intervalo aumentado em dois turnos.</div></div></div></div>

<div class="poder"><div class="niveis"><div class="nome">8. Barreira Humana</div><div class="botoes"><button type="button" name="poder1" title="Nível 1">I</button><button type="button" name="poder2" title="Nível 2">II</button><button type="button" name="poder3" title="Nível 3">III</button></div></div><div class="fashion"><div class="iconic" style="--icon: url('https://2img.net/i.imgur.com/lMkS5p3.jpeg');"></div></div><div class="info"><div class="desc">A maioria dos filhos de Ares/Marte é forte e corpulenta e, em geral, aguenta muito dano sem cair. Alguns deles, no entanto, destacam-se por serem quase inderrubáveis, sendo naturalmente mais constituídos.

<div id="poder1" class="nivelp">[b]Nível 1[/b]
Nesse nível, o semideus recebe 10% de bônus em sua absorção de dano físico pelo atributo constituição. Também recebe 5% de chance de bloqueio por esse atributo.</div><div id="poder2" class="nivelp">[b]Nível 2[/b]
No segundo nível, o bônus aumenta para 15% em sua absorção de dano físico pelo atributo constituição. Também recebe 10% de chance de bloqueio por esse atributo.</div><div id="poder3" class="nivelp">[b]Nível 3[/b]
No nível final, o bônus aumenta para 20% em sua absorção de dano físico pelo atributo constituição. Também recebe 15% de chance de bloqueio por esse atributo.</div></div></div></div></div><div class="ramo" name="ramo2"><div class="poder"><div class="niveis"><div class="nome">9. Vingança dos Derrotados</div><div class="botoes"><button type="button" name="poder1" title="Nível 1">I</button><button type="button" name="poder2" title="Nível 2">II</button><button type="button" name="poder3" title="Nível 3">III</button></div></div><div class="fashion"><div class="iconic" style="--icon: url('https://2img.net/i.imgur.com/63fVFEM.jpeg');"></div></div><div class="info"><div class="desc">Todos os soldados caídos em batalha devem tributo a Ares/Marte, seu senhor da guerra. O deus, inclusive, era conhecido por trazer esses mortos de volta ao campo para lutarem ao seu lado, ou ao lado de seus filhos. Ao se especializar nesse ramo e comprar esse poder, o semideus recebe essa bênção de seu pai, podendo reclamar os caídos em batalha para lutar ao seu lado. Para tal, basta cravar alguma arma sua no chão e convocá-los.

<div id="poder1" class="nivelp">[b]Nível 1[/b]
No primeiro nível, ao custo de 40 pontos de mana, ou vida, o filho de Ares/Marte pode invocar dois esqueletos soldados com 50 pontos de vida cada.</div><div id="poder2" class="nivelp">[b]Nível 2[/b]
No segundo nível, ao custo de 60 pontos de mana, ou vida, ele pode invocar três esqueletos.</div><div id="poder3" class="nivelp">[b]Nível 3[/b]
No terceiro nível, ao custo de 80 pontos de mana, ou vida, ele pode invocar cinco esqueletos.</div></div></div></div>

<div class="poder"><div class="niveis"><div class="nome">10. Frenesi de Batalha</div><div class="botoes"><button type="button" name="poder1" title="Nível 1">I</button><button type="button" name="poder2" title="Nível 2">II</button><button type="button" name="poder3" title="Nível 3">III</button></div></div><div class="fashion"><div class="iconic" style="--icon: url('https://2img.net/i.imgur.com/kkf0w1q.jpeg');"></div></div><div class="info"><div class="desc">Em um combate prolongado, o sangue dos filhos de Ares/Marte começa a ferver e todo o suor derramado e o sangue raspado fazem com que seus corpos se acostumem e se entreguem à sensação de adrenalina.

<div id="poder1" class="nivelp">[b]Nível 1[/b]
No primeiro nível, quando o filho de Ares/Marte tiver seus pontos de vida reduzidos para 50%, ou menos, do valor total, ele entra no estado de Frenesi de Batalha.</div><div id="poder2" class="nivelp">[b]Nível 2[/b]
No segundo nível, ele continua recebendo a ação de movimento extra por turno, mas passa a somar toda a sua chance de bloqueio às resistências de efeitos debilitantes.</div><div id="poder3" class="nivelp">[b]Nível 3[/b]
Finalmente, no terceiro nível, o poder se comporta como no Nível 2, porém, no estado de Frenesi de Batalha, também, ele recebe uma ação ofensiva extra simples.</div></div></div></div>

<div class="poder"><div class="niveis"><div class="nome">11. Sede de Sangue</div><div class="botoes"><button type="button" name="poder1" title="Nível 1">I</button><button type="button" name="poder2" title="Nível 2">II</button><button type="button" name="poder3" title="Nível 3">III</button></div></div><div class="fashion"><div class="iconic" style="--icon: url('https://2img.net/i.imgur.com/LguuVKo.jpeg');"></div></div><div class="info"><div class="desc">Com Sede Sangue, o filho de Ares/Marte se torna capaz de absorver parte do dano infligido a seus inimigos como vitalidade para si mesmo.

<div id="poder1" class="nivelp">[b]Nível 1[/b]
No nível inicial, gastando 40 pontos de vigor, o semideus pode converter 40% do dano causado pelo seu golpe físico seguinte em pontos de vida. Se ele causar 100 pontos de dano com o ataque, por exemplo, recupera 40 pontos de vida. Este poder pode ser ativado uma vez a cada dois turnos.</div><div id="poder2" class="nivelp">[b]Nível 2[/b]
No nível secundário, gastando 60 pontos de vigor, o semideus pode converter 60% do dano causado pelo seu golpe físico seguinte em pontos de vida.</div><div id="poder3" class="nivelp">[b]Nível 3[/b]
No último nível, gastando 80 pontos de vigor, o semideus pode converter 80% do dano causado pelo seu golpe físico seguinte em pontos de vida.</div></div></div></div>

<div class="poder"><div class="niveis"><div class="nome">12. Aptidão para Guerra</div><div class="botoes"><button type="button" name="poder1" title="Nível 1">I</button><button type="button" name="poder2" title="Nível 2">II</button><button type="button" name="poder3" title="Nível 3">III</button></div></div><div class="fashion"><div class="iconic" style="--icon: url('https://2img.net/i.imgur.com/bsmaa6x.jpeg');"></div></div><div class="info"><div class="desc">Filhos de Ares/Marte especializados nesse ramo recebem a bênção da batalha do Deus da Guerra. Com ela, são capazes de lutar com qualquer tipo de arma.

<div id="poder1" class="nivelp">[b]Nível 1[/b]
O primeiro nível garante 50% de aptidão para qualquer arma que o semideus usar.</div><div id="poder2" class="nivelp">[b]Nível 2[/b]
No segundo nível, o bônus de aptidão sobe para 70%.</div><div id="poder3" class="nivelp">[b]Nível 3[/b]
No terceiro nível, o bônus de aptidão sobe para 90%.</div></div></div></div></div>

<div class="ramo" name="ramo3"><div class="poder"><div class="niveis"><div class="nome">13. Provocação Sangrenta</div><div class="botoes"><button type="button" name="poder1" title="Nível 1">I</button><button type="button" name="poder2" title="Nível 2">II</button><button type="button" name="poder3" title="Nível 3">III</button></div></div><div class="fashion"><div class="iconic" style="--icon: url('https://2img.net/i.imgur.com/13sXyZa.jpeg');"></div></div><div class="info"><div class="desc">O guerreiro incita os inimigos a focarem seus ataques nele, canalizando a cólera da guerra.

<div id="poder1" class="nivelp">[b]Nível 1[/b]
Provoca até 2 alvos próximos, forçando-os a atacar o semideus por 1 turno.</div><div id="poder2" class="nivelp">[b]Nível 2[/b]
Provoca todos os inimigos em raio de 10 metros e ganha 20% de absorção de dano.</div><div id="poder3" class="nivelp">[b]Nível 3[/b]
Provocação total em área; ao ser golpeado, reflete 30% do dano aos agressores.</div></div></div></div>

<div class="poder"><div class="niveis"><div class="nome">14. Fúria do Açougueiro</div><div class="botoes"><button type="button" name="poder1" title="Nível 1">I</button><button type="button" name="poder2" title="Nível 2">II</button><button type="button" name="poder3" title="Nível 3">III</button></div></div><div class="fashion"><div class="iconic" style="--icon: url('https://2img.net/i.imgur.com/14sXyZb.jpeg');"></div></div><div class="info"><div class="desc">Golpes brutais que despedaçam defesas e armaduras de monstros e semideuses.

<div id="poder1" class="nivelp">[b]Nível 1[/b]
Ataque pesado que reduz a resistência física do alvo em 15% por 2 turnos.</div><div id="poder2" class="nivelp">[b]Nível 2[/b]
Reduz a armadura em 30% e aplica sangramento cumulativo.</div><div id="poder3" class="nivelp">[b]Nível 3[/b]
Ignora 50% da blindagem e incapacita membros atingidos.</div></div></div></div>

<div class="poder"><div class="niveis"><div class="nome">15. Banquete de Corvos</div><div class="botoes"><button type="button" name="poder1" title="Nível 1">I</button><button type="button" name="poder2" title="Nível 2">II</button><button type="button" name="poder3" title="Nível 3">III</button></div></div><div class="fashion"><div class="iconic" style="--icon: url('https://2img.net/i.imgur.com/15sXyZc.jpeg');"></div></div><div class="info"><div class="desc">Aura fúnebre de corvos de guerra que consome os espíritos e o vigor dos adversários abatidos.

<div id="poder1" class="nivelp">[b]Nível 1[/b]
Ao abater um inimigo, recupera 20 pontos de vigor imediatamente.</div><div id="poder2" class="nivelp">[b]Nível 2[/b]
Recupera 40 pontos de vigor e 20 de vida a cada morte confirmada no combate.</div><div id="poder3" class="nivelp">[b]Nível 3[/b]
Cria uma revoada de corvos ilusórios que cega os inimigos sobreviventes por 1 turno.</div></div></div></div>

<div class="poder"><div class="niveis"><div class="nome">16. Carniceiro</div><div class="botoes"><button type="button" name="poder1" title="Nível 1">I</button><button type="button" name="poder2" title="Nível 2">II</button><button type="button" name="poder3" title="Nível 3">III</button></div></div><div class="fashion"><div class="iconic" style="--icon: url('https://2img.net/i.imgur.com/16sXyZd.jpeg');"></div></div><div class="info"><div class="desc">Habilidade passiva desenvolvida por alguns filhos de Ares/Marte que não têm medo de se expor ao perigo, tirando vantagens de situações desfavoráveis para prevalecer em campo.

<div id="poder1" class="nivelp">[b]Nível 1[/b]
Caso esteja em menor número, recebe uma ação ofensiva extra para cada inimigo a mais em campo, a qual é direcionada a um alvo diferente (não pode atacar várias vezes o mesmo alvo com essas ações extras).</div><div id="poder2" class="nivelp">[b]Nível 2[/b]
O segundo nível permite que o filho de Ares/Marte converta um dano que sofreria em sangramento por três turnos. Sendo uma habilidade passiva, ele não gasta ação curta para tal, mas precisa informar ao narrador quando usá-la para que este mude o cálculo de dano do turno. Se ele iria sofrer 90 pontos de dano, após os cálculos de resistências, e escolhe usar essa habilidade, no lugar, perde 30 pontos de vida uma vez por turno durante três turnos.</div><div id="poder3" class="nivelp">[b]Nível 3[/b]
A partir desse nível, sempre que algum inimigo seu for ferido em campo, o filho de Ares/Marte reduz em um turno o intervalo dos poderes ativos dessa árvore.</div></div></div></div></div></div>`
  },
  {
    nome: 'Template Real DG: Éter (Árvore Incomum com Luz e Trevas)',
    codigo: `<div id="dg-arvore" style="--imagem: url(https://2img.net/i.imgur.com/onLaWJY.png); --cor: var(--eter);"><div class="topo"><titulo>Poderes dos Filhos de Éter</titulo></div><div class="controle"><button type="button" name="tronco">Tronco</button><button type="button" name="ramo1">Ramo 1: Aerocinese</button><button type="button" name="ramo2">Ramo 2: Aítho</button><button type="button" name="ramo3" style="border-right: none;">Ramo 3: Guerreiros celestiais</button></div><div class="ramo" name="tronco"><div class="poder"><div class="niveis"><div class="nome">1. Controle da Respiração</div><div class="botoes"><button type="button" name="poder1" title="Nível 1">I</button><button type="button" name="poder2" title="Nível 2">II</button><button type="button" name="poder3" title="Nível 3">III</button></div></div><div class="fashion"><div class="iconic" style="--icon: url('https://2img.net/i.imgur.com/QTUZuJO.jpeg');"></div></div><div class="info"><div class="desc">Enquanto deus do ar puro e superior, Éter passa parte de seu poder de purificação de oxigênio à sua prole. Esta, por sua vez, desenvolve uma habilidade especial que a permite sugar o ar de inimigos, atrapalhando seu corpo e mente devido à falta de oxigênio, ou expirar ar puro e purificar e regularizar a respiração de aliados. O efeito em aliados funciona apenas nestes, a menos que o filho de Éter opte por se buffar, ao invés de ajudá-los.

<div id="poder1" class="nivelp">[b]Nível 1[/b]
Inicialmente, ao custo de 40 pontos de mana, o semideus inspira o ar afetando inimigos num raio de dez metros, os quais terão o ar sugado de seus pulmões e sentirão uma vertigem súbita perdendo 20% de seus atributos ofensivos e 10% de seus atributos defensivos por aquele turno e o seguinte. Alternativamente, ele pode expirar e infundir aliados na mesma área aumentando seus atributos na mesma proporção que diminuiria de inimigos e com a mesma duração. Uma vez encerrado, esse poder entra em tempo de espera por dois turnos.</div><div id="poder2" class="nivelp">[b]Nível 2[/b]
No nível intermediário, ao custo de 60 pontos de mana, o poder funciona como no nível anterior, mesmo sua duração e intervalo, com alguns acréscimos: poderes ativos de inimigos que estejam em ação são encerrados, porque a inspiração suspende a concentração de energia deles. Por outro lado, efeitos negativos de tipo mental (aqueles reduzidos por inteligência) são purificados de seus aliados, que encontram no ar puro uma respiração mais controlada que os permite raciocinar direito.</div><div id="poder3" class="nivelp">[b]Nível 3[/b]
No final, ao custo de 80 pontos de mana, o funcionamento de Controle da Respiração atinge um novo patamar. A suspensão de poderes ativos por parte de inimigos é mantida, tal qual a purificação de efeitos negativos de tipo mental em aliados, porém, a alteração em atributos é outra: inimigos perdem dois pontos de atributos físicos (força, destreza, velocidade e constituição) e um de atributos técnicos (inteligência, carisma, natureza, magia e espiritualidade); aliados ganham dois pontos de atributos físicos (força, destreza, velocidade e constituição) e um de atributos técnicos (inteligência, carisma, natureza, magia e espiritualidade). Sua duração e intervalo se mantêm.</div></div></div></div>

<div class="poder"><div class="niveis"><div class="nome">2. Aptidão para Espadas ou Lanças</div><div class="botoes"><button type="button" name="poder1" title="Nível 1">I</button><button type="button" name="poder2" title="Nível 2">II</button><button type="button" name="poder3" title="Nível 3">III</button></div></div><div class="fashion"><div class="iconic" style="--icon: url('https://2img.net/i.imgur.com/Nx898Hn.jpeg');"></div></div><div class="info"><div class="desc">Desde o início de sua jornada, filhos de Éter desenvolvem mais aptidão para um armamento que remete ao deus. Ao comprar esse poder, o meio-sangue escolhe na hora da atualização se quer para espadas ou lanças.

<div id="poder1" class="nivelp">[b]Nível 1[/b]
O primeiro nível garante 50% de aptidão para a arma escolhida do filho de Éter.</div><div id="poder2" class="nivelp">[b]Nível 2[/b]
No segundo nível, o filho de Éter recebe mais 20% de aptidão na arma escolhida. Além disso, enquanto estiver usando uma arma da categoria escolhida nesse poder, ele recebe 20% a mais de dano em seus ataques com ela e aumenta em 5 números de dados todas as chances de acertos críticos com a arma em questão. Se sua chance de acertar um ataque crítico, por exemplo, era de 1 a 8, por exemplo, passa a ser de 1 a 13.</div><div id="poder3" class="nivelp">[b]Nível 3[/b]
No terceiro nível, o filho de Éter recebe mais 20% de aptidão na arma escolhida. Além dos bônus do nível anterior, o aumento de números de dados para chances de acerto crítico sobe para 10. Por fim, ele recebe uma ação curta extra envolvendo a arma em questão.</div></div></div></div>

<div class="poder"><div class="niveis"><div class="nome">3. Rajada de Vento</div><div class="botoes"><button type="button" name="poder1" title="Nível 1">I</button><button type="button" name="poder2" title="Nível 2">II</button><button type="button" name="poder3" title="Nível 3">III</button></div></div><div class="fashion"><div class="iconic" style="--icon: url('https://2img.net/i.imgur.com/gSGJTGE.jpeg');"></div></div><div class="info"><div class="desc">Manifestação básica de controle de ar, herdada por todo filho de Éter. Com ela, ele pode controlar o ar ao seu redor para criar uma rajada intensa de vento que causa dano elemental de impacto em seus oponentes. Para medir a chance de acerto desse poder, considera-se o atributo natureza.

<div id="poder1" class="nivelp">[b]Nível 1[/b]
No primeiro nível, ao custo de 40 pontos de mana, ele pode emitir uma rajada de vento que causa 20 pontos de dano elemental com alcance de até oito metros a partir de seu corpo numa área de cone. Há um intervalo de dois turnos entre cada uso desse poder.</div><div id="poder2" class="nivelp">[b]Nível 2[/b]
No segundo nível, ao custo de 60 pontos de mana, ele pode emitir uma rajada de vento que causa 40 pontos de dano elemental com alcance de até dez metros a partir de seu corpo numa área de cone. Há um intervalo de dois turnos entre cada uso desse poder.</div><div id="poder3" class="nivelp">[b]Nível 3[/b]
No terceiro nível, ao custo de 80 pontos de mana, ele pode emitir uma rajada de vento que causa 60 pontos de dano elemental com alcance de até doze metros a partir de seu corpo numa área de cone. Há um intervalo de dois turnos entre cada uso desse poder.
</div></div></div></div>

<div class="poder"><div class="niveis"><div class="nome">4. Amigo da Atmosfera</div><div class="botoes"><button type="button" name="poder1" title="Nível 1">I</button><button type="button" name="poder2" title="Nível 2">II</button><button type="button" name="poder3" title="Nível 3">III</button></div></div><div class="fashion"><div class="iconic" style="--icon: url('https://2img.net/i.imgur.com/P0tDZWK.jpeg');"></div></div><div class="info"><div class="desc">Filhos de Éter possuem uma afinidade maior com a natureza no âmbito atmosférico, obviamente, por conta de seu pai. Para termos de jogo, essa afinidade é traduzida através de uma melhoria do atributo Natureza.

<div id="poder1" class="nivelp">[b]Nível 1[/b]
Nesse nível, o semideus recebe 20% de bônus no atributo natureza. A probabilidade de acerto dos ataques naturais aumenta em 5%.</div><div id="poder2" class="nivelp">[b]Nível 2[/b]
No segundo nível, o bônus aumenta para 40% no atributo natureza. A probabilidade de acerto dos ataques naturais aumenta em 10%.</div><div id="poder3" class="nivelp">[b]Nível 3[/b]
No nível final, o bônus aumenta para 60% no atributo natureza. A probabilidade de acerto dos ataques naturais aumenta em 15%.</div></div></div></div></div><div class="ramo" name="ramo1"><div class="poder"><div class="niveis"><div class="nome">5. Senhor das Correntes</div><div class="botoes"><button type="button" name="poder1" title="Nível 1">I</button><button type="button" name="poder2" title="Nível 2">II</button><button type="button" name="poder3" title="Nível 3">III</button></div></div><div class="fashion"><div class="iconic" style="--icon: url('https://2img.net/i.imgur.com/juARb2S.jpeg');"></div></div><div class="info"><div class="desc">Dentre as múltiplas esferas de poder de Éter, a aerocinese é a que mais se destaca em fama. Ele, como céu superior e senhor do ar puro, possui grande domínio do ar e, consequentemente, ventos. Parte desse domínio é transferido a seus filhos que decidem se especializar nesse ramo. Senhor das Correntes é a manifestação básica da aerocinese, utilizada para controle de campo. Para medir sua chance de acerto, com exceção da ação de movimentação própria, considera-se o atributo Natureza.

<div id="poder1" class="nivelp">[b]Nível 1[/b]
Inicialmente, pagando 40 pontos de mana, o meio-sangue pode agitar o ar ao seu redor para criar uma corrente de vento que empurra alvos à sua frente, com alcance de até dez metros a partir de seu corpo numa área de cone, derrubando estruturas não muito resistentes e todos os inimigos (pode poupar aliados da corrente de vento) que tenham dois pontos ou menos no atributo força. Inimigos derrubados precisam gastar uma ação no turno seguinte para se reerguer. Alternativamente, pode controlar o ar para mover objetos que não sejam muito pesados (testa o peso possível de se levantar com a tabela de Força, mas usando o atributo Natureza no lugar) e que não apresentem muita resistência física (aqueles que estão presos, embaixo de algo pesado, sendo empunhados etc.). Há um intervalo de dois turnos entre cada uso desse poder.</div><div id="poder2" class="nivelp">[b]Nível 2[/b]
Nível intermediário, onde, pagando 60 pontos de mana, o meio-sangue pode agitar o ar ao seu redor para criar uma corrente de vento que empurra alvos à sua frente, com alcance de até quinze metros a partir de seu corpo numa área de cone, derrubando estruturas não muito resistentes e todos os inimigos (pode poupar aliados da corrente de vento) que tenham três pontos ou menos no atributo força. Inimigos derrubados precisam gastar uma ação no turno seguinte para se reerguer. Alternativamente, pode controlar o ar para se reposicionar em batalha: pode realizar uma esquiva usando seu atributo Natureza no lugar de Agilidade, ou então consumir sua ação curta com esse poder para ir a outro lugar como uma ação extra de movimento. Há um intervalo de dois turnos entre cada uso desse poder.</div><div id="poder3" class="nivelp">[b]Nível 3[/b]
Nível Final. Ao custo de 80 pontos de mana, o semideus pode agitar o ar ao seu redor para criar uma corrente de vento que empurra alvos à sua frente, com alcance de até vinte metros a partir de seu corpo numa área de cone, derrubando estruturas não muito resistentes e todos os inimigos (pode poupar aliados da corrente de vento) que tenham quatro pontos ou menos no atributo força. Inimigos derrubados precisam gastar uma ação no turno seguinte para se reerguer. Alternativamente, pode repetir o uso do nível anterior, todavia, para algum aliado seu que esteja em um alcance de até dez metros, gastando sua ação curta para o reposicionar/proteger de um ataque. Há um intervalo de dois turnos entre cada uso desse poder.</div></div></div></div>

<div class="poder"><div class="niveis"><div class="nome">6. Maestria do Ar</div><div class="botoes"><button type="button" name="poder1" title="Nível 1">I</button><button type="button" name="poder2" title="Nível 2">II</button><button type="button" name="poder3" title="Nível 3">III</button></div></div><div class="fashion"><div class="iconic" style="--icon: url('https://2img.net/i.imgur.com/NWXyanC.jpeg');"></div></div><div class="info"><div class="desc">Habilidade passiva de suporte à aerocinese, a qual é obtida por alguns filhos de Éter conforme sua experiência no uso desses poderes. A Maestria do Ar tange os três aspectos principais da manipulação dessa energia: o Alcance, o qual dita as longas distâncias percorridas pelos ventos; a Revigoração, a qual está ligada à troca e recuperação de energias ao se obter a respiração perfeita; o Crítico, associado ao elemento ar devido à sua alta agilidade e aspecto de corte. Adquirir cada nível desse poder garante uma nova habilidade ao semideus.

<div id="poder1" class="nivelp">[b]Nível 1[/b]
Aspecto do Alcance: ao melhorar sua aerocinese, o filho de Éter aprende a controlar melhor o ar, ganhando 10 metros de alcance em seus poderes de ar à sua vontade.</div><div id="poder2" class="nivelp">[b]Nível 2[/b]
Aspecto da Revigoração: ele atinge a maestria sobre o controle do ar, de forma que consegue, com um controle perfeito da respiração, reaproveitar as energias do próprio corpo. Dessa forma, uma vez a cada dois turnos, ele pode converter até 25 pontos de vigor em mana, ou o contrário, como uma ação curta.</div><div id="poder3" class="nivelp">[b]Nível 3[/b]
Aspecto do Crítico: para cada uso de um poder ativo de ar, ou efeito desse elemento, o filho de Éter aumenta em 2 dados a sua chance de crítico para poderes de ar. Se a sua chance de acertar um ataque crítico, por exemplo, era de 1 a 8, por exemplo, passa a ser de 1 a 10.</div></div></div></div>

<div class="poder"><div class="niveis"><div class="nome">7. Olho da Tempestade</div><div class="botoes"><button type="button" name="poder1" title="Nível 1">I</button><button type="button" name="poder2" title="Nível 2">II</button><button type="button" name="poder3" title="Nível 3">III</button></div></div><div class="fashion"><div class="iconic" style="--icon: url('https://2img.net/i.imgur.com/uxLeGHc.jpeg');"></div></div><div class="info"><div class="desc">Aerocinese de nível avançado. Com esse poder, o filho de Éter dar vida a uma tempestade de ventos que bagunça o campo de batalha, atrapalhando ações inimigas ao mesmo tempo em que fornece ventos pré-existentes para que o filho de Éter gaste menos energia com seus outros poderes de ar. Para medir a chance de acerto desse poder, considera-se o atributo Natureza.

<div id="poder1" class="nivelp">[b]Nível 1[/b]
No primeiro nível, ao custo de 60 pontos de mana, o filho de Éter cria uma tempestade de ventos que dura três turnos em uma área de até quinze metros ao seu redor. Dentro dessa área, projéteis simples como: flechas, adagas arremessadas etc., por aqueles com três pontos no atributo Força, ou menos, são inutilizados. Caso utilize outro poder de aerocinese enquanto Olho da Tempestade estiver ativo, o custo de mana desse poder é reduzido pela metade antes de aplicar mais descontos. Após esses três turnos, há um intervalo de dois turnos antes de ser possível começar uma nova tempestade. À vontade do usuário, aliados podem ser preservados dos efeitos negativos da tempestade.</div><div id="poder2" class="nivelp">[b]Nível 2[/b]
No segundo nível, ao custo de 80 pontos de mana, o filho de Éter cria uma tempestade de ventos que dura três turnos em uma área de até quinze metros ao seu redor. Dentro dessa área, projéteis simples como: flechas, adagas arremessadas etc., por aqueles com quatro pontos no atributo Força, ou menos, são inutilizados. Caso utilize outro poder de aerocinese enquanto Olho da Tempestade estiver ativo, o custo de mana desse poder é reduzido em 75% antes de aplicar mais descontos. Após esses três turnos, há um intervalo de dois turnos antes de ser possível começar uma nova tempestade. À vontade do usuário, aliados podem ser preservados dos efeitos negativos da tempestade.</div><div id="poder3" class="nivelp">[b]Nível 3[/b]
No terceiro nível, ao custo de 100 pontos de mana, o filho de Éter cria uma tempestade de ventos que dura três turnos em uma área de até quinze metros ao seu redor. Dentro dessa área, projéteis simples como: flechas, adagas arremessadas etc., por aqueles com cinco pontos no atributo Força, ou menos, são inutilizados. Caso utilize outro poder de aerocinese enquanto Olho da Tempestade estiver ativo, o custo de mana desse poder é zerado. Após esses três turnos, há um intervalo de dois turnos antes de ser possível começar uma nova tempestade. À vontade do usuário, aliados podem ser preservados dos efeitos negativos da tempestade.</div></div></div></div>

<div class="poder"><div class="niveis"><div class="nome">8. Dobrador de Ar</div><div class="botoes"><button type="button" name="poder1" title="Nível 1">I</button><button type="button" name="poder2" title="Nível 2">II</button><button type="button" name="poder3" title="Nível 3">III</button></div></div><div class="fashion"><div class="iconic" style="--icon: url('https://2img.net/i.imgur.com/MFHiJ3S.jpeg');"></div></div><div class="info"><div class="desc">Ao escolher se especializar nesse ramo, o filho de Éter desenvolve a habilidade de manipulação de ar. Com ela, ele pode alterar a propriedade do ar de seus outros poderes para obter efeitos diversos em seus oponentes. Embora sejam três efeitos diferentes, o filho de Éter só pode escolher um deles por uso de poder ativo. Caso escolha um tipo para Olho da Tempestade, este não pode ser alterado até o fim do efeito e início de outro. No entanto, ele pode, mesmo com Olho da Tempestade ativo com um efeito, escolher outro efeito para outro poder ativo utilizado junto a este.

<div id="poder1" class="nivelp">[b]Nível 1[/b]
Miasma, a característica da mácula. Com ela, o filho de Éter torna o ar emitido por ele tão denso e poluído que atrapalha a respiração e sufoca seus oponentes. Como resultado, eles perdem 20% das suas chances de acerto.</div><div id="poder2" class="nivelp">[b]Nível 2[/b]
Morte Por Mil Cortes, a característica da dor. Com ela, o filho de Éter se aproveita do intenso fator cortante do ar para tornar seus ventos mortais para seus inimigos. Como resultado, eles são retalhados em contato com os ventos e sofrem 10 de dano por sangramento durante três turnos, o qual se acumula por turno em contato com os ventos cortantes.</div><div id="poder3" class="nivelp">[b]Nível 3[/b]
Fôlego Revigorante, a característica do alívio. Com ela, o filho de Éter torna o ar mais puro e revigorante para seus aliados, melhorando seu desempenho físico em campo ao passo em que controla a respiração deles em suas ações físicas. Como resultado, durante o turno em que forem afetados pelo vento revigorante e o próximo, eles não gastarão vigor para suas ações que exijam essa energia.</div></div></div></div></div>

<div class="ramo" name="ramo2"><div class="poder"><div class="niveis"><div class="nome">9. Radiância do Amanhecer / Chamado do Anoitecer</div><div class="botoes"><button type="button" name="poder1" title="Nível 1">I</button><button type="button" name="poder2" title="Nível 2">II</button><button type="button" name="poder3" title="Nível 3">III</button></div></div><div class="fashion"><div class="iconic" style="--icon: url('https://2img.net/i.imgur.com/eIHVuql.jpeg');"></div></div><div class="info"><div class="desc">Éter (Aithér vem de aítho = "queimar, abrasar", “fazer brilhar”) é a região superior e de esplêndida luminosidade do céu diurno. O verbo de origem grega, no entanto, possui uma interpretação contrária, no qual esse “queimar” chega ao ponto de “escurecer”, onde, então, a luz se torna trevas. Esse ramo representa as duas facetas desse aspecto astral. Ao se especializar nele, o filho de Éter recebe as duas versões dos poderes. No entanto, ele só pode escolher entre Luz ou Trevas por tópico. Caso utilize algum desses poderes no aspecto Luz, está preso a este até o fim daquele tópico, não podendo usufruir de nenhum efeito de Trevas, assim como o contrário é válido. Radiância do Amanhecer / Chamado do Anoitecer é o poder mais básico desse ramo, que utiliza ambos os elementos, Luz e Trevas, para causar destruição a seus inimigos. Para medir a chance de acerto desse poder, considera-se o atributo Natureza.

<div id="poder1" class="nivelp">[b]Nível 1[/b]
[b](Luz)[/b] No primeiro nível, ao custo de 40 pontos de mana, o semideus invoca um pilar de luz sobre sua posição que se expande por um raio de até dez metros ao seu redor, dissipando todo tipo de escuridão, menos aquela causada por poderes, e clareando a área por dois turnos. Inimigos atingidos pelo pilar de luz sofrem 20 pontos de dano elemental, o qual é aplicado apenas no primeiro contato com este. Há um intervalo de dois turnos entre cada uso desse poder. Alternativamente, o filho de Éter pode usar esse poder para, ao invés de causar dano a inimigos, curar aliados na mesma área de efeito. Nesse caso, o dano que seria causado, na verdade, recupera a vida dos aliados (incluindo ele mesmo).

[b](Trevas)[/b] Inicialmente, ao custo de 40 pontos de mana, o semideus lança um raio de energia de trevas em um inimigo que esteja a no máximo oito metros de distância dele, lhe causando 20 pontos de dano elemental. Se acertar, o semideus rouba um ponto de um atributo à escolha do alvo pelos próximos dois turnos. Um atributo inimigo não pode ser zerado por esse efeito e o semideus também não pode roubar um atributo que ele próprio já tenha no máximo. Todos os ganhos do atributo são recebidos pelo filho de Éter: se ele roubar a Espiritualidade do oponente, pode ganhar, durante aquele tempo, 25 pontos de mana e o restante das melhorias do atributo; ao passo em que o roubado perde tudo isso. Ao final, este último recebe seu atributo de volta com possíveis energias perdidas etc., assim como o filho de Éter perde as regalias roubadas (se ganhou energia extra e não a usou, é perdida também). Há um intervalo de cinco turnos entre cada uso desse poder.</div><div id="poder2" class="nivelp">[b]Nível 2[/b]
[b](Luz)[/b] No segundo nível, ao custo de 60 pontos de mana, a área de alcance do pilar de luz sobe para doze metros. Agora, a claridade é tão intensa que, aqueles à vontade do filho de Éter, sofrem com ela e têm sua visão prejudicada, de forma a ter uma redução de 10% em suas chances de acerto de ações que não sejam em área. Inimigos atingidos pelo pilar de luz sofrem 40 pontos de dano elemental, o qual é aplicado apenas no primeiro contato com este. Há um intervalo de dois turnos entre cada uso desse poder. Alternativamente, o filho de Éter pode usar esse poder para, ao invés de causar dano a inimigos, curar aliados na mesma área de efeito. Nesse caso, o dano que seria causado, na verdade, recupera a vida dos aliados (incluindo ele mesmo).

[b](Trevas)[/b]  No nível intermediário, ao custo de 60 pontos de mana, o semideus lança um raio de energia de trevas em um inimigo que esteja a no máximo dez metros de distância dele, lhe causando 40 pontos de dano elemental. Agora, ele pode roubar até dois pontos de atributo, respeitando ainda as regras de funcionamento desse poder. Há um intervalo de cinco turnos entre cada uso desse poder.
</div><div id="poder3" class="nivelp">[b]Nível 3[/b]
[b](Luz)[/b] No terceiro nível, ao custo de 80 pontos de mana, a área de alcance do pilar de luz sobe para quinze metros. Além do efeito da claridade anterior, a luz é tão poderosa que dissipa mesmo escuridão proveniente de outros poderes, ou efeitos. Inimigos atingidos pelo pilar de luz sofrem 60 pontos de dano elemental, o qual é aplicado apenas no primeiro contato com este. Há um intervalo de dois turnos entre cada uso desse poder. Alternativamente, o filho de Éter pode usar esse poder para, ao invés de causar dano a inimigos, curar aliados na mesma área de efeito. Nesse caso, o dano que seria causado, na verdade, recupera a vida dos aliados (incluindo ele mesmo).

[b](Trevas)[/b] Finalmente, ao custo de 80 pontos de mana, o semideus lança um raio de energia de trevas em um inimigo que esteja a no máximo doze metros de distância dele, lhe causando 60 pontos de dano elemental. Aqui, ele pode roubar até três pontos de atributo do alvo, todavia, quando o efeito acaba, este último não recebe de volta ganhos de energia (mana, ou vigor) dos atributos retirados, ao passo em que o filho de Éter os mantém. Há um intervalo de dois turnos entre cada uso desse poder.</div></div></div></div>

<div class="poder"><div class="niveis"><div class="nome">10. Sigilo da Luz / Gravidade</div><div class="botoes"><button type="button" name="poder1" title="Nível 1">I</button><button type="button" name="poder2" title="Nível 2">II</button><button type="button" name="poder3" title="Nível 3">III</button></div></div><div class="fashion"><div class="iconic" style="--icon: url('https://2img.net/i.imgur.com/tMAe3YI.jpeg');"></div></div><div class="info"><div class="desc">Ao se especializar nesse ramo, o filho de Éter desenvolve habilidades especiais que resultam em efeitos novos para seus elementos Luz e Trevas. Os efeitos desse poder se acumulam, conforme a compra dos níveis. A regra de escolha entre Luz e Trevas ainda é mantida.

<div id="poder1" class="nivelp">[b]Nível 1[/b]
[b](Luz)[/b] Quando um poder de luz executado pelo filho de Éter atinge um inimigo, ele é marcado pelo Sigilo da Luz pelos próximos dois turnos. O próximo dano que ele receber consome o sigilo, causando 20% do dano sofrido por ele como extra, porém em forma de dano absoluto. Se a vítima sofrer, por exemplo, 100 de dano ao fim dos cálculos, ela perde mais 20 de vida pela ativação da marca.

[b](Trevas)[/b] Quando um poder de trevas executado pelo filho de Èter atinge um inimigo, ele se torna afetado pelo efeito de Gravidade. Inimigos sob esse efeito sofrem uma interação especial das trevas que os impede de realizar qualquer tipo de ação de movimento extraordinária: teletransporte, melhoria (mesmo que passiva) de esquiva, se mover de outra maneira, portais, se esquivar de outra maneira etc. Poderes de voo, por sua vez, variam de acordo com a origem: se as vítimas tiverem asas físicas, o funcionamento destas é reduzido pela metade; se o voo for proveniente de alguma energia, ou controle desta, é cancelado.</div><div id="poder2" class="nivelp">[b]Nível 2[/b]
[b](Luz)[/b] Quando um poder de luz executado pelo filho de Éter atinge um aliado, naquele turno e no próximo, efeitos de cura, reduções, escudos ou barreiras sobre ele são aumentados em 50% (se for efeito de porcentagem), ou em 50 pontos (se for efeito em valor inteiro). Aqui, a porcentagem de Sigilo da Luz sobe para 25%.

[b](Trevas)[/b] Quando um poder de trevas executado pelo filho de Éter atinge um inimigo, ele se torna afetado pelo efeito da Moléstia. Inimigos sob esse efeito sofrem uma interação especial das trevas que reduz o alcance de todos os seus poderes em dez metros, mantendo sempre um alcance mínimo de dois metros.
</div><div id="poder3" class="nivelp">[b]Nível 3[/b]
[b](Luz)[/b] Ao alcançar esse nível, o filho de Éter é capaz de infundir o elemento luz em seus outros poderes dessa árvore, de forma a considerar estes como deste elemento também. Aqui, a porcentagem de Sigilo da Luz sobe para 30%.

[b](Trevas)[/b] Ao alcançar esse nível, o filho de Éter é capaz de infundir o elemento trevas em seus outros poderes dessa árvore, de forma a considerar estes como deste elemento também.</div></div></div></div>

<div class="poder"><div class="niveis"><div class="nome">11. Supernova / Estrela Negra</div><div class="botoes"><button type="button" name="poder1" title="Nível 1">I</button><button type="button" name="poder2" title="Nível 2">II</button><button type="button" name="poder3" title="Nível 3">III</button></div></div><div class="fashion"><div class="iconic" style="--icon: url('https://2img.net/i.imgur.com/e6FzK64.jpeg');"></div></div><div class="info"><div class="desc">Poder principal do ramo, onde o filho de Éter aprende a extrair o potencial máximo da manipulação da Luz e Trevas. Com ele, o meio-sangue se torna capaz de trazer destruição aos seus inimigos, seja por meio da luz castigadora, ou das trevas supressoras. Para medir a chance de acerto desse poder, considera-se o atributo Natureza. A regra de escolha entre Luz e Trevas ainda é mantida.

<div id="poder1" class="nivelp">[b]Nível 1[/b]
[b](Luz)[/b]Nesse nível, o semideus pode usar uma ação curta e pagar 40 pontos de mana para criar uma arma qualquer feita completamente de luz com dano base de material igual a 20. Uma vez manifestada, o usuário tem duas opções: ele pode manusear a arma diretamente, o que usa da sua aptidão com tal armamento para calcular a chance de acerto e seus atributos físicos para calcular o dano, ou pode controlá-la remotamente, o que usa sua Natureza para calcular a chance de acerto e substitui seu dano base e modificador de Força pelos valores equivalentes de seu atributo Natureza. No segundo caso, a arma não pode se afastar mais que um metro da posição de seu conjurador. O armamento dura até o fim do tópico, ou até ser desinvocado (o que vier primeiro), mas consome uma ação de ataque normalmente para ser utilizado independente do método escolhido.

[b](Trevas)[/b] Inicialmente, ao custo de 40 pontos de mana, o filho de Éter emite uma aura de trevas ao redor dele numa área de até vinte metros. Aqueles atingidos por ela (pode preservar aliados), sofrem 10 pontos de dano elemental e são puxados em sua direção naquele turno (testa o peso possível de se levantar com a tabela de Força, mas usando o atributo Natureza no lugar; se for maior, ou igual, o puxão acontece). A distância máxima percorrida pelo puxão é de dez metros, à vontade do filho de Éter. No turno seguinte, ele pode utilizar esse poder novamente (sem gastar mana, aproveitando a escuridão ambiente) para provocar o efeito contrário: afastar as vítimas na mesma distância máxima do puxão, causando mais 10 pontos de dano elemental a elas. Vítimas atingidas pelo puxão sofrem uma redução de 60% em suas chances de defesa contra o empurrão. Ou seja: são realizados dois testes de dados e, em caso de falha por parte das vítimas, elas perdem a ação de movimento no turno seguinte aos efeitos de puxão e empurrão. Há um intervalo de três turnos entre cada uso desse poder.</div><div id="poder2" class="nivelp">[b]Nível 2[/b]
[b](Luz)[/b] Nesse nível, ao custo de 60 pontos de mana, o semideus é capaz de manifestar uma barreira de luz ao redor dele, ou de alguma outra pessoa a no máximo oito metros de distância dele, que absorve 60 pontos de dano dos tipos físico, elemental e mágico (a absorção é com base no dano final que o semideus receberia sem calcular sua resistência: 100 de dano seria reduzido para 40 e, a partir daí, entraria a resistência do semideus para o diminuir ainda mais). Há um intervalo de dois turnos entre cada uso desse poder.

[b](Trevas)[/b] No nível intermediário, ao custo de 60 pontos de mana, as trevas exaladas pelo filho de Éter ganham uma nova propriedade e funcionam como um buraco negro. Como no nível anterior, ele suga tudo em um alcance máximo de vinte metros ao seu redor, causando 20 pontos de dano elemental às vítimas e puxando aquelas que perderem no teste de força ditado no nível anterior. Todavia, ao contrário deste, a escuridão agora puxa também objetos, construções etc que são destruídos no processo. Nesse caso, cria-se uma área de segurança de dez metros ao redor do filho de Éter, onde tudo o que for puxado para até o limite disso pelo lado de fora é absorvido pelo buraco negro, com exceção de criaturas vivas independentes: pessoas, monstros etc. Construtos de poderes, invocações, etc., por outro lado, são absorvidos também por aquele turno, sendo inutilizados neste caso sejam sugados antes de agirem. No turno seguinte, o filho de Éter pode expelir tudo o que foi absorvido pelo buraco negro, causando mais 20 pontos de dano elemental caso atinja inimigos. Tal qual antes, vítimas atingidas pelo puxão sofrem uma redução de 60% em suas chances de defesa contra o empurrão. Ou seja: são realizados dois testes de dados e a perda de ações de movimentos se mantém. Invocações, construtos etc. sugados pelo buraco negro sofrem esse dano automaticamente, sendo expelidos no processo e perdem aquele turno (não podem realizar ações, caso sobrevivam). É importante frisar que a área de proteção ao redor do filho de Éter serve para evitar que aliados seus não sejam atingidos por construções durante os processos de absorção e repulsão. Há um intervalo de três turnos entre cada uso desse poder.
</div><div id="poder3" class="nivelp">[b]Nível 3[/b]
[b](Luz)[/b] Nesse nível, ao custo de 80 pontos de mana, o semideus é capaz de provocar uma supernova. Ele literalmente causa uma explosão de luz ao seu redor, com alcance de vinte metros, que causa 40 pontos de dano aos inimigos (pode preservar aliados). Nos três turnos seguintes a essa explosão, ele é recoberto pelo Halo Expurgador: uma aura brilhante e intensa que prejudica quem olha diretamente para ele (pode preservar aliados). Inimigos sofrem uma redução de 50% nas chances de acerto, desde que não sejam ataques em área, contra o filho de Éter. Além disso, todos os seus ataques de luz ganham cinco metros de alcance e são carregados de energia luminosa que atinge suas vítimas antes deles, reduzindo em 25% sua resistência a dano elemental. Caso a resistência delas já esteja zerada, ou chegue a esse ponto, a porcentagem extra da redução do Halo Expurgador é convertida em dano extra para o ataque em questão. Há um intervalo de cinco turnos entre cada uso desse poder.

[b](Trevas)[/b] Finalmente, ao custo de 80 pontos de mana, o poder se comporta como no nível anterior, porém, agora, a escuridão rouba também os poderes das vítimas: elas perdem metade do valor de todos os seus atributos ofensivos (incluindo Carisma pela chance de convencimento). Essa redução é aplicada após a soma de todos os buffs dos atributos delas. Por exemplo: se um afetado somaria 100 de força em dano com poderes ativos e passivos, ela cai para 50, assim como sua chance de convencimento, que antes chegaria a 90% cai para 45%. Para cada vítima desse roubo, o filho de Éter recebe um bônus de 20% em seus atributos ofensivos (que não Carisma, já que prejudicar o carisma alheio não lhe concede o dom de aprimorar o seu). Esse roubo de poder persiste durante o processo de absorção, repulsão e mais dois turnos após eles. Há um intervalo de quatro turnos entre cada uso desse poder.</div></div></div></div>

<div class="poder"><div class="niveis"><div class="nome">12. Aítho</div><div class="botoes"><button type="button" name="poder1" title="Nível 1">I</button><button type="button" name="poder2" title="Nível 2">II</button><button type="button" name="poder3" title="Nível 3">III</button></div></div><div class="fashion"><div class="iconic" style="--icon: url('https://2img.net/i.imgur.com/8PK1JLQ.jpeg');"></div></div><div class="info"><div class="desc">Dentre as várias vantagens de se especializar nesse ramo, está também a melhoria no atributo natureza, posto que este está relacionado aos dois elementos chaves de Aítho: luz e trevas.

<div id="poder1" class="nivelp">[b]Nível 1[/b]
Nesse nível, o poder confere 10% de bônus no atributo natureza do meio-sangue.</div><div id="poder2" class="nivelp">[b]Nível 2[/b]
Nesse nível, o bônus no atributo natureza sobe para 20%.</div><div id="poder3" class="nivelp">[b]Nível 3[/b]
Nesse nível, o bônus no atributo natureza sobe para 30%.</div></div></div></div></div><div class="ramo" name="ramo3"><div class="poder"><div class="niveis"><div class="nome">13. Bênção Divina</div><div class="botoes"><button type="button" name="poder1" title="Nível 1">I</button><button type="button" name="poder2" title="Nível 2">II</button><button type="button" name="poder3" title="Nível 3">III</button></div></div><div class="fashion"><div class="iconic" style="--icon: url('https://2img.net/i.imgur.com/2tjspHo.jpeg');"></div></div><div class="info"><div class="desc">Guerreiros Celestiais é o ramo que melhor traduz o título de celestial de Éter, título este que é transferido a alguns de seus filhos que recebem a Bênção Divina. No momento em que esse poder é ativado, um halo divino surge ao redor do meio-sangue, indicando que sua transformação foi iniciada. Essa transformação, uma vez ativa, dura até o fim do tópico, ou até o semideus querer encerrar. Caso o faça, pode começar a evolução no turno seguinte, mas do início. Os estados Zeloso, Ascendido e Transcendido acumulam seus bônus. Além disso, nesses estados, o filho de Éter não pode ser curado por itens, ou encantamentos, no máximo por poderes de árvore de outros semideuses.

<div id="poder1" class="nivelp">[b]Nível 1[/b]
Pagando 40 pontos de mana, o semideus ganha 10 pontos de vida máxima que escalam com o bônus de vida para invocações do atributo Natureza. Pelo resto do tópico, ele será considerado Zeloso. Nesse estado, ele ganha um par de asas angelicais douradas e pode voar até vinte metros de altura sem problema, sendo capaz de se mover no ar como faria em terra.</div><div id="poder2" class="nivelp">[b]Nível 2[/b]
No segundo nível, ao custo de 60 pontos de mana, o filho de Éter entra no estado Zeloso como no nível anterior e, depois de três turnos assim, ele passa a ser considerado Ascendido pelo resto do tópico. Enquanto Ascendido, os ataques armados do semideus passam a ganhar dez  metros de alcance e a usar seus pontos de Natureza como se fossem Força para calcular o dano (ainda são considerados golpe de contato e não à longa distância). O dano desses ataques armados é convertido de físico para natural. Contudo, cada ataque armado consome 20 pontos de vida do semideus.</div><div id="poder3" class="nivelp">[b]Nível 3[/b]
No terceiro nível, ao custo de 80 de mana, o filho de Éter inicia o mesmo ciclo: começa como Zeloso, três turnos após isso se torna Ascendido e aí, três turnos depois, finalmente se torna Transcendido. Enquanto Transcendido, seus ataques armados são calculados como antes e mantém o alcance, porém o dano deles é convertido para absoluto.</div></div></div></div>

<div class="poder"><div class="niveis"><div class="nome">14. Aspecto Celestial</div><div class="botoes"><button type="button" name="poder1" title="Nível 1">I</button><button type="button" name="poder2" title="Nível 2">II</button><button type="button" name="poder3" title="Nível 3">III</button></div></div><div class="fashion"><div class="iconic" style="--icon: url('https://2img.net/i.imgur.com/Fh4IVKi.jpeg');"></div></div><div class="info"><div class="desc">Poder de suporte que só funciona caso Bênção Divina esteja ativa. Com ele, o celestial, em sua forma abençoada, pode realizar feitos antes impossíveis de purificação pela chama.

<div id="poder1" class="nivelp">[b]Nível 1[/b]
Ao ativar Bênção Divina, o filho de Éter recebe uma ação de movimento extra, desde que ela seja voltada para a ofensiva: ir para cima de um inimigo, ou voltada para a proteção de um aliado.</div><div id="poder2" class="nivelp">[b]Nível 2[/b]
Ao ativar Bênção Divina, o filho de Éter automaticamente ganha uma aura de chamas ao redor de seu armamento. Com ela, ele pode purificar um status negativo de um alvo ao contato com a arma (ou, se estiver no modo Ascendido, se aproveitando do alcance extra), gastando uma ação curta.</div><div id="poder3" class="nivelp">[b]Nível 3[/b]
Ao ativar Bênção Divina, a aura ao redor de seu armamento agora o permite outra coisa: gastando sua ação ofensiva, ele pode “atacar” um aliado e, ao invés de lhe causar dano, curar sua vida com o valor do ataque.</div></div></div></div>

<div class="poder"><div class="niveis"><div class="nome">15.  Purificação Pela Chama</div><div class="botoes"><button type="button" name="poder1" title="Nível 1">I</button><button type="button" name="poder2" title="Nível 2">II</button><button type="button" name="poder3" title="Nível 3">III</button></div></div><div class="fashion"><div class="iconic" style="--icon: url('https://2img.net/i.imgur.com/s2Tod3O.jpeg');"></div></div><div class="info"><div class="desc">A manifestação das chamas celestiais que purifica os inimigos, extinguindo sua existência, e expurga os efeitos negativos de aliados é o poder principal dos filhos de Éter especializados nesse ramo, funcionando apenas quando estiverem com Bênção Divina ativa. Para medir a chance de acerto desse poder, considera-se o atributo Natureza.

<div id="poder1" class="nivelp">[b]Nível 1[/b]
No primeiro nível, ao custo de 40 pontos de mana e 10 pontos de vida, o semideus consegue literalmente emitir uma onda de chamas a partir de um armamento seu numa área de cone à sua frente com alcance de dez metros. Caso atinja inimigos, causa 20 pontos de dano elemental a eles. Caso atinja aliados junto, os purifica no processo removendo seus status negativos. Há um intervalo de dois turnos entre cada uso desse poder.</div><div id="poder2" class="nivelp">[b]Nível 2[/b]
No nível intermediário, o poder passa a custar 60 pontos de mana e 20 pontos de vida e agora seu dano a inimigos aumenta para 40. Além disso, aliados purificados recebem uma ação de movimento extra no turno seguinte à purificação.</div><div id="poder3" class="nivelp">[b]Nível 3[/b]
Finalmente, ao custo de 80 de mana e 30 pontos de vida, o dano das chamas a inimigos aumenta para 60 e aliados purificados, além da ação de movimento extra, se tornam invulneráveis a status negativos no turno seguinte à purificação.</div></div></div></div>

<div class="poder"><div class="niveis"><div class="nome">16. Execução Divina</div><div class="botoes"><button type="button" name="poder1" title="Nível 1">I</button><button type="button" name="poder2" title="Nível 2">II</button><button type="button" name="poder3" title="Nível 3">III</button></div></div><div class="fashion"><div class="iconic" style="--icon: url('https://2img.net/i.imgur.com/MX5wD81.jpeg');"></div></div><div class="info"><div class="desc">Poder de suporte que só funciona caso Bênção Divina esteja ativa. Com Execução Divina, o filho de Éter passa a se tornar ainda mais letal em batalha contra seus inimigos, trazendo a morte àqueles que se opuserem a ele.

<div id="poder1" class="nivelp">[b]Nível 1[/b]
Garante uma ação defensiva extra desde que seja utilizando um armamento.</div><div id="poder2" class="nivelp">[b]Nível 2[/b]
Ataques armados contra alvos com 40% ou menos de vida sempre recebem o modificador de crítico no cálculo de dano.</div><div id="poder3" class="nivelp">[b]Nível 3[/b]
Ataques armados causam metade do seu dano, arredondado para baixo, em um raio de seis metros ao redor da posição do alvo principal.</div></div></div></div></div></div>`
  }
];
