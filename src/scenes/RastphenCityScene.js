import Phaser from 'phaser';
import InputManager from '../services/InputManager.js';
import WorldManager from '../services/WorldManager.js';
import Logger from '../utils/Logger.js';
import DialogueBox from '../ui/DialogueBox.js';

/**
 * Cena Hub de Mundo Aberto - Rastphen.
 */
export default class RastphenCityScene extends Phaser.Scene {
  constructor() {
    super({ key: 'RastphenCityScene' });
  }

  init(data) {
    this.spawnData = data || {};
  }

  create() {
    this.isTransitioning = false;
    Logger.info('RastphenCityScene', 'Renderizando mapa aberto da cidade.');
    this.cameras.main.resetFX();
    this.cameras.main.fadeIn(400, 0, 0, 0);

    // Limites da malha urbana (2400x1800)
    this.physics.world.setBounds(0, 0, 2400, 1800);
    this.add.rectangle(0, 0, 2400, 1800, 0x4a4a4a).setOrigin(0); // Piso basalto

    this.staticGroup = this.physics.add.staticGroup();

    // Procedural genérico de construções e muralhas
    const addBuilding = (x, y, w, h) => {
      const b = this.add.rectangle(x, y, w, h, 0x2d2d2d);
      this.physics.add.existing(b, true);
      this.staticGroup.add(b);
    };

    // Muralhas da Cidade
    addBuilding(1200, 10, 2400, 40);  // Muro Norte
    addBuilding(10, 900, 20, 1800);   // Muro Oeste
    addBuilding(2390, 900, 20, 1800); // Muro Leste
    
    // Praça Central (Decalques)
    this.add.circle(1200, 900, 150, 0x666666);
    this.add.text(1200, 900, 'Mercado Central', { fill: '#aaa' }).setOrigin(0.5);

    // Monumentos e Construções Relevantes
    addBuilding(1200, 200, 600, 300);
    this.add.text(1200, 250, 'Templo de Palmem', { fill: '#fff', fontSize: '24px' }).setOrigin(0.5);

    addBuilding(300, 800, 400, 300);
    this.add.text(300, 800, 'Taverna Cauda do Dragão', { fill: '#fff', fontSize: '20px' }).setOrigin(0.5);

    // NPCs da Cidade
    this.staticGroupNPCs = this.physics.add.staticGroup();
    
    this.mercadorYanil = this.add.circle(1200, 850, 20, 0x00ff00);
    this.physics.add.existing(this.mercadorYanil, true);
    this.staticGroupNPCs.add(this.mercadorYanil);
    this.add.text(1200, 850, 'Yânil', { fill: '#fff' }).setOrigin(0.5);

    this.guardaTelmer = this.add.rectangle(1100, 1750, 32, 32, 0xaaaaaa);
    this.physics.add.existing(this.guardaTelmer, true);
    this.staticGroupNPCs.add(this.guardaTelmer);

    this.guardaBreno = this.add.rectangle(1300, 1750, 32, 32, 0xaaaaaa);
    this.physics.add.existing(this.guardaBreno, true);
    this.staticGroupNPCs.add(this.guardaBreno);

    // Sistema de Telemetria e Spawn do Jogador
    const spawnX = this.spawnData.x || (WorldManager.getSpawn()?.x || 1200);
    const spawnY = this.spawnData.y || (WorldManager.getSpawn()?.y || 900);
    this.player = this.add.rectangle(spawnX, spawnY, 32, 32, 0x0055ff);
    this.physics.add.existing(this.player, false);
    this.player.body.setSize(32, 32);
    this.player.body.setCollideWorldBounds(true);
    
    this.physics.add.collider(this.player, this.staticGroup);
    this.physics.add.collider(this.player, this.staticGroupNPCs);

    // Estabilidade Óptica (Camera Tracking)
    this.cameras.main.setBounds(0, 0, 2400, 1800);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    // Portas e Triggers de Transição (Bidirecionais)
    
    // Porta da Taverna (Lado direito da Taverna)
    this.tavernTrigger = this.add.rectangle(520, 800, 50, 80, 0x00ffff, 0.5);
    this.physics.add.existing(this.tavernTrigger, true);
    this.physics.add.overlap(this.player, this.tavernTrigger, () => {
      if (!this.isDialogueOpen) {
        WorldManager.transitionTo(this, 'TavernScene', { x: 400, y: 540 });
      }
    });

    // Porta Norte (Templo)
    this.templeTrigger = this.add.rectangle(1200, 370, 400, 50, 0x00ffff, 0.5);
    this.physics.add.existing(this.templeTrigger, true);
    this.physics.add.overlap(this.player, this.templeTrigger, () => {
      if (!this.isDialogueOpen) {
        WorldManager.transitionTo(this, 'TempleScene', { x: 400, y: 520 });
      }
    });

    // Portão Sul (Saída pro Mato/Dungeon)
    this.southGateTrigger = this.add.rectangle(1200, 1790, 400, 40, 0x00ff00, 0.5);
    this.physics.add.existing(this.southGateTrigger, true);
    this.physics.add.overlap(this.player, this.southGateTrigger, () => {
      if (!this.isDialogueOpen) {
        if (!QuestManager.isQuestCompleted('quest_02_temple')) {
          this.player.y -= 30; // pushback
          this.player.body.setVelocity(0, 0);
          this.isDialogueOpen = true;
          
          const thoughts = this.cache.json.get('thought_interactions');
          this.dialogueBox.setVisible(true);
          this.dialogueBox.startDialogue(thoughts['thought_locked_south_gate']);
        } else {
          WorldManager.transitionTo(this, 'ForestRouteScene', { x: 400, y: 150 });
        }
      }
    });

    // Interações e Diálogos
    this.dialogueBox = new DialogueBox(this, 50, 440, 700, 140);
    this.dialogueBox.setDepth(2000);
    this.dialogueBox.setScrollFactor(0);
    this.dialogueBox.setVisible(false);
    
    this.isDialogueOpen = false;
    this.interactionsData = this.cache.json.get('act2_interactions');

    this.interactIndicator = this.add.text(0, 0, '[Z]', { fontSize: '16px', fill: '#ffff00', fontStyle: 'bold' }).setOrigin(0.5).setVisible(false);
    this.currentInteractTarget = null;
    
    this.setupInteractions();

    // Inputs e Pause
    InputManager.init(this);
    if (this.input.keyboard) {
      this.input.keyboard.enabled = true;
    }

    InputManager.onAction('CONFIRM', () => {
      if (this.isDialogueOpen) {
        this.dialogueBox.skipOrNext();
        return;
      }

      if (this.currentInteractTarget) {
        this.isDialogueOpen = true;
        this.player.body.setVelocity(0, 0);
        this.interactIndicator.setVisible(false);
        
        let data = this.interactionsData[this.currentInteractTarget];
        if (data) {
          if (data.nodes) data = data.nodes;
          Logger.info('RastphenCityScene', `Iniciando diálogo: ${this.currentInteractTarget}`);
          this.dialogueBox.setVisible(true);
          this.dialogueBox.startDialogue(data);
        } else {
          this.isDialogueOpen = false;
        }
      }
    });

    InputManager.onAction('MENU', () => {
      if (this.isDialogueOpen) return;
      this.scene.pause();
      this.scene.launch('PauseScene', { sceneKey: 'RastphenCityScene' });
    });

    this.dialogueBox.on('dialogueComplete', () => {
      this.dialogueBox.setVisible(false);
      this.isDialogueOpen = false;
    });
  }

