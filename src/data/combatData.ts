export interface MaterialDefinition {
  id: string;
  nome: string;
  mat: number;
  bonus: number;
  percent: number;
}

export interface ChannelingMetalDefinition {
  id: string;
  nome: string;
  percent: number;
}

export const MATERIAIS_ARMA: Record<string, MaterialDefinition> = {
  aluminio: { id: 'aluminio', nome: 'Alumínio', mat: 5, bonus: 0, percent: 0 },
  ferro_aco: { id: 'ferro_aco', nome: 'Ferro/Aço', mat: 10, bonus: 0, percent: 0 },
  cobre: { id: 'cobre', nome: 'Cobre', mat: 12, bonus: 0, percent: 0 },
  prata: { id: 'prata', nome: 'Prata', mat: 15, bonus: 0, percent: 0 },
  titanio: { id: 'titanio', nome: 'Titânio', mat: 20, bonus: 0, percent: 0 },
  ouro_sagrado: { id: 'ouro_sagrado', nome: 'Ouro Sagrado', mat: 25, bonus: 5, percent: 10 },
  prata_sagrada: { id: 'prata_sagrada', nome: 'Prata Sagrada', mat: 25, bonus: 5, percent: 10 },
  bronze_sagrado: { id: 'bronze_sagrado', nome: 'Bronze Sagrado', mat: 30, bonus: 5, percent: 10 },
  ferro_sagrado: { id: 'ferro_sagrado', nome: 'Ferro Sagrado', mat: 35, bonus: 5, percent: 10 },
  adamantino_sagrado: { id: 'adamantino_sagrado', nome: 'Adamantino', mat: 50, bonus: 10, percent: 25 },
  paladio_sagrado: { id: 'paladio_sagrado', nome: 'Paládio Sagrado', mat: 40, bonus: 10, percent: 15 },
  mitralina_sagrada: { id: 'mitralina_sagrada', nome: 'Mitralina Sagrada', mat: 45, bonus: 10, percent: 20 },
  cobalto_sagrado: { id: 'cobalto_sagrado', nome: 'Cobalto Sagrado', mat: 45, bonus: 10, percent: 20 },
  cedro_sagrado: { id: 'cedro_sagrado', nome: 'Cedro Sagrado', mat: 40, bonus: 10, percent: 15 },
  obsidiana_sagrada: { id: 'obsidiana_sagrada', nome: 'Obsidiana Sagrada', mat: 50, bonus: 10, percent: 25 },
  petricita_sagrada: { id: 'petricita_sagrada', nome: 'Petricita Sagrada', mat: 40, bonus: 10, percent: 15 },
  iridio_sagrado: { id: 'iridio_sagrado', nome: 'Irídio Sagrado', mat: 50, bonus: 10, percent: 20 },
  ouro_imperial: { id: 'ouro_imperial', nome: 'Ouro Imperial', mat: 25, bonus: 5, percent: 10 },
  bronze_celestial: { id: 'bronze_celestial', nome: 'Bronze Celestial', mat: 30, bonus: 5, percent: 10 },
  ferro_estigio: { id: 'ferro_estigio', nome: 'Ferro Estígio', mat: 35, bonus: 5, percent: 10 },
  aco_osseo: { id: 'aco_osseo', nome: 'Aço Ósseo', mat: 30, bonus: 5, percent: 10 },
  prata_lunar: { id: 'prata_lunar', nome: 'Prata Lunar', mat: 25, bonus: 5, percent: 10 },
  verdino_mortal: { id: 'verdino_mortal', nome: 'Verdino Mortal', mat: 20, bonus: 0, percent: 5 },
  asphodelium: { id: 'asphodelium', nome: 'Asphodelium', mat: 40, bonus: 10, percent: 15 },
  macarium: { id: 'macarium', nome: 'Macarium', mat: 50, bonus: 15, percent: 25 }
};

export const METAIS_CANALIZACAO: Record<string, ChannelingMetalDefinition> = {
  mitralina_sagrada_ch: { id: 'mitralina_sagrada_ch', nome: 'Mitralina Sagrada', percent: 15 },
  cobalto_sagrado_ch: { id: 'cobalto_sagrado_ch', nome: 'Cobalto Sagrado', percent: 15 },
  cedro_sagrado_ch: { id: 'cedro_sagrado_ch', nome: 'Cedro Sagrado', percent: 15 },
  obsidiana_sagrada_ch: { id: 'obsidiana_sagrada_ch', nome: 'Obsidiana Sagrada', percent: 20 },
  mitralina_purpurea: { id: 'mitralina_purpurea', nome: 'Mitralina Purpúrea', percent: 20 },
  cobalto_helenico: { id: 'cobalto_helenico', nome: 'Cobalto Helênico', percent: 20 },
  cedro_olimpico: { id: 'cedro_olimpico', nome: 'Cedro Olímpico', percent: 20 },
  obsidiana_infernal: { id: 'obsidiana_infernal', nome: 'Obsidiana Infernal', percent: 25 }
};

export const NOMES_ACOES_ACERTO: Record<string, { nome: string; attrDefault: string; baseCap: number }> = {
  desarmado: { nome: 'Chance de Acerto de Combate Desarmado', attrDefault: 'forca', baseCap: 90 },
  voz: { nome: 'Chance de Acerto por Voz', attrDefault: 'carisma', baseCap: 85 },
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
