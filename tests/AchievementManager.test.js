import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import AchievementManager from '../src/services/AchievementManager.js';

describe('AchievementManager Unit Tests', () => {
  beforeEach(() => {
    AchievementManager.reset();
  });

  it('deve inicializar com o catálogo correto de conquistas bloqueadas', () => {
    const list = AchievementManager.getAchievements();
    assert.equal(list.length, 3);
    assert.equal(AchievementManager.isUnlocked('ach_drunk'), false);
    assert.equal(AchievementManager.isUnlocked('ach_free_beer'), false);
    assert.equal(AchievementManager.isUnlocked('ach_gunther_potion'), false);
  });

  it('deve desbloquear uma conquista e disparar o evento no contexto do jogo', () => {
    let emittedEvent = null;
    let emittedPayload = null;

    const mockGame = {
      events: {
        emit: (evt, payload) => {
          emittedEvent = evt;
          emittedPayload = payload;
        }
      }
    };

    const ach = AchievementManager.unlock('ach_free_beer', mockGame);
    assert.ok(ach);
    assert.equal(ach.unlocked, true);
    assert.equal(ach.title, 'Cliente Persistente');
    assert.equal(AchievementManager.isUnlocked('ach_free_beer'), true);
    assert.equal(emittedEvent, 'achievementUnlocked');
    assert.equal(emittedPayload.id, 'ach_free_beer');
    assert.equal(emittedPayload.title, 'Cliente Persistente');
  });

  it('não deve disparar evento duplicado caso a conquista já tenha sido desbloqueada', () => {
    let emitCount = 0;
    const mockGame = {
      events: {
        emit: () => {
          emitCount++;
        }
      }
    };

    AchievementManager.unlock('ach_drunk', mockGame);
    assert.equal(emitCount, 1);

    // Segunda tentativa de desbloqueio
    AchievementManager.unlock('ach_drunk', mockGame);
    assert.equal(emitCount, 1);
  });

  it('deve listar corretamente as conquistas desbloqueadas', () => {
    AchievementManager.unlock('ach_drunk');
    AchievementManager.unlock('ach_gunther_potion');

    const unlocked = AchievementManager.getUnlockedAchievements();
    assert.equal(unlocked.length, 2);
    assert.equal(unlocked.some(a => a.id === 'ach_drunk'), true);
    assert.equal(unlocked.some(a => a.id === 'ach_gunther_potion'), true);
    assert.equal(unlocked.some(a => a.id === 'ach_free_beer'), false);
  });

  it('deve persistir e restaurar o estado das conquistas via saveToStorage e loadFromStorage', () => {
    AchievementManager.unlock('ach_free_beer');
    const saved = AchievementManager.saveToStorage();

    AchievementManager.reset();
    assert.equal(AchievementManager.isUnlocked('ach_free_beer'), false);

    AchievementManager.loadFromStorage(saved);
    assert.equal(AchievementManager.isUnlocked('ach_free_beer'), true);
  });
});
