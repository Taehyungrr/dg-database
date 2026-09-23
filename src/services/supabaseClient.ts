import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Deus, Ramo, Poder, Monstro, MonstroPoder, SupabaseConfig } from '../types';
import { 
  INITIAL_DEUSES, 
  INITIAL_RAMOS, 
  INITIAL_PODERES,
  INITIAL_MONSTROS,
  INITIAL_MONSTRO_PODERES
} from '../data/defaultData';

const CONFIG_STORAGE_KEY = 'pj_supabase_config_v1';
const LOCAL_STORAGE_DEUSES = 'pj_local_deuses_v1';
const LOCAL_STORAGE_RAMOS = 'pj_local_ramos_v1';
const LOCAL_STORAGE_PODERES = 'pj_local_poderes_v1';
const LOCAL_STORAGE_MONSTROS = 'pj_local_monstros_v1';
const LOCAL_STORAGE_MONSTRO_PODERES = 'pj_local_monstro_poderes_v1';

let supabaseInstance: SupabaseClient | null = null;

/**
 * Gets Supabase configuration from environment variables or saved cache
 * Supports both modern Supabase Publishable Key (sb_pub_... / pk_...) and legacy Anon Key
 */
export function getSavedSupabaseConfig(): SupabaseConfig {
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const envKey = 
    (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY ||
    (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 
    '';

  if (envUrl && envKey) {
    return {
      url: envUrl,
      anonKey: envKey,
      publishableKey: envKey,
      isConnected: true,
      lastTested: new Date().toISOString()
    };
  }

  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const key = parsed?.publishableKey || parsed?.anonKey;
      if (parsed && parsed.url && key) {
        return {
          ...parsed,
          anonKey: key,
          publishableKey: key
        };
      }
    }
  } catch (e) {
    console.error('Erro ao ler configuração do Supabase:', e);
  }

  return {
    url: '',
    anonKey: '',
    publishableKey: '',
    isConnected: false
  };
}

/**
 * Initializes or returns the singleton Supabase client instance
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (!supabaseInstance) {
    const config = getSavedSupabaseConfig();
    const clientKey = config.publishableKey || config.anonKey;
    if (config.url && clientKey) {
      try {
        supabaseInstance = createClient(config.url, clientKey);
      } catch (e) {
        console.error('Falha ao inicializar cliente Supabase:', e);
        supabaseInstance = null;
      }
    }
  }
  return supabaseInstance;
}

/**
 * Saves Supabase config to local storage and re-initializes client
 */
export function saveSupabaseConfig(url: string, keyOrAnon: string): SupabaseConfig {
  const cleanKey = keyOrAnon.trim();
  const cleanUrl = url.trim();
  const config: SupabaseConfig = {
    url: cleanUrl,
    anonKey: cleanKey,
    publishableKey: cleanKey,
    isConnected: Boolean(cleanUrl && cleanKey),
    lastTested: new Date().toISOString()
  };
  try {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Erro ao salvar config no localStorage:', e);
  }
  supabaseInstance = null;
  if (config.url && cleanKey) {
    try {
      supabaseInstance = createClient(config.url, cleanKey);
    } catch (e) {
      console.error('Falha ao instanciar Supabase:', e);
    }
  }
  return config;
}

/**
 * Clears local cache of deuses, ramos, and poderes to force fresh fetch
 */
export function clearLocalCache(): void {
  try {
    localStorage.removeItem(LOCAL_STORAGE_DEUSES);
    localStorage.removeItem(LOCAL_STORAGE_RAMOS);
    localStorage.removeItem(LOCAL_STORAGE_PODERES);
    localStorage.removeItem(LOCAL_STORAGE_MONSTROS);
    localStorage.removeItem(LOCAL_STORAGE_MONSTRO_PODERES);
  } catch (e) {
    console.error('Erro ao limpar cache local:', e);
  }
}

// ==========================================
// LOCAL STORAGE CACHE HELPERS
// ==========================================

export function getLocalData<T>(key: string, defaultData: T[]): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error(`Erro ao ler ${key} local:`, e);
  }
  return defaultData;
}

