import Logger from '../utils/Logger.js';

/**
 * Gerenciador Singleton de Conquistas (Achievements).
 * Gerencia o desbloqueio, persistência e disparo de notificações de marcos do jogador.
 * @module AchievementManager
 */
class AchievementManager {
  constructor() {
    if (AchievementManager.instance) {
      return AchievementManager.instance;
    }
    AchievementManager.instance = this;

    this.achievements = {
      ach_drunk: {
        id: 'ach_drunk',
        title: 'Por Onde Andei',
        description: 'Atingiu o estado de embriaguez profunda na taverna.',
        icon: '💫',
        unlocked: false,
        unlockedAt: null
      },
      ach_free_beer: {
        id: 'ach_free_beer',
        title: 'Cliente Persistente',
        description: 'Ganhou uma Cerveja Anã de graça após insistir com a garçonete.',
        icon: '🍺',
        unlocked: false,
        unlockedAt: null
      },
      ach_gunther_potion: {
        id: 'ach_gunther_potion',
        title: 'Visita Fraterna',
        description: 'Visitou Gunther na Ala Norte do Templo e recebeu sua Poção de Vida.',
        icon: '🧪',
        unlocked: false,
        unlockedAt: null
      }
    };
  }

  /**
   * Desbloqueia uma conquista por ID e emite evento global caso recém-desbloqueada.
   * @param {string} achievementId - Chave da conquista.
   * @param {Phaser.Game|Phaser.Scene} [gameOrScene] - Contexto de eventos do Phaser.
   * @returns {Object|null}
   */
  unlock(achievementId, gameOrScene = null) {
    const ach = this.achievements[achievementId];
    if (!ach) {
      Logger.warn('AchievementManager', `Conquista inexistente: ${achievementId}`);
      return null;
    }

    if (ach.unlocked) {
      return ach; // Já desbloqueada anteriormente
    }

    ach.unlocked = true;
    ach.unlockedAt = new Date().toISOString();
    Logger.info('AchievementManager', `★ CONQUISTA DESBLOQUEADA: [${ach.title}] - ${ach.description}`);

    const emitter = gameOrScene?.events || (gameOrScene?.game ? gameOrScene.game.events : null);
    if (emitter && typeof emitter.emit === 'function') {
      emitter.emit('achievementUnlocked', { ...ach });
    }

    return ach;
  }

  /**
   * Verifica se uma conquista já foi desbloqueada.
   * @param {string} achievementId 
   * @returns {boolean}
   */
  isUnlocked(achievementId) {
    return !!(this.achievements[achievementId] && this.achievements[achievementId].unlocked);
  }

  /**
   * Retorna a lista de todas as conquistas cadastradas.
   * @returns {Array<Object>}
   */
  getAchievements() {
    return Object.values(this.achievements);
  }

  /**
   * Retorna a lista de conquistas já desbloqueadas.
   * @returns {Array<Object>}
   */
  getUnlockedAchievements() {
    return Object.values(this.achievements).filter(a => a.unlocked);
  }

  /**
   * Serializa as conquistas para persistência.
   * @returns {Array<Object>}
   */
  saveToStorage() {
    return Object.values(this.achievements).map(a => ({
      id: a.id,
      unlocked: a.unlocked,
      unlockedAt: a.unlockedAt
    }));
  }

  /**
   * Restaura o estado salvo das conquistas.
   * @param {Array<Object>} data 
   */
  loadFromStorage(data) {
    if (Array.isArray(data)) {
      data.forEach(savedAch => {
        if (savedAch && savedAch.id && this.achievements[savedAch.id]) {
          this.achievements[savedAch.id].unlocked = !!savedAch.unlocked;
          this.achievements[savedAch.id].unlockedAt = savedAch.unlockedAt || null;
        }
      });
    }
  }

  /**
   * Reseta todas as conquistas para novo jogo.
   */
  reset() {
    Object.values(this.achievements).forEach(a => {
      a.unlocked = false;
      a.unlockedAt = null;
    });
  }
}

const achievementManagerInstance = new AchievementManager();
export default achievementManagerInstance;
