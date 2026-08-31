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
  aluminio: { id: 'aluminio', nome: 'Alumínio', mat: 10, bonus: 10, percent: 0, text: '+10 de dano base contra elementais da terra e das florestas.', effectType: 'flat' },
  ferro_aco: { id: 'ferro_aco', nome: 'Ferro/Aço', mat: 10, bonus: 10, percent: 0, text: '+10 de dano base contra mortais.', effectType: 'flat' },
  cobre: { id: 'cobre', nome: 'Cobre', mat: 10, bonus: 15, percent: 0, text: '+15 de dano em efeitos e poderes de eletricidade e/ou temperatura usados através do item.', effectType: 'flat' },
  prata: { id: 'prata', nome: 'Prata', mat: 10, bonus: 10, percent: 0, text: '+10 de dano contra espíritos.', effectType: 'flat' },
  titanio: { id: 'titanio', nome: 'Titânio', mat: 10, bonus: 0, percent: 0, text: 'Sem efeito especial.', effectType: 'none' },
  ouro_sagrado: { id: 'ouro_sagrado', nome: 'Ouro Sagrado', mat: 20, bonus: 10, percent: 0, text: '+10 de dano base contra seres voadores.', effectType: 'flat' },
  prata_sagrada: { id: 'prata_sagrada', nome: 'Prata Sagrada', mat: 20, bonus: 10, percent: 0, text: '+10 de dano base contra seres terrestres.', effectType: 'flat' },
  bronze_sagrado: { id: 'bronze_sagrado', nome: 'Bronze Sagrado', mat: 20, bonus: 10, percent: 0, text: '+10 de dano base contra seres aquáticos.', effectType: 'flat' },
  ferro_sagrado: { id: 'ferro_sagrado', nome: 'Ferro Sagrado', mat: 20, bonus: 10, percent: 0, text: '+10 de dano base contra seres ctônicos.', effectType: 'flat' },
  adamantino_sagrado: { id: 'adamantino_sagrado', nome: 'Adamantino', mat: 20, bonus: 0, percent: 10, text: '+10% de dano físico perfurocortante.', effectType: 'percent' },
  paladio_sagrado: { id: 'paladio_sagrado', nome: 'Paládio Sagrado', mat: 20, bonus: 0, percent: 10, text: '+10% de dano físico contundente.', effectType: 'percent' },
  mitralina_sagrada: { id: 'mitralina_sagrada', nome: 'Mitralina Sagrada', mat: 20, bonus: 0, percent: 0, text: 'Sem efeito especial.', effectType: 'none' },
  cobalto_sagrado: { id: 'cobalto_sagrado', nome: 'Cobalto Sagrado', mat: 20, bonus: 0, percent: 0, text: 'Sem efeito especial.', effectType: 'none' },
  cedro_sagrado: { id: 'cedro_sagrado', nome: 'Cedro Sagrado', mat: 20, bonus: 0, percent: 0, text: 'Sem efeito especial.', effectType: 'none' },
  obsidiana_sagrada: { id: 'obsidiana_sagrada', nome: 'Obsidiana Sagrada', mat: 20, bonus: 0, percent: 0, text: 'Sem efeito especial.', effectType: 'none' },
  petricita_sagrada: { id: 'petricita_sagrada', nome: 'Petricita Sagrada', mat: 20, bonus: 0, percent: 0, text: 'Sem efeito especial.', effectType: 'none' },
  iridio_sagrado: { id: 'iridio_sagrado', nome: 'Irídio Sagrado', mat: 20, bonus: 0, percent: 0, text: 'Sem efeito especial.', effectType: 'none' },
  ouro_imperial: { id: 'ouro_imperial', nome: 'Ouro Imperial', mat: 30, bonus: 20, percent: 0, text: '+20 de dano base contra seres voadores.', effectType: 'flat' },
  bronze_celestial: { id: 'bronze_celestial', nome: 'Bronze Celestial', mat: 30, bonus: 20, percent: 0, text: '+20 de dano base contra seres aquáticos.', effectType: 'flat' },
  ferro_estigio: { id: 'ferro_estigio', nome: 'Ferro Estígio', mat: 30, bonus: 20, percent: 0, text: '+20 de dano base contra seres ctônicos.', effectType: 'flat' },
  aco_osseo: { id: 'aco_osseo', nome: 'Aço Ósseo', mat: 30, bonus: 20, percent: 0, text: '+20 de dano base contra monstros terrestres.', effectType: 'flat' },
  prata_lunar: { id: 'prata_lunar', nome: 'Prata Lunar', mat: 30, bonus: 15, percent: 0, text: '+15 de dano base contra qualquer monstro.', effectType: 'flat' },
  verdino_mortal: { id: 'verdino_mortal', nome: 'Verdino Mortal', mat: 30, bonus: 15, percent: 0, text: '+15 de dano venenoso por golpe perfurocortante. Consegue absorver pelo período de um tópico qualquer tipo de veneno que for jogado em sua parte metálica, que é acoplado ao veneno natural do metal. Só pode haver um veneno ativo por vez.', effectType: 'flat' },
  asphodelium: { id: 'asphodelium', nome: 'Asphodelium', mat: 40, bonus: 0, percent: 0, text: 'Quebra de espírito — cada golpe bem sucedido com a arma gera acúmulos que reagem com o sofrimento alheio, sinta o outro dor ou não, acumulando energia e garantindo um acerto crítico garantido a cada três acertos.', effectType: 'flat' },
  macarium: { id: 'macarium', nome: 'Macarium', mat: 40, bonus: 0, percent: 30, text: 'Danos elementais com origem na arma causam +30% de dano.', effectType: 'percent' }
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
