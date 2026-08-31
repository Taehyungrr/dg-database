export type RamoTipo = 'tronco' | 'ramo1' | 'ramo2' | 'ramo3' | string;

export interface Deus {
  id: string;
  nome_grego_romano: string;
  cor_hex: string;
  imagem_url?: string;
  icone_url?: string;
  simbolo?: string;
  icone_css?: string;
  atributos_principais?: string;
  descricao?: string;
  titulo_mitologico?: string;
  ordem?: number;
  dificuldade?: number | string;
}

export interface Ramo {
  id: string;
  deus_id: string;
  tipo: RamoTipo;
  nome: string;
  descricao?: string;
}

export interface Poder {
  id: string;
  ramo_id: string;
  numero: number;
  nome: string;
  descricao_base: string;
  icone_url?: string;
  tipo_poder?: 'ativo' | 'passivo';
  nivel_1_desc: string;
  nivel_2_desc: string;
  nivel_3_desc: string;
}

export interface AtributosPersonagem {
  forca: number;
  destreza: number;
  agilidade: number;
  constituicao: number;
  inteligencia: number;
  carisma: number;
  natureza: number;
  magia: number;
  espiritualidade: number;
}

export interface StatusCalculados {
  vida: number;
  vigor: number;
  mana: number;
}

export interface PlanejamentoFicha {
  poderes_planejados?: Record<string, number>; // poder_id -> nivel (1, 2, or 3)
  atributos_planejados?: AtributosPersonagem;
}

export interface ItemInventario {
  id: string;
  nome: string;
  tipo: 'arma' | 'armadura' | 'acessorio';
  aptidao?: number; // 0-100%
  material?: string; // Material key e.g. 'bronze_celestial', 'custom'
  materialCustom?: {
    mat: number;
    bonus: number;
    percentBonus: number;
  };
  bonusForja?: number; // FB (Bônus de forja)
  descricao?: string;
  bonusAtributoOuEfeito?: string;
}

export interface BonusExtraDano {
  id: string;
  valor: number;
  descricao: string;
}

export interface BonusCombateFicha {
  bonusDanoAtributos?: {
    forca?: number;
    destreza?: number;
    inteligencia?: number;
    natureza?: number;
    carisma?: number;
    espiritualidade?: number;
    magia?: number;
  };
  bonusDanoExtras?: BonusExtraDano[];
  bonusAcerto?: {
    desarmado?: number;
    armas?: number;
    esquiva?: number;
    bloqueio?: number;
    contra?: number;
    magico?: number;
    elemental?: number;
    espiritual?: number;
    mental?: number;
    convencimento?: number;
    resistencia?: number;
    voz?: number;
  };
}

export interface FichaPersonagem {
  id: string;
  nome: string;
  deus_id: string;
  nivel: number;
  exp?: number; // Pontos de EXP atuais
  poderes_comprados: Record<string, number>; // poder_id -> nivel (1, 2, or 3)
  atributos: AtributosPersonagem;
  planejamento?: PlanejamentoFicha;
  arma_principal?: string;
  historia?: string;
  aparencia?: string;
  inventario?: ItemInventario[];
  bonus_combate?: BonusCombateFicha;
  chances_acerto?: string;
  criado_em: string;
  atualizado_em: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected: boolean;
  lastTested?: string;
}

export type TabType = 'arvore' | 'fichas' | 'combate' | 'evolucao';
