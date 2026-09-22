import React, { useState, useEffect } from 'react';
import { Shield, ShieldAlert, CheckCircle2, AlertTriangle, ExternalLink, RefreshCw, X, Download } from 'lucide-react';

export const checkIsBrave = async (): Promise<boolean> => {
  try {
    if (typeof window !== 'undefined') {
      if ((navigator as any).brave && typeof (navigator as any).brave.isBrave === 'function') {
        return await (navigator as any).brave.isBrave();
      }
      if ((navigator as any).userAgentData?.brands) {
        return (navigator as any).userAgentData.brands.some((b: any) =>
          b.brand && b.brand.toLowerCase().includes('brave')
        );
      }
    }
  } catch {
    // ignore
  }
  return false;
};

interface BraveTroubleshootModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExportBackup?: () => void;
}

export const BraveTroubleshootModal: React.FC<BraveTroubleshootModalProps> = ({
  isOpen,
  onClose,
  onExportBackup
}) => {
  const [testResult, setTestResult] = useState<'idle' | 'success' | 'failed'>('idle');

  useEffect(() => {
    if (isOpen) {
      setTestResult('idle');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const testStorage = () => {
    try {
      const testKey = '__brave_storage_test__' + Date.now();
      localStorage.setItem(testKey, 'ok');
      const val = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      if (val === 'ok') {
        setTestResult('success');
      } else {
        setTestResult('failed');
      }
    } catch {
      setTestResult('failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[var(--fundo2)] border border-orange-500/40 rounded-2xl shadow-2xl p-5 sm:p-6 space-y-4 text-[var(--ctexto1)]">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[var(--bordadg)] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
              <ShieldAlert className="w-5 h-5 shrink-0" />
            </div>
            <div>
              <h3 className="font-cinzel text-base font-bold text-orange-400">
                Solucionar Navegador Brave
              </h3>
              <p className="text-xs text-[var(--ctexto2)]">
                Proteções do Brave Shields e persistência de fichas
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--ctexto2)] hover:text-[var(--ctexto1)] hover:bg-[var(--fundo3)] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-3.5 text-xs text-[var(--ctexto1)] leading-relaxed">
          <p className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-3 text-[var(--ctexto1)]">
            Detectamos que você está usando o <strong>Brave Browser</strong>. O recurso <strong>Brave Shields</strong> bloqueia por padrão o armazenamento local (<code className="text-orange-400 font-mono">localStorage</code>) quando a página está dentro de um fórum ou iframe, o que pode fazer com que suas fichas salvas sumam ao recarregar a página.
          </p>

          <div className="space-y-2">
            <h4 className="font-bold text-xs uppercase tracking-wide text-orange-400 flex items-center gap-1.5">
              <span>Como resolver no Brave:</span>
            </h4>
            
            <ol className="list-decimal list-inside space-y-2 bg-[var(--fundo1)] p-3.5 rounded-xl border border-[var(--bordadg)] text-[var(--ctexto1)]">
              <li>
                Clique no <strong>ícone do Leão (Brave Shields)</strong> na barra de endereços (ao lado do link do site).
              </li>
              <li>
                Alterne a chave para <strong>"Proteções DESATIVADAS neste site"</strong> (Shields Down) ou permita cookies/armazenamento de terceiros.
              </li>
              <li>
                Alternativamente, abra a aplicação em uma <strong>nova aba direta</strong> fora do iframe do fórum.
              </li>
              <li>
                Sempre faça o download de um <strong>Backup (.json)</strong> de suas fichas através do botão de backup para nunca perder seu progresso!
              </li>
            </ol>
          </div>

          {/* Test Storage Section */}
          <div className="bg-[var(--fundo3)] p-3 rounded-xl border border-[var(--bordadg)] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs">Testar Armazenamento Local:</span>
              <button
                type="button"
                onClick={testStorage}
                className="px-3 py-1 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Testar Agora</span>
              </button>
            </div>

            {testResult === 'success' && (
              <div className="flex items-center gap-2 p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Seu armazenamento local está <strong>ativo e funcionando</strong>! Suas fichas serão salvas.</span>
              </div>
            )}

            {testResult === 'failed' && (
              <div className="flex items-center gap-2 p-2 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>O armazenamento está <strong>bloqueado pelo Brave</strong>! Desative o Brave Shields para salvar suas fichas.</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-[var(--bordadg)]">
          {onExportBackup ? (
            <button
              type="button"
              onClick={() => {
                onExportBackup();
                onClose();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#b8a944] hover:bg-[#a39438] text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar Backup das Fichas</span>
            </button>
          ) : <div />}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-[var(--fundo3)] hover:bg-[var(--fundo4)] text-[var(--ctexto1)] border border-[var(--bordadg)] rounded-xl text-xs font-semibold cursor-pointer"
          >
            Entendi
          </button>
        </div>

      </div>
    </div>
  );
};
