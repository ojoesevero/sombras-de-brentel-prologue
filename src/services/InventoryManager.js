import Logger from '../utils/Logger.js';

/**
 * Gerenciador Singleton de Inventário e Moedas.
 */
class InventoryManager {
  constructor() {
    if (InventoryManager.instance) {
      return InventoryManager.instance;
    }
    InventoryManager.instance = this;
    
    this.gold = 10;
    this.items = [];
    
    this.itemDatabase = {
      potion_heal: { id: 'potion_heal', name: 'Poção de Vida', type: 'consumable', value: 20, icon: '🧪', effectDesc: '+50 HP', category: 'Poções' },
      potion_large: { id: 'potion_large', name: 'Poção Grande de Cura', type: 'consumable', value: 45, icon: '🍷', effectDesc: '+100 HP', category: 'Poções' },
      dwarven_ale: { id: 'dwarven_ale', name: 'Cerveja Anã', type: 'consumable', value: 15, icon: '🍺', effectDesc: '+30 Fúria', category: 'Bebidas' },
      fury_elixir: { id: 'fury_elixir', name: 'Elixir Dracônico', type: 'consumable', value: 40, icon: '🔥', effectDesc: '+50 Fúria', category: 'Poções' },
      manto_elfico: { id: 'manto_elfico', name: 'Manto Élfico de Yanil', type: 'equipment', value: 75, icon: '🧣', effectDesc: '+4 Defesa Permanente', category: 'Equipamentos' },
      pergaminho_trovao: { id: 'pergaminho_trovao', name: 'Pergaminho do Trovão', type: 'scroll', value: 50, icon: '📜', effectDesc: 'Libera faíscas arcanas (+15 ATQ)', category: 'Pergaminhos' },
      seda_walldarten: { id: 'seda_walldarten', name: 'Seda Rara de Walldarten', type: 'lore', value: 60, icon: '🧵', effectDesc: 'Tecido lendário de mercenários (Cap. 7)', category: 'Itens de Lore' },
      amuleto_brentel: { id: 'amuleto_brentel', name: 'Amuleto Protetor de Brentel', type: 'equipment', value: 90, icon: '🛡️', effectDesc: '+30 Max HP e +2 DEF', category: 'Equipamentos' }
    };
  }

  addItem(itemId, quantity = 1) {
    let existingItem = this.items.find(i => i.id === itemId);
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      const baseItem = this.itemDatabase[itemId];
      if (baseItem) {
        this.items.push({ ...baseItem, quantity });
      }
    }
    Logger.info('InventoryManager', `Item adicionado: ${itemId} x${quantity}`);
  }

  removeItem(itemId, quantity = 1) {
    let existingItem = this.items.find(i => i.id === itemId);
    if (existingItem && existingItem.quantity >= quantity) {
      existingItem.quantity -= quantity;
      if (existingItem.quantity <= 0) {
        this.items = this.items.filter(i => i.id !== itemId);
      }
      return true;
    }
    return false;
  }

  useItem(itemId, target) {
    if (!target) return false;
    const baseItem = this.itemDatabase[itemId] || this.items.find(i => i.id === itemId);
    if (!baseItem) return false;

    if (this.removeItem(itemId, 1)) {
      if (itemId === 'potion_heal') {
        target.hp = Math.min(target.hp + 50, target.maxHp || 120);
        Logger.info('InventoryManager', 'Poção de Vida usada. +50 HP');
      } else if (itemId === 'potion_large') {
        target.hp = Math.min(target.hp + 100, target.maxHp || 120);
        Logger.info('InventoryManager', 'Poção Grande usada. +100 HP');
      } else if (itemId === 'dwarven_ale') {
        if (typeof target.consumeBeer === 'function') {
          target.consumeBeer();
        } else {
          target.fury = Math.min((target.fury || 0) + 30, target.maxFury || 100);
          Logger.info('InventoryManager', 'Cerveja Anã usada. +30 Fúria');
        }
      } else if (itemId === 'fury_elixir') {
        target.fury = Math.min((target.fury || 0) + 50, target.maxFury || 100);
        Logger.info('InventoryManager', 'Elixir Dracônico usado. +50 Fúria');
      } else if (itemId === 'manto_elfico') {
        target.defense = (target.defense || 0) + 4;
        Logger.info('InventoryManager', 'Manto Élfico equipado. +4 Defesa');
      } else if (itemId === 'amuleto_brentel') {
        target.maxHp = (target.maxHp || 120) + 30;
        target.hp = Math.min((target.hp || 120) + 30, target.maxHp);
        target.defense = (target.defense || 0) + 2;
        Logger.info('InventoryManager', 'Amuleto Protetor de Brentel equipado. +30 Max HP, +2 DEF');
      } else if (itemId === 'pergaminho_trovao') {
        target.attack = (target.attack || 18) + 15;
        Logger.info('InventoryManager', 'Pergaminho do Trovão ativado. +15 Ataque');
      } else if (itemId === 'seda_walldarten') {
        Logger.info('InventoryManager', 'Seda Rara de Walldarten inspecionada. (Item de Lore)');
      }
      return true;
    }
    return false;
  }

  /**
   * Verifica se o jogador possui o item especificado no inventário.
   * @param {string} itemId 
   * @returns {boolean}
   */
  hasItem(itemId) {
    const item = this.items.find(i => i.id === itemId);
    return !!(item && item.quantity > 0);
  }

  /**
   * Retorna os dados do item no inventário ou null se ausente.
   * @param {string} itemId 
   * @returns {Object|null}
   */
  getItem(itemId) {
    return this.items.find(i => i.id === itemId) || null;
  }

  /**
   * Retorna a quantidade total possuída de um item.
   * @param {string} itemId 
   * @returns {number}
   */
  getItemCount(itemId) {
    const item = this.getItem(itemId);
    return item ? item.quantity : 0;
  }

  /**
   * Retorna lista de itens filtrados por categoria ou tipo.
   * @param {string} category 
   * @returns {Array<Object>}
   */
  getItemsByCategory(category) {
    if (!category || category === 'Todos') return this.items;
    return this.items.filter(i => (i.category === category || i.type === category));
  }

  /**
   * Adiciona moedas de ouro ao inventário.
   * @param {number} amount 
   */
  addGold(amount = 0) {
    this.gold = Math.max(0, this.gold + amount);
    Logger.info('InventoryManager', `Ouro adicionado: +${amount} (Total: ${this.gold})`);
  }

  /**
   * Remove moedas de ouro do inventário se saldo for suficiente.
   * @param {number} amount 
   * @returns {boolean}
   */
  removeGold(amount = 0) {
    if (this.gold >= amount) {
      this.gold -= amount;
      Logger.info('InventoryManager', `Ouro debitado: -${amount} (Total: ${this.gold})`);
      return true;
    }
    return false;
  }

  saveToStorage() {
    return { gold: this.gold, items: this.items };
  }

  loadFromStorage(data) {
    if (data) {
      this.gold = data.gold !== undefined ? data.gold : 10;
      this.items = data.items || [];
    }
  }

  /**
   * Reseta o inventário para novo jogo (vazio).
   */
  reset() {
    this.gold = 10;
    this.items = [];
    Logger.info('InventoryManager', 'Inventário resetado para novo jogo (vazio).');
  }
}

const inventoryManagerInstance = new InventoryManager();
export default inventoryManagerInstance;
