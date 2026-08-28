import Phaser from 'phaser';
import InputManager from '../services/InputManager.js';
import WorldManager from '../services/WorldManager.js';
import Logger from '../utils/Logger.js';
import InventoryManager from '../services/InventoryManager.js';
import QuestManager from '../services/QuestManager.js';
import Player from '../entities/Player.js';
import DevShortcuts from '../utils/DevShortcuts.js';

/**
 * Cena da Estrada Exterior (Ato II - A Floresta Cinzenta).
 */
export class ForestRouteScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ForestRouteScene' });
  }

  init(data) {
    this.spawnX = data?.x || 800;
    this.spawnY = data?.y || 100;
  }

  create() {
    Logger.info('ForestRouteScene', 'Cena ForestRouteScene iniciada com sucesso.');
    this.cameras.main.resetFX();
    this.cameras.main.fadeIn(300, 0, 0, 0);

    if (this.input.keyboard) this.input.keyboard.enabled = true;

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
    this.fazendeiro = this.add.rectangle(200, 530, 32, 32, 0xf1c40f);
    this.physics.add.existing(this.fazendeiro, true);
    this.staticGroupNPCs.add(this.fazendeiro);
    this.add.text(200, 530, 'Fazendeiro', { fill: '#fff', fontSize: '10px' }).setOrigin(0.5);

    // O Jogador e Spawn (Player com FSM)
    this.player = new Player(this, this.spawnX, this.spawnY, 32, 32, 0x2980b9);
    
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

    // Inimigos de Campo (Emboscada)
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
      if (this.scene.isPaused()) return;
      
      Logger.info('ForestRouteScene', 'Emboscada da floresta engatilhada!');
      enemy.destroy();
      this.scene.pause();
      
      this.scene.launch('BattleScene', {
        enemies: [{ name: 'Goblin', hp: 40, attack: 12 }],
        returnScene: 'ForestRouteScene',
        isOverlay: true,
        isFlashback: false
      });
    });

    // Portas e Triggers Data-Driven
    WorldManager.buildTransitions(this);

    // Interações e Diálogos
    this.interactionsData = this.cache.json.get('act2_interactions');
    this.interactIndicator = this.add.text(0, 0, '[Z]', { fontSize: '16px', fill: '#ffff00', fontStyle: 'bold' }).setOrigin(0.5).setVisible(false);
    this.currentInteractTarget = null;
    
    this.setupInteractions();
    this.updateHUD();

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
          Logger.warn('ForestRouteScene', `Nenhum dado de diálogo encontrado para ${this.currentInteractTarget}`);
        }
      }
    });

    InputManager.onAction('MENU', () => {
      if (this.player && !this.player.canInteract()) return;
      this.scene.pause();
      this.scene.launch('PauseScene', { sceneKey: 'ForestRouteScene' });
    });

    // Ouvinte para conclusão de diálogos (avanço de missão)
    this._onGlobalDialogueClosed = () => {
      const target = this.activeDialogueTarget || this.currentInteractTarget;
      this.activeDialogueTarget = null;
      if (target === 'celeiro_pistas') {
        if (!QuestManager.isQuestCompleted('quest_03_investigate_farm')) {
          QuestManager.advanceQuest('quest_03_investigate_farm', 'completed');
          QuestManager.advanceQuest('quest_04_forest_trail', 'active');
          Logger.info('ForestRouteScene', 'Quest "Rastros na Névoa" concluída! Nova Quest Ativa.');
        }
        this.updateHUD();
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
    if (QuestManager.isQuestCompleted('quest_03_investigate_farm')) {
      text = 'Objetivo Atual: Siga os rastros do Minotauro até a Masmorra do Bosque Cinzento (Sul)';
    } else {
      text = 'Objetivo Atual: Investigue o celeiro destruído na Fazenda dos Halflings';
    }
    this.game.events.emit('updateObjective', text);
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
    if (!this.input.keyboard || !this.input.keyboard.enabled) return;

    const cursors = this.input.keyboard.createCursorKeys();
    const wasd = {
      w: this.input.keyboard.addKey('W'),
      a: this.input.keyboard.addKey('A'),
      s: this.input.keyboard.addKey('S'),
      d: this.input.keyboard.addKey('D')
    };

    // Movimentação via FSM
    this.player.handleMovement(cursors, wasd, 200);

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

export default ForestRouteScene;
