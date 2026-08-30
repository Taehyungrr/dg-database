import React from 'react';
import { TabType } from '../types';
import { 
  Database, 
  TreePine, 
  FileText, 
  Swords, 
  TrendingUp, 
  Sun, 
  Moon, 
  RefreshCw
} from 'lucide-react';

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  isSupabaseConnected: boolean;
  onRefreshData: () => void;
  isRefreshing?: boolean;
  savedSheetsCount: number;
  isDarkMode: boolean;
  setIsDarkMode: (dark: boolean) => void;
  hideThemeToggle?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isSupabaseConnected,
  onRefreshData,
  isRefreshing = false,
  savedSheetsCount,
  isDarkMode,
  setIsDarkMode,
  hideThemeToggle = false
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[var(--fundo2)]/95 backdrop-blur-md border-b border-[var(--bordadg)] transition-colors duration-200 py-1.5 sm:py-2">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-2 min-h-[38px]">
          
          {/* Main Action / Navigation Buttons */}
          <nav className="flex items-center gap-1 sm:gap-2 flex-wrap">
            <button
              type="button"
              id="nav-tab-arvore"
              onClick={() => setActiveTab('arvore')}
              className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'arvore'
                  ? 'bg-[var(--fundo3)] text-blue-500 border border-[var(--bordadg)] shadow-sm font-bold'
                  : 'text-[var(--ctexto2)] hover:text-[var(--ctexto1)] hover:bg-[var(--fundo3)] border border-transparent'
              }`}
            >
              <TreePine className="w-3.5 h-3.5 text-blue-500" />
              <span>Árvore de Poderes</span>
            </button>

            <button
              type="button"
              id="nav-tab-fichas"
              onClick={() => setActiveTab('fichas')}
              className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'fichas'
                  ? 'bg-[var(--fundo3)] text-blue-500 border border-[var(--bordadg)] shadow-sm font-bold'
                  : 'text-[var(--ctexto2)] hover:text-[var(--ctexto1)] hover:bg-[var(--fundo3)] border border-transparent'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-blue-500" />
              <span>Minhas Fichas</span>
              {savedSheetsCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 text-[9px] font-bold rounded-full bg-blue-500 text-white">
                  {savedSheetsCount}
                </span>
              )}
            </button>

            <button
              type="button"
              id="nav-tab-combate"
              onClick={() => setActiveTab('combate')}
              className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'combate'
                  ? 'bg-[var(--fundo3)] text-rose-500 border border-[var(--bordadg)] shadow-sm font-bold'
                  : 'text-[var(--ctexto2)] hover:text-[var(--ctexto1)] hover:bg-[var(--fundo3)] border border-transparent'
              }`}
            >
              <Swords className="w-3.5 h-3.5 text-rose-500" />
              <span>Combate</span>
            </button>

            <button
              type="button"
              id="nav-tab-evolucao"
              onClick={() => setActiveTab('evolucao')}
              className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'evolucao'
                  ? 'bg-[var(--fundo3)] text-emerald-500 border border-[var(--bordadg)] shadow-sm font-bold'
                  : 'text-[var(--ctexto2)] hover:text-[var(--ctexto1)] hover:bg-[var(--fundo3)] border border-transparent'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              <span>Evolução</span>
            </button>
          </nav>

          {/* Database Status & Utility Actions */}
          <div className="flex items-center gap-2">
            
            {/* Supabase Status Indicator (Green if connected, Red if not) */}
            <div className="flex items-center gap-1.5">
              <div
                title={isSupabaseConnected ? "Conectado ao Supabase" : "Desconectado do Supabase"}
                className={`flex items-center gap-1 px-2 py-1 rounded-xl text-xs border transition-all ${
                  isSupabaseConnected 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                }`}
              >
                <Database className="w-3.5 h-3.5 shrink-0" />
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isSupabaseConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
              </div>

              {/* Botão de Atualizar ao lado */}
              <button
                type="button"
                id="btn-refresh-database"
                onClick={onRefreshData}
                disabled={isRefreshing}
                title="Recarregar dados do banco"
                className="p-1.5 rounded-xl text-[var(--ctexto2)] hover:text-[var(--ctexto1)] hover:bg-[var(--fundo3)] border border-[var(--bordadg)] transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-500' : ''}`} />
              </button>
            </div>

            {/* Dark / Light Mode Toggle (Hidden when controlled externally by parent page data-theme) */}
            {!hideThemeToggle && (
              <button
                type="button"
                id="btn-dark-mode"
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-1.5 rounded-xl text-[var(--ctexto2)] hover:text-[var(--ctexto1)] hover:bg-[var(--fundo3)] border border-transparent hover:border-[var(--bordadg)] transition-all cursor-pointer"
                title={isDarkMode ? 'Mudar para Tema Claro' : 'Mudar para Tema Escuro'}
              >
                {isDarkMode ? <Moon className="w-3.5 h-3.5 text-blue-400" /> : <Sun className="w-3.5 h-3.5 text-amber-500" />}
              </button>
            )}

          </div>

        </div>
      </div>

      {/* Mobile Navigation Sub-bar */}
      <div className="md:hidden border-t border-[var(--bordadg)] mt-1.5 pt-1.5 px-2 flex items-center justify-around gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('arvore')}
          className={`flex-1 flex items-center justify-center gap-1 text-[11px] font-semibold py-1 px-1.5 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'arvore' ? 'bg-[var(--fundo3)] text-blue-500 font-bold border border-[var(--bordadg)]' : 'text-[var(--ctexto2)]'
          }`}
        >
          <TreePine className="w-3 h-3" />
          <span>Árvore</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('fichas')}
          className={`flex-1 flex items-center justify-center gap-1 text-[11px] font-semibold py-1 px-1.5 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'fichas' ? 'bg-[var(--fundo3)] text-blue-500 font-bold border border-[var(--bordadg)]' : 'text-[var(--ctexto2)]'
          }`}
        >
          <FileText className="w-3 h-3" />
          <span>Fichas ({savedSheetsCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('combate')}
          className={`flex-1 flex items-center justify-center gap-1 text-[11px] font-semibold py-1 px-1.5 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'combate' ? 'bg-[var(--fundo3)] text-rose-500 font-bold border border-[var(--bordadg)]' : 'text-[var(--ctexto2)]'
          }`}
        >
          <Swords className="w-3 h-3 text-rose-500" />
          <span>Combate</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('evolucao')}
          className={`flex-1 flex items-center justify-center gap-1 text-[11px] font-semibold py-1 px-1.5 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'evolucao' ? 'bg-[var(--fundo3)] text-emerald-500 font-bold border border-[var(--bordadg)]' : 'text-[var(--ctexto2)]'
          }`}
        >
          <TrendingUp className="w-3 h-3 text-emerald-500" />
          <span>Evolução</span>
        </button>
      </div>
    </header>
  );
};

