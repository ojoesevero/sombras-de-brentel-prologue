import Phaser from 'phaser';
import InputManager from '../services/InputManager.js';
import ShopUI from '../ui/ShopUI.js';
import WorldMapUI from '../ui/WorldMapUI.js';
import QuestManager from '../services/QuestManager.js';
import WorldManager from '../services/WorldManager.js';
import Logger from '../utils/Logger.js';
import Player, { PlayerState } from '../entities/Player.js';
import DevShortcuts from '../utils/DevShortcuts.js';

/**
 * Cena de Exploração Top-Down da Taverna Cauda do Dragão.
 * @module TavernScene
 */
export default class TavernScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TavernScene' });
  }

  init(data) {
    this.returnedFromFlashback = data.returnedFromFlashback || false;
    this.battleOutcome = data.battleOutcome || null;
    this.spawnData = data || {};
  }

  create() {
    Logger.info('TavernScene', 'Renderizando Taverna Cauda do Dragão.');
    this.interactions = this.cache.json.get('tavern_interactions');
    
    // Inicializar QuestManager se necessário
    const questsData = this.cache.json.get('quests');
    if (Object.keys(QuestManager.quests).length === 0) {
      QuestManager.init(questsData);
    }

    if (this.input.keyboard) this.input.keyboard.enabled = true;
    this.cameras.main.resetFX();
    this.cameras.main.fadeIn(400, 0, 0, 0);

    // Chão de madeira
    this.add.rectangle(0, 0, 800, 600, 0x4a3b2c).setOrigin(0);

    // Sistema Físico de Colisões
    this.staticGroup = this.physics.add.staticGroup();
    
    const addStatic = (x, y, w, h, color) => {
      const r = this.add.rectangle(x, y, w, h, color);
      this.physics.add.existing(r, true);
      this.staticGroup.add(r);
    };

    // Limites de Borda (Paredes)
    addStatic(400, 10, 800, 20, 0x221100);
    addStatic(400, 590, 800, 20, 0x221100);
    addStatic(10, 300, 20, 600, 0x221100);
    addStatic(790, 300, 20, 600, 0x221100);

    // Mobília (Colisores)
    addStatic(400, 100, 400, 60, 0x3d2314); // Balcão
    addStatic(200, 300, 80, 80, 0x5c3a21);  // Mesa 1
    addStatic(600, 300, 80, 80, 0x5c3a21);  // Mesa 2

    // NPCs e Entidades de Interação
    this.interactables = [
      { id: 'hilda', x: 400, y: 150 },
      { id: 'placa_regras', x: 200, y: 100 },
      { id: 'quadro_avisos', x: 600, y: 100 },
      { id: 'john_bardem', x: 100, y: 500 },
      { id: 'veronica_stinfy', x: 200, y: 250 },
      { id: 'traudon_alicia', x: 600, y: 250 },
      { id: 'joseph_sylven', x: 700, y: 500 }
    ];

    // Renderizar pontos de interesse (NPCs amarelos)
    this.interactables.forEach(ent => {
      this.add.rectangle(ent.x, ent.y, 32, 32, 0xf1c40f);
      this.add.text(ent.x, ent.y - 25, ent.id.replace('_', ' '), { fontSize: '10px', fill: '#fff' }).setOrigin(0.5);
    });

    // Instanciação do Jogador (Player com FSM)
    const spawnX = this.spawnData.x || (WorldManager.getSpawn()?.x || 400);
    const spawnY = this.spawnData.y || (WorldManager.getSpawn()?.y || 500);
    this.player = new Player(this, spawnX, spawnY, 32, 32, 0x2980b9);
    this.physics.add.collider(this.player, this.staticGroup);

    // Portas Data-Driven via WorldManager
    WorldManager.buildTransitions(this);

    // Indicador UI Flutuante de Interação
    this.interactPrompt = this.add.text(0, 0, '▼ [Z] Interagir', { fontSize: '14px', fill: '#ffff00', backgroundColor: '#000' }).setOrigin(0.5);
    this.interactPrompt.setVisible(false);
    this.interactPrompt.setDepth(10);
    
    // Shop UI e Map UI locais
    this.shopUI = new ShopUI(this, 400, 300);
    this.shopUI.setDepth(30);
    this.shopUI.on('shopClosed', () => {
      if (this.player.state === PlayerState.INTERACTING) {
        this.player.setState(PlayerState.IDLE);
      }
    });

    this.currentInteractable = null;
    this.visitedNPCs = new Set();

    InputManager.init(this);
    this.setupInputs();

    this.updateHUD();

    // Listener global para fim de diálogo
    this._onGlobalDialogueClosed = () => {
      const target = this.activeDialogueTarget;
      const josephType = this.activeDialogueJosephType;
      this.activeDialogueTarget = null;
      this.activeDialogueJosephType = null;

      // Controle do Flashback no Joseph Sylven
      if (target === 'joseph_sylven' && (josephType === 'joseph_ready' || this.visitedNPCs.size >= 4)) {
        if (!QuestManager.isQuestCompleted('quest_01_flashback')) {
          Logger.info('TavernScene', 'Rhogar lembrou do passado. Iniciando Flashback...');
          this.cameras.main.fadeOut(500, 255, 255, 255);
          this.time.delayedCall(550, () => {
            this.scene.start('GameScene'); 
          });
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

  setupInputs() {
    InputManager.onAction('CONFIRM', () => {
      if (this.player && !this.player.canInteract()) {
        if (this.currentMapUI) {
          this.currentMapUI.closeMap();
          this.currentMapUI = null;
          this.player.setState(PlayerState.IDLE);
        } else {
          this.game.events.emit('advanceDialogue');
        }
        return;
      }

      if (this.currentInteractable) {
        Logger.info('Intent', `Iniciando interação com [${this.currentInteractable}].`);
        this.openInteraction(this.currentInteractable);
      }
    });

    InputManager.onAction('CANCEL', () => {
      if (this.currentMapUI) {
        this.currentMapUI.closeMap();
        this.currentMapUI = null;
        this.player.setState(PlayerState.IDLE);
      }
    });

    InputManager.onAction('MENU', () => {
      if (this.player && !this.player.canInteract()) return;
      this.scene.pause();
      this.scene.launch('PauseScene', { sceneKey: 'TavernScene' });
    });
  }

  openInteraction(id) {
    this.activeDialogueTarget = id;
    if (id === 'hilda') {
      this.player.setState(PlayerState.INTERACTING);
      this.shopUI.openShop();
      this.visitedNPCs.add('hilda');
      this.updateHUD();
    } else if (id === 'quadro_avisos') {
      this.player.setState(PlayerState.INTERACTING);
      this.currentMapUI = new WorldMapUI(this, 400, 300);
      this.currentMapUI.setDepth(60);
    } else if (id === 'joseph_sylven') {
      let josephId = 'joseph_initial';
      
      if (QuestManager.isQuestCompleted('quest_01_flashback')) {
        if (this.battleOutcome === 'victory') {
          josephId = 'joseph_victory';
        } else if (this.battleOutcome === 'defeat') {
          josephId = 'joseph_defeat';
        } else {
          josephId = 'joseph_victory';
        }
      } else if (this.visitedNPCs.size >= 4) {
        josephId = 'joseph_ready';
      }
      
      this.activeDialogueJosephType = josephId;
      const dialogue = this.interactions[josephId];
      this.game.events.emit('openDialogue', dialogue);
    } else {
      const dialogue = this.interactions[id];
      if (dialogue) {
        this.game.events.emit('openDialogue', dialogue);
        if (['veronica_stinfy', 'traudon_alicia', 'john_bardem'].includes(id)) {
          this.visitedNPCs.add(id);
          this.updateHUD();
        }
      }
    }
  }

  updateHUD() {
    let text = '';
    if (QuestManager.isQuestCompleted('quest_01_flashback')) {
      text = 'Objetivo Atual: Saia da Taverna e vá ao Templo de Palmem ao norte de Rastphen';
    } else if (this.visitedNPCs.size >= 4) {
      text = 'Objetivo: Fale com Joseph Sylven sobre o passado';
    } else {
      text = 'Objetivo: Converse com todos os clientes da Taverna (' + this.visitedNPCs.size + '/4)';
    }
    this.game.events.emit('updateObjective', text);
  }

  update() {
    if (!this.input.keyboard.enabled) return;

    if (this.returnedFromFlashback) {
      this.returnedFromFlashback = false;
      Logger.info('TavernScene', 'Retornou do Flashback. Missões atualizadas.');
      this.updateHUD();
    }

    const cursors = this.input.keyboard.createCursorKeys();
    const wasd = {
      w: this.input.keyboard.addKey('W'),
      a: this.input.keyboard.addKey('A'),
      s: this.input.keyboard.addKey('S'),
      d: this.input.keyboard.addKey('D')
    };

    // Controle de movimento via FSM do Player
    this.player.handleMovement(cursors, wasd, 160);

    // Sistema de Gatilhos Espaciais
    let closest = null;
    let minDist = 50;

    this.interactables.forEach(ent => {
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, ent.x, ent.y);
      if (dist < minDist) {
        minDist = dist;
        closest = ent;
      }
    });

    if (closest && this.player.canInteract()) {
      this.currentInteractable = closest.id;
      this.interactPrompt.setPosition(this.player.x, this.player.y - 30);
      this.interactPrompt.setVisible(true);
    } else {
      this.currentInteractable = null;
      this.interactPrompt.setVisible(false);
    }
  }
}
