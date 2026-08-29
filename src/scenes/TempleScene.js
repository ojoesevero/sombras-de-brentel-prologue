import Phaser from 'phaser';
import InputManager from '../services/InputManager.js';
import WorldManager from '../services/WorldManager.js';
import QuestManager from '../services/QuestManager.js';
import Logger from '../utils/Logger.js';
import Player from '../entities/Player.js';
import DevShortcuts from '../utils/DevShortcuts.js';

/**
 * Cena do Templo de Palmem (Ato II).
 */
export default class TempleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TempleScene' });
  }

  init(data) {
    this.spawnData = data || {};
  }

  create() {
    Logger.info('TempleScene', 'Renderizando Templo de Palmem.');
    this.cameras.main.resetFX();
    this.cameras.main.fadeIn(400, 0, 0, 0);

    // Layout Sagrado (800x600) - Piso de Mármore
    this.physics.world.setBounds(0, 0, 800, 600);
    this.add.rectangle(0, 0, 800, 600, 0xdddddd).setOrigin(0);

    this.staticGroup = this.physics.add.staticGroup();

    // Colunas e Paredes
    const addPillar = (x, y) => {
      const p = this.add.circle(x, y, 20, 0xaaaaaa);
      this.physics.add.existing(p, true);
      this.staticGroup.add(p);
    };
    addPillar(200, 200); addPillar(600, 200);
    addPillar(200, 400); addPillar(600, 400);

    // Altar Cerimonial
    const altar = this.add.rectangle(400, 150, 120, 60, 0xd4af37);
    this.physics.add.existing(altar, true);
    this.staticGroup.add(altar);
    this.add.text(400, 150, 'Altar de Palmem', { fill: '#fff', fontSize: '12px' }).setOrigin(0.5);

    // Área de Enfermaria (Leito de Gruther)
    const leito = this.add.rectangle(230, 220, 80, 120, 0x8b0000);
    this.physics.add.existing(leito, true);
    this.staticGroup.add(leito);
    this.add.text(230, 220, 'Gruther\n(Febril)', { fill: '#fff', fontSize: '10px' }).setOrigin(0.5);

    // NPCs e Zonas
    this.staticGroupNPCs = this.physics.add.staticGroup();
    
    // Sacerdotisa
    this.sacerdotisa = this.add.rectangle(400, 250, 32, 32, 0xf1c40f);
    this.physics.add.existing(this.sacerdotisa, true);
    this.staticGroupNPCs.add(this.sacerdotisa);
    this.add.text(400, 250, 'Sacerdotisa', { fill: '#fff', fontSize: '10px' }).setOrigin(0.5);

    // Spawn do Jogador (Player com FSM)
    const spawnX = this.spawnData.x || (WorldManager.getSpawn()?.x || 400);
    const spawnY = this.spawnData.y || (WorldManager.getSpawn()?.y || 520);
    this.player = new Player(this, spawnX, spawnY, 32, 32, 0x2980b9);
    if (this.spawnData?.loadedData?.player) {
      this.player.loadState(this.spawnData.loadedData.player);
    }
    
    this.physics.add.collider(this.player, this.staticGroup);
    this.physics.add.collider(this.player, this.staticGroupNPCs);

    // Portas e Triggers Data-Driven
    WorldManager.buildTransitions(this);

    // Interações e Diálogos
    this.interactionsData = this.cache.json.get('act2_interactions');
    this.interactIndicator = this.add.text(0, 0, '▼ [Z] Interagir', { fontSize: '14px', fill: '#ffff00', backgroundColor: '#000' }).setOrigin(0.5).setVisible(false);
    this.currentInteractTarget = null;
    
    this.setupInteractions();
    this.updateHUD();

    // Inputs e Pause
    InputManager.init(this);
    if (this.input.keyboard) this.input.keyboard.enabled = true;

    InputManager.onAction('CONFIRM', () => {
      if (this.player && !this.player.canInteract()) {
        Logger.info('Intent', 'Input Z/ESPAÇO recebido: Avançando diálogo na UIScene.');
        this.game.events.emit('advanceDialogue');
        return;
      }

      if (this.currentInteractTarget) {
        this.activeDialogueTarget = this.currentInteractTarget;
        let data = this.interactionsData ? this.interactionsData[this.currentInteractTarget] : null;
        if (data) {
          if (data.nodes) data = data.nodes;
          Logger.info('Intent', `Iniciando interação com alvo [${this.currentInteractTarget}].`);
          this.interactIndicator.setVisible(false);
          this.game.events.emit('openDialogue', data);
        } else {
          Logger.warn('TempleScene', `Nenhum dado de diálogo encontrado para ${this.currentInteractTarget}`);
        }
      }
    });

    InputManager.onAction('MENU', () => {
      if (this.player && !this.player.canInteract()) return;
      this.scene.pause();
      this.scene.launch('PauseScene', { sceneKey: 'TempleScene' });
    });

    // Ouvinte para conclusão de diálogos
    this._onGlobalDialogueClosed = () => {
      const target = this.activeDialogueTarget || this.currentInteractTarget;
      this.activeDialogueTarget = null;
      if (target === 'sacerdotisa_palmem' || target === 'gruther_leito') {
        if (!QuestManager.isQuestCompleted('quest_02_temple')) {
          QuestManager.advanceQuest('quest_02_temple', 'completed');
          QuestManager.advanceQuest('quest_03_investigate_farm', 'active');
          Logger.info('TempleScene', 'Quest "O Templo de Palmem" concluída! Nova Missão: Investigar a Fazenda.');
          this.updateHUD();
        }
      }
    };

    this.game.events.on('dialogueClosed', this._onGlobalDialogueClosed);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off('dialogueClosed', this._onGlobalDialogueClosed);
    });

    // Atalhos de desenvolvedor
    DevShortcuts.register(this);
  }

  updateHUD() {
    let text = '';
    if (QuestManager.isQuestCompleted('quest_02_temple') || QuestManager.getQuestStatus('quest_03_investigate_farm') === 'active') {
      text = 'Objetivo Atual: Investigue o celeiro na Fazenda dos Halflings na Estrada Sul';
    } else {
      text = 'Objetivo: Fale com a Sacerdotisa e veja o estado de Gruther';
    }
    this.game.events.emit('updateObjective', text);
  }

  setupInteractions() {
    this.interactZones = this.physics.add.group();

    const addZone = (target, id) => {
      const zone = this.add.zone(target.x, target.y, 80, 80);
      this.physics.add.existing(zone, true);
      zone.interactId = id;
      zone.targetEntity = target;
      this.interactZones.add(zone);
    };

    addZone(this.sacerdotisa, 'sacerdotisa_palmem');
    const leitoZone = this.add.zone(230, 220, 100, 140);
    this.physics.add.existing(leitoZone, true);
    leitoZone.interactId = 'gruther_leito';
    leitoZone.targetEntity = { x: 230, y: 220 };
    this.interactZones.add(leitoZone);
  }

  update() {
    if (!this.input.keyboard || !this.input.keyboard.enabled) return;
    
    const cursors = this.input.keyboard.createCursorKeys();
    const wasd = {
      w: this.input.keyboard.addKey('W'),
      a: this.input.keyboard.addKey('A'),
      s: this.input.keyboard.addKey('S'),
      d: this.input.keyboard.addKey('D')
    };

    // Controle de movimentação delegado ao Player (FSM)
    this.player.handleMovement(cursors, wasd, 180);

    let touching = false;
    this.physics.overlap(this.player, this.interactZones, (player, zone) => {
      touching = true;
      this.currentInteractTarget = zone.interactId;
      this.interactIndicator.setPosition(zone.targetEntity.x, zone.targetEntity.y - 40);
      this.interactIndicator.setVisible(true);
    });

    if (!touching) {
      this.currentInteractTarget = null;
      this.interactIndicator.setVisible(false);
    }
  }
}
