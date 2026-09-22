import React, { useState, useEffect } from 'react';
import { TabType } from '../types';
import { MinotaurIcon } from './icons/MinotaurIcon';
import { 
  Database, 
  FileText, 
  Calculator, 
  Sun, 
  Moon, 
  RefreshCw,
  ShieldAlert
} from 'lucide-react';
import { BraveTroubleshootModal, checkIsBrave } from './BraveTroubleshootModal';

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
  const [isBrave, setIsBrave] = useState<boolean>(false);
  const [isBraveModalOpen, setIsBraveModalOpen] = useState<boolean>(false);

  useEffect(() => {
    checkIsBrave().then((res) => setIsBrave(res));
  }, []);
  return (
    <header className="sticky top-0 z-40 bg-[var(--fundo2)]/95 backdrop-blur-md border-b border-[var(--bordadg)] transition-colors duration-200 py-1.5 sm:py-2">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-2 min-h-[38px]">
          
          {/* Mobile-only brand badge/title */}
          <div className="flex md:hidden items-center">
            <span className="font-mono font-black text-xs text-[#b8a944] uppercase tracking-wider">
              Divine Ground RPG
            </span>
          </div>

          {/* Main Desktop Navigation Buttons */}
          <nav className="hidden md:flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              id="nav-tab-arvore"
              onClick={() => setActiveTab('arvore')}
              className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'arvore'
                  ? 'bg-[var(--fundo3)] text-[#b8a944] border border-[var(--bordadg)] shadow-sm font-bold'
                  : 'text-[var(--ctexto2)] hover:text-[var(--ctexto1)] hover:bg-[var(--fundo3)] border border-transparent'
              }`}
            >
              <i className="game-icon game-icon-scroll-unfurled text-[#b8a944] text-sm leading-none" />
              <span>Árvore de Poderes</span>
            </button>

            <button
              type="button"
              id="nav-tab-fichas"
              onClick={() => setActiveTab('fichas')}
              className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'fichas'
                  ? 'bg-[var(--fundo3)] text-[#b8a944] border border-[var(--bordadg)] shadow-sm font-bold'
                  : 'text-[var(--ctexto2)] hover:text-[var(--ctexto1)] hover:bg-[var(--fundo3)] border border-transparent'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-[#b8a944]" />
              <span>Minhas Fichas</span>
              {savedSheetsCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 text-[9px] font-bold rounded-full bg-[#b8a944] text-white">
                  {savedSheetsCount}
                </span>
              )}
            </button>

            <button
              type="button"
              id="nav-tab-bestiario"
              onClick={() => setActiveTab('bestiario')}
              className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'bestiario'
                  ? 'bg-[var(--fundo3)] text-[#b8a944] border border-[var(--bordadg)] shadow-sm font-bold'
                  : 'text-[var(--ctexto2)] hover:text-[var(--ctexto1)] hover:bg-[var(--fundo3)] border border-transparent'
              }`}
            >
              <MinotaurIcon className="w-3.5 h-3.5 text-[#b8a944]" />
              <span>Bestiário</span>
            </button>

            <button
              type="button"
              id="nav-tab-calculadoras"
              onClick={() => setActiveTab('calculadoras')}
              className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'calculadoras' || activeTab === 'combate'
                  ? 'bg-[var(--fundo3)] text-[#b8a944] border border-[var(--bordadg)] shadow-sm font-bold'
                  : 'text-[var(--ctexto2)] hover:text-[var(--ctexto1)] hover:bg-[var(--fundo3)] border border-transparent'
              }`}
            >
              <Calculator className="w-3.5 h-3.5 text-[#b8a944]" />
              <span>Calculadoras</span>
            </button>
          </nav>

          {/* Database Status & Utility Actions */}
          <div className="flex items-center gap-2">
            
            {/* Supabase Status Indicator (Green if connected, Red if not) */}
            <div className="flex items-center gap-1.5">
              <div
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
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#b8a944]' : ''}`} />
              </button>
            </div>

            {/* Botão Solucionar Brave (aparece SÓ para quem usa navegador Brave) */}
            {isBrave && (
              <button
                type="button"
                id="btn-solucionar-brave-nav"
                onClick={() => setIsBraveModalOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-orange-500/15 hover:bg-orange-500/25 text-orange-400 border border-orange-500/40 shadow-sm transition-all cursor-pointer"
                title="Dicas e soluções para o navegador Brave (Brave Shields)"
              >
                <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                <span>Solucionar Brave</span>
              </button>
            )}

            {/* Dark / Light Mode Toggle (Hidden when controlled externally by parent page data-theme) */}
            {!hideThemeToggle && (
              <button
                type="button"
                id="btn-dark-mode"
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-1.5 rounded-xl text-[var(--ctexto2)] hover:text-[var(--ctexto1)] hover:bg-[var(--fundo3)] border border-transparent hover:border-[var(--bordadg)] transition-all cursor-pointer"
                title={isDarkMode ? 'Mudar para Tema Claro' : 'Mudar para Tema Escuro'}
              >
                {isDarkMode ? <Moon className="w-3.5 h-3.5 text-[#b8a944]" /> : <Sun className="w-3.5 h-3.5 text-amber-500" />}
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
            activeTab === 'arvore' ? 'bg-[var(--fundo3)] text-[#b8a944] font-bold border border-[var(--bordadg)]' : 'text-[var(--ctexto2)]'
          }`}
        >
          <i className="game-icon game-icon-scroll-unfurled text-[#b8a944] text-xs leading-none" />
          <span>Árvore</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('fichas')}
          className={`flex-1 flex items-center justify-center gap-1 text-[11px] font-semibold py-1 px-1.5 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'fichas' ? 'bg-[var(--fundo3)] text-[#b8a944] font-bold border border-[var(--bordadg)]' : 'text-[var(--ctexto2)]'
          }`}
        >
          <FileText className="w-3 h-3 text-[#b8a944]" />
          <span>Fichas ({savedSheetsCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('bestiario')}
          className={`flex-1 flex items-center justify-center gap-1 text-[11px] font-semibold py-1 px-1.5 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'bestiario' ? 'bg-[var(--fundo3)] text-[#b8a944] font-bold border border-[var(--bordadg)]' : 'text-[var(--ctexto2)]'
          }`}
        >
          <MinotaurIcon className="w-3.5 h-3.5 text-[#b8a944]" />
          <span>Bestiário</span>
        </button>

        <button
          type="button"
          id="nav-tab-calculadoras-mobile"
          onClick={() => setActiveTab('calculadoras')}
          className={`flex-1 flex items-center justify-center gap-1 text-[11px] font-semibold py-1 px-1.5 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'calculadoras' || activeTab === 'combate' ? 'bg-[var(--fundo3)] text-[#b8a944] font-bold border border-[var(--bordadg)]' : 'text-[var(--ctexto2)]'
          }`}
        >
          <Calculator className="w-3.5 h-3.5 text-[#b8a944]" />
          <span>Calculadoras</span>
        </button>
      </div>

      {/* Brave Troubleshooting Modal */}
      <BraveTroubleshootModal
        isOpen={isBraveModalOpen}
        onClose={() => setIsBraveModalOpen(false)}
      />
    </header>
  );
};

