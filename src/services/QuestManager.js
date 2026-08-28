import Logger from '../utils/Logger.js';

/**
 * Emissor de eventos agnóstico de ambiente (funciona no Browser e em Node.js puro).
 */
class BaseEventEmitter {
  constructor() {
    this._events = {};
  }

  on(event, fn) {
    (this._events[event] = this._events[event] || []).push(fn);
    return this;
  }

  once(event, fn) {
    const wrapped = (...args) => {
      this.off(event, wrapped);
      fn(...args);
    };
    return this.on(event, wrapped);
  }

  off(event, fn) {
    if (!this._events[event]) return this;
    if (!fn) delete this._events[event];
    else this._events[event] = this._events[event].filter(cb => cb !== fn);
    return this;
  }

  emit(event, ...args) {
    if (!this._events[event]) return false;
    this._events[event].forEach(cb => cb(...args));
    return true;
  }

  removeAllListeners() {
    this._events = {};
    return this;
  }
}

/**
 * Singleton Gerenciador de Missões (Quests).
 */
class QuestManager extends BaseEventEmitter {
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
      Logger.quest(questId, nextStatus);
      this.emit('questUpdated', this.quests[questId]);
    } else {
      Logger.warn('QuestManager', `Tentou avançar missão inexistente: ${questId}`);
    }
  }

  isQuestCompleted(questId) {
    return this.getQuestStatus(questId) === 'completed' || this.quests?.[questId]?.status === 'completed';
  }

  isCompleted(questId) {
    return this.isQuestCompleted(questId);
  }

  getQuestStatus(questId) {
    return this.quests?.[questId]?.status || 'locked';
  }

  resetQuests() {
    if (this.quests) {
      for (const key in this.quests) {
        this.quests[key].status = 'locked';
      }
      if (this.quests['quest_01_flashback']) {
        this.quests['quest_01_flashback'].status = 'active';
        Logger.quest('quest_01_flashback', 'active');
      }
    }
    Logger.info('QuestManager', 'Progresso das missões resetado para novo jogo.');
  }
}

const questManagerInstance = new QuestManager();
export default questManagerInstance;
