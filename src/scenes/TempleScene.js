import Phaser from 'phaser';
import InputManager from '../services/InputManager.js';
import WorldManager from '../services/WorldManager.js';
import QuestManager from '../services/QuestManager.js';
import Logger from '../utils/Logger.js';
import DialogueBox from '../ui/DialogueBox.js';

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
    this.isTransitioning = false;
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
    const leito = this.add.rectangle(150, 100, 80, 120, 0x8b0000);
    this.physics.add.existing(leito, true);
    this.staticGroup.add(leito);
    this.add.text(150, 100, 'Gruther\n(Febril)', { fill: '#fff', fontSize: '10px' }).setOrigin(0.5);

    // NPCs e Zonas
    this.staticGroupNPCs = this.physics.add.staticGroup();
    
    // Sacerdotisa
    this.sacerdotisa = this.add.circle(400, 220, 16, 0x00aaff);
    this.physics.add.existing(this.sacerdotisa, true);
    this.staticGroupNPCs.add(this.sacerdotisa);
    this.add.text(400, 220, 'Sacerdotisa', { fill: '#fff', fontSize: '10px' }).setOrigin(0.5);

    // Spawn do Jogador
    const spawnX = this.spawnData.x || (WorldManager.getSpawn()?.x || 400);
    const spawnY = this.spawnData.y || (WorldManager.getSpawn()?.y || 520);
    this.player = this.add.rectangle(spawnX, spawnY, 32, 32, 0x0055ff);
    this.physics.add.existing(this.player, false);
    this.player.body.setSize(32, 32);
    this.player.body.setCollideWorldBounds(true);
    
    this.physics.add.collider(this.player, this.staticGroup);
    this.physics.add.collider(this.player, this.staticGroupNPCs);

    // Porta Sul (Saída)
    this.southDoor = this.add.rectangle(400, 590, 160, 20, 0x00ffff, 0.5);
    this.physics.add.existing(this.southDoor, true);
    this.physics.add.overlap(this.player, this.southDoor, () => {
      if (!this.isInteracting) {
        WorldManager.transitionTo(this, 'RastphenCityScene', { x: 600, y: 220 });
      }
    });

    // HUD de Objetivo
    this.objectiveText = this.add.text(400, 20, '', { fontSize: '14px', fill: '#ffff00', fontStyle: 'bold' }).setOrigin(0.5).setScrollFactor(0);
    this.objectiveText.setDepth(50);

    // Interações e Diálogos
    this.dialogueBox = new DialogueBox(this, 50, 440, 700, 140);
    this.dialogueBox.setDepth(1000);
    this.dialogueBox.setScrollFactor(0);
    this.dialogueBox.setVisible(false);
    
    this.isInteracting = false;
    this.interactionsData = this.cache.json.get('act2_interactions');
    this.interactIndicator = this.add.text(0, 0, '▼ [Z] Interagir', { fontSize: '14px', fill: '#ffff00', backgroundColor: '#000' }).setOrigin(0.5).setVisible(false);
    this.currentInteractTarget = null;
    
    this.setupInteractions();

    // Inputs e Pause
    InputManager.init(this);
    if (this.input.keyboard) this.input.keyboard.enabled = true;

    InputManager.onAction('CONFIRM', () => {
      if (this.isInteracting) {
        this.dialogueBox.skipOrNext();
        return;
      }

      if (this.currentInteractTarget) {
        this.isInteracting = true;
        this.player.body.setVelocity(0, 0);
        this.interactIndicator.setVisible(false);
        
        let data = this.interactionsData[this.currentInteractTarget];
        if (data) {
          if (data.nodes) data = data.nodes;
          Logger.info('TempleScene', `Iniciando diálogo: ${this.currentInteractTarget}`);
          this.dialogueBox.setVisible(true);
          this.dialogueBox.startDialogue(data);
        } else {
          this.isInteracting = false;
        }
      }
    });

    InputManager.onAction('MENU', () => {
      if (this.isInteracting) return;
      this.scene.pause();
      this.scene.launch('PauseScene', { sceneKey: 'TempleScene' });
    });

    this.dialogueBox.on('dialogueComplete', () => {
      this.isInteracting = false;
      // Avançar missão ao falar com Sacerdotisa ou Gruther
      if (this.currentInteractTarget === 'sacerdotisa_palmem' || this.currentInteractTarget === 'gruther_leito') {
        if (!QuestManager.isQuestCompleted('quest_02_temple')) {
          QuestManager.advanceQuest('quest_02_temple', 'completed');
          QuestManager.advanceQuest('quest_03_investigate_farm', 'active');
          Logger.info('TempleScene', 'Quest "O Templo de Palmem" concluída! Nova Missão: Investigar a Fazenda.');
          this.objectiveText.setText('Objetivo Atual: Investigue o celeiro na Fazenda dos Halflings na Estrada Sul');
        }
      }
    });
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
    const leitoZone = this.add.zone(150, 100, 100, 140);
    this.physics.add.existing(leitoZone, true);
    leitoZone.interactId = 'gruther_leito';
    leitoZone.targetEntity = { x: 150, y: 100 };
    this.interactZones.add(leitoZone);
  }

  update() {
    if (this.isInteracting) return;
    if (!this.input.keyboard.enabled) return;
    
    const cursors = this.input.keyboard.createCursorKeys();
    const w = this.input.keyboard.addKey('W');
    const a = this.input.keyboard.addKey('A');
    const s = this.input.keyboard.addKey('S');
    const d = this.input.keyboard.addKey('D');

    let velX = 0; let velY = 0;
    const speed = 180;

    if (cursors.left.isDown || a.isDown) velX = -speed;
    else if (cursors.right.isDown || d.isDown) velX = speed;
    if (cursors.up.isDown || w.isDown) velY = -speed;
    else if (cursors.down.isDown || s.isDown) velY = speed;

    this.player.body.setVelocity(velX, velY);

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
