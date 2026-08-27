import Phaser from 'phaser';
import InputManager from '../services/InputManager.js';
import WorldManager from '../services/WorldManager.js';
import Logger from '../utils/Logger.js';
import InventoryManager from '../services/InventoryManager.js';
import QuestManager from '../services/QuestManager.js';
import DialogueBox from '../ui/DialogueBox.js';

/**
 * Cena da Estrada Exterior (Ato II - A Floresta Cinzenta).
 */
export default class ForestRouteScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ForestRouteScene' });
  }

  init(data) {
    this.spawnData = data || {};
  }

  create() {
    this.isTransitioning = false;
    Logger.info('ForestRouteScene', 'Iniciando Rota da Floresta.');

    if (this.input.keyboard) this.input.keyboard.enabled = true;
    this.cameras.main.fadeIn(800, 0, 0, 0);

    // HUD de Objetivo
    this.objectiveText = this.add.text(800, 20, '', { fontSize: '14px', fill: '#ffff00', fontStyle: 'bold' }).setOrigin(0.5).setScrollFactor(0);
    this.objectiveText.setDepth(1900);

    // Limites do Mundo Expandido (1600x1200)
    this.physics.world.setBounds(0, 0, 1600, 1200);

    // Fundo da Floresta
    this.add.rectangle(0, 0, 1600, 1200, 0x224422).setOrigin(0);

    // Caminho da Estrada (Estética)
    this.add.rectangle(600, 0, 400, 1200, 0x4d3319).setOrigin(0);

    this.staticGroup = this.physics.add.staticGroup();

    // Gerador Procedural de Árvores Colisíveis
    const addTree = (x, y) => {
      const tree = this.add.circle(x, y, 40, 0x002200);
      this.physics.add.existing(tree, true);
      this.staticGroup.add(tree);
    };

    // Populando as margens com árvores
    for (let i = 0; i < 20; i++) {
      addTree(Phaser.Math.Between(50, 500), Phaser.Math.Between(50, 1150));
      addTree(Phaser.Math.Between(1100, 1550), Phaser.Math.Between(50, 1150));
    }

    // Fazenda dos Halflings (Bifurcação no meio da estrada)
    this.add.rectangle(200, 500, 300, 200, 0x6b4226); // Terreno Arado
    const farmhouse = this.add.rectangle(150, 450, 120, 100, 0x8b4513); // Casa
    this.physics.add.existing(farmhouse, true);
    this.staticGroup.add(farmhouse);
    
    this.celeiro = this.add.rectangle(300, 420, 100, 80, 0x5c4033); // Celeiro Destruído
    this.physics.add.existing(this.celeiro, true);
    this.staticGroup.add(this.celeiro);
    this.add.text(300, 420, 'Celeiro\n(Arrombado)', { fill: '#fff', fontSize: '12px' }).setOrigin(0.5);

    // NPC: Fazendeiro
    this.staticGroupNPCs = this.physics.add.staticGroup();
    this.fazendeiro = this.add.circle(200, 530, 15, 0xffa500);
    this.physics.add.existing(this.fazendeiro, true);
    this.staticGroupNPCs.add(this.fazendeiro);
    this.add.text(200, 530, 'Fazendeiro', { fill: '#fff', fontSize: '10px' }).setOrigin(0.5);

    // O Jogador e Spawn
    const spawnX = this.spawnData.x || (WorldManager.getSpawn()?.x || 800);
    const spawnY = this.spawnData.y || (WorldManager.getSpawn()?.y || 100);
    this.player = this.add.rectangle(spawnX, spawnY, 32, 32, 0x0055ff);
    this.physics.add.existing(this.player, false);
    this.player.body.setSize(32, 32);
    this.player.body.setCollideWorldBounds(true);
    
    this.physics.add.collider(this.player, this.staticGroup);
    this.physics.add.collider(this.player, this.staticGroupNPCs);

    // Câmera segue o jogador suavemente
    this.cameras.main.setBounds(0, 0, 1600, 1200);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

    // Baús de Itens (Exploração)
    this.chests = this.physics.add.group();
    const chest1 = this.add.rectangle(450, 600, 32, 32, 0xffff00);
    this.physics.add.existing(chest1, true); 
    this.chests.add(chest1);

    this.physics.add.overlap(this.player, this.chests, (player, chest) => {
      Logger.info('ForestRouteScene', 'Baú encontrado! +1 Poção de Vida, +50 PO');
      InventoryManager.addItem('potion_heal', 1);
      InventoryManager.gold += 50;
      
      const fx = this.add.text(chest.x, chest.y - 20, '+ Saque', { fill: '#ff0' }).setOrigin(0.5);
      this.tweens.add({ targets: fx, y: fx.y - 40, alpha: 0, duration: 1000, onComplete: () => fx.destroy() });
      
      chest.destroy();
    });

    // Inimigos de Campo (Encontros Aleatórios ou Fixos)
    this.enemies = this.physics.add.group();
    const patrol1 = this.add.rectangle(800, 500, 32, 32, 0xff0000);
    this.physics.add.existing(patrol1, false);
    patrol1.body.setImmovable(true);
    this.enemies.add(patrol1);

    const patrol2 = this.add.rectangle(900, 900, 32, 32, 0xff0000);
    this.physics.add.existing(patrol2, false);
    patrol2.body.setImmovable(true);
    this.enemies.add(patrol2);

    this.physics.add.overlap(this.player, this.enemies, (player, enemy) => {
      if (this.scene.isPaused()) return; // Previne invocação simultânea múltipla
      
      Logger.info('ForestRouteScene', 'Emboscada da floresta engatilhada!');
      enemy.destroy(); // Remove do mapa após a colisão
      this.scene.pause();
      
      this.scene.launch('BattleScene', {
        enemies: [{ name: 'Goblin', hp: 40, attack: 12 }],
        returnScene: 'ForestRouteScene',
        isOverlay: true,
        isFlashback: false
      });
    });

    // Zonas de Transição (Norte -> Taverna, Sul -> Fim da Demo)
    this.northZone = this.add.rectangle(800, 10, 400, 20, 0x0000ff, 0.5);
    this.physics.add.existing(this.northZone, true);
    
    this.southZone = this.add.rectangle(800, 1150, 400, 40, 0xff00ff, 0.5);
    this.physics.add.existing(this.southZone, true);

    this.physics.add.overlap(this.player, this.northZone, () => {
      if (!this.isInteracting) {
        WorldManager.transitionTo(this, 'RastphenCityScene', { x: 1200, y: 1720 });
      }
    });

    this.physics.add.overlap(this.player, this.southZone, () => {
      if (!this.isInteracting) {
        if (!QuestManager.isQuestCompleted('quest_03_investigate_farm')) {
          this.player.y -= 35; // pushback
          this.player.body.setVelocity(0, 0);
          this.isInteracting = true;
          
          const thoughts = this.cache.json.get('thought_interactions');
          this.dialogueBox.setVisible(true);
          this.dialogueBox.startDialogue(thoughts['thought_locked_dungeon_entry']);
        } else {
          WorldManager.transitionTo(this, 'DungeonScene', { x: 800, y: 150 });
        }
      }
    });

    // Interações e Diálogos
    this.dialogueBox = new DialogueBox(this, 50, 440, 700, 140);
    this.dialogueBox.setDepth(2000);
    this.dialogueBox.setScrollFactor(0);
    this.dialogueBox.setVisible(false);
    
    this.isInteracting = false;
    this.interactionsData = this.cache.json.get('act2_interactions');

    this.interactIndicator = this.add.text(0, 0, '[Z]', { fontSize: '16px', fill: '#ffff00', fontStyle: 'bold' }).setOrigin(0.5).setVisible(false);
    this.currentInteractTarget = null;
    
    this.setupInteractions();

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
          Logger.info('ForestRouteScene', `Iniciando diálogo: ${this.currentInteractTarget}`);
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
      this.scene.launch('PauseScene', { sceneKey: 'ForestRouteScene' });
    });

    this.dialogueBox.on('dialogueComplete', () => {
      this.isInteracting = false;
      // Lógica Narrativa (Quest) ao Inspecionar o Celeiro
      if (this.currentInteractTarget === 'celeiro_pistas') {
        if (!QuestManager.isQuestCompleted('quest_03_investigate_farm')) {
          QuestManager.advanceQuest('quest_03_investigate_farm', 'completed');
          QuestManager.advanceQuest('quest_04_forest_trail', 'active');
          Logger.info('ForestRouteScene', 'Quest "Rastros na Névoa" concluída! Nova Quest Ativa.');
        }
        this.objectiveText.setText('Objetivo Atual: Siga os rastros do Minotauro até a Masmorra do Bosque Cinzento (Sul)');
      }
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

    addZone(this.fazendeiro, 'halfling_fazendeiro');
    addZone(this.celeiro, 'celeiro_pistas');
  }

  update() {
    if (this.isInteracting) return;
    if (!this.input.keyboard.enabled) return;

    const cursors = this.input.keyboard.createCursorKeys();
    const w = this.input.keyboard.addKey('W');
    const a = this.input.keyboard.addKey('A');
    const s = this.input.keyboard.addKey('S');
    const d = this.input.keyboard.addKey('D');

    let velX = 0;
    let velY = 0;
    const speed = 200;

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