export function setLocalData<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Erro ao salvar ${key} local:`, e);
  }
}

// ==========================================
// UNIFIED DATA ACCESS LAYER (SUPABASE + LOCAL)
// ==========================================

// Helper to resolve icon from any possible column name in the database
function resolveGodIcon(d: any): string {
  const possibleFields = [
    d?.icone_url,
    d?.icone_css,
    d?.simbolo,
    d?.game_icon,
    d?.game_icons,
    d?.icone,
    d?.icon,
    d?.icon_code,
    d?.simbolo_css,
    d?.icon_css
  ];

  for (const field of possibleFields) {
    if (typeof field === 'string' && field.trim().length > 0) {
      return field.trim();
    }
  }

  return '';
}

/**
 * Fetches all Deuses from Supabase with fallback to local cache / defaultData
 */
export async function fetchAllDeuses(): Promise<Deus[]> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client.from('deuses').select('*');
      if (!error && data && data.length > 0) {
        const initialDeusMap = new Map(INITIAL_DEUSES.map((id) => [id.id, id]));
        const deusesMapeados = data.map((d: any) => {
          const icon = resolveGodIcon(d);
          const cor = d.cor_hex || '#38bdf8';
          const defaultGod = initialDeusMap.get(d.id);

          const mappedDeus: Deus = {
            ...d,
            icone_url: d.icone_url || icon,
            icone_css: icon,
            simbolo: icon,
            cor_hex: cor,
            atributos_principais: d.atributos_principais || defaultGod?.atributos_principais || '',
            descricao: d.descricao || d.description || d.desc || d.historia || d.bio || defaultGod?.descricao || '',
            titulo_mitologico: d.titulo_mitologico || defaultGod?.titulo_mitologico || '',
            dificuldade: d.dificuldade ?? d.difficulty ?? defaultGod?.dificuldade ?? 1
          };
          return mappedDeus;
        });

        // Ensure Legado is present if missing from DB
        if (!deusesMapeados.some((d) => d.id === 'legado')) {
          const legadoDefault = initialDeusMap.get('legado');
          if (legadoDefault) {
            deusesMapeados.push(legadoDefault);
          }
        } else {
          const idx = deusesMapeados.findIndex((d) => d.id === 'legado');
          if (idx !== -1 && initialDeusMap.get('legado')) {
            deusesMapeados[idx].simbolo = deusesMapeados[idx].simbolo || initialDeusMap.get('legado')!.simbolo;
            deusesMapeados[idx].icone_css = deusesMapeados[idx].icone_css || initialDeusMap.get('legado')!.icone_css;
          }
        }

        deusesMapeados.sort((a, b) => {
          if (a.id === 'legado') return 1;
          if (b.id === 'legado') return -1;
          if (a.ordem !== undefined && b.ordem !== undefined && a.ordem !== b.ordem && a.ordem > 0 && b.ordem > 0) {
            return a.ordem - b.ordem;
          }
          return (a.nome_grego_romano || '').localeCompare(b.nome_grego_romano || '', 'pt-BR');
        });

        setLocalData(LOCAL_STORAGE_DEUSES, deusesMapeados);
        return deusesMapeados as Deus[];
      }
    } catch (e) {
      console.warn('Supabase inacessível, usando dados locais de deuses:', e);
    }
  }
  
  const initialDeusMap = new Map(INITIAL_DEUSES.map((id) => [id.id, id]));
  const localList = getLocalData<Deus>(LOCAL_STORAGE_DEUSES, INITIAL_DEUSES);
  const mappedLocal = localList.map((d: any) => {
    const icon = resolveGodIcon(d);
    const defaultGod = initialDeusMap.get(d.id);
    return {
      ...d,
      icone_url: d.icone_url || icon,
      icone_css: icon,
      simbolo: icon,
      cor_hex: d.cor_hex || '#38bdf8',
      descricao: d.descricao || d.description || d.desc || d.historia || d.bio || defaultGod?.descricao || '',
      atributos_principais: d.atributos_principais || defaultGod?.atributos_principais || '',
      titulo_mitologico: d.titulo_mitologico || defaultGod?.titulo_mitologico || '',
      dificuldade: d.dificuldade ?? d.difficulty ?? defaultGod?.dificuldade ?? 1
    };
  });

  // Ensure Legado is present in mappedLocal
  if (!mappedLocal.some((d) => d.id === 'legado')) {
    const legadoDefault = initialDeusMap.get('legado');
    if (legadoDefault) {
      mappedLocal.push(legadoDefault);
    }
  } else {
    const idx = mappedLocal.findIndex((d) => d.id === 'legado');
    if (idx !== -1 && initialDeusMap.get('legado')) {
      mappedLocal[idx].simbolo = initialDeusMap.get('legado')!.simbolo;
      mappedLocal[idx].icone_css = initialDeusMap.get('legado')!.icone_css;
    }
  }

  mappedLocal.sort((a, b) => {
    if (a.id === 'legado') return 1;
    if (b.id === 'legado') return -1;
    if (a.ordem !== undefined && b.ordem !== undefined && a.ordem !== b.ordem && a.ordem > 0 && b.ordem > 0) {
      return a.ordem - b.ordem;
    }
    return (a.nome_grego_romano || '').localeCompare(b.nome_grego_romano || '', 'pt-BR');
  });

  return mappedLocal;
}

/**
 * Fetches all Ramos from Supabase with fallback to local cache / defaultData
 */
export async function fetchAllRamos(): Promise<Ramo[]> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client.from('ramos').select('*');
      if (!error && data && data.length > 0) {
        setLocalData(LOCAL_STORAGE_RAMOS, data);
        return data as Ramo[];
      }
    } catch (e) {
      console.warn('Supabase inacessível, usando dados locais de ramos:', e);
    }
  }
  return getLocalData<Ramo>(LOCAL_STORAGE_RAMOS, INITIAL_RAMOS);
}

/**
 * Fetches all Poderes from Supabase with fallback to local cache / defaultData
 */
export async function fetchAllPoderes(): Promise<Poder[]> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client.from('poderes').select('*').order('numero', { ascending: true });
      if (!error && data && data.length > 0) {
        const mapped = data.map((p: any) => ({
          ...p,
          tipo_poder: p.tipo_poder || p.tipo_habilidade || p.tipo || p.type || p.tipoPoder,
          icone_url: p.icone_url || p.icone || p.icon || p.icone_css || 'zap'
        }));
        setLocalData(LOCAL_STORAGE_PODERES, mapped);
        return mapped as Poder[];
      }
    } catch (e) {
      console.warn('Supabase inacessível, usando dados locais de poderes:', e);
    }
  }
  const localList = getLocalData<Poder>(LOCAL_STORAGE_PODERES, INITIAL_PODERES);
  return localList.map((p: any) => ({
    ...p,
    tipo_poder: p.tipo_poder || p.tipo_habilidade || p.tipo || p.type || p.tipoPoder,
    icone_url: p.icone_url || p.icone || p.icon || p.icone_css || 'zap'
  }));
}

/**
 * Fetches all Monstros from Supabase with fallback to local cache / defaultData
 */
export async function fetchAllMonstros(): Promise<Monstro[]> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client.from('monstros').select('*').order('nome', { ascending: true });
      if (!error && data && data.length > 0) {
        const mapped = data.map((m: any) => ({
          ...m,
          tipo: (m.tipo || 'terrestre').toLowerCase().trim(),
          perigoso: Boolean(m.perigoso),
          cor_hex: m.cor_hex || '#38bdf8'
        }));
        setLocalData(LOCAL_STORAGE_MONSTROS, mapped);
        return mapped as Monstro[];
      }
    } catch (e) {
      console.warn('Supabase inacessível, usando dados locais de monstros:', e);
    }
  }
  const localList = getLocalData<Monstro>(LOCAL_STORAGE_MONSTROS, INITIAL_MONSTROS);
  return localList.map((m: any) => ({
    ...m,
    tipo: (m.tipo || 'terrestre').toLowerCase().trim(),
    perigoso: Boolean(m.perigoso),
    cor_hex: m.cor_hex || '#38bdf8'
  }));
}

/**
 * Fetches all Monstro Poderes from Supabase with fallback to local cache / defaultData
 */
export async function fetchAllMonstroPoderes(): Promise<MonstroPoder[]> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client.from('monstro_poderes').select('*').order('numero', { ascending: true });
      if (!error && data && data.length > 0) {
        setLocalData(LOCAL_STORAGE_MONSTRO_PODERES, data);
        return data as MonstroPoder[];
      }
    } catch (e) {
      console.warn('Supabase inacessível, usando dados locais de poderes de monstros:', e);
    }
  }
  return getLocalData<MonstroPoder>(LOCAL_STORAGE_MONSTRO_PODERES, INITIAL_MONSTRO_PODERES);
}

