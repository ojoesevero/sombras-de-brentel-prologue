import Phaser from 'phaser';
import InputManager from '../services/InputManager.js';
import WorldManager from '../services/WorldManager.js';
import QuestManager from '../services/QuestManager.js';
import Logger from '../utils/Logger.js';
import Player from '../entities/Player.js';
import DevShortcuts from '../utils/DevShortcuts.js';
import { AssetsConfig } from '../config/assets.js';

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

    // Layout Sagrado (800x600) - Piso Texturizado de Ladrilhos de Pedra e Mármore
    this.physics.world.setBounds(0, 0, 800, 600);
    this.add.tileSprite(400, 300, 800, 600, AssetsConfig.tiles.temple_floor).setOrigin(0.5);

    // Tapete Cerimonial Central
    this.add.rectangle(400, 350, 96, 420, 0x8b0000).setDepth(1);
    this.add.rectangle(400, 350, 86, 414, 0xb71540).setDepth(1);
    this.add.rectangle(400, 350, 78, 410, 0x780218).setDepth(1);

    this.staticGroup = this.physics.add.staticGroup();

    // 1. Pilares de Mármore e Ouro com Capitéis
    const addPillar = (x, y) => {
      this.add.ellipse(x, y + 26, 44, 14, 0x000000, 0.35).setDepth(1);
      const p = this.add.image(x, y, AssetsConfig.tiles.temple_pillar).setDepth(2);
      this.physics.add.existing(p, true);
      this.staticGroup.add(p);
    };
    addPillar(200, 200); addPillar(600, 200);
    addPillar(200, 400); addPillar(600, 400);

    // 2. Altar Cerimonial de Palmem com Iluminação Sagrada e Velas
    this.altar = this.add.image(400, 140, AssetsConfig.tiles.temple_altar).setDepth(2);
    this.physics.add.existing(this.altar, true);
    this.staticGroup.add(this.altar);

    // Halo sagrado dourado ambiente do altar
    const altarHalo = this.add.circle(400, 140, 85, 0xf1c40f, 0.2)
      .setDepth(1)
      .setBlendMode(Phaser.BlendModes.ADD);

    this.tweens.add({
      targets: altarHalo,
      alpha: 0.36,
      scale: 1.15,
      duration: 1300,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Chamas cintilantes das velas nos castiçais do altar
    const candleL = this.add.circle(362, 120, 16, 0xffa502, 0.35).setDepth(1).setBlendMode(Phaser.BlendModes.ADD);
    const candleR = this.add.circle(438, 120, 16, 0xffa502, 0.35).setDepth(1).setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({
      targets: [candleL, candleR],
      alpha: 0.55,
      scale: 1.3,
      duration: 450,
      yoyo: true,
      repeat: -1
    });

    this.add.text(400, 178, 'ALTAR DE PALMEM', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '9px',
      color: '#ffd700',
      fontStyle: 'bold',
      backgroundColor: 'rgba(10, 10, 16, 0.75)',
      padding: { x: 4, y: 2 }
    }).setOrigin(0.5).setDepth(3);

    // 3. Área de Enfermaria: Leito de Gruther em Pixel Art
    this.add.ellipse(230, 260, 68, 18, 0x000000, 0.35).setDepth(1);
    const leito = this.add.image(230, 220, AssetsConfig.sprites.gruther_bed).setDepth(2);
    this.physics.add.existing(leito, true);
    this.staticGroup.add(leito);
    this.add.text(230, 275, 'GRUTHER (FEBRIL)', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '9px',
      color: '#74b9ff',
      fontStyle: 'bold',
      backgroundColor: 'rgba(10, 10, 16, 0.75)',
      padding: { x: 3, y: 2 }
    }).setOrigin(0.5).setDepth(3);

    // 4. Sacerdotisa de Palmem em Pixel Art Chibi com Sombra e Respiração
    this.staticGroupNPCs = this.physics.add.staticGroup();
    
    this.add.ellipse(400, 263, 22, 8, 0x000000, 0.35).setDepth(2);
    this.sacerdotisa = this.add.sprite(400, 250, AssetsConfig.sprites.sacerdotisa).setDepth(3);
    this.physics.add.existing(this.sacerdotisa, true);
    this.staticGroupNPCs.add(this.sacerdotisa);

    this.tweens.add({
      targets: this.sacerdotisa,
      scaleY: 0.94,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    this.add.text(400, 225, 'SACERDOTISA ILIDIZ', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '9px',
      color: '#ffd700',
      fontStyle: 'bold',
      backgroundColor: 'rgba(10, 10, 16, 0.75)',
      padding: { x: 4, y: 2 }
    }).setOrigin(0.5).setDepth(4);

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

    // Caching de teclado para prevenir Garbage Collection per-frame
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = {
      w: this.input.keyboard.addKey('W'),
      a: this.input.keyboard.addKey('A'),
      s: this.input.keyboard.addKey('S'),
      d: this.input.keyboard.addKey('D')
    };

    this.setupInputs();

    // Restaurar listeners de input ao retomar da pausa/overlay
    this.events.on(Phaser.Scenes.Events.RESUME, () => {
      InputManager.init(this);
      if (typeof this.setupInputs === 'function') {
        this.setupInputs();
      }
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

    // Atalhos de desenvolvedor protegidos por ambiente DEV
    if (import.meta.env?.DEV) {
      DevShortcuts.register(this);
    }
  }

  setupInputs() {
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
    
    // Controle de movimentação delegado ao Player (FSM com instâncias em cache)
    this.player.handleMovement(this.cursors, this.wasd, 180);

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
