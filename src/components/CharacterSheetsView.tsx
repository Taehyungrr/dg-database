import React, { useState } from 'react';
import { Deus, FichaPersonagem, Poder, Ramo } from '../types';
import { createNewSheet, saveSheet, deleteSheet } from '../services/characterSheets';
import { normalizeAttributes, calculateCombatStatus, calculateSheetPoints } from '../utils/calculator';
import { CharacterSheetEditorModal } from './CharacterSheetEditorModal';
import { 
  FileText, 
  Plus, 
  Trash2, 
  Copy, 
  Edit, 
  Download, 
  Upload, 
  Award, 
  Calendar,
  AlertCircle,
  FileCode,
  Shield,
  Zap,
  Swords,
  Heart,
  Flame,
  Sparkles
} from 'lucide-react';

interface CharacterSheetsViewProps {
  sheets: FichaPersonagem[];
  setSheets: React.Dispatch<React.SetStateAction<FichaPersonagem[]>>;
  activeSheetId: string;
  onLoadSheet: (sheet: FichaPersonagem) => void;
  deuses: Deus[];
  ramos: Ramo[];
  poderes: Poder[];
  initialNewSheetDeusId?: string | null;
  onClearInitialDeusId?: () => void;
}

export const CharacterSheetsView: React.FC<CharacterSheetsViewProps> = ({
  sheets,
  setSheets,
  activeSheetId,
  onLoadSheet,
  deuses,
  ramos,
  poderes,
  initialNewSheetDeusId,
  onClearInitialDeusId
}) => {
  const [importJsonText, setImportJsonText] = useState<string>('');
  const [showImportBox, setShowImportBox] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [deletingSheetId, setDeletingSheetId] = useState<string | null>(null);

  // Sheet Editor Modal State
  const [editingSheet, setEditingSheet] = useState<FichaPersonagem | null>(() => {
    if (initialNewSheetDeusId) {
      return createNewSheet(initialNewSheetDeusId);
    }
    return null;
  });
  const [isNewSheetModal, setIsNewSheetModal] = useState<boolean>(!!initialNewSheetDeusId);

  React.useEffect(() => {
    if (initialNewSheetDeusId) {
      setEditingSheet(createNewSheet(initialNewSheetDeusId));
      setIsNewSheetModal(true);
      if (onClearInitialDeusId) onClearInitialDeusId();
    }
  }, [initialNewSheetDeusId, onClearInitialDeusId]);

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleOpenCreateNew = () => {
    const newS = createNewSheet(deuses[0]?.id || 'poseidon');
    setEditingSheet(newS);
    setIsNewSheetModal(true);
  };

  const handleOpenEdit = (sheet: FichaPersonagem) => {
    setEditingSheet(sheet);
    setIsNewSheetModal(false);
  };

  const handleSaveFromEditor = (savedSheet: FichaPersonagem) => {
    const updated = saveSheet(savedSheet);
    setSheets(updated);
    onLoadSheet(savedSheet);
    setEditingSheet(null);
    showFeedback(`Ficha de "${savedSheet.nome}" salva com sucesso!`);
  };

  const handleDelete = (sheetId: string) => {
    const updated = deleteSheet(sheetId);
    setSheets(updated);
    setDeletingSheetId(null);
    showFeedback('Ficha excluída com sucesso.');
  };

  const handleDuplicate = (sheet: FichaPersonagem) => {
    const duplicated: FichaPersonagem = {
      ...sheet,
      id: 'ficha_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      nome: `${sheet.nome || 'Semideus'} (Cópia)`,
      criado_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString()
    };
    const updated = saveSheet(duplicated);
    setSheets(updated);
    showFeedback('Ficha duplicada com sucesso!');
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(sheets, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `Fichas_Acampamento_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showFeedback('Arquivo de backup exportado!');
  };

  const handleImportJson = () => {
    try {
      if (!importJsonText.trim()) return;
      const parsed = JSON.parse(importJsonText);
      const itemsToImport: FichaPersonagem[] = Array.isArray(parsed) ? parsed : [parsed];
      
      const current = [...sheets];
      itemsToImport.forEach((item) => {
        if (item.id && item.nome) {
          const idx = current.findIndex(s => s.id === item.id);
          if (idx >= 0) {
            current[idx] = item;
          } else {
            current.unshift(item);
          }
          saveSheet(item);
        }
      });
      
      setSheets(current);
      setImportJsonText('');
      setShowImportBox(false);
      showFeedback(`${itemsToImport.length} ficha(s) importada(s) com sucesso!`);
    } catch {
      showFeedback('Erro: Formato JSON inválido.');
    }
  };

  return (
    <div className="flex-1 flex flex-col space-y-6 pb-20 md:pb-12 animate-fadeIn w-full">
      
      {/* Toast */}
      {feedbackMsg && (
        <div className="fixed bottom-20 md:bottom-6 right-6 z-50 px-4 py-2.5 bg-[var(--fundo2)] text-blue-500 rounded-xl shadow-2xl border border-blue-500/40 text-xs font-semibold animate-fadeIn flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-blue-500 shrink-0" />
          <span className="text-[var(--ctexto1)]">{feedbackMsg}</span>
        </div>
      )}

      {/* Header bar */}
      <div className="bg-[var(--fundo2)] border border-[var(--bordadg)] rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div>
          <h2 className="text-[10px] uppercase tracking-[0.2em] text-[var(--ctexto2)] font-bold flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-500" />
            Minhas Fichas de Semideuses
          </h2>
          <p className="text-sm font-semibold text-[var(--ctexto1)] mt-0.5">
            Crie novos personagens, distribua atributos, invista em habilidades divinas e gere BBCode para o fórum
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <button
            type="button"
            id="btn-new-character-sheet"
            onClick={handleOpenCreateNew}
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 transition-all active:scale-95 uppercase tracking-wider cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Criar Nova Ficha</span>
          </button>

          <button
            type="button"
            onClick={handleExportJson}
            disabled={sheets.length === 0}
            className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-[var(--fundo3)] hover:bg-[var(--fundo4)] disabled:opacity-40 text-[var(--ctexto2)] hover:text-[var(--ctexto1)] border border-[var(--bordadg)] transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Backup</span>
          </button>

          <button
            type="button"
            onClick={() => setShowImportBox(!showImportBox)}
            className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-[var(--fundo3)] hover:bg-[var(--fundo4)] text-[var(--ctexto2)] hover:text-[var(--ctexto1)] border border-[var(--bordadg)] transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Importar</span>
          </button>
        </div>
      </div>

      {/* Import Box */}
      {showImportBox && (
        <div className="bg-[var(--fundo2)] border border-blue-500/40 rounded-2xl p-5 space-y-3 animate-fadeIn">
          <h4 className="font-cinzel text-xs font-bold text-blue-500">
            Importar Fichas via JSON
          </h4>
          <textarea
            value={importJsonText}
            onChange={(e) => setImportJsonText(e.target.value)}
            placeholder="Cole aqui o conteúdo JSON exportado anteriormente..."
            className="w-full h-32 p-3 bg-[var(--fundo1)] font-mono text-xs text-[var(--ctexto1)] border border-[var(--bordadg)] rounded-xl focus:outline-none focus:border-blue-500"
          />
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setShowImportBox(false)}
              className="px-3 py-1.5 text-xs text-[var(--ctexto2)] hover:text-[var(--ctexto1)] cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleImportJson}
              className="px-4 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white uppercase tracking-wider cursor-pointer"
            >
              Confirmar
            </button>
          </div>
        </div>
      )}

      {/* Sheets Grid */}
      {sheets.length === 0 ? (
        <div className="p-12 text-center bg-[var(--fundo2)] border border-[var(--bordadg)] rounded-2xl space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-500 mx-auto">
            <Swords className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[var(--ctexto1)]">
              Nenhuma ficha de semideus cadastrada
            </h3>
            <p className="text-xs text-[var(--ctexto2)] max-w-md mx-auto mt-1">
              Comece agora criando uma ficha completa com distribuição de atributos (Força, Agilidade, Intelecto, etc.) e árvore de habilidades divinas.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenCreateNew}
            className="px-6 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white uppercase tracking-wider shadow-lg shadow-blue-500/20 cursor-pointer"
          >
            Criar Ficha Agora
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 flex-1 items-stretch min-h-[400px]">
          {sheets.map((sheet) => {
            const deus = deuses.find((d) => d.id === sheet.deus_id);
            const godColor = deus?.cor_hex || '#3b82f6';
            const isActive = sheet.id === activeSheetId;
            const isConfirmingDelete = deletingSheetId === sheet.id;
            const attrs = normalizeAttributes(sheet.atributos);
            const statusValues = calculateCombatStatus(sheet.nivel, attrs);

            // Compute sheet powers accounting for both purchased powers and free Tronco levels
            const deityRamos = ramos.filter((r) => r.deus_id === sheet.deus_id);
            const deityBranchIds = new Set(deityRamos.map((r) => r.id));
            const deityPoderes = poderes.filter((p) => deityBranchIds.has(p.ramo_id));

            const sheetCalc = calculateSheetPoints(
              sheet.nivel,
              sheet.poderes_comprados || {},
              deityPoderes,
              deityRamos
            );

            return (
              <div
                key={sheet.id}
                id={`sheet-card-${sheet.id}`}
                className={`p-5 rounded-2xl border flex flex-col justify-between transition-all ${
                  isActive
                    ? 'bg-[var(--fundo2)] border-blue-500/50 shadow-xl'
                    : 'bg-[var(--fundo2)] hover:bg-[var(--fundo3)] border-[var(--bordadg)]'
                }`}
              >
                <div>
                  {/* Top bar with Character Name & Level */}
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: godColor }}
                      />
                      <span className="font-cinzel text-base font-bold text-[var(--ctexto1)] truncate">
                        {sheet.nome || 'Sem Nome'}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1 text-xs font-mono font-bold text-blue-500 bg-[var(--fundo1)] px-2 py-0.5 rounded border border-[var(--bordadg)] shrink-0">
                      <Award className="w-3 h-3" />
                      <span>Lvl {sheet.nivel}</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-[var(--ctexto2)] truncate font-mono ml-4.5">
                    {deus?.nome_grego_romano || 'Olimpiano'}
                  </div>

                  {/* Combat Status Quick Bar (Vida, Vigor, Mana) */}
                  <div className="mt-3 grid grid-cols-3 gap-1.5 text-center">
                    <div className="p-1.5 bg-[var(--fundo1)] rounded-lg border border-[var(--bordadg)]">
                      <span className="text-[8px] text-emerald-500 font-bold block font-mono">VIDA</span>
                      <span className="text-xs font-mono font-black text-emerald-600 dark:text-emerald-300">{statusValues.vida}</span>
                    </div>
                    <div className="p-1.5 bg-[var(--fundo1)] rounded-lg border border-[var(--bordadg)]">
                      <span className="text-[8px] text-rose-500 font-bold block font-mono">VIGOR</span>
                      <span className="text-xs font-mono font-black text-rose-600 dark:text-rose-300">{statusValues.vigor}</span>
                    </div>
                    <div className="p-1.5 bg-[var(--fundo1)] rounded-lg border border-[var(--bordadg)]">
                      <span className="text-[8px] text-purple-500 font-bold block font-mono">MANA</span>
                      <span className="text-xs font-mono font-black text-purple-600 dark:text-purple-300">{statusValues.mana}</span>
                    </div>
                  </div>

                  {/* Attributes Quick Preview (9 Attributes) */}
                  <div className="mt-2.5 p-2 bg-[var(--fundo1)] rounded-xl border border-[var(--bordadg)] grid grid-cols-5 sm:grid-cols-5 gap-1 text-center">
                    <div>
                      <span className="text-[7px] text-[var(--ctexto2)] font-bold block font-mono">FOR</span>
                      <span className="text-[11px] font-mono font-bold text-rose-500">{attrs.forca || 1}</span>
                    </div>
                    <div>
                      <span className="text-[7px] text-[var(--ctexto2)] font-bold block font-mono">DES</span>
                      <span className="text-[11px] font-mono font-bold text-orange-500">{attrs.destreza || 1}</span>
                    </div>
                    <div>
                      <span className="text-[7px] text-[var(--ctexto2)] font-bold block font-mono">AGI</span>
                      <span className="text-[11px] font-mono font-bold text-amber-500">{attrs.agilidade || 1}</span>
                    </div>
                    <div>
                      <span className="text-[7px] text-[var(--ctexto2)] font-bold block font-mono">CON</span>
                      <span className="text-[11px] font-mono font-bold text-emerald-500">{attrs.constituicao || 1}</span>
                    </div>
                    <div>
                      <span className="text-[7px] text-[var(--ctexto2)] font-bold block font-mono">INT</span>
                      <span className="text-[11px] font-mono font-bold text-sky-500">{attrs.inteligencia || 1}</span>
                    </div>
                    <div>
                      <span className="text-[7px] text-[var(--ctexto2)] font-bold block font-mono">CAR</span>
                      <span className="text-[11px] font-mono font-bold text-pink-500">{attrs.carisma || 1}</span>
                    </div>
                    <div>
                      <span className="text-[7px] text-[var(--ctexto2)] font-bold block font-mono">NAT</span>
                      <span className="text-[11px] font-mono font-bold text-lime-600 dark:text-lime-400">{attrs.natureza || 1}</span>
                    </div>
                    <div>
                      <span className="text-[7px] text-[var(--ctexto2)] font-bold block font-mono">MAG</span>
                      <span className="text-[11px] font-mono font-bold text-purple-500">{attrs.magia || 1}</span>
                    </div>
                    <div>
                      <span className="text-[7px] text-[var(--ctexto2)] font-bold block font-mono">ESP</span>
                      <span className="text-[11px] font-mono font-bold text-cyan-500">{attrs.espiritualidade || 1}</span>
                    </div>
                  </div>

                  {/* Acquired Powers Preview by Branch (Modo Evolução + Tronco Grátis) */}
                  {(() => {
                    const ramosWithAcquiredPowers = deityRamos.map((ramo) => {
                      const ramoPowers = deityPoderes
                        .filter((p) => p.ramo_id === ramo.id)
                        .map((p) => {
                          const costInfo = sheetCalc.powerDetails[p.id];
                          return {
                            power: p,
                            level: costInfo ? costInfo.effectiveLevel : 0,
                            isFreeLvl1: costInfo ? costInfo.isFreeLvl1 : false
                          };
                        })
                        .filter((item) => item.level > 0);

                      return {
                        ramo,
                        powers: ramoPowers
                      };
                    }).filter((group) => group.powers.length > 0);

                    if (ramosWithAcquiredPowers.length === 0) {
                      return (
                        <div className="mt-2.5 p-2 bg-[var(--fundo1)] rounded-lg border border-[var(--bordadg)] text-center">
                          <span className="text-[9px] text-[var(--ctexto2)] uppercase block font-mono">Poderes Divinos</span>
                          <span className="text-[11px] text-[var(--ctexto2)] italic">Nenhum poder adquirido ainda</span>
                        </div>
                      );
                    }

                    return (
                      <div className="mt-2.5 p-2.5 bg-[var(--fundo1)] rounded-xl border border-[var(--bordadg)] space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] text-[var(--ctexto2)] uppercase font-mono font-bold flex items-center gap-1">
                            <Zap className="w-3 h-3 text-amber-500" />
                            Poderes Adquiridos ({sheetCalc.poderesCount})
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          {ramosWithAcquiredPowers.map(({ ramo, powers: ramoPowersList }) => (
                            <div key={ramo.id} className="text-[10px] bg-[var(--fundo2)] p-1.5 rounded-lg border border-[var(--bordadg)]">
                              <div className="font-semibold text-blue-500 text-[10px] mb-1 font-mono flex items-center justify-between">
                                <span className="truncate">{ramo.nome}</span>
                                <span className="text-[9px] text-[var(--ctexto2)] font-normal shrink-0 ml-1">({ramoPowersList.length})</span>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {ramoPowersList.map(({ power, level, isFreeLvl1 }) => (
                                  <span
                                    key={power.id}
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[var(--fundo3)] border border-[var(--bordadg)] text-[10px] text-[var(--ctexto1)]"
                                    title={isFreeLvl1 && level === 1 ? 'Nível 1 concedido gratuitamente pelo tronco' : undefined}
                                  >
                                    <span className="truncate max-w-[130px] font-medium">{power.nome}</span>
                                    <span className="text-[9px] font-mono font-bold text-amber-500 shrink-0">
                                      Nv.{level}
                                    </span>
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  <div className="mt-3 flex items-center text-[10px] text-[var(--ctexto2)] font-mono gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>Salvo em: {new Date(sheet.atualizado_em || sheet.criado_em).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-4 pt-3 border-t border-[var(--bordadg)] flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(sheet)}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-blue-600 hover:bg-blue-500 text-white shadow-md transition-all cursor-pointer"
                    >
                      <Edit className="w-3 h-3" />
                      <span>Editar & Distribuir</span>
                    </button>
                  </div>

                  {isConfirmingDelete ? (
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] text-rose-500 font-mono mr-1">Excluir?</span>
                      <button
                        type="button"
                        onClick={() => handleDelete(sheet.id)}
                        className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-[9px] font-bold uppercase cursor-pointer"
                      >
                        Sim
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingSheetId(null)}
                        className="px-2 py-1 rounded bg-[var(--fundo3)] hover:bg-[var(--fundo4)] text-[var(--ctexto2)] text-[9px] font-bold uppercase cursor-pointer border border-[var(--bordadg)]"
                      >
                        Não
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => handleDuplicate(sheet)}
                        title="Duplicar ficha"
                        className="p-1.5 text-[var(--ctexto2)] hover:text-[var(--ctexto1)] hover:bg-[var(--fundo3)] rounded transition-colors cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeletingSheetId(sheet.id)}
                        title="Excluir ficha"
                        className="p-1.5 text-[var(--ctexto2)] hover:text-rose-500 hover:bg-[var(--fundo3)] rounded transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Character Sheet Editor Modal */}
      {editingSheet && (
        <CharacterSheetEditorModal
          isOpen={!!editingSheet}
          onClose={() => setEditingSheet(null)}
          sheet={editingSheet}
          deuses={deuses}
          ramos={ramos}
          poderes={poderes}
          onSave={handleSaveFromEditor}
          isNew={isNewSheetModal}
        />
      )}

    </div>
  );
};
