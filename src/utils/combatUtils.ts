import { AtributosPersonagem } from '../types';
import { MATERIAIS_ARMA, METAIS_CANALIZACAO, NOMES_ACOES_ACERTO } from '../data/combatData';

export function clamp(v: number): number {
  return Math.max(0, Math.min(100, Math.round(v)));
}

export function erroCritico(attr: number): number {
  return 95 + attr;
}

export function aplicarTeto(valor: number, teto: number, quebra: boolean): number {
  if (!quebra && valor > teto) return teto;
  return valor;
}

export function progressaoEnergetica(attr: number): number {
  if (attr <= 2) return 50;
  if (attr <= 4) return 60;
  return 70;
}

export function bonusCriticoFisico(dex: number): number {
  if (dex <= 1) return 0;
  if (dex === 2) return 3;
  if (dex === 3) return 4;
  if (dex === 4) return 5;
  return 6;
}

export interface FaixaResultado {
  nome: string;
  criticoInicio: number;
  criticoFim: number;
  acimaMediaInicio: number;
  acimaMediaFim: number;
  normalInicio: number;
  normalFim: number;
  erroNormalInicio: number;
  erroNormalFim: number;
  erroCriticoValor: number;
  textoFormatado: string;
}

export function montarFaixas(
  nomeExibicao: string,
  numero: number,
  erroCriticoValor: number,
  bonusCriticoExtra: number = 0
): FaixaResultado {
  const totalClamped = clamp(numero);

  let fimCritico = Math.ceil(totalClamped / 5) + bonusCriticoExtra;
  const fimAcimaMedia = Math.ceil(totalClamped / 2);

  const limiteMaximo = Math.min(totalClamped, erroCriticoValor - 1);
  if (fimCritico > limiteMaximo) {
    fimCritico = limiteMaximo;
  }

  const fimNormal = limiteMaximo;

  const faixaStr = (nome: string, i: number, f: number) => {
    if (i > f) return '';
    if (i === f) return `${nome}: ${i}\n`;
    return `${nome}: ${i} a ${f}\n`;
  };

  let texto = `${nomeExibicao}\n`;
  texto += faixaStr('Acerto Crítico', 1, fimCritico);
  texto += faixaStr('Acerto Acima da Média', fimCritico + 1, fimAcimaMedia);
  texto += faixaStr('Acerto Normal', Math.max(fimCritico, fimAcimaMedia) + 1, fimNormal);
  texto += faixaStr('Erro Normal', fimNormal + 1, erroCriticoValor - 1);
  texto += faixaStr('Erro Crítico', erroCriticoValor, 100);

  return {
    nome: nomeExibicao,
    criticoInicio: 1,
    criticoFim: fimCritico,
    acimaMediaInicio: fimCritico + 1,
    acimaMediaFim: fimAcimaMedia,
    normalInicio: Math.max(fimCritico, fimAcimaMedia) + 1,
    normalFim: fimNormal,
    erroNormalInicio: fimNormal + 1,
    erroNormalFim: erroCriticoValor - 1,
    erroCriticoValor,
    textoFormatado: texto
  };
}

// Map short attribute names to full AtributosPersonagem keys
export const ATTR_SHORT_MAP: Record<string, keyof AtributosPersonagem> = {
  str: 'forca',
  dex: 'destreza',
  agi: 'agilidade',
  con: 'constituicao',
  int: 'inteligencia',
  cha: 'carisma',
  nat: 'natureza',
  mag: 'magia',
  spi: 'espiritualidade',
  forca: 'forca',
  destreza: 'destreza',
  agilidade: 'agilidade',
  constituicao: 'constituicao',
  inteligencia: 'inteligencia',
  carisma: 'carisma',
  natureza: 'natureza',
  magia: 'magia',
  espiritualidade: 'espiritualidade'
};

export const ATTR_NOME_EXIBICAO: Record<keyof AtributosPersonagem, string> = {
  forca: 'Força',
  destreza: 'Destreza',
  agilidade: 'Agilidade',
  constituicao: 'Constituição',
  inteligencia: 'Inteligência',
  carisma: 'Carisma',
  natureza: 'Natureza',
  magia: 'Magia',
  espiritualidade: 'Espiritualidade'
};
