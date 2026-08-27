import Logger from '../utils/Logger.js';
import Phaser from 'phaser';

/**
 * Singleton Gerenciador de Missões (Quests).
 */
class QuestManager extends Phaser.Events.EventEmitter {
  constructor() {
    super();
    if (QuestManager.instance) {
      return QuestManager.instance;
    }
    QuestManager.instance = this;
    this.quests = {};
  }

  init(questsData) {
    this.quests = JSON.parse(JSON.stringify(questsData));
    Logger.info('QuestManager', 'Banco de missões inicializado.');
  }

  getQuest(questId) {
    return this.quests[questId];
  }

  advanceQuest(questId, nextStatus) {
    if (this.quests[questId]) {
      this.quests[questId].status = nextStatus;
      Logger.info('QuestManager', `Missão '${questId}' avançou para o status: ${nextStatus}`);
      this.emit('questUpdated', this.quests[questId]);
    } else {
      Logger.warn('QuestManager', `Tentou avançar missão inexistente: ${questId}`);
    }
  }

  isQuestCompleted(questId) {
    return this.quests[questId] && this.quests[questId].status === 'completed';
  }

  resetQuests() {
    if (this.quests) {
      for (const key in this.quests) {
        this.quests[key].status = 'locked';
      }
      if (this.quests['quest_01_flashback']) {
        this.quests['quest_01_flashback'].status = 'active';
      }
    }
    Logger.info('QuestManager', 'Progresso das missões resetado para novo jogo.');
  }
}

const questManagerInstance = new QuestManager();
export default questManagerInstance;
