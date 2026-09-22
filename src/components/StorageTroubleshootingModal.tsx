import React, { useState } from 'react';
import { 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  RefreshCw, 
  Download, 
  Shield, 
  HardDrive, 
  Lock,
  Sparkles
} from 'lucide-react';
import { StorageDiagnostics } from '../services/characterSheets';

interface StorageTroubleshootingModalProps {
  isOpen: boolean;
  onClose: () => void;
  storageDiag: StorageDiagnostics | null;
  onRefreshDiag: () => Promise<void>;
  onPersistRequest: () => Promise<boolean>;
}

export const StorageTroubleshootingModal: React.FC<StorageTroubleshootingModalProps> = ({
  isOpen,
  onClose,
  storageDiag,
  onRefreshDiag,
  onPersistRequest
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRequestingPersist, setIsRequestingPersist] = useState(false);
  const [persistFeedback, setPersistFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setPersistFeedback(null);
    try {
      await onRefreshDiag();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handlePersist = async () => {
    setIsRequestingPersist(true);
    setPersistFeedback(null);
    try {
      const success = await onPersistRequest();
      if (success) {
        setPersistFeedback('✓ O navegador autorizou a persistência permanente dos dados!');
        await onRefreshDiag();
      } else {
        setPersistFeedback('O navegador não concedeu persistência total no momento. Siga as instruções abaixo do Brave Shields.');
      }
    } catch {
      setPersistFeedback('Não foi possível solicitar persistência.');
    } finally {
      setIsRequestingPersist(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-fadeIn">
      <div 
        className="bg-[var(--fundo2)] border border-[var(--bordadg)] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-[var(--ctexto1)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="storage-modal-title"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[var(--bordadg)] flex items-center justify-between bg-[var(--fundo1)]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#b8a944]/15 text-[#b8a944] shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 id="storage-modal-title" className="text-base font-bold text-[var(--ctexto1)] flex items-center gap-2">
                Armazenamento das Fichas & Navegador Brave
              </h3>
              <p className="text-xs text-[var(--ctexto2)]">
                Como garantir que suas fichas não sejam apagadas ao fechar o navegador
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[var(--ctexto2)] hover:text-[var(--ctexto1)] hover:bg-[var(--fundo3)] transition-colors cursor-pointer"
            title="Fechar janela"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs text-[var(--ctexto2)] leading-relaxed">
          
          {/* Diagnostic Status Box */}
          <div className="bg-[var(--fundo1)] border border-[var(--bordadg)] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[var(--ctexto1)] uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-[#b8a944]" />
                Diagnóstico de Armazenamento deste Dispositivo
              </span>
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-1 text-[11px] text-[#b8a944] hover:underline disabled:opacity-50 cursor-pointer font-medium"
              >
                <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Testar novamente</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              {/* Write/Read status */}
              <div className="bg-[var(--fundo2)] p-2.5 rounded-lg border border-[var(--bordadg)]">
                <div className="text-[10px] text-[var(--ctexto2)]">Gravação Local</div>
                <div className="mt-1 flex items-center gap-1.5 font-bold text-xs">
                  {storageDiag?.isAvailable ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="text-emerald-500">Funcionando</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                      <span className="text-red-500">Bloqueado</span>
                    </>
                  )}
                </div>
              </div>

              {/* Brave detection */}
              <div className="bg-[var(--fundo2)] p-2.5 rounded-lg border border-[var(--bordadg)]">
                <div className="text-[10px] text-[var(--ctexto2)]">Navegador</div>
                <div className="mt-1 flex items-center gap-1.5 font-bold text-xs">
                  {storageDiag?.isBrave ? (
                    <>
                      <Shield className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="text-amber-500">Brave Detectado</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span className="text-[var(--ctexto1)]">Navegador Padrão</span>
                    </>
                  )}
                </div>
              </div>

              {/* Persistence Mode */}
              <div className="bg-[var(--fundo2)] p-2.5 rounded-lg border border-[var(--bordadg)]">
                <div className="text-[10px] text-[var(--ctexto2)]">Retenção de Dados</div>
                <div className="mt-1 flex items-center gap-1.5 font-bold text-xs">
                  {storageDiag?.isPersisted ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="text-emerald-500">Persistente</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5 text-[var(--ctexto2)] shrink-0" />
                      <span className="text-[var(--ctexto2)]">Padrão</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {storageDiag?.errorMessage && (
              <div className="text-[11px] text-red-400 bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                {storageDiag.errorMessage}
              </div>
            )}

            {!storageDiag?.isPersisted && (
              <div className="pt-1 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <span className="text-[11px] text-[var(--ctexto2)]">
                  Você pode solicitar ao navegador permissão para proteger os dados contra limpezas automáticas de cache:
                </span>
                <button
                  type="button"
                  onClick={handlePersist}
                  disabled={isRequestingPersist}
                  className="px-2.5 py-1.5 rounded-lg bg-[#b8a944]/20 hover:bg-[#b8a944]/30 text-[#b8a944] font-semibold text-[11px] transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>{isRequestingPersist ? 'Solicitando...' : 'Tornar Persistente'}</span>
                </button>
              </div>
            )}

            {persistFeedback && (
              <div className="text-[11px] text-[#b8a944] bg-[#b8a944]/10 p-2 rounded-lg border border-[#b8a944]/20">
                {persistFeedback}
              </div>
            )}
          </div>

          {/* Instructions Guide */}
          <div>
            <h4 className="font-bold text-[var(--ctexto1)] text-sm mb-3 flex items-center gap-2">
              <span>Passo a Passo: Como Evitar a Perda de Fichas no Brave</span>
            </h4>

            <div className="space-y-3">
              {/* Step 1 */}
              <div className="p-3.5 rounded-xl bg-[var(--fundo1)] border border-[var(--bordadg)] space-y-1">
                <div className="flex items-center gap-2 font-bold text-xs text-[var(--ctexto1)]">
                  <span className="w-5 h-5 rounded-full bg-[#b8a944] text-white flex items-center justify-center text-[10px] shrink-0">1</span>
                  <span>Desative "Esquecer-me ao fechar este site" (Brave Shields)</span>
                </div>
                <p className="text-xs text-[var(--ctexto2)] pl-7">
                  Ao lado da URL na barra de endereços, clique no <strong>ícone do Leão (Brave Shields)</strong>. Abra as <em>Configurações Avançadas</em> e verifique se a opção <strong>"Esquecer-me ao fechar este site"</strong> (ou <em>Forget me when I close this site</em>) está <strong>desativada</strong>. Se estiver ativada, o Brave deleta todo o armazenamento assim que a aba fecha.
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-3.5 rounded-xl bg-[var(--fundo1)] border border-[var(--bordadg)] space-y-1">
                <div className="flex items-center gap-2 font-bold text-xs text-[var(--ctexto1)]">
                  <span className="w-5 h-5 rounded-full bg-[#b8a944] text-white flex items-center justify-center text-[10px] shrink-0">2</span>
                  <span>Verifique a Limpeza Automática ao Sair</span>
                </div>
                <p className="text-xs text-[var(--ctexto2)] pl-7">
                  No Brave, acesse o endereço <code className="px-1.5 py-0.5 rounded bg-[var(--fundo3)] text-[var(--ctexto1)] font-mono text-[10px]">brave://settings/clearBrowserData</code> e clique na aba <strong>"Ao sair"</strong>. Certifique-se de que a caixa <strong>"Cookies e outros dados do site"</strong> está <strong>desmarcada</strong>.
                </p>
              </div>

              {/* Step 3 */}
              <div className="p-3.5 rounded-xl bg-[var(--fundo1)] border border-[var(--bordadg)] space-y-1">
                <div className="flex items-center gap-2 font-bold text-xs text-[var(--ctexto1)]">
                  <span className="w-5 h-5 rounded-full bg-[#b8a944] text-white flex items-center justify-center text-[10px] shrink-0">3</span>
                  <span>Abra diretamente no navegador (não em Webviews)</span>
                </div>
                <p className="text-xs text-[var(--ctexto2)] pl-7">
                  Se você abriu o site clicando em um link dentro do Discord, Telegram ou WhatsApp, o navegador pode ter aberto em uma visualização interna com armazenamento particionado temporário. Copie o link e abra diretamente em uma aba normal do navegador.
                </p>
              </div>

              {/* Step 4 */}
              <div className="p-3.5 rounded-xl bg-[var(--fundo1)] border border-[var(--bordadg)] space-y-1">
                <div className="flex items-center gap-2 font-bold text-xs text-[var(--ctexto1)]">
                  <span className="w-5 h-5 rounded-full bg-[#b8a944] text-white flex items-center justify-center text-[10px] shrink-0">4</span>
                  <span>Sempre faça Backup (.json) de segurança</span>
                </div>
                <p className="text-xs text-[var(--ctexto2)] pl-7">
                  Para máxima segurança contra qualquer limpeza acidental do navegador, use o botão <strong>Backup</strong> no topo da página de Fichas. Ele baixa um arquivo JSON com todos os seus personagens, que você pode restaurar instantaneamente com o botão <strong>Importar</strong> em qualquer dispositivo.
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--bordadg)] bg-[var(--fundo1)] flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#b8a944] hover:bg-[#a39438] text-white transition-all cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
