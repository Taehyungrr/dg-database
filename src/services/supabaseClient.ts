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
          const defaultD = INITIAL_DEUSES.find(initD => initD.id === d.id) ||
            INITIAL_DEUSES.find(initD => d.nome_grego_romano && String(d.nome_grego_romano).toLowerCase().includes(initD.id));
          
          let icon = String(d.icone_css || d.simbolo || '').trim().replace(/^\./, '').replace(/^game-icon-/, '');
          if (!icon && defaultD) {
            icon = (defaultD.icone_css || defaultD.simbolo || '').trim().replace(/^\./, '').replace(/^game-icon-/, '');
          }
          
          const cor = d.cor_hex || defaultD?.cor_hex || '#38bdf8';
          const mappedDeus: Deus = {
            ...d,
            icone_css: icon,
            simbolo: icon || d.simbolo || '',
            cor_hex: cor,
            atributos_principais: d.atributos_principais || defaultD?.atributos_principais || '',
            descricao: d.descricao || defaultD?.descricao || '',
            titulo_mitologico: d.titulo_mitologico || defaultD?.titulo_mitologico || ''
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
    const defaultD = INITIAL_DEUSES.find(initD => initD.id === d.id) ||
      INITIAL_DEUSES.find(initD => d.nome_grego_romano && String(d.nome_grego_romano).toLowerCase().includes(initD.id));
    const rawIcon = d.icone_css || d.simbolo || defaultD?.icone_css || defaultD?.simbolo || '';
    const icon = String(rawIcon).trim().replace(/^\./, '').replace(/^game-icon-/, '');
    return {
      ...d,
      icone_css: icon,
      simbolo: icon || d.simbolo || '',
      cor_hex: d.cor_hex || defaultD?.cor_hex || '#38bdf8'
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
          icone_url: p.icone_url || 'zap'
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
    icone_url: p.icone_url || 'zap'
  }));
}
