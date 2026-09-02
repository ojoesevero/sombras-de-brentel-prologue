import Phaser from 'phaser';
import InputManager from '../services/InputManager.js';
import ShopUI from '../ui/ShopUI.js';
import WorldMapUI from '../ui/WorldMapUI.js';
import QuestManager from '../services/QuestManager.js';
import WorldManager from '../services/WorldManager.js';
import Logger from '../utils/Logger.js';
import Player, { PlayerState } from '../entities/Player.js';
import DevShortcuts from '../utils/DevShortcuts.js';
import { AssetsConfig } from '../config/assets.js';
import NPCWalker from '../entities/NPCWalker.js';

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
    Logger.info('TavernScene', 'Renderizando Taverna Cauda do Dragão (Pixel Art).');
    this.interactions = this.cache.json.get('tavern_interactions');
    
    // Inicializar QuestManager se necessário
    const questsData = this.cache.json.get('quests');
    if (Object.keys(QuestManager.quests).length === 0) {
      QuestManager.init(questsData);
    }

    if (this.input.keyboard) this.input.keyboard.enabled = true;
    this.cameras.main.resetFX();
    this.cameras.main.fadeIn(400, 0, 0, 0);

    // 1. Fundo Atmosférico de Pixel Art (assoalho de madeira, paredes de pedra e tapete rúnico)
    this.add.image(400, 300, AssetsConfig.backgrounds.tavern).setDepth(0);

    // 2. Iluminação Dinâmica da Lareira e Partículas de Brasas
    const hearthLight = this.add.circle(400, 45, 95, 0xffa502, 0.22)
      .setDepth(1)
      .setBlendMode(Phaser.BlendModes.ADD);

    this.tweens.add({
      targets: hearthLight,
      alpha: 0.38,
      scale: 1.12,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    if (this.textures.exists(AssetsConfig.fx.particle_ember)) {
      this.add.particles(400, 40, AssetsConfig.fx.particle_ember, {
        speedY: { min: -35, max: -12 },
        speedX: { min: -15, max: 15 },
        scale: { start: 0.6, end: 0 },
        alpha: { start: 0.8, end: 0 },
        lifespan: 1500,
        frequency: 180,
        blendMode: 'ADD'
      }).setDepth(2);
    }

    // 3. Sistema Físico de Colisões (Paredes invisíveis)
    this.staticGroup = this.physics.add.staticGroup();
    
    const addInvisibleBoundary = (x, y, w, h) => {
      const r = this.add.rectangle(x, y, w, h, 0x000000, 0);
      this.physics.add.existing(r, true);
      this.staticGroup.add(r);
    };

    // Limites de Borda (Paredes da Taverna)
    addInvisibleBoundary(400, 35, 800, 70); // Parede norte e lareira
    addInvisibleBoundary(400, 595, 800, 10); // Parede sul
    addInvisibleBoundary(5, 300, 10, 600);   // Parede oeste
    addInvisibleBoundary(795, 300, 10, 600); // Parede leste

    // 4. Mobílias e Colisores em Sprites/Imagens
    const counter = this.add.image(400, 100, AssetsConfig.tiles.counter).setDepth(2);
    this.physics.add.existing(counter, true);
    this.staticGroup.add(counter);

    const mesa1 = this.add.image(200, 300, AssetsConfig.tiles.table).setDepth(2);
    this.physics.add.existing(mesa1, true);
    this.staticGroup.add(mesa1);

    const mesa2 = this.add.image(600, 300, AssetsConfig.tiles.table).setDepth(2);
    this.physics.add.existing(mesa2, true);
    this.staticGroup.add(mesa2);

    // 5. NPCs e Entidades de Interação
    this.interactables = [
      { id: 'hilda', x: 400, y: 150 },
      { id: 'placa_regras', x: 200, y: 100 },
      { id: 'quadro_avisos', x: 600, y: 100 },
      { id: 'john_bardem', x: 100, y: 500 },
      { id: 'veronica_stinfy', x: 200, y: 250 },
      { id: 'traudon_alicia', x: 600, y: 250 },
      { id: 'joseph_sylven', x: 700, y: 500 }
    ];

    // 6. Renderizar NPCs com Sprites de Pixel Art, Sombras e Tags
    this.npcSprites = {};
    this.interactables.forEach(ent => {
      let textureKey = 'spr_npc_default';
      const isProp = ent.id.startsWith('placa') || ent.id.startsWith('quadro');

      if (ent.id === 'hilda') textureKey = AssetsConfig.sprites.hilda;
      else if (ent.id === 'joseph_sylven') textureKey = AssetsConfig.sprites.joseph;
      else if (ent.id === 'veronica_stinfy') textureKey = AssetsConfig.sprites.veronica;
      else if (ent.id === 'john_bardem') textureKey = AssetsConfig.sprites.john;
      else if (ent.id === 'traudon_alicia') textureKey = AssetsConfig.sprites.traudon;
      else if (ent.id === 'quadro_avisos') textureKey = AssetsConfig.tiles.noticeboard;
      else if (ent.id === 'placa_regras') textureKey = AssetsConfig.tiles.rules;

      if (!this.textures.exists(textureKey)) {
        textureKey = isProp ? 'tex_noticeboard' : 'spr_npc_default';
      }

      // Sombra projetada sob os pés de personagens vivos
      if (!isProp) {
        this.add.ellipse(ent.x, ent.y + 13, 22, 8, 0x000000, 0.35).setDepth(2);
      }

      const sprite = this.add.sprite(ent.x, ent.y, textureKey).setDepth(3);
      this.npcSprites[ent.id] = sprite;

      // Micro-animação sutil de respiração para personagens vivos
      if (!isProp) {
        this.tweens.add({
          targets: sprite,
          scaleY: 0.95,
          duration: 1100 + Math.random() * 400,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      }

      // Etiqueta de identificação estilizada
      const displayName = ent.id.replace(/_/g, ' ').toUpperCase();
      this.add.text(ent.x, ent.y - 23, displayName, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '9px',
        color: '#ffd700',
        fontStyle: 'bold',
        backgroundColor: 'rgba(10, 10, 16, 0.75)',
        padding: { x: 4, y: 2 }
      }).setOrigin(0.5).setDepth(4);
    });

    // 7. Garçonete Ambulante (NPCWalker com waypoints de atendimento)
    this.waitress = new NPCWalker(this, 350, 180, AssetsConfig.sprites.waitress, {
      name: 'Gisela',
      speed: 40,
      depth: 3,
      waypoints: [
        { x: 350, y: 180, waitTime: 3000 },
        { x: 260, y: 280, waitTime: 3500 },
        { x: 400, y: 320, waitTime: 2000 },
        { x: 540, y: 280, waitTime: 3500 },
        { x: 450, y: 180, waitTime: 2500 }
      ]
    });
    this.interactables.push({ id: 'gisela_waitress', x: 350, y: 180, isWalker: true });

    // Instanciação do Jogador (Player com FSM)
    const spawnX = this.spawnData.x || (WorldManager.getSpawn()?.x || 400);
    const spawnY = this.spawnData.y || (WorldManager.getSpawn()?.y || 500);
    this.player = new Player(this, spawnX, spawnY, 32, 32, 0x2980b9);
    if (this.spawnData?.loadedData?.player) {
      this.player.loadState(this.spawnData.loadedData.player);
    }
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

      // Retomar patrulha da garçonete se estava conversando
      if (this.waitress) {
        this.waitress.resumePatrol();
      }

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

    // Caching de teclado para prevenir Garbage Collection per-frame
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = {
      w: this.input.keyboard.addKey('W'),
      a: this.input.keyboard.addKey('A'),
      s: this.input.keyboard.addKey('S'),
      d: this.input.keyboard.addKey('D')
    };

    // Restaurar listeners de input ao retomar da pausa/overlay
    this.events.on(Phaser.Scenes.Events.RESUME, () => {
      InputManager.init(this);
      if (typeof this.setupInputs === 'function') {
        this.setupInputs();
      }
    });

    // Atalhos de desenvolvedor protegidos por ambiente DEV
    if (import.meta.env?.DEV) {
      DevShortcuts.register(this);
    }
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
    } else if (id === 'gisela_waitress') {
      this.player.setState(PlayerState.INTERACTING);
      if (this.waitress) this.waitress.pauseForDialogue(this.player.x);
      this.game.events.emit('openDialogue', [
        {
          character: 'Gisela (Garçonete)',
          portrait: 'port_ilidiz_worried',
          text: 'Mais uma caneca de cerveja anã fresquinha? Os viajantes que chegaram do sul estavam tremendo... Dizem que o celeiro da fazenda foi partido ao meio e rastros negros cobrem a estrada.'
        }
      ]);
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

    // Controle de movimento via FSM do Player (usando instâncias em cache)
    this.player.handleMovement(this.cursors, this.wasd, 160);

    // Sincronizar coordenadas móveis da garçonete
    const giselaEntry = this.interactables.find(e => e.id === 'gisela_waitress');
    if (giselaEntry && this.waitress) {
      giselaEntry.x = this.waitress.x;
      giselaEntry.y = this.waitress.y;
    }

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