  setupInteractions() {
    this.interactZones = this.physics.add.group();

    const addZone = (target, id) => {
      const zone = this.add.zone(target.x, target.y, target.width ? target.width + 40 : 90, target.height ? target.height + 40 : 90);
      this.physics.add.existing(zone, true);
      zone.interactId = id;
      zone.targetEntity = target;
      this.interactZones.add(zone);
    };

    addZone(this.mercadorYanil, 'mercador_yanil');
    addZone(this.guardaTelmer, 'guardas_muralha');
    addZone(this.guardaBreno, 'guardas_muralha');
  }

  update() {
    if (this.isDialogueOpen) return;
    if (!this.input.keyboard.enabled) return;
    
    const cursors = this.input.keyboard.createCursorKeys();
    const w = this.input.keyboard.addKey('W');
    const a = this.input.keyboard.addKey('A');
    const s = this.input.keyboard.addKey('S');
    const d = this.input.keyboard.addKey('D');

    let velX = 0;
    let velY = 0;
    const speed = 250; // Nas ruas pavimentadas o sprint é maior

    if (cursors.left.isDown || a.isDown) velX = -speed;
    else if (cursors.right.isDown || d.isDown) velX = speed;
    
    if (cursors.up.isDown || w.isDown) velY = -speed;
    else if (cursors.down.isDown || s.isDown) velY = speed;

    this.player.body.setVelocity(velX, velY);

    // Checar zonas de interação
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
