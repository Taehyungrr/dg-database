import React, { useState } from 'react';
import { FichaPersonagem, ItemInventario, BonusExtraDano } from '../types';
import { MATERIAIS_ARMA } from '../data/combatData';
import { 
  Shield, 
  Swords, 
  Plus, 
  Trash2, 
  Zap, 
  Sparkles, 
  Crosshair, 
  Package, 
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
  const [newExtraBonusVal, setNewExtraBonusVal] = useState<number>(10);
  const [newExtraBonusDesc, setNewExtraBonusDesc] = useState<string>('');

  // Get current inventory & combat bonuses
  const inventory = formData.inventario || [];
  const combatBonuses = formData.bonus_combate || {};
  const attrDmgBonuses = combatBonuses.bonusDanoAtributos || {};
  const extraDmgBonuses = combatBonuses.bonusDanoExtras || [];
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

  // Handler to add an Extra Damage Bonus Tag
  const handleAddExtraDmgBonus = () => {
    if (newExtraBonusVal <= 0) return;
    const newBonus: BonusExtraDano = {
      id: `extra_dmg_${Date.now()}`,
      valor: newExtraBonusVal,
      descricao: newExtraBonusDesc.trim() || 'Bônus de Poder'
    };
    setFormData((prev) => ({
      ...prev,
      bonus_combate: {
        ...prev.bonus_combate,
        bonusDanoExtras: [...(prev.bonus_combate?.bonusDanoExtras || []), newBonus]
      }
    }));
    setNewExtraBonusDesc('');
  };

  // Handler to remove Extra Damage Bonus
  const handleRemoveExtraDmgBonus = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      bonus_combate: {
        ...prev.bonus_combate,
        bonusDanoExtras: (prev.bonus_combate?.bonusDanoExtras || []).filter((b) => b.id !== id)
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
  const handleAddItem = (tipo: 'arma' | 'armadura' | 'acessorio') => {
    const newItem: ItemInventario = {
      id: `item_${Date.now()}`,
      nome: tipo === 'arma' ? 'Nova Arma' : tipo === 'armadura' ? 'Nova Armadura' : 'Novo Acessório',
      tipo,
      aptidao: tipo === 'arma' ? 50 : undefined,
      material: tipo === 'arma' ? 'bronze_celestial' : undefined,
      bonusForja: tipo === 'arma' ? 0 : undefined,
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
  const armors = inventory.filter((i) => i.tipo === 'armadura');
  const accessories = inventory.filter((i) => i.tipo === 'acessorio');

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
            
            {/* 1. Bônus % de Atributo no Dano */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Bônus de Atributos no Dano (%)
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

            {/* 2. Bônus Extras de Dano (Multiplicadores) */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400 mb-2 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                Bônus Extras de Dano Multiplicador (%)
              </h4>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {extraDmgBonuses.map((b) => (
                  <div key={b.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-bold">
                    <span>+{b.valor}%</span>
                    <span className="text-[10px] opacity-80">({b.descricao})</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveExtraDmgBonus(b.id)}
                      className="hover:text-rose-400 cursor-pointer ml-1"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {extraDmgBonuses.length === 0 && (
                  <span className="text-xs italic text-[var(--ctexto2)]">Nenhum bônus extra cadastrado.</span>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2 bg-[var(--fundo3)] p-2.5 rounded-xl border border-[var(--bordadg)]">
                <input
                  type="number"
                  min="1"
                  max="500"
                  placeholder="Valor %"
                  value={newExtraBonusVal || ''}
                  onChange={(e) => setNewExtraBonusVal(Number(e.target.value))}
                  className="w-full sm:w-28 bg-[var(--fundo1)] px-2.5 py-1.5 rounded-lg text-xs font-bold text-[var(--ctexto1)] border border-[var(--bordadg)]"
                />
                <input
                  type="text"
                  placeholder="Descrição (ex: Bênção de Macária, Poder Especial)"
                  value={newExtraBonusDesc}
                  onChange={(e) => setNewExtraBonusDesc(e.target.value)}
                  className="w-full flex-1 bg-[var(--fundo1)] px-2.5 py-1.5 rounded-lg text-xs text-[var(--ctexto1)] border border-[var(--bordadg)]"
                />
                <button
                  type="button"
                  onClick={handleAddExtraDmgBonus}
                  className="w-full sm:w-auto px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar</span>
                </button>
              </div>
            </div>

            {/* 3. Bônus de Acerto Fixo */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-2 flex items-center gap-1.5">
                <Crosshair className="w-3.5 h-3.5" />
                Bônus de Acerto Adicional
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                {[
                  { key: 'desarmado', label: 'Desarmado' },
                  { key: 'armas', label: 'Armas' },
                  { key: 'esquiva', label: 'Esquiva' },
                  { key: 'bloqueio', label: 'Bloqueio' },
                  { key: 'contra', label: 'Contra-Ataque' },
                  { key: 'magico', label: 'Mágico' },
                  { key: 'elemental', label: 'Elemental' },
                  { key: 'espiritual', label: 'Espiritual' },
                  { key: 'mental', label: 'Mental' },
                  { key: 'convencimento', label: 'Convencimento' },
                  { key: 'resistencia', label: 'Resistência' }
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
            onClick={() => handleAddItem('arma')}
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
                      className="w-full bg-[var(--fundo1)] px-2 py-1.5 rounded-lg text-xs font-bold text-[var(--ctexto1)] border border-[var(--bordadg)]"
                    />
                  </div>

                  {/* Material */}
                  <div className="sm:col-span-3">
                    <label className="text-[10px] font-bold text-[var(--ctexto2)] uppercase block mb-1">Material</label>
                    <select
                      value={arma.material || 'bronze_celestial'}
                      onChange={(e) => handleUpdateItem(arma.id, { material: e.target.value })}
                      className="w-full bg-[var(--fundo1)] px-2 py-1.5 rounded-lg text-xs text-[var(--ctexto1)] border border-[var(--bordadg)]"
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
                      className="w-full bg-[var(--fundo1)] px-2 py-1.5 rounded-lg text-xs font-bold text-[var(--ctexto1)] border border-[var(--bordadg)]"
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

      {/* SECTION 3: ARMADURAS & ACESSÓRIOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Armaduras */}
        <div className="bg-[var(--fundo2)] rounded-2xl p-4 border border-[var(--bordadg)] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
              <h3 className="font-cinzel text-xs sm:text-sm font-bold text-[var(--ctexto1)]">
                Armaduras ({armors.length})
              </h3>
            </div>
            <button
              type="button"
              onClick={() => handleAddItem('armadura')}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              <span>Adicionar</span>
            </button>
          </div>

          {armors.length === 0 ? (
            <p className="text-xs italic text-[var(--ctexto2)] py-2">Nenhuma armadura registrada.</p>
          ) : (
            <div className="space-y-2">
              {armors.map((arm) => (
                <div key={arm.id} className="bg-[var(--fundo3)] p-2.5 rounded-xl border border-[var(--bordadg)] space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      value={arm.nome}
                      onChange={(e) => handleUpdateItem(arm.id, { nome: e.target.value })}
                      placeholder="Nome da Armadura"
                      className="flex-1 bg-[var(--fundo1)] px-2 py-1 rounded-lg text-xs font-bold text-[var(--ctexto1)] border border-[var(--bordadg)]"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(arm.id)}
                      className="p-1 text-[var(--ctexto2)] hover:text-rose-400 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={arm.descricao || ''}
                    onChange={(e) => handleUpdateItem(arm.id, { descricao: e.target.value })}
                    placeholder="Descrição / Bônus da Armadura (ex: +20% Defesa Mágica)"
                    className="w-full bg-[var(--fundo1)] px-2 py-1 rounded-lg text-[11px] text-[var(--ctexto1)] border border-[var(--bordadg)]"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Acessórios */}
        <div className="bg-[var(--fundo2)] rounded-2xl p-4 border border-[var(--bordadg)] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-400 shrink-0" />
              <h3 className="font-cinzel text-xs sm:text-sm font-bold text-[var(--ctexto1)]">
                Acessórios ({accessories.length})
              </h3>
            </div>
            <button
              type="button"
              onClick={() => handleAddItem('acessorio')}
              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              <span>Adicionar</span>
            </button>
          </div>

          {accessories.length === 0 ? (
            <p className="text-xs italic text-[var(--ctexto2)] py-2">Nenhum acessório registrado.</p>
          ) : (
            <div className="space-y-2">
              {accessories.map((acc) => (
                <div key={acc.id} className="bg-[var(--fundo3)] p-2.5 rounded-xl border border-[var(--bordadg)] space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      value={acc.nome}
                      onChange={(e) => handleUpdateItem(acc.id, { nome: e.target.value })}
                      placeholder="Nome do Acessório"
                      className="flex-1 bg-[var(--fundo1)] px-2 py-1 rounded-lg text-xs font-bold text-[var(--ctexto1)] border border-[var(--bordadg)]"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(acc.id)}
                      className="p-1 text-[var(--ctexto2)] hover:text-rose-400 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={acc.descricao || ''}
                    onChange={(e) => handleUpdateItem(acc.id, { descricao: e.target.value })}
                    placeholder="Descrição / Efeito (ex: +10% Dano Mágico, Amuleto de Proteção)"
                    className="w-full bg-[var(--fundo1)] px-2 py-1 rounded-lg text-[11px] text-[var(--ctexto1)] border border-[var(--bordadg)]"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
