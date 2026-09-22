export interface MaterialDefinition {
  id: string;
  nome: string;
  mat: number;
  bonus: number; // matb
  percent: number;
  text?: string;
  effectType?: 'flat' | 'percent' | 'none';
}

export interface ChannelingMetalDefinition {
  id: string;
  nome: string;
  mat: number;
  percent: number;
  text?: string;
  effectType?: string;
}

export const MATERIAIS_ARMA: Record<string, MaterialDefinition> = {
  mundano: { id: 'mundano', nome: 'Mundano', mat: 10, bonus: 0, percent: 0, text: 'Material comum/mundano (MAT: 10).', effectType: 'none' },
  sagrado: { id: 'sagrado', nome: 'Sagrado', mat: 20, bonus: 0, percent: 0, text: 'Material sagrado (MAT: 20).', effectType: 'none' },
  divino: { id: 'divino', nome: 'Divino', mat: 30, bonus: 0, percent: 0, text: 'Material divino (MAT: 30).', effectType: 'none' },
  unico: { id: 'unico', nome: 'Único', mat: 40, bonus: 0, percent: 0, text: 'Material único de alta qualidade (MAT: 40).', effectType: 'none' }
};

export const LEGACY_MATERIAL_MAP: Record<string, string> = {
  aluminio: 'mundano',
  ferro_aco: 'mundano',
  cobre: 'mundano',
  prata: 'mundano',
  titanio: 'mundano',
  ouro_sagrado: 'sagrado',
  prata_sagrada: 'sagrado',
  bronze_sagrado: 'sagrado',
  ferro_sagrado: 'sagrado',
  adamantino_sagrado: 'sagrado',
  paladio_sagrado: 'sagrado',
  mitralina_sagrada: 'sagrado',
  cobalto_sagrado: 'sagrado',
  cedro_sagrado: 'sagrado',
  obsidiana_sagrada: 'sagrado',
  petricita_sagrada: 'sagrado',
  iridio_sagrado: 'sagrado',
  ouro_imperial: 'divino',
  bronze_celestial: 'divino',
  ferro_estigio: 'divino',
  aco_osseo: 'divino',
  prata_lunar: 'divino',
  verdino_mortal: 'divino',
  asphodelium: 'unico',
  macarium: 'unico',
  unico: 'unico',
  custom: 'unico'
};

export const METAIS_CANALIZACAO: Record<string, ChannelingMetalDefinition> = {
  mitralina_sagrada_ch: { id: 'mitralina_sagrada_ch', nome: 'Mitralina Sagrada', mat: 20, percent: 10, text: 'Pode ser usado como um foco para poderes mágicos, fazendo com que partam de um item forjado por ele (desde que aplicável). Danos mágicos utilizando itens deste metal causam +10% de dano.', effectType: 'percent' },
  cobalto_sagrado_ch: { id: 'cobalto_sagrado_ch', nome: 'Cobalto Sagrado', mat: 20, percent: 10, text: 'Pode ser usado como um foco para poderes mentais, fazendo com que partam de um item forjado por ele (desde que aplicável). Danos mentais utilizando itens deste metal causam +10% de dano.', effectType: 'percent' },
  cedro_sagrado_ch: { id: 'cedro_sagrado_ch', nome: 'Cedro Sagrado', mat: 20, percent: 10, text: 'Pode ser usado como um foco para poderes elementais, fazendo com que partam de um item forjado por ele (desde que aplicável). Danos elementais utilizando itens deste metal causam +10% de dano.', effectType: 'percent' },
  obsidiana_sagrada_ch: { id: 'obsidiana_sagrada_ch', nome: 'Obsidiana Sagrada', mat: 20, percent: 10, text: 'Pode ser usado como um foco para poderes espirituais, fazendo com que partam de um item forjado por ele (desde que aplicável). Danos espirituais utilizando itens deste metal causam +10% de dano.', effectType: 'percent' },
  mitralina_purpurea: { id: 'mitralina_purpurea', nome: 'Mitralina Purpúrea', mat: 30, percent: 20, text: 'Pode ser usado como um foco para poderes mágicos, fazendo com que partam de um item forjado por ele (desde que aplicável). Danos mágicos utilizando itens deste metal causam +20% de dano.', effectType: 'percent' },
  cobalto_helenico: { id: 'cobalto_helenico', nome: 'Cobalto Helênico', mat: 30, percent: 20, text: 'Pode ser usado como um foco para poderes mentais, fazendo com que partam de um item forjado por ele (desde que aplicável). Danos mentais utilizando itens deste metal causam +20% de dano.', effectType: 'percent' },
  cedro_olimpico: { id: 'cedro_olimpico', nome: 'Cedro Olímpico', mat: 30, percent: 20, text: 'Pode ser usado como um foco para poderes elementais, fazendo com que partam de um item forjado por ele (desde que aplicável). Danos elementais utilizando itens deste metal causam +20% de dano.', effectType: 'percent' },
  obsidiana_infernal: { id: 'obsidiana_infernal', nome: 'Obsidiana Infernal', mat: 30, percent: 20, text: 'Pode ser usado como um foco para poderes espirituais, fazendo com que partam de um item forjado por ele (desde que aplicável). Danos espirituais utilizando itens deste metal causam +20% de dano.', effectType: 'percent' }
};

export const NOMES_ACOES_ACERTO: Record<string, { nome: string; attrDefault: string; baseCap: number; defaultIgnorar?: boolean }> = {
  desarmado: { nome: 'Chance de Acerto de Combate Desarmado', attrDefault: 'forca', baseCap: 90 },
  voz: { nome: 'Chance de Acerto por Voz', attrDefault: 'carisma', baseCap: 85, defaultIgnorar: true },
  contra: { nome: 'Chance de Contra-Ataque', attrDefault: 'destreza', baseCap: 85 },
  esquiva: { nome: 'Chance de Esquiva', attrDefault: 'agilidade', baseCap: 80 },
  bloqueio: { nome: 'Chance de Bloqueio', attrDefault: 'constituicao', baseCap: 85 },
  mental: { nome: 'Chance de Acerto Mental', attrDefault: 'inteligencia', baseCap: 85 },
  convencimento: { nome: 'Chance de Convencimento', attrDefault: 'carisma', baseCap: 85 },
  resistencia: { nome: 'Chance de Resistência a Convencimento', attrDefault: 'carisma', baseCap: 85 },
  magico: { nome: 'Chance de Acerto Mágico', attrDefault: 'magia', baseCap: 85 },
  elemental: { nome: 'Chance de Acerto Elemental', attrDefault: 'natureza', baseCap: 85 },
  espiritual: { nome: 'Chance de Acerto Espiritual', attrDefault: 'espiritualidade', baseCap: 85 }
};
