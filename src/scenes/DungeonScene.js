import Phaser from 'phaser';
import InputManager from '../services/InputManager.js';
import WorldManager from '../services/WorldManager.js';
import SaveManager from '../services/SaveManager.js';
import Logger from '../utils/Logger.js';
import Player from '../entities/Player.js';
import DevShortcuts from '../utils/DevShortcuts.js';

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

    // Layout e Atmosfera (1600x1200)
    this.physics.world.setBounds(0, 0, 1600, 1200);
    this.add.rectangle(0, 0, 1600, 1200, 0x696969).setOrigin(0);

    // Paredes e Colisões (staticGroup)
    this.staticGroup = this.physics.add.staticGroup();

    // Bordas externas e arquitetura do mapa
    this.staticGroup.add(this.add.rectangle(800, 5, 1600, 10, 0x222222)); // Norte
    this.staticGroup.add(this.add.rectangle(800, 1195, 1600, 10, 0x222222)); // Sul
    this.staticGroup.add(this.add.rectangle(5, 600, 10, 1200, 0x222222)); // Oeste
    this.staticGroup.add(this.add.rectangle(1595, 600, 10, 1200, 0x222222)); // Leste
    
    // Pilares
    this.staticGroup.add(this.add.circle(400, 400, 30, 0x2a2a2a));
    this.staticGroup.add(this.add.circle(1200, 400, 30, 0x2a2a2a));
    this.staticGroup.add(this.add.circle(400, 800, 30, 0x2a2a2a));
    this.staticGroup.add(this.add.circle(1200, 800, 30, 0x2a2a2a));

    // O Jogador e Spawn (Player com FSM)
    const spawnX = this.spawnData.x || (WorldManager.getSpawn()?.x || 800);
    const spawnY = this.spawnData.y || (WorldManager.getSpawn()?.y || 150);
    this.player = new Player(this, spawnX, spawnY, 32, 32, 0x0055ff);
    this.physics.add.collider(this.player, this.staticGroup);

    // Câmera Tracking
    this.cameras.main.setBounds(0, 0, 1600, 1200);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

    // Fogueira (Ponto de Checkpoint)
    this.fogueira = this.add.circle(800, 600, 24, 0xff4500);
    this.physics.add.existing(this.fogueira, true);
    this.staticGroup.add(this.fogueira);
    this.add.text(800, 600, 'Fogueira', { fontSize: '10px', fill: '#fff' }).setOrigin(0.5);

    // 3 Pedestais de Runa
    this.pedestais = this.physics.add.staticGroup();
    
    this.runa1 = this.add.rectangle(300, 300, 40, 40, 0x8a2be2);
    this.physics.add.existing(this.runa1, true);
    this.runa1.isPurified = false;
    this.pedestais.add(this.runa1);

    this.runa2 = this.add.rectangle(1300, 300, 40, 40, 0x8a2be2);
    this.physics.add.existing(this.runa2, true);
    this.runa2.isPurified = false;
    this.pedestais.add(this.runa2);

    this.runa3 = this.add.rectangle(800, 950, 40, 40, 0x8a2be2);
    this.physics.add.existing(this.runa3, true);
    this.runa3.isPurified = false;
    this.pedestais.add(this.runa3);

    this.physics.add.collider(this.player, this.pedestais);

    // Inimigos da Masmorra
    this.enemies = this.physics.add.group();
    const spawnEnemy = (x, y, type) => {
      const e = this.add.rectangle(x, y, 32, 32, 0x8b0000);
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

    // Grande Portão Sul (Desbloqueio de Boss)
    this.southGate = this.add.rectangle(800, 1180, 200, 40, 0xff0000, 0.5);
    this.physics.add.existing(this.southGate, true);
    this.southGateActive = false;
    
    this.physics.add.overlap(this.player, this.southGate, () => {
      if (this.player && !this.player.canInteract()) return;

      if (this.southGateActive) {
        WorldManager.transitionTo(this, 'BossChamberScene', { x: 400, y: 100 });
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

    InputManager.onAction('CONFIRM', () => {
      if (this.player && !this.player.canInteract()) {
        this.game.events.emit('advanceDialogue');
        return;
      }

      if (this.currentInteractTarget === 'fogueira') {
        Logger.info('DungeonScene', 'Fogueira ativada: Salvando o jogo e curando.');
        if (SaveManager && SaveManager.saveGame) {
           SaveManager.saveGame();
        }
        
        const floatText = this.add.text(this.player.x, this.player.y - 40, 'HP Restaurado!\nJogo Salvo', { fontSize: '14px', fill: '#00ff00', align: 'center', backgroundColor: '#000' }).setOrigin(0.5);
        floatText.setDepth(200);
        this.tweens.add({ targets: floatText, y: floatText.y - 40, alpha: 0, duration: 2000, onComplete: () => floatText.destroy() });

      } else if (this.currentInteractTarget === 'runa') {
        const rune = this.currentInteractEntity;
        if (!rune.isPurified) {
          rune.isPurified = true;
          rune.fillColor = 0xd4af37;
          this.runasPurificadas++;
          Logger.info('DungeonScene', `Runa purificada! (${this.runasPurificadas}/3)`);
          
          const floatText = this.add.text(rune.x, rune.y - 40, 'Runa Purificada', { fontSize: '14px', fill: '#d4af37', backgroundColor: '#000' }).setOrigin(0.5);
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

    // Atalhos de desenvolvedor
    DevShortcuts.register(this);
  }

  openSouthGate() {
    Logger.info('DungeonScene', 'Grande Portão Sul Aberto!');
    this.cameras.main.shake(400, 0.015);
    this.southGate.fillColor = 0x00ff00;
    this.southGateActive = true;
    this.game.events.emit('updateObjective', 'Objetivo Atual: Entre no Covil Abissal através do Portão Sul');
  }

  updateHUD() {
    this.game.events.emit('updateObjective', 'Objetivo: Purifique as 3 Runas da Masmorra para abrir o Portão Sul');
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
    this.player.handleMovement(cursors, wasd, 180);

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
