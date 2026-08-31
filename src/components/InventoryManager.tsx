import React, { useState } from 'react';
import { FichaPersonagem, ItemInventario } from '../types';
import { MATERIAIS_ARMA } from '../data/combatData';
import { 
  Swords, 
  Plus, 
  Trash2, 
  Zap, 
  Sparkles, 
  Crosshair, 
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface InventoryManagerProps {
  formData: FichaPersonagem;
  setFormData: React.Dispatch<React.SetStateAction<FichaPersonagem>>;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({
  formData,
  setFormData
}) => {
  const [showBonusSection, setShowBonusSection] = useState<boolean>(true);

  // Get current inventory & combat bonuses
  const inventory = formData.inventario || [];
  const combatBonuses = formData.bonus_combate || {};
  const attrDmgBonuses = combatBonuses.bonusDanoAtributos || {};
  const hitBonuses = combatBonuses.bonusAcerto || {};

  // Handlers for Attr % Damage Bonuses
  const handleAttrDmgBonusChange = (attrKey: string, val: number) => {
    setFormData((prev) => ({
      ...prev,
      bonus_combate: {
        ...prev.bonus_combate,
        bonusDanoAtributos: {
          ...prev.bonus_combate?.bonusDanoAtributos,
          [attrKey]: val
        }
      }
    }));
  };

  // Handlers for Hit Bonuses
  const handleHitBonusChange = (hitKey: string, val: number) => {
    setFormData((prev) => ({
      ...prev,
      bonus_combate: {
        ...prev.bonus_combate,
        bonusAcerto: {
          ...prev.bonus_combate?.bonusAcerto,
          [hitKey]: val
        }
      }
    }));
  };

  // Inventory Items Handlers
  const handleAddWeapon = () => {
    const newItem: ItemInventario = {
      id: `item_${Date.now()}`,
      nome: 'Nova Arma',
      tipo: 'arma',
      aptidao: 50,
      material: 'bronze_celestial',
      bonusForja: 0,
      descricao: ''
    };

    setFormData((prev) => ({
      ...prev,
      inventario: [...(prev.inventario || []), newItem]
    }));
  };

  const handleUpdateItem = (id: string, updates: Partial<ItemInventario>) => {
    setFormData((prev) => ({
      ...prev,
      inventario: (prev.inventario || []).map((item) => (item.id === id ? { ...item, ...updates } : item))
    }));
  };

  const handleRemoveItem = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      inventario: (prev.inventario || []).filter((item) => item.id !== id)
    }));
  };

  const weapons = inventory.filter((i) => i.tipo === 'arma');

  return (
    <div className="space-y-6 animate-fadeIn pb-6">
      
      {/* SECTION 1: BÔNUS DE DANO & ACERTO */}
      <div className="bg-[var(--fundo2)] rounded-2xl p-4 sm:p-5 border border-[var(--bordadg)] space-y-4">
        <div className="flex items-center justify-between cursor-pointer select-none" onClick={() => setShowBonusSection(!showBonusSection)}>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <h3 className="font-cinzel text-sm sm:text-base font-bold text-[var(--ctexto1)]">
                Bônus de Dano & Acerto do Personagem
              </h3>
              <p className="text-xs text-[var(--ctexto2)]">
                Estes bônus serão pré-preenchidos automaticamente na Calculadora de Combate.
              </p>
            </div>
          </div>
          <button type="button" className="p-1 rounded-lg text-[var(--ctexto2)] hover:text-[var(--ctexto1)]">
            {showBonusSection ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>

        {showBonusSection && (
          <div className="space-y-5 pt-3 border-t border-[var(--bordadg)]">
            
            {/* 1. Bônus de dano dos atributos */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Bônus de dano dos atributos
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
                {[
                  { key: 'forca', label: 'Força' },
                  { key: 'destreza', label: 'Destreza' },
                  { key: 'inteligencia', label: 'Inteligência' },
                  { key: 'natureza', label: 'Natureza' },
                  { key: 'carisma', label: 'Carisma' },
                  { key: 'espiritualidade', label: 'Espiritualidade' },
                  { key: 'magia', label: 'Magia' }
                ].map(({ key, label }) => (
                  <div key={key} className="bg-[var(--fundo3)] p-2 rounded-xl border border-[var(--bordadg)] flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-[var(--ctexto2)] uppercase">{label}</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        max="200"
                        value={attrDmgBonuses[key as keyof typeof attrDmgBonuses] || 0}
                        onChange={(e) => handleAttrDmgBonusChange(key, Number(e.target.value))}
                        className="w-full bg-[var(--fundo1)] px-2 py-1 rounded-lg text-xs font-bold text-[var(--ctexto1)] border border-[var(--bordadg)] focus:outline-none focus:border-amber-500"
                      />
                      <span className="text-xs font-bold text-amber-400">%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bônus de Acerto Adicional */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-2 flex items-center gap-1.5">
                <Crosshair className="w-3.5 h-3.5" />
                Bônus de Acerto Adicional
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-2">
                {[
                  { key: 'contra', label: 'Contra-Ataque' },
                  { key: 'bloqueio', label: 'Bloqueio' },
                  { key: 'esquiva', label: 'Esquiva' },
                  { key: 'mental', label: 'Mental' },
                  { key: 'magico', label: 'Mágico' },
                  { key: 'elemental', label: 'Elemental' },
                  { key: 'espiritual', label: 'Espiritual' },
                  { key: 'convencimento', label: 'Convencimento' }
                ].map(({ key, label }) => (
                  <div key={key} className="bg-[var(--fundo3)] p-2 rounded-xl border border-[var(--bordadg)] flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-[var(--ctexto2)] uppercase truncate">{label}</label>
                    <input
                      type="number"
                      value={hitBonuses[key as keyof typeof hitBonuses] || 0}
                      onChange={(e) => handleHitBonusChange(key, Number(e.target.value))}
                      className="w-full bg-[var(--fundo1)] px-2 py-1 rounded-lg text-xs font-bold text-[var(--ctexto1)] border border-[var(--bordadg)] focus:outline-none focus:border-blue-500"
                    />
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>

      {/* SECTION 2: ARMAS */}
      <div className="bg-[var(--fundo2)] rounded-2xl p-4 sm:p-5 border border-[var(--bordadg)] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Swords className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <h3 className="font-cinzel text-sm sm:text-base font-bold text-[var(--ctexto1)]">
                Armas ({weapons.length})
              </h3>
              <p className="text-xs text-[var(--ctexto2)]">
                Cadastre as armas do personagem com aptidão %, material e bônus de forja.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleAddWeapon}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nova Arma</span>
          </button>
        </div>

        {weapons.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-[var(--bordadg)] rounded-xl text-xs text-[var(--ctexto2)]">
            Nenhuma arma cadastrada no inventário. Clique em "Nova Arma" para adicionar.
          </div>
        ) : (
          <div className="space-y-3">
            {weapons.map((arma) => (
              <div key={arma.id} className="bg-[var(--fundo3)] p-3.5 rounded-xl border border-[var(--bordadg)] space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                  
                  {/* Nome */}
                  <div className="sm:col-span-4">
                    <label className="text-[10px] font-bold text-[var(--ctexto2)] uppercase block mb-1">Nome da Arma</label>
                    <input
                      type="text"
                      value={arma.nome}
                      onChange={(e) => handleUpdateItem(arma.id, { nome: e.target.value })}
                      placeholder="Ex: Espada de Bronze Celestial"
                      className="w-full bg-[var(--fundo1)] px-2.5 py-1.5 rounded-lg text-xs font-bold text-[var(--ctexto1)] border border-[var(--bordadg)]"
                    />
                  </div>

                  {/* Aptidão % */}
                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-bold text-[var(--ctexto2)] uppercase block mb-1">Aptidão (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={arma.aptidao ?? 50}
                      onChange={(e) => handleUpdateItem(arma.id, { aptidao: Number(e.target.value) })}
                      className="w-full bg-[var(--fundo1)] px-2.5 py-1.5 rounded-lg text-xs font-bold text-[var(--ctexto1)] border border-[var(--bordadg)]"
                    />
                  </div>

                  {/* Material */}
                  <div className="sm:col-span-3">
                    <label className="text-[10px] font-bold text-[var(--ctexto2)] uppercase block mb-1">Material</label>
                    <select
                      value={arma.material || 'bronze_celestial'}
                      onChange={(e) => handleUpdateItem(arma.id, { material: e.target.value })}
                      className="w-full bg-[var(--fundo1)] px-2.5 py-1.5 rounded-lg text-xs text-[var(--ctexto1)] border border-[var(--bordadg)]"
                    >
                      <option value="custom">Outro (Personalizado)</option>
                      {Object.values(MATERIAIS_ARMA).map((mat) => (
                        <option key={mat.id} value={mat.id}>
                          {mat.nome} (MAT: {mat.mat})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Bônus de Forja (FB) */}
                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-bold text-[var(--ctexto2)] uppercase block mb-1">Bônus Forja (FB)</label>
                    <input
                      type="number"
                      min="0"
                      value={arma.bonusForja ?? 0}
                      onChange={(e) => handleUpdateItem(arma.id, { bonusForja: Number(e.target.value) })}
                      className="w-full bg-[var(--fundo1)] px-2.5 py-1.5 rounded-lg text-xs font-bold text-[var(--ctexto1)] border border-[var(--bordadg)]"
                    />
                  </div>

                  {/* Delete Button */}
                  <div className="sm:col-span-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(arma.id)}
                      title="Remover Arma"
                      className="p-2 text-[var(--ctexto2)] hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                </div>

                {/* Custom Material Fields if custom */}
                {arma.material === 'custom' && (
                  <div className="grid grid-cols-3 gap-2 bg-[var(--fundo1)] p-2 rounded-lg border border-[var(--bordadg)]">
                    <div>
                      <label className="text-[9px] font-bold text-[var(--ctexto2)] uppercase">Valor MAT</label>
                      <input
                        type="number"
                        min="0"
                        value={arma.materialCustom?.mat || 0}
                        onChange={(e) =>
                          handleUpdateItem(arma.id, {
                            materialCustom: { ...arma.materialCustom, mat: Number(e.target.value), bonus: arma.materialCustom?.bonus || 0, percentBonus: arma.materialCustom?.percentBonus || 0 }
                          })
                        }
                        className="w-full bg-[var(--fundo2)] px-2 py-1 rounded text-xs text-[var(--ctexto1)]"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-[var(--ctexto2)] uppercase">Bônus Fixo</label>
                      <input
                        type="number"
                        min="0"
                        value={arma.materialCustom?.bonus || 0}
                        onChange={(e) =>
                          handleUpdateItem(arma.id, {
                            materialCustom: { ...arma.materialCustom, bonus: Number(e.target.value), mat: arma.materialCustom?.mat || 0, percentBonus: arma.materialCustom?.percentBonus || 0 }
                          })
                        }
                        className="w-full bg-[var(--fundo2)] px-2 py-1 rounded text-xs text-[var(--ctexto1)]"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-[var(--ctexto2)] uppercase">% Bônus</label>
                      <input
                        type="number"
                        min="0"
                        value={arma.materialCustom?.percentBonus || 0}
                        onChange={(e) =>
                          handleUpdateItem(arma.id, {
                            materialCustom: { ...arma.materialCustom, percentBonus: Number(e.target.value), mat: arma.materialCustom?.mat || 0, bonus: arma.materialCustom?.bonus || 0 }
                          })
                        }
                        className="w-full bg-[var(--fundo2)] px-2 py-1 rounded text-xs text-[var(--ctexto1)]"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
