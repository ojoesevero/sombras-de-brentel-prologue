import Logger from './Logger.js';
import QuestManager from '../services/QuestManager.js';
import WorldManager from '../services/WorldManager.js';

/**
 * Módulo utilitário de atalhos de desenvolvedor (DevShortcuts).
 * Fornece binds de teclado rápidos para testes e diagnóstico:
 * - F1: Alterna visualização de hitboxes (Physics Debug).
 * - F2: Conclui todas as Quests.
 * - 1: Teletransporte para TavernScene.
 * - 2: Teletransporte para RastphenCityScene.
 * - 3: Teletransporte para TempleScene.
 * - 4: Teletransporte para ForestRouteScene.
 * - 5: Teletransporte para DungeonScene.
 */
export default class DevShortcuts {
  /**
   * Registra os atalhos de desenvolvedor na cena atual.
   * @param {Phaser.Scene} scene - A cena do Phaser ativa.
   */
  static register(scene) {
    if (!scene || !scene.input || !scene.input.keyboard) return;

    // F1 - Toggle Debug Physics
    const f1Key = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F1);
    f1Key.on('down', () => {
      if (scene.physics && scene.physics.world) {
        scene.physics.world.drawDebug = !scene.physics.world.drawDebug;
        if (!scene.physics.world.debugGraphic) {
          scene.physics.world.createDebugGraphic();
        }
        scene.physics.world.debugGraphic.setVisible(scene.physics.world.drawDebug);
        Logger.info('DevShortcuts', `Physics Debug: ${scene.physics.world.drawDebug ? 'ATIVADO' : 'DESATIVADO'}`);
      }
    });

    // F2 - Unlock / Complete All Quests
    const f2Key = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F2);
    f2Key.on('down', () => {
      Object.keys(QuestManager.quests).forEach(qKey => {
        QuestManager.quests[qKey].status = 'completed';
      });
      Logger.info('DevShortcuts', 'F2: Todas as Quests foram marcadas como COMPLETED.');
    });

    // Teclas Numéricas 1 a 5 - Teletransporte Rápido
    const key1 = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
    key1.on('down', () => {
      Logger.info('DevShortcuts', 'Teletransporte Dev -> TavernScene');
      WorldManager.transitionTo(scene, 'TavernScene', { x: 400, y: 500 });
    });

    const key2 = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);
    key2.on('down', () => {
      Logger.info('DevShortcuts', 'Teletransporte Dev -> RastphenCityScene (Pátio)');
      WorldManager.transitionTo(scene, 'RastphenCityScene', { x: 1200, y: 900 });
    });

    const key3 = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE);
    key3.on('down', () => {
      Logger.info('DevShortcuts', 'Teletransporte Dev -> TempleScene');
      WorldManager.transitionTo(scene, 'TempleScene', { x: 400, y: 500 });
    });

    const key4 = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.FOUR);
    key4.on('down', () => {
      Logger.info('DevShortcuts', 'Teletransporte Dev -> ForestRouteScene (Fazenda)');
      WorldManager.transitionTo(scene, 'ForestRouteScene', { x: 800, y: 100 });
    });

    const key5 = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.FIVE);
    key5.on('down', () => {
      Logger.info('DevShortcuts', 'Teletransporte Dev -> DungeonScene (Masmorra)');
      WorldManager.transitionTo(scene, 'DungeonScene', { x: 800, y: 150 });
    });
  }
}
