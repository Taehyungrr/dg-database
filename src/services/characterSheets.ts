import { FichaPersonagem } from '../types';

const SHEETS_STORAGE_KEY = 'pj_character_sheets_v1';
const LAST_EXPORT_KEY = 'pj_last_export_timestamp';
const LAST_CHANGE_KEY = 'pj_last_change_timestamp';

export function getLastExportTime(): number {
  try {
    const val = localStorage.getItem(LAST_EXPORT_KEY);
    return val ? parseInt(val, 10) : 0;
  } catch {
    return 0;
  }
}

export function getLastChangeTime(): number {
  try {
    const val = localStorage.getItem(LAST_CHANGE_KEY);
    return val ? parseInt(val, 10) : 0;
  } catch {
    return 0;
  }
}

export function markExportDone(): void {
  try {
    localStorage.setItem(LAST_EXPORT_KEY, Date.now().toString());
  } catch (e) {
    console.error('Erro ao registrar tempo de exportação:', e);
  }
}

export function markChangeMade(): void {
  try {
    localStorage.setItem(LAST_CHANGE_KEY, Date.now().toString());
  } catch (e) {
    console.error('Erro ao registrar tempo de alteração:', e);
  }
}

export function hasUnexportedChanges(sheets?: FichaPersonagem[]): boolean {
  const currentSheets = sheets || getSavedSheets();
  if (!currentSheets || currentSheets.length === 0) return false;

  const lastExport = getLastExportTime();
  if (lastExport === 0) return true; // Fichas existem mas nunca foram exportadas

  const lastChange = getLastChangeTime();
  if (lastChange > lastExport) return true;

  return currentSheets.some(sheet => {
    if (!sheet.atualizado_em) return true;
    const updateTime = new Date(sheet.atualizado_em).getTime();
    return updateTime > lastExport;
  });
}

export function getSavedSheets(): FichaPersonagem[] {
  try {
    const raw = localStorage.getItem(SHEETS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Erro ao ler fichas salvas:', e);
  }
  return [];
}

export function saveSheet(sheet: FichaPersonagem): FichaPersonagem[] {
  const current = getSavedSheets();
  const index = current.findIndex(s => s.id === sheet.id);
  const updatedSheet = {
    ...sheet,
    atualizado_em: new Date().toISOString()
  };

  if (index >= 0) {
    current[index] = updatedSheet;
  } else {
    current.unshift(updatedSheet);
  }

  try {
    localStorage.setItem(SHEETS_STORAGE_KEY, JSON.stringify(current));
    markChangeMade();
  } catch (e) {
    console.error('Erro ao persistir ficha no localStorage:', e);
  }
  return current;
}

export function deleteSheet(sheetId: string): FichaPersonagem[] {
  const current = getSavedSheets();
  const filtered = current.filter(s => s.id !== sheetId);
  try {
    localStorage.setItem(SHEETS_STORAGE_KEY, JSON.stringify(filtered));
    markChangeMade();
  } catch (e) {
    console.error('Erro ao deletar ficha:', e);
  }
  return filtered;
}

export function createNewSheet(deusId: string = 'poseidon'): FichaPersonagem {
  return {
    id: 'ficha_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    nome: 'Novo Semideus',
    deus_id: deusId,
    nivel: 1,
    poderes_comprados: {},
    atributos: {
      forca: 1,
      destreza: 1,
      agilidade: 1,
      constituicao: 1,
      inteligencia: 1,
      carisma: 1,
      natureza: 1,
      magia: 1,
      espiritualidade: 1
    },
    criado_em: new Date().toISOString(),
    atualizado_em: new Date().toISOString()
  };
}

export interface StorageDiagnostics {
  isAvailable: boolean;
  isBrave: boolean;
  isPersisted: boolean;
  isPrivateOrEphemeral: boolean;
  errorMessage?: string;
}

export async function checkStorageDiagnostics(): Promise<StorageDiagnostics> {
  let isAvailable = false;
  let isBrave = false;
  let isPersisted = false;
  let isPrivateOrEphemeral = false;
  let errorMessage: string | undefined;

  // 1. Test localStorage write, read and removal
  try {
    const testKey = '__pj_storage_diag_test__';
    const testVal = 'test_' + Date.now();
    localStorage.setItem(testKey, testVal);
    const read = localStorage.getItem(testKey);
    localStorage.removeItem(testKey);
    isAvailable = read === testVal;
    if (!isAvailable) {
      errorMessage = 'O navegador falhou ao validar leitura imediata no localStorage.';
    }
  } catch (e: any) {
    isAvailable = false;
    errorMessage = e?.name === 'SecurityError' || e?.name === 'QuotaExceededError'
      ? 'Armazenamento bloqueado por configurações de privacidade ou modo anônimo.'
      : (e?.message || 'Acesso ao armazenamento local indisponível no navegador.');
  }

  // 2. Detect Brave browser
  try {
    if (typeof (navigator as any)?.brave?.isBrave === 'function') {
      isBrave = await (navigator as any).brave.isBrave();
    }
  } catch {
    isBrave = false;
  }

  // 3. Check persistent storage state
  try {
    if (navigator.storage && typeof navigator.storage.persisted === 'function') {
      isPersisted = await navigator.storage.persisted();
    }
  } catch {
    isPersisted = false;
  }

  // 4. Check if quota suggests incognito / ephemeral mode
  try {
    if (navigator.storage && typeof navigator.storage.estimate === 'function') {
      const estimate = await navigator.storage.estimate();
      if (estimate.quota && estimate.quota < 125 * 1024 * 1024) {
        isPrivateOrEphemeral = true;
      }
    }
  } catch {
    // Ignore quota estimation errors
  }

  return {
    isAvailable,
    isBrave,
    isPersisted,
    isPrivateOrEphemeral,
    errorMessage
  };
}

export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (navigator.storage && typeof navigator.storage.persist === 'function') {
      return await navigator.storage.persist();
    }
  } catch (e) {
    console.warn('Erro ao solicitar persistência de armazenamento:', e);
  }
  return false;
}

