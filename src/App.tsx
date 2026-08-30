import React, { useState, useEffect } from 'react';
import { Deus, Ramo, Poder, FichaPersonagem, TabType, SupabaseConfig } from './types';
import { 
  fetchAllDeuses, 
  fetchAllRamos, 
  fetchAllPoderes, 
  getSavedSupabaseConfig
} from './services/supabaseClient';
import { getSavedSheets, createNewSheet, saveSheet, hasUnexportedChanges } from './services/characterSheets';
import { Navbar } from './components/Navbar';
import { PowerTreeCalculator } from './components/PowerTreeCalculator';
import { CharacterSheetsView } from './components/CharacterSheetsView';
import { CombatCalculatorView } from './components/CombatCalculatorView';
import { EvolutionView } from './components/EvolutionView';
import { BBCodeModal } from './components/BBCodeModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('arvore');
  const [isControlledByParent, setIsControlledByParent] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    // Check initial parent or top window data-theme attribute
    try {
      if (typeof window !== 'undefined') {
        if (window.parent && window.parent !== window) {
          try {
            const parentHtml = window.parent.document.documentElement;
            if (parentHtml && parentHtml.hasAttribute('data-theme')) {
              const val = parentHtml.getAttribute('data-theme')?.toLowerCase();
              return val === 'dark' || (val !== 'light' && val?.includes('dark'));
            }
          } catch {
            // Cross-origin
          }
        }
        if (window.top && window.top !== window && window.top !== window.parent) {
          try {
            const topHtml = window.top.document.documentElement;
            if (topHtml && topHtml.hasAttribute('data-theme')) {
              const val = topHtml.getAttribute('data-theme')?.toLowerCase();
              return val === 'dark' || (val !== 'light' && val?.includes('dark'));
            }
          } catch {
            // Cross-origin
          }
        }
      }
    } catch {
      // ignore
    }

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

  // Browser reload / leave warning if there are unexported changes in character sheets
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnexportedChanges(savedSheets)) {
        e.preventDefault();
        const msg = 'Você possui edições em fichas que ainda não foram exportadas em backup. Deseja realmente sair ou recarregar?';
        e.returnValue = msg;
        return msg;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [savedSheets]);

  // Check and sync with parent window's <html> data-theme attribute in real-time
  useEffect(() => {
    let parentObserver: MutationObserver | null = null;
    let topObserver: MutationObserver | null = null;

    const evaluateThemeFromElement = (element: HTMLElement): boolean | null => {
      if (!element || !element.hasAttribute('data-theme')) return null;
      const val = element.getAttribute('data-theme')?.toLowerCase()?.trim();
      if (!val) return null;
      return val === 'dark' || (val !== 'light' && val.includes('dark'));
    };

    const inspectAndObserveParentTheme = () => {
      let isHandled = false;

      // 1. Check parent window (e.g. if embedded in iframe)
      if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
        try {
          const parentHtml = window.parent.document.documentElement;
          if (parentHtml) {
            const parentTheme = evaluateThemeFromElement(parentHtml);
            if (parentTheme !== null) {
              setIsControlledByParent(true);
              setIsDarkMode(parentTheme);
              isHandled = true;
            }

            // Observe parent <html> for runtime changes to data-theme
            parentObserver = new MutationObserver(() => {
              try {
                const currentTheme = evaluateThemeFromElement(parentHtml);
                if (currentTheme !== null) {
                  setIsControlledByParent(true);
                  setIsDarkMode(currentTheme);
                } else {
                  setIsControlledByParent(false);
                }
              } catch (err) {
                console.warn('Erro ao observar mudanças de tema no pai:', err);
              }
            });

            parentObserver.observe(parentHtml, {
              attributes: true,
              attributeFilter: ['data-theme']
            });
          }
        } catch {
          // Cross-origin iframe parent
        }
      }

      // 2. Check top window if not already handled
      if (!isHandled && typeof window !== 'undefined' && window.top && window.top !== window && window.top !== window.parent) {
        try {
          const topHtml = window.top.document.documentElement;
          if (topHtml) {
            const topTheme = evaluateThemeFromElement(topHtml);
            if (topTheme !== null) {
              setIsControlledByParent(true);
              setIsDarkMode(topTheme);
              isHandled = true;
            }

            // Observe top <html> for runtime changes
            topObserver = new MutationObserver(() => {
              try {
                const currentTheme = evaluateThemeFromElement(topHtml);
                if (currentTheme !== null) {
                  setIsControlledByParent(true);
                  setIsDarkMode(currentTheme);
                } else {
                  setIsControlledByParent(false);
                }
              } catch (err) {
                console.warn('Erro ao observar mudanças de tema no top:', err);
              }
            });

            topObserver.observe(topHtml, {
              attributes: true,
              attributeFilter: ['data-theme']
            });
          }
        } catch {
          // Cross-origin top
        }
      }

      if (!isHandled) {
        setIsControlledByParent(false);
      }
    };

    inspectAndObserveParentTheme();

    // 3. Fallback / PostMessage listener for cross-origin iframes
    const handlePostMessage = (event: MessageEvent) => {
      try {
        if (!event.data) return;
        if (typeof event.data === 'object') {
          const raw = event.data['data-theme'] || event.data.dataTheme || event.data.theme;
          if (raw === 'dark' || raw === 'light') {
            setIsControlledByParent(true);
            setIsDarkMode(raw === 'dark');
          }
        } else if (typeof event.data === 'string') {
          if (event.data.includes('data-theme=dark') || event.data === 'theme:dark' || event.data === 'dark') {
            setIsControlledByParent(true);
            setIsDarkMode(true);
          } else if (event.data.includes('data-theme=light') || event.data === 'theme:light' || event.data === 'light') {
            setIsControlledByParent(true);
            setIsDarkMode(false);
          }
        }
      } catch {
        // ignore
      }
    };

    window.addEventListener('message', handlePostMessage);

    return () => {
      if (parentObserver) parentObserver.disconnect();
      if (topObserver) topObserver.disconnect();
      window.removeEventListener('message', handlePostMessage);
    };
  }, []);

  // Sync theme with HTML element & local storage
  useEffect(() => {
    if (!isControlledByParent) {
      try {
        localStorage.setItem('pj_theme', isDarkMode ? 'dark' : 'light');
      } catch (e) {
        console.warn('Não foi possível salvar tema no localStorage:', e);
      }
    }

    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, [isDarkMode, isControlledByParent]);

  const handleCreateSheetWithDeus = (deusId: string) => {
    setInitialNewSheetDeusId(deusId);
    setActiveTab('fichas');
  };

  const handleLoadSheet = (sheet: FichaPersonagem) => {
    setActiveSheet(sheet);
  };

  return (
    <div className="min-h-screen w-full bg-[var(--fundo1)] text-[var(--ctexto1)] font-sans antialiased selection:bg-blue-600 selection:text-white flex flex-col transition-colors duration-200">
      <div className="flex-1 flex flex-col w-full">
        {/* Navigation Bar */}
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          hideThemeToggle={isControlledByParent}
          isSupabaseConnected={supabaseConfig.isConnected}
          onRefreshData={() => loadData(true)}
          isRefreshing={isRefreshing}
          savedSheetsCount={savedSheets.length}
        />

        {/* Main Content Area */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 pt-3 sm:pt-5 pb-6 sm:pb-8 flex flex-col min-h-[calc(100vh-80px)]">
          
          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] space-y-4">
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

              {/* TAB 3: COMBATE (CALCULADORA DE DANO E ACERTO) */}
              {activeTab === 'combate' && (
                <CombatCalculatorView sheets={savedSheets} />
              )}

              {/* TAB 4: EVOLUÇÃO (CALCULADORA DE EXP E BARRA DE PROGRESSO) */}
              {activeTab === 'evolucao' && (
                <EvolutionView
                  sheets={savedSheets}
                  onUpdateSheet={(updatedSheet) => {
                    const newSheets = saveSheet(updatedSheet);
                    setSavedSheets(newSheets);
                  }}
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
