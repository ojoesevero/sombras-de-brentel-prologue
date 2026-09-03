import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import InventoryManager from '../src/services/InventoryManager.js';

describe('InventoryManager Unit Tests', () => {
  beforeEach(() => {
    InventoryManager.gold = 50;
    InventoryManager.items = [];
  });

  it('deve adicionar novos itens e acumular quantidades existentes', () => {
    InventoryManager.addItem('potion_heal', 2);
    assert.equal(InventoryManager.items.length, 1);
    assert.equal(InventoryManager.items[0].id, 'potion_heal');
    assert.equal(InventoryManager.items[0].quantity, 2);

    InventoryManager.addItem('potion_heal', 3);
    assert.equal(InventoryManager.items.length, 1);
    assert.equal(InventoryManager.items[0].quantity, 5);

    InventoryManager.addItem('dwarven_ale', 1);
    assert.equal(InventoryManager.items.length, 2);
  });

  it('deve remover itens e expurgar do array quando a quantidade chegar a zero', () => {
    InventoryManager.addItem('potion_heal', 3);
    
    const removedTwo = InventoryManager.removeItem('potion_heal', 2);
    assert.equal(removedTwo, true);
    assert.equal(InventoryManager.items[0].quantity, 1);

    const removedLast = InventoryManager.removeItem('potion_heal', 1);
    assert.equal(removedLast, true);
    assert.equal(InventoryManager.items.length, 0);

    const failedRemoval = InventoryManager.removeItem('potion_heal', 1);
    assert.equal(failedRemoval, false);
  });

  it('deve consumir poção de cura e restaurar o HP do alvo respeitando o maxHp', () => {
    InventoryManager.addItem('potion_heal', 1);
    const mockPlayer = {
      name: 'Rhogar',
      hp: 60,
      maxHp: 100,
      fury: 10
    };

    const used = InventoryManager.useItem('potion_heal', mockPlayer);
    assert.equal(used, true);
    assert.equal(mockPlayer.hp, 100); // 60 + 50 = 110, capped at maxHp 100
    assert.equal(InventoryManager.items.length, 0);
  });

  it('deve consumir cerveja anã e aumentar a fúria do alvo respeitando o limite de 100', () => {
    InventoryManager.addItem('dwarven_ale', 1);
    const mockPlayer = {
      name: 'Rhogar',
      hp: 100,
      maxHp: 100,
      fury: 80
    };

    const used = InventoryManager.useItem('dwarven_ale', mockPlayer);
    assert.equal(used, true);
    assert.equal(mockPlayer.fury, 100); // 80 + 30 = 110, capped at 100
    assert.equal(InventoryManager.items.length, 0);
  });

  it('deve equipar manto élfico e aumentar a defesa permanente do alvo', () => {
    InventoryManager.addItem('manto_elfico', 1);
    const mockPlayer = {
      name: 'Rhogar',
      defense: 8
    };

    const used = InventoryManager.useItem('manto_elfico', mockPlayer);
    assert.equal(used, true);
    assert.equal(mockPlayer.defense, 12);
    assert.equal(InventoryManager.items.length, 0);
  });

  it('deve usar pergaminho do trovão e poção grande de cura', () => {
    InventoryManager.addItem('pergaminho_trovao', 1);
    InventoryManager.addItem('potion_large', 1);
    const mockPlayer = {
      name: 'Rhogar',
      attack: 18,
      hp: 10,
      maxHp: 150
    };

    InventoryManager.useItem('pergaminho_trovao', mockPlayer);
    assert.equal(mockPlayer.attack, 33); // 18 + 15

    InventoryManager.useItem('potion_large', mockPlayer);
    assert.equal(mockPlayer.hp, 110); // 10 + 100
  });

  it('deve consultar itens com hasItem, getItem e getItemCount', () => {
    assert.equal(InventoryManager.hasItem('seda_walldarten'), false);
    assert.equal(InventoryManager.getItemCount('seda_walldarten'), 0);
    assert.equal(InventoryManager.getItem('seda_walldarten'), null);

    InventoryManager.addItem('seda_walldarten', 3);
    assert.equal(InventoryManager.hasItem('seda_walldarten'), true);
    assert.equal(InventoryManager.getItemCount('seda_walldarten'), 3);
    assert.equal(InventoryManager.getItem('seda_walldarten').name, 'Seda Rara de Walldarten');

    const loreItems = InventoryManager.getItemsByCategory('Itens de Lore');
    assert.equal(loreItems.length, 1);
    assert.equal(loreItems[0].id, 'seda_walldarten');
  });

  it('deve persistir e restaurar o estado de ouro e itens', () => {
    InventoryManager.gold = 150;
    InventoryManager.addItem('potion_heal', 2);

    const saved = InventoryManager.saveToStorage();
    assert.equal(saved.gold, 150);
    assert.equal(saved.items.length, 1);

    InventoryManager.gold = 0;
    InventoryManager.items = [];

    InventoryManager.loadFromStorage(saved);
    assert.equal(InventoryManager.gold, 150);
    assert.equal(InventoryManager.items.length, 1);
    assert.equal(InventoryManager.items[0].id, 'potion_heal');
  });

  it('deve resetar o inventário deixando-o vazio e com ouro base', () => {
    InventoryManager.gold = 200;
    InventoryManager.addItem('potion_heal', 5);
    InventoryManager.reset();

    assert.equal(InventoryManager.gold, 10);
    assert.equal(InventoryManager.items.length, 0);
  });
});
