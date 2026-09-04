import Phaser from 'phaser';
import Player from '../entities/Player.js';
import Logger from '../utils/Logger.js';
import AudioManager from '../audio/AudioManager.js';
import InputManager from '../services/InputManager.js';
import FXManager from '../services/FXManager.js';
import InventoryManager from '../services/InventoryManager.js';
import WorldManager from '../services/WorldManager.js';
import { AssetsConfig } from '../config/assets.js';

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
    AudioManager.init(this);
    window.playBGM(this, 'bgm_furia_estayler');
    this.cameras.main.resetFX();
    this.cameras.main.fadeIn(400, 0, 0, 0);
    InputManager.init(this);
    
    this.add.rectangle(0, 0, 800, 600, 0x111111).setOrigin(0);
    this.add.rectangle(0, 450, 800, 150, 0x2a2a2a).setOrigin(0);

    // Jogador (Rhogar em Pixel Art Chibi com sombra e respiração)
    this.player = new Player(this, 150, 350, 32, 32, 0x0055ff);
    this.player.setVisible(false);
    if (this.player.sprite) this.player.sprite.setVisible(false);
    if (this.player.shadow) this.player.shadow.setVisible(false);

    this.playerBattleShadow = this.add.ellipse(150, 388, 48, 14, 0x000000, 0.45);
    this.playerVisual = this.add.sprite(150, 345, AssetsConfig.sprites.rhogar || 'spr_rhogar')
      .setScale(2.5)
      .setDepth(2);

    this.tweens.add({
      targets: this.playerVisual,
      y: 339,
      duration: 1100,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    this.add.text(150, 260, this.player.name, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '13px',
      color: '#ffd700',
      fontStyle: 'bold',
      backgroundColor: 'rgba(0,0,0,0.6)',
      padding: { x: 4, y: 2 }
    }).setOrigin(0.5);
    this.playerHpText = this.add.text(150, 285, `HP: ${this.player.hp}/${this.player.maxHp}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '12px',
      color: '#2ecc71',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.playerFuryText = this.add.text(150, 302, `Fúria: ${this.player.fury}/100`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '11px',
      color: '#ff9f1a',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Inimigos em Pixel Art Chibi com Armadura, Sombras e Flutuação/Respiração
    this.enemyVisuals = [];
    this.enemies.forEach((enemy, idx) => {
      let textureKey = AssetsConfig.sprites.guard;
      const lowerName = enemy.name.toLowerCase();
      const isGoblin = lowerName.includes('goblin');

      if (lowerName.includes('cultista')) textureKey = AssetsConfig.sprites.cultist;
      else if (lowerName.includes('corruptor') || lowerName.includes('minotaur')) textureKey = AssetsConfig.sprites.iksar;
      else if (isGoblin) textureKey = AssetsConfig.sprites.goblin;

      // Sombra oval preta translúcida sob os pés para profundidade
      const shadow = this.add.ellipse(enemy.x, enemy.y + 40, 50, 14, 0x000000, 0.45);
      
      const visual = this.add.sprite(enemy.x, enemy.y, textureKey)
        .setScale(2.5)
        .setDepth(2)
        .setFlipX(true); // Voltado para a esquerda (encarando Rhogar)

      // Suporte a animação de spritesheet customizada se presente no cache
      if (isGoblin && this.anims.exists('anim_goblin_idle')) {
        visual.play('anim_goblin_idle');
      }

      // Oscilação vertical contínua suave (efeito de respiração / flutuação)
      const idleTween = this.tweens.add({
        targets: visual,
        y: '+=4',
        duration: 1200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      const nameText = this.add.text(enemy.x, enemy.y - 70, enemy.name, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px',
        color: '#ffd700',
        fontStyle: 'bold',
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: { x: 4, y: 2 }
      }).setOrigin(0.5);

      const hpText = this.add.text(enemy.x, enemy.y - 48, `HP: ${enemy.hp}/${enemy.maxHp}`, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '11px',
        color: '#2ecc71',
        fontStyle: 'bold'
      }).setOrigin(0.5);
      
      this.enemyVisuals.push({ visual, shadow, idleTween, nameText, hpText, x: enemy.x, y: enemy.y, enemyId: enemy.id });
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
    const step = dir === 0 ? 1 : dir;
    let newIndex = (this.selectedEnemyIndex + dir + this.enemies.length) % this.enemies.length;
    
    // Pula inimigos mortos
    let attempts = 0;
    while (this.enemies[newIndex] && this.enemies[newIndex].hp <= 0 && attempts < this.enemies.length) {
      newIndex = (newIndex + step + this.enemies.length) % this.enemies.length;
      attempts++;
    }

    this.selectedEnemyIndex = newIndex;
    
    if (!this.enemies[newIndex] || this.enemies[newIndex].hp <= 0) {
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

      // Efeito de recuo físico (recoil) e piscar vermelho de dano no monstro
      this.tweens.add({
        targets: targetVisual.visual,
        x: targetVisual.x + 18,
        duration: 80,
        yoyo: true,
        ease: 'Quad.easeOut'
      });
      targetVisual.visual.setTint(0xff4757);
      this.time.delayedCall(160, () => {
        if (targetVisual.visual && targetVisual.visual.active) {
          targetVisual.visual.clearTint();
        }
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

      // Efeito de choque e recuo de dano elétrico
      this.tweens.add({
        targets: targetVisual.visual,
        x: targetVisual.x + 22,
        duration: 90,
        yoyo: true,
        ease: 'Quad.easeOut'
      });
      targetVisual.visual.setTint(0x00ffff);
      this.time.delayedCall(200, () => {
        if (targetVisual.visual && targetVisual.visual.active) {
          targetVisual.visual.clearTint();
        }
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
        // Animação de investida/ataque do monstro
        const visualObj = this.enemyVisuals.find(ev => ev.enemyId === enemy.id || ev.x === enemy.x);
        if (visualObj && visualObj.visual) {
          if (this.anims.exists('anim_goblin_attack') && enemy.name.toLowerCase().includes('goblin')) {
            visualObj.visual.play('anim_goblin_attack');
            visualObj.visual.once('animationcomplete', () => {
              if (this.anims.exists('anim_goblin_idle')) visualObj.visual.play('anim_goblin_idle');
            });
          }
          this.tweens.add({
            targets: visualObj.visual,
            x: visualObj.x - 38,
            duration: 130,
            yoyo: true,
            ease: 'Back.easeIn'
          });
        }

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
        this.enemyVisuals[i].visual.setAlpha(0.25);
        if (this.enemyVisuals[i].idleTween) this.enemyVisuals[i].idleTween.stop();
        if (this.enemyVisuals[i].shadow) this.enemyVisuals[i].shadow.setAlpha(0.1);
      }
    });
  }

  winBattle() {
    Logger.info('BattleScene', 'Batalha vencida (Multi-Alvo)! Processando recompensas e XP...');
    
    // Cálculo do ganho de XP baseado nos inimigos derrotados
    let totalXp = 0;
    this.enemies.forEach(enemy => {
      const lower = (enemy.name || '').toLowerCase();
      if (lower.includes('minotaur') || lower.includes('corruptor')) {
        totalXp += 120;
      } else if (lower.includes('cultista') || lower.includes('iksar')) {
        totalXp += 75;
      } else if (lower.includes('goblin')) {
        totalXp += 35;
      } else {
        totalXp += 45; // Guardas de Estayler / padrão
      }
    });
    totalXp = Math.max(50, totalXp);

    const xpResult = this.player.gainXP(totalXp);

    // Banner Visual de Vitória
    const bannerContainer = this.add.container(400, 180).setDepth(100);
    const bannerBg = this.add.rectangle(0, 0, 380, xpResult.leveledUp ? 130 : 90, 0x07070e, 0.92);
    bannerBg.setStrokeStyle(3, 0xd4af37, 1);
    bannerContainer.add(bannerBg);

    const vicText = this.add.text(0, -25, '★ VITÓRIA ★', {
      fontFamily: 'Georgia, serif',
      fontSize: '28px',
      color: '#ffd700',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    bannerContainer.add(vicText);

    const xpText = this.add.text(0, 5, `+${totalXp} XP Adquirido`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      color: '#2ecc71',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    bannerContainer.add(xpText);

    if (xpResult.leveledUp) {
      const lvlText = this.add.text(0, 32, `★ LEVEL UP! NÍVEL ${xpResult.currentLevel} ★`, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '15px',
        color: '#ff9f1a',
        fontStyle: 'bold'
      }).setOrigin(0.5);
      bannerContainer.add(lvlText);

      this.cameras.main.flash(400, 255, 215, 0, 0.5);
    }
    
    this.time.delayedCall(1500, () => {
      this.cameras.main.fadeOut(800, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('RewardScene', { 
          player: this.player,
          returnScene: this.returnScene,
          isOverlay: this.isOverlay,
          isFlashback: this.isFlashback,
          xpGained: totalXp,
          xpResult: xpResult
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
