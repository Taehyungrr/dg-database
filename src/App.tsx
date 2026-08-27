import React, { useState, useEffect } from 'react';
import { Deus, Ramo, Poder, FichaPersonagem, TabType, SupabaseConfig } from './types';
import { 
  fetchAllDeuses, 
  fetchAllRamos, 
  fetchAllPoderes, 
  getSavedSupabaseConfig
} from './services/supabaseClient';
import { getSavedSheets, createNewSheet } from './services/characterSheets';
import { Navbar } from './components/Navbar';
import { PowerTreeCalculator } from './components/PowerTreeCalculator';
import { CharacterSheetsView } from './components/CharacterSheetsView';
import { BBCodeModal } from './components/BBCodeModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('arvore');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('pj_theme');
      return stored ? stored === 'dark' : true;
    } catch {
      return true;
    }
  });

  // Supabase Data State (Live data read from database)
  const [deuses, setDeuses] = useState<Deus[]>([]);
  const [ramos, setRamos] = useState<Ramo[]>([]);
  const [poderes, setPoderes] = useState<Poder[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Supabase Configuration Status
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>(() => getSavedSupabaseConfig());

  // Saved Sheets State (Locally saved by the player)
  const [savedSheets, setSavedSheets] = useState<FichaPersonagem[]>([]);
  const [activeSheet, setActiveSheet] = useState<FichaPersonagem>(() => createNewSheet('poseidon'));
  const [initialNewSheetDeusId, setInitialNewSheetDeusId] = useState<string | null>(null);

  // Modals
  const [isBBCodeModalOpen, setIsBBCodeModalOpen] = useState<boolean>(false);

  // Fetch all RPG data from Supabase
  const loadData = async (showRefreshSpinner: boolean = false) => {
    if (showRefreshSpinner) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const [d, r, p] = await Promise.all([
        fetchAllDeuses(),
        fetchAllRamos(),
        fetchAllPoderes()
      ]);
      
      setDeuses(d);
      setRamos(r);
      setPoderes(p);
      setSupabaseConfig(getSavedSupabaseConfig());
    } catch (e) {
      console.error('Erro ao carregar dados do RPG:', e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadData();
    const storedSheets = getSavedSheets();
    setSavedSheets(storedSheets);
    if (storedSheets.length > 0) {
      setActiveSheet(storedSheets[0]);
    }
  }, []);

  // Sync theme with HTML element & local storage
  useEffect(() => {
    try {
      localStorage.setItem('pj_theme', isDarkMode ? 'dark' : 'light');
    } catch (e) {
      console.warn('Não foi possível salvar tema no localStorage:', e);
    }

    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, [isDarkMode]);

  const handleCreateSheetWithDeus = (deusId: string) => {
    setInitialNewSheetDeusId(deusId);
    setActiveTab('fichas');
  };

  const handleLoadSheet = (sheet: FichaPersonagem) => {
    setActiveSheet(sheet);
  };

  return (
    <div className="min-h-screen bg-[var(--fundo1)] text-[var(--ctexto1)] font-sans antialiased selection:bg-blue-600 selection:text-white flex flex-col justify-between transition-colors duration-200">
      <div>
        {/* Navigation Bar */}
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          isSupabaseConnected={supabaseConfig.isConnected}
          onRefreshData={() => loadData(true)}
          isRefreshing={isRefreshing}
          savedSheetsCount={savedSheets.length}
        />

        {/* Main Content Area */}
        <main className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 pt-3 sm:pt-5 pb-6 sm:pb-8">
          
          {isLoading ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
              <div className="w-10 h-10 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin" />
              <p className="font-cinzel text-xs uppercase tracking-widest text-[var(--ctexto2)]">
                Carregando poderes do Divine Ground...
              </p>
            </div>
          ) : (
            <>
              {/* TAB 1: VISUALIZADOR DA ÁRVORE DE PODERES */}
              {activeTab === 'arvore' && (
                <PowerTreeCalculator
                  deuses={deuses}
                  ramos={ramos}
                  poderes={poderes}
                  onOpenCreateSheetWithDeus={handleCreateSheetWithDeus}
                />
              )}

              {/* TAB 2: MINHAS FICHAS (DISTRIBUIÇÃO DE ATRIBUTOS, PODERES & BBCODE) */}
              {activeTab === 'fichas' && (
                <CharacterSheetsView
                  sheets={savedSheets}
                  setSheets={setSavedSheets}
                  deuses={deuses}
                  ramos={ramos}
                  poderes={poderes}
                  onLoadSheet={handleLoadSheet}
                  activeSheetId={activeSheet.id}
                  initialNewSheetDeusId={initialNewSheetDeusId}
                  onClearInitialDeusId={() => setInitialNewSheetDeusId(null)}
                />
              )}
            </>
          )}

        </main>
      </div>

      {/* BBCode Generator Modal */}
      <BBCodeModal
        isOpen={isBBCodeModalOpen}
        onClose={() => setIsBBCodeModalOpen(false)}
        activeSheet={activeSheet}
        deuses={deuses}
        ramos={ramos}
        poderes={poderes}
      />
    </div>
  );
}
