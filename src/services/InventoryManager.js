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
    
    this.gold = 50;
    this.items = [];
    
    this.itemDatabase = {
      potion_heal: { id: 'potion_heal', name: 'Poção de Vida', type: 'consumable', value: 20, effectDesc: '+50 HP' },
      dwarven_ale: { id: 'dwarven_ale', name: 'Cerveja Anã', type: 'consumable', value: 15, effectDesc: '+30 Fúria' }
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
    if (this.removeItem(itemId, 1)) {
      if (itemId === 'potion_heal') {
        target.hp = Math.min(target.hp + 50, target.maxHp);
        Logger.info('InventoryManager', 'Poção de Vida usada. +50 HP');
      } else if (itemId === 'dwarven_ale') {
        target.fury = Math.min(target.fury + 30, 100);
        Logger.info('InventoryManager', 'Cerveja Anã usada. +30 Fúria');
      }
      return true;
    }
    return false;
  }

  saveToStorage() {
    return { gold: this.gold, items: this.items };
  }

  loadFromStorage(data) {
    if (data) {
      this.gold = data.gold !== undefined ? data.gold : 50;
      this.items = data.items || [];
    }
  }
}

const inventoryManagerInstance = new InventoryManager();
export default inventoryManagerInstance;
