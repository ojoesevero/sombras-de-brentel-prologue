import Phaser from 'phaser';
import InputManager from '../services/InputManager.js';
import WorldManager from '../services/WorldManager.js';
import Logger from '../utils/Logger.js';
import AudioManager from '../audio/AudioManager.js';
import InventoryManager from '../services/InventoryManager.js';
import QuestManager from '../services/QuestManager.js';
import Player from '../entities/Player.js';
import DevShortcuts from '../utils/DevShortcuts.js';
import { AssetsConfig } from '../config/assets.js';
import EnvironmentFX from '../utils/EnvironmentFX.js';
import NPCWalker from '../entities/NPCWalker.js';

/**
 * Cena da Estrada Exterior (Ato II - A Floresta Cinzenta).
 */
export class ForestRouteScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ForestRouteScene' });
  }

  init(data) {
    this.spawnData = data || {};
    this.spawnX = data?.x || 800;
    this.spawnY = data?.y || 100;
  }

  create() {
    AudioManager.init(this);
    window.playBGM(this, 'bgm_rastros_icor');
    Logger.info('ForestRouteScene', 'Cena ForestRouteScene iniciada com sucesso.');
    this.cameras.main.resetFX();
    this.cameras.main.fadeIn(300, 0, 0, 0);

    if (this.input.keyboard) this.input.keyboard.enabled = true;

    // Limites do Mundo Expandido (1600x1200)
    this.physics.world.setBounds(0, 0, 1600, 1200);

    // 1. Fundo da Floresta em Pixel Art verde musgo profundo
    this.add.rectangle(0, 0, 1600, 1200, 0x1a331a).setOrigin(0);

    // 2. Estrada de Terra com ranhuras e pedregulhos
    this.add.tileSprite(800, 600, 360, 1200, AssetsConfig.tiles.dirt_road).setOrigin(0.5);

    this.staticGroup = this.physics.add.staticGroup();

    // 3. Cercas de Madeira e Perímetro da Fazenda (com entrada desobstruída)
    [
      { x: 100, y: 340 }, { x: 164, y: 340 }, { x: 228, y: 340 }, // Cerca norte
      { x: 100, y: 560 }, { x: 164, y: 560 }, { x: 228, y: 560 }, { x: 292, y: 560 }, // Cerca sul
      { x: 68, y: 400 }, { x: 68, y: 464 }, { x: 68, y: 528 }, // Cerca oeste
      { x: 350, y: 360 } // Cerca leste com portão amplo aberto para a estrada
    ].forEach(fp => {
      const fence = this.add.image(fp.x, fp.y, AssetsConfig.tiles.fence).setDepth(2);
      this.physics.add.existing(fence, true);
      this.staticGroup.add(fence);
    });

    // 4. Fazenda dos Halflings e Celeiro Arrombado (Layout Espaçado e Fluido)
    this.add.rectangle(210, 450, 280, 200, 0x4a2e18).setDepth(1); // Terreno arado
    const farmhouse = this.add.rectangle(140, 410, 110, 90, 0x6e3b1b).setDepth(2);
    this.physics.add.existing(farmhouse, true);
    this.staticGroup.add(farmhouse);
    this.add.text(140, 410, 'Casa da Fazenda', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '9px',
      color: '#f1c40f',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(3);
    
    // Celeiro Arrombado posicionado com recuo limpo para acesso desimpedido
    this.celeiro = this.add.image(310, 410, AssetsConfig.tiles.barn).setDepth(2);
    this.physics.add.existing(this.celeiro, true);
    this.staticGroup.add(this.celeiro);
    this.add.text(310, 472, 'Celeiro Arrombado', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '9px',
      color: '#ffd700',
      fontStyle: 'bold',
      backgroundColor: 'rgba(10, 10, 16, 0.75)',
      padding: { x: 4, y: 2 }
    }).setOrigin(0.5).setDepth(4);

    // 5. Rastros de Sangue Negro e Garras da Besta (Guiando ao Sul para a Masmorra)
    [
      { x: 350, y: 470 }, { x: 450, y: 510 }, { x: 580, y: 560 },
      { x: 740, y: 660 }, { x: 820, y: 820 }, { x: 790, y: 1050 }
    ].forEach(tp => {
      this.add.image(tp.x, tp.y, AssetsConfig.tiles.beast_tracks).setDepth(1).setAlpha(0.8);
    });

    // 6. Bosque de Árvores Colisíveis (Excluindo a zona da fazenda para evitar sobreposição)
    this.treesList = [];
    const addTree = (x, y) => {
      this.add.ellipse(x, y + 26, 58, 20, 0x000000, 0.35).setDepth(1);
      const tree = this.add.circle(x, y, 38, 0x145a32).setDepth(5);
      tree.setStrokeStyle(3, 0x0e3a20);
      this.treesList.push(tree);
      this.physics.add.existing(tree, true);
      this.staticGroup.add(tree);
    };

    // Árvores a oeste (fora do raio da fazenda)
    for (let i = 0; i < 30; i++) {
      const tx = Phaser.Math.Between(50, 560);
      const ty = Phaser.Math.Between(50, 1150);
      // Proteção de perímetro: não gerar árvores dentro do lote da fazenda
      if (tx >= 50 && tx <= 440 && ty >= 300 && ty <= 640) {
        continue;
      }
      addTree(tx, ty);
    }
    // Árvores a leste da estrada
    for (let i = 0; i < 24; i++) {
      addTree(Phaser.Math.Between(1040, 1550), Phaser.Math.Between(50, 1150));
    }

    // 7. Efeitos Ambientais: Vento com folhas, árvores oscilantes e pássaros voando
    EnvironmentFX.addTreeSway(this, this.treesList);
    EnvironmentFX.addWindLeaves(this, { x: 0, y: 0, w: 1600, h: 1200 });
    EnvironmentFX.addFlyingBirds(this, { x: 0, y: 0, w: 1600, h: 1200 });

    // 8. NPCs: Fazendeiro e Patrulheiro da Fazenda (NPCWalker)
    this.staticGroupNPCs = this.physics.add.staticGroup();
    
    // Fazendeiro em Pixel Art com sombra e tag
    this.add.ellipse(200, 533, 22, 8, 0x000000, 0.35).setDepth(2);
    this.fazendeiro = this.add.sprite(200, 520, AssetsConfig.sprites.traudon).setDepth(3);
    this.physics.add.existing(this.fazendeiro, true);
    this.staticGroupNPCs.add(this.fazendeiro);
    this.add.text(200, 498, 'FAZENDEIRO', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '9px',
      color: '#ffd700',
      fontStyle: 'bold',
      backgroundColor: 'rgba(10, 10, 16, 0.75)',
      padding: { x: 4, y: 2 }
    }).setOrigin(0.5).setDepth(4);

    // Guarda da Fazenda patrulhando os limites da cerca
    this.farmPatrol = new NPCWalker(this, 370, 520, AssetsConfig.sprites.guard, {
      name: 'Vigia da Fazenda',
      speed: 35,
      depth: 3,
      waypoints: [
        { x: 370, y: 520, waitTime: 2500 },
        { x: 370, y: 370, waitTime: 2000 },
        { x: 230, y: 370, waitTime: 3000 },
        { x: 370, y: 370, waitTime: 1500 }
      ]
    });

    // O Jogador e Spawn (Player com FSM)
    this.player = new Player(this, this.spawnX, this.spawnY, 32, 32, 0x2980b9);
    if (this.spawnData?.loadedData?.player) {
      this.player.loadState(this.spawnData.loadedData.player);
    }
    
    this.physics.add.collider(this.player, this.staticGroup);
    this.physics.add.collider(this.player, this.staticGroupNPCs);

    // Câmera segue o jogador suavemente
    this.cameras.main.setBounds(0, 0, 1600, 1200);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

    // 9. Baú de Tesouro em Pixel Art com Animação e Partículas de Moedas
    this.chests = this.physics.add.group();
    this.add.ellipse(480, 592, 30, 10, 0x000000, 0.35).setDepth(1);
    const chest1 = this.add.sprite(480, 580, AssetsConfig.tiles.chest_closed).setDepth(2);
    this.physics.add.existing(chest1, true); 
    chest1.isOpened = false;
    this.chests.add(chest1);

    this.physics.add.overlap(this.player, this.chests, (player, chest) => {
      if (chest.isOpened) return;
      chest.isOpened = true;

      // Animação visual: troca de textura para baú aberto e efeito pop
      chest.setTexture(AssetsConfig.tiles.chest_open);
      this.tweens.add({
        targets: chest,
        scaleY: 1.25,
        scaleX: 1.1,
        duration: 150,
        yoyo: true,
        ease: 'Back.easeOut'
      });

      // Partículas de moedas douradas saltando
      if (this.textures.exists(AssetsConfig.fx.particle_coin)) {
        const coins = this.add.particles(chest.x, chest.y - 6, AssetsConfig.fx.particle_coin, {
          speedY: { min: -120, max: -60 },
          speedX: { min: -45, max: 45 },
          gravityY: 180,
          scale: { start: 1, end: 0.5 },
          lifespan: 800,
          quantity: 6,
          emitting: false
        }).setDepth(10);
        coins.explode(6);
        this.time.delayedCall(1000, () => coins.destroy());
      }

      Logger.info('ForestRouteScene', 'Baú de tesouro aberto! +1 Poção de Vida, +50 PO');
      InventoryManager.addItem('potion_heal', 1);
      InventoryManager.gold += 50;
      
      const fx = this.add.text(chest.x, chest.y - 25, '+50 PO & Poção de Cura!', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '11px',
        color: '#ffd700',
        fontStyle: 'bold',
        backgroundColor: 'rgba(0,0,0,0.75)',
        padding: { x: 4, y: 2 }
      }).setOrigin(0.5).setDepth(10);

      this.tweens.add({
        targets: fx,
        y: fx.y - 35,
        alpha: 0,
        duration: 1400,
        onComplete: () => fx.destroy()
      });
    });

    // 10. Inimigos de Campo em Patrulha Ativa (Goblins em movimento com FlipX)
    this.enemies = this.physics.add.group();
    const spawnPatrollingGoblin = (startX, startY, deltaX, deltaY) => {
      const shadow = this.add.ellipse(startX, startY + 13, 20, 8, 0x000000, 0.35).setDepth(2);
      const e = this.add.sprite(startX, startY, AssetsConfig.sprites.goblin || 'spr_guard').setDepth(3);
      this.physics.add.existing(e, false);
      e.body.setImmovable(true);
      this.enemies.add(e);

      const targetX = startX + deltaX;
      const targetY = startY + deltaY;

      this.tweens.add({
        targets: [e, shadow],
        x: targetX,
        y: targetY,
        duration: 2600,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        onYoyo: () => {
          if (deltaX !== 0) e.setFlipX(!e.flipX);
        },
        onRepeat: () => {
          if (deltaX !== 0) e.setFlipX(!e.flipX);
        },
        onUpdate: () => {
          if (e.body) {
            e.body.position.x = e.x - e.width / 2;
            e.body.position.y = e.y - e.height / 2;
          }
        }
      });

      return e;
    };

    spawnPatrollingGoblin(780, 500, 140, 0); // Patrulha horizontal na estrada
    spawnPatrollingGoblin(920, 860, 0, 120); // Patrulha vertical na bifurcação

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

    // Caching de teclado para prevenir Garbage Collection per-frame
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = {
      w: this.input.keyboard.addKey('W'),
      a: this.input.keyboard.addKey('A'),
      s: this.input.keyboard.addKey('S'),
      d: this.input.keyboard.addKey('D')
    };

    this.setupInputs();

    // Restaurar listeners de input ao retomar da pausa/batalha overlay
    this.events.on(Phaser.Scenes.Events.RESUME, () => {
      InputManager.init(this);
      if (typeof this.setupInputs === 'function') {
        this.setupInputs();
      }
    });

    // Ouvinte para conclusão de diálogos (avanço de missão)
    this._onGlobalDialogueClosed = () => {
      // Cooldown de interação para evitar Input Bubbling
      InputManager.ignoreInputs = true;
      this.time.delayedCall(250, () => {
        InputManager.ignoreInputs = false;
      });

      const target = this.activeDialogueTarget || this.currentInteractTarget;
      this.activeDialogueTarget = null;
      if (target === 'celeiro_pistas') {
        if (!window.gameState) window.gameState = { flags: {} };
        window.gameState.flags.investigatedBarn = true;

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

    // Atalhos de desenvolvedor protegidos por ambiente DEV
    if (import.meta.env?.DEV) {
      DevShortcuts.register(this);
    }
  }

  setupInputs() {
    this.events.off(Phaser.Scenes.Events.RESUME, this._bgmResumeHandler, this);
    this._bgmResumeHandler = () => {
      AudioManager.init(this);
      window.playBGM(this, 'bgm_rastros_icor');
    };
    this.events.on(Phaser.Scenes.Events.RESUME, this._bgmResumeHandler, this);

    InputManager.onAction('CONFIRM', () => {
      if (this.player && !this.player.canInteract()) {
        Logger.info('Intent', 'Input Z/ESPAÇO recebido: Avançando diálogo na UIScene.');
        this.game.events.emit('advanceDialogue');
        return;
      }

      if (this.currentInteractTarget) {
        this.activeDialogueTarget = this.currentInteractTarget;

        if (this.currentInteractTarget === 'celeiro_pistas') {
          if (window.gameState && window.gameState.flags && window.gameState.flags.investigatedBarn) {
            Logger.info('Intent', `Iniciando interação com alvo [celeiro_pistas] (Pós-investigação).`);
            this.interactIndicator.setVisible(false);
            this.game.events.emit('openDialogue', [{
              character: 'Rhogar (Pensamento)',
              text: 'O rastro de icor segue para dentro da floresta... Devo ter cuidado.'
            }]);
            return;
          }
        }

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

    // Movimentação via FSM (usando instâncias em cache)
    this.player.handleMovement(this.cursors, this.wasd, 200);

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
