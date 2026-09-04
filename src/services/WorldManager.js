import Phaser from 'phaser';
import Logger from '../utils/Logger.js';
import QuestManager from './QuestManager.js';
import { PlayerState } from '../entities/Player.js';

/**
 * Singleton Gerenciador de Mundo Aberto (Open World Streaming).
 * Controla os pontos de spawn, transições bidirecionais, geração data-driven de portais e fades de câmera.
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
   * Realiza a transição segura entre cenas com fade-out e cleanup.
   * Suporta cena intermediária de transição de ato narrativo (ActTransitionScene).
   * @param {Phaser.Scene} currentScene 
   * @param {string} targetSceneKey 
   * @param {object} spawnData 
   * @param {object} [actTransition]
   */
  transitionTo(currentScene, targetSceneKey, spawnData = {}, actTransition = null) {
    if (!currentScene || !currentScene.scene) return;
    if (currentScene._fadeRunning) return;
    currentScene._fadeRunning = true;
    currentScene.sound.play('sfx_env_portal', { volume: 0.4 });

    // Se o player possuir FSM, trava em TRANSITIONING
    if (currentScene.player) {
      if (typeof currentScene.player.setState === 'function') {
        currentScene.player.setState(PlayerState.TRANSITIONING);
      } else if (currentScene.player.body) {
        currentScene.player.body.setVelocity(0, 0);
      }
    }

    Logger.info('WorldManager', `Transicionando: ${currentScene.scene.key} -> ${targetSceneKey}`, { spawnData, actTransition });

    currentScene.cameras.main.fadeOut(250, 0, 0, 0);
    currentScene.time.delayedCall(270, () => {
      currentScene._fadeRunning = false;
      if (actTransition) {
        currentScene.scene.start('ActIntroScene', {
          ...actTransition,
          nextScene: targetSceneKey,
          spawnData: spawnData
        });
      } else {
        currentScene.scene.start(targetSceneKey, spawnData);
      }
    });
  }

  /**
   * Constrói e instancia automaticamente as transições/portais para a cena informada
   * com base no arquivo public/data/map_transitions.json.
   * @param {Phaser.Scene} scene - A cena do Phaser ativa
   * @returns {Phaser.Physics.Arcade.StaticGroup} Grupo contendo os triggers criados
   */
  buildTransitions(scene) {
    if (!scene || !scene.scene) return null;
    const sceneKey = scene.scene.key;
    const allTransitions = scene.cache.json.get('map_transitions');
    if (!allTransitions || !allTransitions[sceneKey]) {
      Logger.debug('WorldManager', `Nenhuma transição declarada para ${sceneKey}`);
      return null;
    }

    const transitionsList = allTransitions[sceneKey];
    const triggerGroup = scene.physics.add.staticGroup();

    transitionsList.forEach(tData => {
      const color = parseInt(tData.color || '0x27ae60', 16);
      const rect = scene.add.rectangle(tData.x, tData.y, tData.w, tData.h, color, 0.6).setDepth(1);
      scene.physics.add.existing(rect, true);
      triggerGroup.add(rect);

      // Overlap do player com o trigger
      if (scene.player) {
        scene.physics.add.overlap(scene.player, rect, () => {
          // Checagem de FSM
          if (scene.player.canInteract && !scene.player.canInteract()) {
            return;
          }

          // Checagem de Requisitos de Quest
          if (tData.requiredQuest) {
            const isCompleted = QuestManager.isQuestCompleted(tData.requiredQuest) ||
                                QuestManager.getQuestStatus(tData.requiredQuest) === 'completed' ||
                                (window.gameState && window.gameState.flags && window.gameState.flags.talkedToPriestess);

            if (!isCompleted) {
              // Empurrar o player para longe do trigger
              if (scene.player && scene.player.body) {
                scene.player.setState(PlayerState.TRANSITIONING);
                if (tData.pushY !== undefined) {
                  scene.player.y += tData.pushY;
                } else {
                  scene.player.y += (scene.player.y < tData.y ? -20 : 20);
                }
                scene.player.body.setVelocity(0, 0);

                scene.game.events.once('dialogueClosed', () => {
                  if (scene.player && scene.player.state === PlayerState.TRANSITIONING) {
                    scene.player.setState(PlayerState.IDLE);
                  }
                });
              }

              // Carregar pensamento de bloqueio
              const thoughtKey = tData.lockedThought;
              const thoughtData = (thoughtKey && scene.cache.json.get('thought_interactions')?.[thoughtKey]) || {
                character: 'Rhogar (Pensamento)',
                text: 'Não posso avançar por aqui ainda...'
              };

              // Emitir para UIScene global
              scene.game.events.emit('openDialogue', [thoughtData]);
              return;
            }
          }

          // Transição direta ou com Ato Narrativo intermediário
          let actData = tData.actTransition || null;
          
          if (actData && actData.actNumber === 'ATO II') {
            const isQuestDone = QuestManager.isQuestCompleted('quest_01_flashback') || QuestManager.getQuestStatus('quest_01_flashback') === 'completed';
            const seenAct2 = window.gameState?.flags?.seenAct2;
            
            if (isQuestDone && !seenAct2) {
              window.gameState = window.gameState || {};
              window.gameState.flags = window.gameState.flags || {};
              window.gameState.flags.seenAct2 = true;
            } else {
              actData = null; // Anula a transição de ato se não cumprir os requisitos
            }
          }
          
          this.transitionTo(scene, tData.targetScene, tData.spawn || {}, actData);
        });
      }
    });

    Logger.info('WorldManager', `Portais construídos com sucesso para ${sceneKey} (${transitionsList.length} triggers).`);
    return triggerGroup;
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
export { worldManagerInstance as WorldManager };
