import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import SaveManager from '../src/services/SaveManager.js';
import InventoryManager from '../src/services/InventoryManager.js';
import QuestManager from '../src/services/QuestManager.js';

describe('SaveManager Unit Tests', () => {
  beforeEach(() => {
    SaveManager.clearSave();
    InventoryManager.gold = 100;
    InventoryManager.items = [
      { id: 'potion_heal', name: 'Poção de Vida', quantity: 3 },
      { id: 'dwarven_ale', name: 'Cerveja Anã', quantity: 1 }
    ];
    QuestManager.init({
      quest_01_flashback: { id: 'quest_01_flashback', title: 'Memórias de Estayler', status: 'completed' },
      quest_02_temple: { id: 'quest_02_temple', title: 'O Templo de Palmem', status: 'active' }
    });
  });

  it('deve salvar e carregar o estado completo do jogo com suporte a UTF-8 e acentuação', () => {
    const mockPlayer = {
      name: 'Rhogar Tordan (Draconato)',
      hp: 95,
      maxHp: 120,
      attack: 38,
      defense: 12,
      fury: 40,
      maxFury: 100,
      equippedWeapon: 'Espada Bastarda Serrilhada',
      checkpoint: 'DungeonScene',
      currentScene: 'DungeonScene',
      x: 800,
      y: 600
    };

    const saved = SaveManager.saveGame(mockPlayer);
    assert.equal(saved, true);
    assert.equal(SaveManager.hasSave(), true);

    const loaded = SaveManager.loadGame();
    assert.ok(loaded);
    assert.equal(loaded.player.name, 'Rhogar Tordan (Draconato)');
    assert.equal(loaded.player.hp, 95);
    assert.equal(loaded.player.attack, 38);
    assert.equal(loaded.player.defense, 12);
    assert.equal(loaded.player.fury, 40);
    assert.equal(loaded.player.equippedWeapon, 'Espada Bastarda Serrilhada');
    assert.equal(loaded.player.checkpoint, 'DungeonScene');
    assert.equal(loaded.player.scene, 'DungeonScene');
    assert.equal(loaded.player.x, 800);
    assert.equal(loaded.player.y, 600);

    // Validação de inventário persistido
    assert.equal(loaded.inventory.gold, 100);
    assert.equal(loaded.inventory.items.length, 2);
    assert.equal(loaded.inventory.items[0].id, 'potion_heal');
    assert.equal(loaded.inventory.items[0].quantity, 3);

    // Validação de quests persistidas
    assert.equal(loaded.quests.quest_01_flashback.status, 'completed');
    assert.equal(loaded.quests.quest_02_temple.status, 'active');
  });

  it('deve construir payload com valores padrão caso o player seja omitido', () => {
    const payload = SaveManager.buildSavePayload(null);
    assert.equal(payload.player, null);
    assert.equal(payload.inventory.gold, 100);
    assert.ok(payload.quests);
    assert.ok(payload.savedAt);
  });

  it('deve limpar dados salvos corretamente ao chamar clearSave', () => {
    SaveManager.saveGame({ name: 'Rhogar', hp: 100 });
    assert.equal(SaveManager.hasSave(), true);

    SaveManager.clearSave();
    assert.equal(SaveManager.hasSave(), false);
    assert.equal(SaveManager.loadGame(), null);
  });
});
