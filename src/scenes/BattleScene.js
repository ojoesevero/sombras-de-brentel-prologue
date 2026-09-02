import Phaser from 'phaser';
import Player from '../entities/Player.js';
import Logger from '../utils/Logger.js';
import InputManager from '../services/InputManager.js';
import FXManager from '../services/FXManager.js';
import InventoryManager from '../services/InventoryManager.js';
import WorldManager from '../services/WorldManager.js';

/**
 * Cena de Combate em Turnos Refatorada (Máquina de Estados de Teclado e Multi-Alvo).
 */
export default class BattleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BattleScene' });
  }

  init(data) {
    const safeData = data || {};
    const rawEnemies = safeData.enemies || [];
    this.returnScene = safeData.returnScene || 'TavernScene';
    this.isOverlay = safeData.isOverlay || false;
    this.isFlashback = safeData.isFlashback || false;
    this.enemyGroup = safeData.enemyGroup || null;
    
    this.enemies = [];
    if (this.enemyGroup === 'estayler_guards' || rawEnemies.length === 0) {
      this.enemies = [
        { id: 'guard_1', name: 'Guarda de Estayler A', hp: 45, maxHp: 45, attack: 8, def: 3, x: 550, y: 220, color: 0xcc3333 },
        { id: 'guard_2', name: 'Guarda de Estayler B', hp: 45, maxHp: 45, attack: 8, def: 3, x: 620, y: 320, color: 0xcc3333 }
      ];
    } else {
      rawEnemies.forEach((e, i) => {
        this.enemies.push({ 
          ...e, 
          id: `enemy_${i}`, 
          maxHp: e.hp, 
          attack: e.attack || 10,
          x: 550 + (i * 120),
          y: 350,
          color: 0xff0000 
        });
      });
    }

    this.isPlayerTurn = true;
    this.battleState = 'SELECTING_ACTION'; // Estados: SELECTING_ACTION, SELECTING_TARGET, EXECUTING, ENEMY_TURN
    this.pendingActionType = null;
    this.selectedEnemyIndex = 0;
    
    Logger.info('BattleScene', 'Combate iniciado com suporte total a Teclado.');
  }

  create() {
    this.cameras.main.resetFX();
    this.cameras.main.fadeIn(400, 0, 0, 0);
    InputManager.init(this);
    
    this.add.rectangle(0, 0, 800, 600, 0x111111).setOrigin(0);
    this.add.rectangle(0, 450, 800, 150, 0x2a2a2a).setOrigin(0);

    // Jogador
    this.player = new Player(this, 150, 350, 60, 100, 0x0055ff);
    this.add.text(150, 280, this.player.name, { fontSize: '14px', fill: '#fff' }).setOrigin(0.5);
    this.playerHpText = this.add.text(150, 300, `HP: ${this.player.hp}/${this.player.maxHp}`, { fontSize: '12px', fill: '#0f0' }).setOrigin(0.5);
    this.playerFuryText = this.add.text(150, 315, `Fúria: ${this.player.fury}/100`, { fontSize: '12px', fill: '#ffaa00' }).setOrigin(0.5);

    // Inimigos
    this.enemyVisuals = [];
    this.enemies.forEach((enemy) => {
      const visual = this.add.rectangle(enemy.x, enemy.y, 60, 100, enemy.color).setOrigin(0.5);
      const nameText = this.add.text(enemy.x, enemy.y - 70, enemy.name, { fontSize: '12px', fill: '#fff' }).setOrigin(0.5);
      const hpText = this.add.text(enemy.x, enemy.y - 50, `HP: ${enemy.hp}/${enemy.maxHp}`, { fontSize: '12px', fill: '#0f0' }).setOrigin(0.5);
      
      this.enemyVisuals.push({ visual, nameText, hpText, x: enemy.x, y: enemy.y });
    });

    // Indicador de Alvo
    this.targetIndicator = this.add.text(0, 250, '▼', { fontSize: '24px', fill: '#ffff00' }).setOrigin(0.5);
    this.targetIndicator.setVisible(false);

    this.createUI();
    this.setupKeyboardInput();

    this.events.on(Phaser.Scenes.Events.RESUME, () => {
      InputManager.init(this);
      if (typeof this.setupKeyboardInput === 'function') {
        this.setupKeyboardInput();
      }
    });
  }

  createUI() {
    this.uiContainer = this.add.container(0, 480);
    this.actionButtons = [];
    this.actions = ['attack', 'breath', 'defend', 'item'];
    this.actionIndex = 0;

    const btnAttack = this.createButton(120, 30, 'Atacar', () => this.selectAction('attack'));
    const btnBreath = this.createButton(280, 30, 'Sopro Elétrico', () => this.selectAction('breath'));
    const btnDefend = this.createButton(440, 30, 'Defender', () => this.executeAction('defend'));
    const btnItem = this.createButton(600, 30, 'Item', () => this.openItemMenu());

    this.uiContainer.add([btnAttack, btnBreath, btnDefend, btnItem]);
    this.updateActionVisuals();
    
    // Menu de Itens
    this.itemMenu = this.add.container(400, 250);
    const bg = this.add.rectangle(0, 0, 300, 200, 0x111111, 0.95);
    bg.setStrokeStyle(2, 0xd4af37);
    this.itemMenu.add(bg);
    this.itemMenu.setVisible(false);
  }

  createButton(x, y, text, callback) {
    const btn = this.add.rectangle(x, y, 150, 40, 0x555555).setInteractive();
    const lbl = this.add.text(x, y, text, { fontSize: '16px', fill: '#fff' }).setOrigin(0.5);
    
    btn.on('pointerdown', () => {
      if (this.isPlayerTurn && this.battleState === 'SELECTING_ACTION') {
        this.actionIndex = this.actionButtons.indexOf(btn);
        this.updateActionVisuals();
        callback();
      }
    });

    this.actionButtons.push(btn);
    return this.add.container(0, 0, [btn, lbl]);
  }

  updateActionVisuals() {
    this.actionButtons.forEach((btn, index) => {
      if (index === this.actionIndex && this.battleState === 'SELECTING_ACTION') {
        btn.setFillStyle(0x777777);
        btn.setStrokeStyle(2, 0xd4af37);
      } else {
        btn.setFillStyle(0x555555);
        btn.setStrokeStyle(0);
      }
    });
  }

  changeActionIndex(dir) {
    this.actionIndex += dir;
    if (this.actionIndex < 0) this.actionIndex = this.actions.length - 1;
    if (this.actionIndex >= this.actions.length) this.actionIndex = 0;
    this.updateActionVisuals();
  }

  selectCurrentAction() {
    if (this.itemMenu && this.itemMenu.visible) return;
    const action = this.actions[this.actionIndex];
    if (action === 'attack' || action === 'breath') {
      this.selectAction(action);
    } else if (action === 'defend') {
      this.executeAction('defend');
    } else if (action === 'item') {
      this.openItemMenu();
    }
  }

  selectAction(action) {
    if (action === 'breath' && this.player.fury < 50) {
      Logger.warn('BattleScene', 'Tentou usar Sopro sem fúria.');
      return;
    }

    this.battleState = 'SELECTING_TARGET';
    this.pendingActionType = action;
    this.updateActionVisuals(); // Remove o brilho dos botões
    
    if (!this.enemies[this.selectedEnemyIndex] || this.enemies[this.selectedEnemyIndex].hp <= 0) {
      this.selectedEnemyIndex = 0;
      this.changeTarget(0); // Força buscar o primeiro alvo válido
    }

    this.targetIndicator.setVisible(true);
    this.updateTargetVisual();
  }

  cancelTargeting() {
    this.battleState = 'SELECTING_ACTION';
    this.pendingActionType = null;
    this.targetIndicator.setVisible(false);
    this.updateActionVisuals();
  }

  changeTarget(dir) {
    let newIndex = this.selectedEnemyIndex + dir;
    if (newIndex < 0) newIndex = this.enemies.length - 1;
    if (newIndex >= this.enemies.length) newIndex = 0;
    
    // Pula inimigos mortos
    let attempts = 0;
    while (this.enemies[newIndex].hp <= 0 && attempts < this.enemies.length) {
      newIndex += dir;
      if (newIndex < 0) newIndex = this.enemies.length - 1;
      if (newIndex >= this.enemies.length) newIndex = 0;
      attempts++;
    }

    this.selectedEnemyIndex = newIndex;
    
    if (this.enemies[newIndex].hp <= 0) {
      this.targetIndicator.setVisible(false);
    } else {
      this.updateTargetVisual();
      if (this.battleState === 'SELECTING_TARGET') this.targetIndicator.setVisible(true);
    }
  }

  updateTargetVisual() {
    const targetInfo = this.enemyVisuals[this.selectedEnemyIndex];
    if (targetInfo) {
      this.targetIndicator.setPosition(targetInfo.x, targetInfo.y - 100);
    }
  }

  setupKeyboardInput() {
    InputManager.removeAllListeners('LEFT');
    InputManager.removeAllListeners('RIGHT');
    InputManager.removeAllListeners('UP');
    InputManager.removeAllListeners('DOWN');
    InputManager.removeAllListeners('CONFIRM');
    InputManager.removeAllListeners('CANCEL');
    InputManager.removeAllListeners('MENU');

    InputManager.onAction('MENU', () => {
      this.scene.pause();
      this.scene.launch('PauseScene', { sceneKey: 'BattleScene' });
    });

    InputManager.onAction('LEFT', () => {
      if (!this.isPlayerTurn || this.battleState === 'EXECUTING') return;
      if (this.battleState === 'SELECTING_ACTION') this.changeActionIndex(-1);
      else if (this.battleState === 'SELECTING_TARGET') this.changeTarget(-1);
    });

    InputManager.onAction('RIGHT', () => {
      if (!this.isPlayerTurn || this.battleState === 'EXECUTING') return;
      if (this.battleState === 'SELECTING_ACTION') this.changeActionIndex(1);
      else if (this.battleState === 'SELECTING_TARGET') this.changeTarget(1);
    });

    InputManager.onAction('UP', () => {
      if (!this.isPlayerTurn || this.battleState === 'EXECUTING') return;
      if (this.battleState === 'SELECTING_TARGET') this.changeTarget(-1);
    });

    InputManager.onAction('DOWN', () => {
      if (!this.isPlayerTurn || this.battleState === 'EXECUTING') return;
      if (this.battleState === 'SELECTING_TARGET') this.changeTarget(1);
    });

    InputManager.onAction('CONFIRM', () => {
      if (!this.isPlayerTurn || this.battleState === 'EXECUTING') return;
      if (this.battleState === 'SELECTING_ACTION') {
        this.selectCurrentAction();
      } else if (this.battleState === 'SELECTING_TARGET') {
        this.executeAction(this.pendingActionType);
      }
    });

    InputManager.onAction('CANCEL', () => {
      if (!this.isPlayerTurn || this.battleState === 'EXECUTING') return;
      if (this.battleState === 'SELECTING_TARGET') {
        this.cancelTargeting();
      } else if (this.itemMenu.visible) {
        this.itemMenu.setVisible(false);
      }
    });
  }

  openItemMenu() {
    if (!this.isPlayerTurn || this.battleState !== 'SELECTING_ACTION') return;
    
    this.itemMenu.list.forEach(child => {
      if (child.type === 'Text') child.destroy();
    });

    const items = InventoryManager.items;
    if (items.length === 0) {
      const t = this.add.text(0, 0, 'Nenhum item', { fill: '#fff' }).setOrigin(0.5);
      this.itemMenu.add(t);
    } else {
      items.forEach((item, index) => {
        const t = this.add.text(0, -60 + (index * 30), `${item.name} x${item.quantity}`, { fill: '#fff' }).setOrigin(0.5).setInteractive();
        t.on('pointerdown', () => this.useItem(item.id));
        this.itemMenu.add(t);
      });
    }

    const cancel = this.add.text(0, 80, 'Cancelar', { fill: '#f00' }).setOrigin(0.5).setInteractive();
    cancel.on('pointerdown', () => this.itemMenu.setVisible(false));
    this.itemMenu.add(cancel);

    this.itemMenu.setVisible(true);
  }

  useItem(itemId) {
    this.itemMenu.setVisible(false);
    if (InventoryManager.useItem(itemId, this.player)) {
      FXManager.flashScreen(this, 0x00ff00, 200);
      FXManager.createDamageNumber(this, 150, 350, 'Cura', false);
      
      this.isPlayerTurn = false;
      this.battleState = 'EXECUTING';
      this.updateUI();
      this.time.delayedCall(800, () => this.enemyTurn());
    }
  }

  executeAction(action) {
    this.isPlayerTurn = false;
    this.battleState = 'EXECUTING';
    this.targetIndicator.setVisible(false);
    this.uiContainer.setAlpha(0.5);

    if (action === 'attack') {
      const target = this.enemies[this.selectedEnemyIndex];
      const damage = this.player.basicAttack(target);
      const targetVisual = this.enemyVisuals[this.selectedEnemyIndex];
      
      FXManager.createSlashEffect(this, targetVisual.x, targetVisual.y);
      FXManager.createSlashParticles(this, targetVisual.x, targetVisual.y);
      FXManager.applyScreenShake(this, damage);
      
      FXManager.playHitStop(this, 80, () => {
        FXManager.createDamageNumber(this, targetVisual.x, targetVisual.y, damage, false);
      });
    } else if (action === 'breath') {
      const target = this.enemies[this.selectedEnemyIndex];
      const damage = this.player.electricBreath(target);
      const targetVisual = this.enemyVisuals[this.selectedEnemyIndex];
      
      FXManager.flashScreen(this, 0x00ffff, 200);
      FXManager.createLightningBreathFX(this, 150, 350, targetVisual.x, targetVisual.y);
      FXManager.createLightningParticles(this, targetVisual.x, targetVisual.y);
      FXManager.applyScreenShake(this, damage);
      
      FXManager.playHitStop(this, 90, () => {
        FXManager.createDamageNumber(this, targetVisual.x, targetVisual.y, damage, true);
      });
    } else if (action === 'defend') {
      Logger.info('BattleScene', `${this.player.name} assumiu postura defensiva.`);
      this.player.fury = Math.min(this.player.fury + 15, this.player.maxFury);
      FXManager.createDamageNumber(this, 150, 350, 'Defesa +Fúria', false);
    }

    this.pendingActionType = null;
    this.updateUI();

    const allDead = this.enemies.every(e => e.hp <= 0);
    if (allDead) {
      this.winBattle();
    } else {
      this.time.delayedCall(800, () => this.enemyTurn());
    }
  }

  enemyTurn() {
    Logger.info('BattleScene', 'Turno dos Inimigos.');
    
    let totalEnemyDamage = 0;
    this.enemies.forEach(enemy => {
      if (enemy.hp > 0 && this.player.isAlive()) {
        const damage = this.player.takeDamage(enemy.attack);
        totalEnemyDamage += damage;
        FXManager.createSlashEffect(this, 150, 350);
        FXManager.createSlashParticles(this, 150, 350);
        FXManager.createDamageNumber(this, 150, 350, damage, false);
      }
    });
    
    if (totalEnemyDamage > 0) {
      FXManager.applyScreenShake(this, totalEnemyDamage);
    }
    
    this.updateUI();

    if (!this.player.isAlive()) {
      this.loseBattle();
    } else {
      this.isPlayerTurn = true;
      this.battleState = 'SELECTING_ACTION';
      this.uiContainer.setAlpha(1);
      this.updateActionVisuals();
      
      if (this.enemies[this.selectedEnemyIndex].hp <= 0) {
        this.changeTarget(1); 
      }
    }
  }

  updateUI() {
    this.playerHpText.setText(`HP: ${this.player.hp}/${this.player.maxHp}`);
    this.playerFuryText.setText(`Fúria: ${this.player.fury}/100`);
    
    this.enemies.forEach((enemy, i) => {
      this.enemyVisuals[i].hpText.setText(`HP: ${enemy.hp}/${enemy.maxHp}`);
      if (enemy.hp <= 0) {
        this.enemyVisuals[i].visual.setAlpha(0.3);
      }
    });
  }

  winBattle() {
    Logger.info('BattleScene', 'Batalha vencida (Multi-Alvo)!');
    this.add.text(400, 200, 'VITÓRIA', { fontSize: '40px', fill: '#ff0' }).setOrigin(0.5);
    
    this.time.delayedCall(1000, () => {
      this.cameras.main.fadeOut(1000, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('RewardScene', { 
          player: this.player,
          returnScene: this.returnScene,
          isOverlay: this.isOverlay,
          isFlashback: this.isFlashback
        });
      });
    });
  }

  loseBattle() {
    Logger.info('BattleScene', 'Rhogar foi derrotado.');
    this.cameras.main.fadeOut(600, 255, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      if (this.isFlashback) {
        WorldManager.transitionTo(this, 'TavernScene', { x: 400, y: 350, battleOutcome: 'defeat', returnedFromFlashback: true });
      } else {
        this.scene.start('GameOverScene', { previousScene: 'BattleScene' });
      }
    });
  }
}
