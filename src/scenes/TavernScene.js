import Phaser from 'phaser';
import InputManager from '../services/InputManager.js';
import DialogueBox from '../ui/DialogueBox.js';
import ShopUI from '../ui/ShopUI.js';
import WorldMapUI from '../ui/WorldMapUI.js';
import QuestManager from '../services/QuestManager.js';
import WorldManager from '../services/WorldManager.js';
import Logger from '../utils/Logger.js';

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
    this.isTransitioning = false;
    this.interactions = this.cache.json.get('tavern_interactions');
    
    // Inicializar QuestManager
    const questsData = this.cache.json.get('quests');
    if (Object.keys(QuestManager.quests).length === 0) {
      QuestManager.init(questsData);
    }

    // Habilitar controles (reset após transição)
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

    // Porta Sul (Saída para a Floresta/Rastphen) - Uso de Zone em vez de Render Visual Fixo
    this.southDoor = this.add.zone(400, 585, 120, 30);
    this.physics.world.enable(this.southDoor, Phaser.Physics.Arcade.STATIC_BODY);

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

    // Renderizar pontos de interesse
    this.interactables.forEach(ent => {
      this.add.circle(ent.x, ent.y, 16, 0x00ff00);
      this.add.text(ent.x, ent.y - 25, ent.id.replace('_', ' '), { fontSize: '10px', fill: '#fff' }).setOrigin(0.5);
    });

    // Corpo e Física do Jogador (Rhogar) via WorldManager
    const spawnX = this.spawnData.x || (WorldManager.getSpawn()?.x || 400);
    const spawnY = this.spawnData.y || (WorldManager.getSpawn()?.y || 500);
    this.player = this.add.rectangle(spawnX, spawnY, 32, 32, 0x0055ff);
    this.physics.add.existing(this.player, false); 
    this.player.body.setSize(32, 32);
    this.player.body.setCollideWorldBounds(true);
    
    this.physics.add.collider(this.player, this.staticGroup);

    // Colisão com a Porta Sul (Transição Bidirecional e Livre para a Cidade)
    this.physics.add.overlap(this.player, this.southDoor, () => {
      if (!this.isDialogueOpen) {
        if (!QuestManager.isQuestCompleted('quest_01_flashback')) {
          this.player.y -= 25; // pushback
          this.player.body.setVelocity(0, 0);
          this.isDialogueOpen = true;
          
          const thoughts = this.cache.json.get('thought_interactions');
          this.dialogueBox.setVisible(true);
          this.dialogueBox.startDialogue(thoughts['thought_locked_tavern']);
        } else {
          WorldManager.transitionTo(this, 'RastphenCityScene', { x: 520, y: 880 }); // fora da porta da caverna
        }
      }
    });

    // Indicador UI Flutuante de Interação
    this.interactPrompt = this.add.text(0, 0, '▼ [Z] Interagir', { fontSize: '14px', fill: '#ffff00', backgroundColor: '#000' }).setOrigin(0.5);
    this.interactPrompt.setVisible(false);
    this.interactPrompt.setDepth(10);

    // Caixa de Diálogos
    this.dialogueBox = new DialogueBox(this, 50, 420, 700, 140);
    this.dialogueBox.setVisible(false);
    this.dialogueBox.setDepth(20);
    
    // Shop UI
    this.shopUI = new ShopUI(this, 400, 300);
    this.shopUI.setDepth(30);

    this.shopUI.on('shopClosed', () => {
      this.isDialogueOpen = false;
    });

    this.isDialogueOpen = false;
    this.currentInteractable = null;
    this.visitedNPCs = new Set();

    InputManager.init(this);
    this.setupInputs();

    // HUD de Missões
    this.objectiveText = this.add.text(400, 20, '', { fontSize: '14px', fill: '#ffff00', fontStyle: 'bold' }).setOrigin(0.5);
    this.objectiveText.setScrollFactor(0);
    this.objectiveText.setDepth(50);
    this.updateHUD();

    this.dialogueBox.on('dialogueComplete', () => {
      this.dialogueBox.setVisible(false);
      this.isDialogueOpen = false;

      // Controle do Flashback no Joseph Sylven
      if (this.currentInteractable === 'joseph_sylven') {
        if (this.visitedNPCs.size >= 4 && !QuestManager.isQuestCompleted('quest_01_flashback')) {
          Logger.info('TavernScene', 'Rhogar lembrou do passado. Iniciando Flashback...');
          this.cameras.main.fadeOut(500, 255, 255, 255);
          this.time.delayedCall(550, () => {
            this.scene.start('GameScene'); 
          });
        }
      }
      
      this.currentInteractable = null;
    });
    
    Logger.info('TavernScene', 'Ambiente da Taverna criado.');
  }

  setupInputs() {
    InputManager.onAction('CONFIRM', () => {
      if (this.isDialogueOpen) {
        if (this.currentMapUI) {
          this.currentMapUI.closeMap();
          this.currentMapUI = null;
          this.isDialogueOpen = false;
        } else {
          this.dialogueBox.skipOrNext();
        }
      } else if (this.currentInteractable) {
        this.openDialogue(this.currentInteractable);
      }
    });

    InputManager.onAction('CANCEL', () => {
      if (this.isDialogueOpen && this.currentMapUI) {
        this.currentMapUI.closeMap();
        this.currentMapUI = null;
        this.isDialogueOpen = false;
      }
    });

    InputManager.onAction('MENU', () => {
      if (!this.isDialogueOpen) {
        this.scene.pause();
        this.scene.launch('PauseScene', { sceneKey: 'TavernScene' });
      }
    });
  }

  openDialogue(id) {
    if (id === 'hilda') {
      this.isDialogueOpen = true;
      this.player.body.setVelocity(0, 0);
      this.shopUI.openShop();
      this.visitedNPCs.add('hilda');
      this.updateHUD();
    } else if (id === 'quadro_avisos') {
      this.isDialogueOpen = true;
      this.player.body.setVelocity(0, 0);
      this.currentMapUI = new WorldMapUI(this, 400, 300);
      this.currentMapUI.setDepth(60);
    } else if (id === 'joseph_sylven') {
      this.isDialogueOpen = true;
      this.player.body.setVelocity(0, 0);
      let josephId = 'joseph_initial';
      
      if (QuestManager.isQuestCompleted('quest_01_flashback')) {
        if (this.battleOutcome === 'victory') {
          josephId = 'joseph_victory';
        } else if (this.battleOutcome === 'defeat') {
          josephId = 'joseph_defeat';
        } else {
          josephId = 'joseph_victory'; // default legacy
        }
      } else if (this.visitedNPCs.size >= 4) {
        josephId = 'joseph_ready';
      }
      
      const dialogue = this.interactions[josephId];
      this.dialogueBox.setVisible(true);
      this.dialogueBox.startDialogue(dialogue);
    } else {
      const dialogue = this.interactions[id];
      if (dialogue) {
        this.isDialogueOpen = true;
        this.dialogueBox.setVisible(true);
        this.dialogueBox.startDialogue(dialogue);
        this.player.body.setVelocity(0, 0);
        if (['veronica_stinfy', 'traudon_alicia', 'john_bardem'].includes(id)) {
          this.visitedNPCs.add(id);
          this.updateHUD();
        }
      }
    }
  }

  updateHUD() {
    if (QuestManager.isQuestCompleted('quest_01_flashback')) {
      this.objectiveText.setText('Objetivo Atual: Saia da Taverna e vá ao Templo de Palmem ao norte de Rastphen');
    } else if (this.visitedNPCs.size >= 4) {
      this.objectiveText.setText('Objetivo: Fale com Joseph Sylven sobre o passado');
    } else {
      this.objectiveText.setText('Objetivo: Converse com todos os clientes da Taverna (' + this.visitedNPCs.size + '/4)');
    }
  }

  update() {
    if (!this.input.keyboard.enabled) return;

    if (this.returnedFromFlashback) {
      this.returnedFromFlashback = false;
      Logger.info('TavernScene', 'Retornou do Flashback. Missões atualizadas.');
      this.updateHUD();
    }

    if (this.isDialogueOpen) {
      return; 
    }

    // Leitura contínua das teclas para Movimentação Fluida
    const cursors = this.input.keyboard.createCursorKeys();
    const w = this.input.keyboard.addKey('W');
    const a = this.input.keyboard.addKey('A');
    const s = this.input.keyboard.addKey('S');
    const d = this.input.keyboard.addKey('D');

    let velX = 0;
    let velY = 0;
    const speed = 160;

    if (cursors.left.isDown || a.isDown) velX = -speed;
    else if (cursors.right.isDown || d.isDown) velX = speed;
    
    if (cursors.up.isDown || w.isDown) velY = -speed;
    else if (cursors.down.isDown || s.isDown) velY = speed;

    this.player.body.setVelocity(velX, velY);

    // Sistema de Gatilhos Espaciais (InteractableTrigger)
    let closest = null;
    let minDist = 50; // Raio de interação

    this.interactables.forEach(ent => {
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, ent.x, ent.y);
      if (dist < minDist) {
        minDist = dist;
        closest = ent;
      }
    });

    if (closest) {
      this.currentInteractable = closest.id;
      this.interactPrompt.setPosition(this.player.x, this.player.y - 30);
      this.interactPrompt.setVisible(true);
    } else {
      this.currentInteractable = null;
      this.interactPrompt.setVisible(false);
    }
  }
}
