import Phaser from 'phaser';
import InputManager from '../services/InputManager.js';
import WorldManager from '../services/WorldManager.js';
import SaveManager from '../services/SaveManager.js';
import Logger from '../utils/Logger.js';
import Player from '../entities/Player.js';
import DevShortcuts from '../utils/DevShortcuts.js';
import { AssetsConfig } from '../config/assets.js';
import EnvironmentFX from '../utils/EnvironmentFX.js';
import NPCWalker from '../entities/NPCWalker.js';

/**
 * Cena da Masmorra do Bosque Cinzento (Ato III).
 * Puzzle de 3 Runas e Checkpoint (Fogueira).
 */
export default class DungeonScene extends Phaser.Scene {
  constructor() {
    super({ key: 'DungeonScene' });
  }

  init(data) {
    this.spawnData = data || {};
  }

  create() {
    this.runasPurificadas = 0;
    Logger.info('DungeonScene', 'Iniciando Masmorra do Bosque Cinzento.');

    this.cameras.main.resetFX();
    this.cameras.main.fadeIn(400, 0, 0, 0);

    // Layout e Atmosfera (1600x1200) em Pixel Art de Masmorra Antiga
    this.physics.world.setBounds(0, 0, 1600, 1200);
    this.add.rectangle(0, 0, 1600, 1200, 0x14141c).setOrigin(0);

    // 1. Névoa Translúcida Horizontal Rastejante
    EnvironmentFX.addAtmosphericFog(this, { x: 0, y: 0, w: 1600, h: 1200 });

    // Paredes e Colisões (staticGroup)
    this.staticGroup = this.physics.add.staticGroup();

    // Bordas externas da masmorra
    this.staticGroup.add(this.add.rectangle(800, 5, 1600, 10, 0x222222)); // Norte
    this.staticGroup.add(this.add.rectangle(800, 1195, 1600, 10, 0x222222)); // Sul
    this.staticGroup.add(this.add.rectangle(5, 600, 10, 1200, 0x222222)); // Oeste
    this.staticGroup.add(this.add.rectangle(1595, 600, 10, 1200, 0x222222)); // Leste
    
    // 2. Pilares de Carvalho Avermelhado e Basalto (Redwood Pillars)
    const addPillar = (px, py) => {
      this.add.ellipse(px, py + 26, 60, 18, 0x000000, 0.4).setDepth(1);
      const pillar = this.add.image(px, py, AssetsConfig.tiles.redwood_pillar).setDepth(2);
      this.physics.add.existing(pillar, true);
      this.staticGroup.add(pillar);
      return pillar;
    };

    addPillar(400, 400);
    addPillar(1200, 400);
    addPillar(400, 800);
    addPillar(1200, 800);

    // O Jogador e Spawn (Player com FSM)
    const spawnX = this.spawnData.x || (WorldManager.getSpawn()?.x || 800);
    const spawnY = this.spawnData.y || (WorldManager.getSpawn()?.y || 150);
    this.player = new Player(this, spawnX, spawnY, 32, 32, 0x0055ff);
    if (this.spawnData.loadedData?.player) {
      this.player.loadState(this.spawnData.loadedData.player);
    }
    this.physics.add.collider(this.player, this.staticGroup);

    // Câmera Tracking
    this.cameras.main.setBounds(0, 0, 1600, 1200);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

    // 3. Fogueira (Ponto de Checkpoint) com Iluminação e Brasas
    this.fogueira = this.add.circle(800, 600, 18, 0xd35400).setDepth(2);
    this.physics.add.existing(this.fogueira, true);
    this.staticGroup.add(this.fogueira);

    const fireGlow = this.add.circle(800, 600, 80, 0xff9f1a, 0.22)
      .setDepth(1)
      .setBlendMode(Phaser.BlendModes.ADD);

    this.tweens.add({
      targets: fireGlow,
      alpha: 0.38,
      scale: 1.15,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    if (this.textures.exists(AssetsConfig.fx.particle_ember)) {
      this.add.particles(800, 595, AssetsConfig.fx.particle_ember, {
        speedY: { min: -35, max: -12 },
        speedX: { min: -15, max: 15 },
        scale: { start: 0.5, end: 0 },
        alpha: { start: 0.85, end: 0 },
        lifespan: 1300,
        frequency: 180,
        blendMode: 'ADD'
      }).setDepth(3);
    }

    this.add.text(800, 565, 'FOGUEIRA', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '9px',
      color: '#ffd700',
      fontStyle: 'bold',
      backgroundColor: 'rgba(10, 10, 16, 0.75)',
      padding: { x: 4, y: 2 }
    }).setOrigin(0.5).setDepth(4);

    // 4. 3 Altares de Runa de Purificação com Efeito de Luz
    this.pedestais = this.physics.add.staticGroup();
    
    const createAltar = (rx, ry) => {
      this.add.ellipse(rx, ry + 18, 38, 12, 0x000000, 0.35).setDepth(1);
      const altar = this.add.image(rx, ry, AssetsConfig.tiles.altar_rune).setDepth(2);
      this.physics.add.existing(altar, true);
      altar.isPurified = false;

      // Brilho arcano da runa (violeta/púrpura inicial)
      altar.runeGlow = this.add.circle(rx, ry, 34, 0x8e44ad, 0.28)
        .setDepth(1)
        .setBlendMode(Phaser.BlendModes.ADD);

      this.tweens.add({
        targets: altar.runeGlow,
        alpha: 0.55,
        scale: 1.25,
        duration: 900,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      this.pedestais.add(altar);
      return altar;
    };

    this.runa1 = createAltar(300, 300);
    this.runa2 = createAltar(1300, 300);
    this.runa3 = createAltar(800, 950);

    this.physics.add.collider(this.player, this.pedestais);

    // 5. Cultista Patrulheiro Ambulante (NPCWalker)
    this.dungeonPatrol = new NPCWalker(this, 700, 420, AssetsConfig.sprites.cultist, {
      name: 'Cultista Vigia',
      speed: 32,
      depth: 3,
      waypoints: [
        { x: 700, y: 420, waitTime: 3000 },
        { x: 900, y: 420, waitTime: 3000 },
        { x: 800, y: 520, waitTime: 2000 }
      ]
    });

    // 6. Inimigos de Combate da Masmorra (em Pixel Art com sombras)
    this.enemies = this.physics.add.group();
    const spawnEnemy = (x, y, type) => {
      const tex = type === 'corruptor' ? AssetsConfig.sprites.iksar : AssetsConfig.sprites.cultist;
      this.add.ellipse(x, y + 13, 22, 8, 0x000000, 0.35).setDepth(2);
      const e = this.add.sprite(x, y, tex).setDepth(3);
      this.physics.add.existing(e, false);
      e.body.setImmovable(true);
      e.enemyType = type;
      this.enemies.add(e);
      return e;
    };

    spawnEnemy(600, 400, 'cultista');
    spawnEnemy(1000, 400, 'cultista');
    spawnEnemy(800, 800, 'corruptor');

    this.physics.add.overlap(this.player, this.enemies, (player, enemy) => {
      if (this.scene.isPaused()) return;
      
      Logger.info('DungeonScene', `Iniciando combate na Masmorra: ${enemy.enemyType}`);
      const type = enemy.enemyType;
      enemy.destroy();
      this.scene.pause();
      
      let enemyData = [{ name: 'Cultista das Sombras', hp: 45, attack: 14 }];
      if (type === 'corruptor') {
        enemyData = [{ name: 'Corruptor Abissal', hp: 70, attack: 18 }];
      }

      this.scene.launch('BattleScene', {
        enemies: enemyData,
        returnScene: 'DungeonScene',
        isOverlay: true,
        isFlashback: false
      });
    });

    // Zonas Interativas
    this.interactZones = this.physics.add.group();
    const addZone = (target, id) => {
      const zone = this.add.zone(target.x, target.y, 80, 80);
      this.physics.add.existing(zone, true);
      zone.interactId = id;
      zone.targetEntity = target;
      this.interactZones.add(zone);
    };

    addZone(this.fogueira, 'fogueira');
    addZone(this.runa1, 'runa');
    addZone(this.runa2, 'runa');
    addZone(this.runa3, 'runa');

    this.interactIndicator = this.add.text(0, 0, '▼ [Z] Interagir', { fontSize: '14px', fill: '#ffff00', backgroundColor: '#000' }).setOrigin(0.5).setVisible(false);
    this.currentInteractTarget = null;
    this.currentInteractEntity = null;

    // Grande Portão Sul em Pixel Art com Selo Mágico
    this.gateImage = this.add.image(800, 1160, AssetsConfig.tiles.sealed_gate).setDepth(2);
    this.gateSealGlow = this.add.circle(800, 1160, 42, 0x8e44ad, 0.35)
      .setDepth(1)
      .setBlendMode(Phaser.BlendModes.ADD);

    this.tweens.add({
      targets: this.gateSealGlow,
      alpha: 0.65,
      scale: 1.2,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    this.southGate = this.add.zone(800, 1170, 140, 50);
    this.physics.add.existing(this.southGate, true);
    this.southGateActive = false;
    
    this.physics.add.overlap(this.player, this.southGate, () => {
      if (this.player && !this.player.canInteract()) return;

      if (this.southGateActive) {
        WorldManager.transitionTo(this, 'DemoEndScene');
      } else {
        this.player.y -= 30;
        this.player.body.setVelocity(0, 0);
        
        const thoughts = this.cache.json.get('thought_interactions') || {};
        const thoughtData = thoughts['thought_locked_boss_gate'] || {
          character: 'Rhogar (Pensamento)',
          text: 'O portão está trancado por três selos de pestilência. Devo purificar os três altares de runas da masmorra.'
        };
        this.game.events.emit('openDialogue', [thoughtData]);
      }
    });

    this.updateHUD();

    // Inputs
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

    // Atalhos de desenvolvedor protegidos por ambiente DEV
    if (import.meta.env?.DEV) {
      DevShortcuts.register(this);
    }
  }

  setupInputs() {
    InputManager.onAction('CONFIRM', () => {
      if (this.player && !this.player.canInteract()) {
        this.game.events.emit('advanceDialogue');
        return;
      }

      if (this.currentInteractTarget === 'fogueira') {
        Logger.info('DungeonScene', 'Fogueira ativada: Salvando o jogo e curando.');
        if (this.player) {
          this.player.hp = this.player.maxHp;
          this.player.checkpoint = 'DungeonScene';
          this.player.currentScene = 'DungeonScene';
        }
        SaveManager.saveGame(this.player);
        
        const floatText = this.add.text(this.player.x, this.player.y - 40, 'HP Restaurado!\nJogo Salvo', { fontSize: '14px', fill: '#00ff00', align: 'center', backgroundColor: '#000' }).setOrigin(0.5);
        floatText.setDepth(200);
        this.tweens.add({ targets: floatText, y: floatText.y - 40, alpha: 0, duration: 2000, onComplete: () => floatText.destroy() });

      } else if (this.currentInteractTarget === 'runa') {
        const rune = this.currentInteractEntity;
        if (!rune.isPurified) {
          rune.isPurified = true;
          this.runasPurificadas++;
          Logger.info('DungeonScene', `Runa purificada! (${this.runasPurificadas}/3)`);
          
          // Efeito de purificação: brilho muda para ciano sagrado
          if (rune.runeGlow) {
            rune.runeGlow.fillColor = 0x00d2d3;
            rune.runeGlow.setAlpha(0.75);
          }

          const floatText = this.add.text(rune.x, rune.y - 40, 'Runa Purificada!', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '14px',
            color: '#00d2d3',
            fontStyle: 'bold',
            backgroundColor: 'rgba(10,10,16,0.85)',
            padding: { x: 4, y: 2 }
          }).setOrigin(0.5);
          floatText.setDepth(200);
          this.tweens.add({ targets: floatText, y: floatText.y - 40, alpha: 0, duration: 1500, onComplete: () => floatText.destroy() });

          if (this.runasPurificadas >= 3) {
            this.openSouthGate();
          }
        }
      }
    });

    InputManager.onAction('MENU', () => {
      if (this.player && !this.player.canInteract()) return;
      this.scene.pause();
      this.scene.launch('PauseScene', { sceneKey: 'DungeonScene' });
    });
  }

  openSouthGate() {
    Logger.info('DungeonScene', 'Grande Portão Sul Aberto!');
    this.cameras.main.shake(400, 0.015);
    this.southGateActive = true;

    // Dissipação mágica do selo do portão
    if (this.gateSealGlow) {
      this.gateSealGlow.fillColor = 0x00d2d3;
      this.tweens.add({
        targets: this.gateSealGlow,
        alpha: 0,
        scale: 1.8,
        duration: 1200
      });
    }

    this.game.events.emit('updateObjective', 'Objetivo Atual: Entre no Covil Abissal através do Portão Sul');
  }

  updateHUD() {
    this.game.events.emit('updateObjective', 'Objetivo: Purifique as 3 Runas da Masmorra para abrir o Portão Sul');
  }

  update() {
    if (!this.input.keyboard || !this.input.keyboard.enabled) return;

    // Movimentação via FSM (usando instâncias em cache)
    this.player.handleMovement(this.cursors, this.wasd, 180);

    // Zonas Interativas Overlap Manual
    let touching = false;
    this.physics.overlap(this.player, this.interactZones, (player, zone) => {
      if (zone.interactId === 'runa' && zone.targetEntity.isPurified) return;
      
      touching = true;
      this.currentInteractTarget = zone.interactId;
      this.currentInteractEntity = zone.targetEntity;
      
      this.interactIndicator.setText(zone.interactId === 'fogueira' ? '▼ [Z] Descansar' : '▼ [Z] Purificar');
      this.interactIndicator.setPosition(zone.targetEntity.x, zone.targetEntity.y - 40);
      this.interactIndicator.setVisible(true);
    });

    if (!touching) {
      this.currentInteractTarget = null;
      this.currentInteractEntity = null;
      this.interactIndicator.setVisible(false);
    }
  }
}
