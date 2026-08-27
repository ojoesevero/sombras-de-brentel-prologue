import Phaser from 'phaser';
import InputManager from '../services/InputManager.js';
import WorldManager from '../services/WorldManager.js';
import SaveManager from '../services/SaveManager.js';
import Logger from '../utils/Logger.js';

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
    this.isTransitioning = false;
    this.isInteracting = false;
    this.runasPurificadas = 0;
    
    Logger.info('DungeonScene', 'Iniciando Masmorra do Bosque Cinzento.');

    this.cameras.main.resetFX();
    this.cameras.main.fadeIn(400, 0, 0, 0);

    // Layout e Atmosfera (1600x1200)
    this.physics.world.setBounds(0, 0, 1600, 1200);
    this.add.rectangle(0, 0, 1600, 1200, 0x696969).setOrigin(0); // Piso arenoso acinzentado

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

    // O Jogador e Spawn
    const spawnX = this.spawnData.x || (WorldManager.getSpawn()?.x || 800);
    const spawnY = this.spawnData.y || (WorldManager.getSpawn()?.y || 150);
    this.player = this.add.rectangle(spawnX, spawnY, 32, 32, 0x0055ff);
    this.physics.add.existing(this.player, false);
    this.player.body.setSize(32, 32);
    this.player.body.setCollideWorldBounds(true);
    this.physics.add.collider(this.player, this.staticGroup);

    // Câmera Tracking
    this.cameras.main.setBounds(0, 0, 1600, 1200);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

    // Overlay de Névoa Translúcida Arroxeada (fica acima do mapa e do player)
    const fog = this.add.rectangle(0, 0, 1600, 1200, 0x800080, 0.12).setOrigin(0);
    fog.setDepth(100);

    // HUD Objetivo
    this.objectiveText = this.add.text(800, 20, 'Objetivo Atual: Purifique as 3 Runas de Pestilência', { fontSize: '14px', fill: '#ffff00', fontStyle: 'bold' }).setOrigin(0.5).setScrollFactor(0);
    this.objectiveText.setDepth(1900);

    // Zonas Interativas
    this.interactZones = this.physics.add.group();
    
    // Fogueira de Checkpoint (Antecâmara Central)
    this.fogueira = this.add.circle(800, 600, 25, 0xff4500);
    this.physics.add.existing(this.fogueira, true);
    this.staticGroup.add(this.fogueira);
    
    const fogoZone = this.add.zone(800, 600, 80, 80);
    this.physics.add.existing(fogoZone, true);
    fogoZone.interactId = 'fogueira';
    fogoZone.targetEntity = this.fogueira;
    this.interactZones.add(fogoZone);

    // Puzzle das 3 Runas de Pestilência (Oeste, Leste, Norte)
    this.runes = [];
    const createRune = (x, y, id) => {
      const rune = this.add.rectangle(x, y, 40, 40, 0x8a2be2);
      this.physics.add.existing(rune, true);
      this.staticGroup.add(rune);
      rune.isPurified = false;
      
      const zone = this.add.zone(x, y, 100, 100);
      this.physics.add.existing(zone, true);
      zone.interactId = 'runa';
      zone.targetEntity = rune;
      this.interactZones.add(zone);
      this.runes.push(rune);
    };

    createRune(300, 600, 'oeste');
    createRune(1300, 600, 'leste');
    createRune(800, 300, 'norte');

    // Indicador Interação
    this.interactIndicator = this.add.text(0, 0, '[Z]', { fontSize: '14px', fill: '#ffff00', fontStyle: 'bold', backgroundColor: '#000' }).setOrigin(0.5).setVisible(false);
    this.interactIndicator.setDepth(150);
    this.currentInteractTarget = null;
    this.currentInteractEntity = null;

    // Patrulhas Inimigas
    this.enemies = this.physics.add.group();
    const createEnemy = (x, y, type) => {
      const e = this.add.rectangle(x, y, 32, 32, 0xff0000);
      this.physics.add.existing(e, false);
      e.body.setImmovable(true);
      e.enemyType = type;
      this.enemies.add(e);
    };

    createEnemy(400, 800, 'goblin_emboscador');
    createEnemy(1200, 800, 'cultista_sombras');
    createEnemy(800, 950, 'corruptor_abissal');

    this.physics.add.overlap(this.player, this.enemies, (player, enemy) => {
      if (this.scene.isPaused() || this.isTransitioning) return;
      Logger.info('DungeonScene', `Batalha iniciada com ${enemy.enemyType}`);
      const eType = enemy.enemyType;
      enemy.destroy();
      this.scene.pause();
      
      this.scene.launch('BattleScene', {
        enemyGroup: eType,
        isDungeon: true,
        returnScene: 'DungeonScene',
        isOverlay: true,
        isFlashback: false
      });
    });

    // Portões de Transição
    this.northZone = this.add.rectangle(800, 20, 200, 40, 0x0000ff, 0.5);
    this.physics.add.existing(this.northZone, true);
    this.physics.add.overlap(this.player, this.northZone, () => {
      if (!this.isInteracting && !this.isTransitioning) {
        WorldManager.transitionTo(this, 'ForestRouteScene', { x: 400, y: 1050 });
      }
    });

    // DialogueBox instanciada
    this.dialogueBox = new DialogueBox(this, 50, 440, 700, 140);
    this.dialogueBox.setDepth(2000);
    this.dialogueBox.setScrollFactor(0);
    this.dialogueBox.setVisible(false);
    
    this.dialogueBox.on('dialogueComplete', () => {
      this.isInteracting = false;
    });

    this.southGate = this.add.rectangle(800, 1180, 200, 40, 0xff0000, 0.5);
    this.physics.add.existing(this.southGate, true);
    this.southGateActive = false; // Bloqueado inicialmente
    
    this.physics.add.overlap(this.player, this.southGate, () => {
      if (!this.isInteracting && !this.isTransitioning) {
        if (this.southGateActive) {
          WorldManager.transitionTo(this, 'BossChamberScene', { x: 400, y: 100 });
        } else {
          this.player.y -= 30; // pushback
          this.player.body.setVelocity(0, 0);
          this.isInteracting = true;
          
          const thoughts = this.cache.json.get('thought_interactions');
          this.dialogueBox.setVisible(true);
          this.dialogueBox.startDialogue(thoughts['thought_locked_boss_gate']);
        }
      }
    });

    // Inputs
    InputManager.init(this);
    if (this.input.keyboard) this.input.keyboard.enabled = true;

    InputManager.onAction('CONFIRM', () => {
      if (this.isTransitioning) return;
      if (this.isInteracting) {
        this.dialogueBox.skipOrNext();
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
      if (this.isInteracting) return;
      this.scene.pause();
      this.scene.launch('PauseScene', { sceneKey: 'DungeonScene' });
    });
  }

  openSouthGate() {
    Logger.info('DungeonScene', 'Grande Portão Sul Aberto!');
    this.cameras.main.shake(400, 0.015);
    this.southGate.fillColor = 0x00ff00;
    this.southGateActive = true;
    this.objectiveText.setText('Objetivo Atual: Entre no Covil Abissal através do Portão Sul');
  }

  update() {
    if (this.isInteracting || this.isTransitioning) return;
    if (!this.input.keyboard.enabled) return;

    const cursors = this.input.keyboard.createCursorKeys();
    const w = this.input.keyboard.addKey('W');
    const a = this.input.keyboard.addKey('A');
    const s = this.input.keyboard.addKey('S');
    const d = this.input.keyboard.addKey('D');

    let velX = 0;
    let velY = 0;
    const speed = 180;

    if (cursors.left.isDown || a.isDown) velX = -speed;
    else if (cursors.right.isDown || d.isDown) velX = speed;
    if (cursors.up.isDown || w.isDown) velY = -speed;
    else if (cursors.down.isDown || s.isDown) velY = speed;

    this.player.body.setVelocity(velX, velY);

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
