import Logger from '../utils/Logger.js';

/**
 * Singleton Gerenciador de Mundo Aberto (Open World Streaming).
 * Controla os pontos de spawn, transições bidirecionais e fades de câmera.
 */
class WorldManager {
  constructor() {
    if (WorldManager.instance) {
      return WorldManager.instance;
    }
    WorldManager.instance = this;
    
    this.currentZone = 'MenuScene';
    this.spawnPoint = null;
  }

  /**
   * Transiciona fluidamente entre mapas/cenas guardando o ponto de origem.
   * @param {Phaser.Scene} fromScene - Cena atual
   * @param {string} targetZoneKey - Chave da cena destino
   * @param {Object} spawnConfig - Coordenadas e direção {x, y, direction}
   */
  transitionTo(currentScene, targetSceneKey, spawnData = {}) {
    if (currentScene.isTransitioning) return;
    currentScene.isTransitioning = true;
    
    Logger.info('WorldManager', `Iniciando streaming de mapa: ${currentScene.scene.key} -> ${targetSceneKey}`);
    this.spawnPoint = spawnData;
    
    // Congelar controles da cena atual para evitar bugs e colisões repetidas
    if (currentScene.player && currentScene.player.body) {
      currentScene.player.body.setVelocity(0, 0);
    }
    if (currentScene.input && currentScene.input.keyboard) {
      currentScene.input.keyboard.enabled = false;
    }

    currentScene.cameras.main.fadeOut(300, 0, 0, 0);
    currentScene.time.delayedCall(320, () => {
      currentScene.scene.start(targetSceneKey, spawnData);
    });
  }

  /**
   * Consome o ponto de spawn agendado e o limpa.
   * @returns {Object|null}
   */
  getSpawn() {
    const sp = this.spawnPoint;
    this.spawnPoint = null; 
    return sp;
  }
}

const worldManagerInstance = new WorldManager();
export default worldManagerInstance;
