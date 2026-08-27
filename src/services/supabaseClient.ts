import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Deus, Ramo, Poder, SupabaseConfig } from '../types';
import { INITIAL_DEUSES, INITIAL_RAMOS, INITIAL_PODERES } from '../data/defaultData';

const CONFIG_STORAGE_KEY = 'pj_supabase_config_v1';
const LOCAL_STORAGE_DEUSES = 'pj_local_deuses_v1';
const LOCAL_STORAGE_RAMOS = 'pj_local_ramos_v1';
const LOCAL_STORAGE_PODERES = 'pj_local_poderes_v1';

let supabaseInstance: SupabaseClient | null = null;

/**
 * Gets Supabase configuration from environment variables or saved cache
 */
export function getSavedSupabaseConfig(): SupabaseConfig {
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

  if (envUrl && envKey) {
    return {
      url: envUrl,
      anonKey: envKey,
      isConnected: true,
      lastTested: new Date().toISOString()
    };
  }

  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.url && parsed.anonKey) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Erro ao ler configuração do Supabase:', e);
  }

  return {
    url: '',
    anonKey: '',
    isConnected: false
  };
}

/**
 * Initializes or returns the singleton Supabase client instance
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (!supabaseInstance) {
    const config = getSavedSupabaseConfig();
    if (config.url && config.anonKey) {
      try {
        supabaseInstance = createClient(config.url, config.anonKey);
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
export function saveSupabaseConfig(url: string, anonKey: string): SupabaseConfig {
  const config: SupabaseConfig = {
    url: url.trim(),
    anonKey: anonKey.trim(),
    isConnected: Boolean(url.trim() && anonKey.trim()),
    lastTested: new Date().toISOString()
  };
  try {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Erro ao salvar config no localStorage:', e);
  }
  supabaseInstance = null;
  if (config.url && config.anonKey) {
    try {
      supabaseInstance = createClient(config.url, config.anonKey);
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
        const deusesMapeados = data.map((d: any) => {
          const icon = resolveGodIcon(d);
          const cor = d.cor_hex || '#38bdf8';

          const mappedDeus: Deus = {
            ...d,
            icone_url: d.icone_url || icon,
            icone_css: icon,
            simbolo: icon,
            cor_hex: cor,
            atributos_principais: d.atributos_principais || '',
            descricao: d.descricao || '',
            titulo_mitologico: d.titulo_mitologico || ''
          };
          return mappedDeus;
        });

        setLocalData(LOCAL_STORAGE_DEUSES, deusesMapeados);
        return deusesMapeados as Deus[];
      }
    } catch (e) {
      console.warn('Supabase inacessível, usando dados locais de deuses:', e);
    }
  }
  
  const localList = getLocalData<Deus>(LOCAL_STORAGE_DEUSES, INITIAL_DEUSES);
  return localList.map((d: any) => {
    const icon = resolveGodIcon(d);
    return {
      ...d,
      icone_url: d.icone_url || icon,
      icone_css: icon,
      simbolo: icon,
      cor_hex: d.cor_hex || '#38bdf8'
    };
  });
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
    icone_url: p.icone_url || p.icone || p.icon || p.icone_css || 'zap'
  }));
}
