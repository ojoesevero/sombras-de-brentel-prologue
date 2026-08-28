import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import QuestManager from '../src/services/QuestManager.js';

describe('QuestManager Unit Tests', () => {
  const mockQuests = {
    quest_01_flashback: {
      id: 'quest_01_flashback',
      title: 'Memórias de Estayler',
      status: 'active'
    },
    quest_02_temple: {
      id: 'quest_02_temple',
      title: 'O Templo de Palmem',
      status: 'locked'
    },
    quest_03_investigate_farm: {
      id: 'quest_03_investigate_farm',
      title: 'Rastros na Névoa',
      status: 'locked'
    },
    quest_04_forest_trail: {
      id: 'quest_04_forest_trail',
      title: 'A Trilha do Bosque Cinzento',
      status: 'locked'
    }
  };

  beforeEach(() => {
    QuestManager.init(mockQuests);
  });

  it('deve inicializar com o banco de missões e status corretos', () => {
    assert.equal(QuestManager.getQuestStatus('quest_01_flashback'), 'active');
    assert.equal(QuestManager.getQuestStatus('quest_02_temple'), 'locked');
    assert.equal(QuestManager.isQuestCompleted('quest_01_flashback'), false);
  });

  it('deve avançar o status de uma missão e disparar evento', (t, done) => {
    QuestManager.once('questUpdated', (quest) => {
      assert.equal(quest.id, 'quest_01_flashback');
      assert.equal(quest.status, 'completed');
      assert.equal(QuestManager.isQuestCompleted('quest_01_flashback'), true);
      done();
    });

    QuestManager.advanceQuest('quest_01_flashback', 'completed');
  });

  it('deve permitir a progressão linear entre as missões da campanha', () => {
    // 1. Conclui Flashback e Ativa Templo
    QuestManager.advanceQuest('quest_01_flashback', 'completed');
    QuestManager.advanceQuest('quest_02_temple', 'active');
    assert.equal(QuestManager.isQuestCompleted('quest_01_flashback'), true);
    assert.equal(QuestManager.getQuestStatus('quest_02_temple'), 'active');

    // 2. Conclui Templo e Ativa Fazenda
    QuestManager.advanceQuest('quest_02_temple', 'completed');
    QuestManager.advanceQuest('quest_03_investigate_farm', 'active');
    assert.equal(QuestManager.isQuestCompleted('quest_02_temple'), true);
    assert.equal(QuestManager.getQuestStatus('quest_03_investigate_farm'), 'active');

    // 3. Conclui Fazenda e Ativa Trilha da Masmorra
    QuestManager.advanceQuest('quest_03_investigate_farm', 'completed');
    QuestManager.advanceQuest('quest_04_forest_trail', 'active');
    assert.equal(QuestManager.isQuestCompleted('quest_03_investigate_farm'), true);
    assert.equal(QuestManager.getQuestStatus('quest_04_forest_trail'), 'active');
  });

  it('deve resetar todas as missões bloqueando-as e ativando apenas quest_01_flashback', () => {
    QuestManager.advanceQuest('quest_01_flashback', 'completed');
    QuestManager.advanceQuest('quest_02_temple', 'completed');
    
    QuestManager.resetQuests();

    assert.equal(QuestManager.getQuestStatus('quest_01_flashback'), 'active');
    assert.equal(QuestManager.getQuestStatus('quest_02_temple'), 'locked');
    assert.equal(QuestManager.getQuestStatus('quest_03_investigate_farm'), 'locked');
    assert.equal(QuestManager.getQuestStatus('quest_04_forest_trail'), 'locked');
  });
});
