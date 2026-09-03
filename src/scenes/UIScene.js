import Phaser from 'phaser';
import DialogueBox from '../ui/DialogueBox.js';
import Logger from '../utils/Logger.js';
import InputManager from '../services/InputManager.js';

/**
 * Cena Global de Interface de Usuário (Overlay UIScene).
 * Executada em paralelo no topo das cenas ativas de exploração.
 * Gerencia a instância única de DialogueBox, o HUD de Objetivos e os Controles Virtuais Táteis (Touch/Mobile).
 */
export default class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UIScene' });
  }

  create() {
    Logger.info('UIScene', 'Inicializando UIScene (Overlay global de UI).');

    // 1. HUD de Objetivos no topo central
    this.objectiveText = this.add.text(400, 20, '', {
      fontFamily: 'Arial',
      fontSize: '15px',
      color: '#ffd700',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(3000);

    // 2. Caixa de Diálogos Global
    this.dialogueBox = new DialogueBox(this, 50, 440, 700, 140);
    this.dialogueBox.setDepth(3000);
    this.dialogueBox.setScrollFactor(0);
    this.dialogueBox.setVisible(false);

    // Eventos do DialogueBox
    this.dialogueBox.on('dialogueComplete', () => {
      this.dialogueBox.setVisible(false);
      this.game.events.emit('dialogueClosed');
    });

    // 3. Controles Virtuais Táteis (Mobile Touch)
    this.createVirtualTouchControls();

    // 4. Ouvintes de Eventos Globais (game.events)
    this.game.events.off('openDialogue');
    this.game.events.on('openDialogue', (dialogueNodes) => {
      if (!dialogueNodes) return;
      this.dialogueBox.setVisible(true);
      this.dialogueBox.startDialogue(dialogueNodes);
      this.game.events.emit('dialogueOpened');
    });

    this.game.events.off('advanceDialogue');
    this.game.events.on('advanceDialogue', () => {
      if (this.dialogueBox.visible) {
        this.dialogueBox.skipOrNext();
      }
    });

    this.game.events.off('closeDialogue');
    this.game.events.on('closeDialogue', () => {
      this.dialogueBox.setVisible(false);
      this.dialogueBox.closeDialogue();
      this.game.events.emit('dialogueClosed');
    });

    this.game.events.off('updateObjective');
    this.game.events.on('updateObjective', (text) => {
      if (this.objectiveText) {
        this.objectiveText.setText(text || '');
      }
    });

    // 5. Sistema Visual de Toasts de Conquistas
    this.setupAchievementToast();

    // Ouvinte para alternância dinâmica do modo de controle (PC / Mobile)
    const updateControlVisibility = (mode) => {
      const activeMode = mode || this.registry.get('controlMode') || localStorage.getItem('controlMode') || 'pc';
      if (this.touchControlsContainer) {
        this.touchControlsContainer.setVisible(activeMode === 'mobile');
      }
    };

    this.game.events.on('controlModeChanged', updateControlVisibility);
    this.registry.events.on('changedata-controlMode', (parent, val) => updateControlVisibility(val));

    // Aplicar visibilidade inicial
    updateControlVisibility();

    // Limpeza de eventos ao desligar cena
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off('openDialogue');
      this.game.events.off('advanceDialogue');
      this.game.events.off('closeDialogue');
      this.game.events.off('updateObjective');
      this.game.events.off('achievementUnlocked');
      this.game.events.off('controlModeChanged', updateControlVisibility);
      InputManager.resetVirtualKeys();
    });
  }

  /**
   * Instancia os controles virtuais (D-Pad e Botões de Ação) no HUD.
   */
  createVirtualTouchControls() {
    this.touchControlsContainer = this.add.container(0, 0).setDepth(2900).setScrollFactor(0);

    // ==========================================
    // D-PAD VIRTUAL (Canto Inferior Esquerdo)
    // ==========================================
    const dpadCenterX = 110;
    const dpadCenterY = 490;

    // Placa de base do D-Pad
    const dpadBase = this.add.circle(dpadCenterX, dpadCenterY, 75, 0x111111, 0.45);
    dpadBase.setStrokeStyle(2, 0x444444, 0.6);
    this.touchControlsContainer.add(dpadBase);

    const createDPadBtn = (offsetX, offsetY, dirKey, arrowSymbol) => {
      const btnContainer = this.add.container(dpadCenterX + offsetX, dpadCenterY + offsetY);
      const bg = this.add.rectangle(0, 0, 48, 48, 0x222222, 0.85);
      bg.setStrokeStyle(2, 0xd4af37, 0.8);
      bg.setInteractive({ useHandCursor: true });

      const text = this.add.text(0, 0, arrowSymbol, {
        fontSize: '20px',
        color: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      btnContainer.add([bg, text]);

      const activate = () => {
        InputManager.setVirtualKey(dirKey, true);
        InputManager.emitAction(dirKey.toUpperCase());
        bg.fillColor = 0xd4af37;
        text.setColor('#000000');
        btnContainer.setScale(0.92);
      };

      const deactivate = () => {
        InputManager.setVirtualKey(dirKey, false);
        bg.fillColor = 0x222222;
        text.setColor('#ffffff');
        btnContainer.setScale(1.0);
      };

      bg.on('pointerdown', activate);
      bg.on('pointerup', deactivate);
      bg.on('pointerout', deactivate);

      this.touchControlsContainer.add(btnContainer);
      return btnContainer;
    };

    createDPadBtn(0, -48, 'up', '▲');
    createDPadBtn(0, 48, 'down', '▼');
    createDPadBtn(-48, 0, 'left', '◄');
    createDPadBtn(48, 0, 'right', '►');

    // ==========================================
    // BOTÕES DE AÇÃO (Canto Inferior Direito)
    // ==========================================
    const actionBtnX = 720;
    const actionBtnY = 500;

    // Botão Principal de Ação / Interagir [A / Z]
    const actionContainer = this.add.container(actionBtnX, actionBtnY);
    const actionBg = this.add.circle(0, 0, 36, 0x1a252f, 0.9);
    actionBg.setStrokeStyle(3, 0xd4af37, 1);
    actionBg.setInteractive({ useHandCursor: true });

    const actionLabel = this.add.text(0, -2, 'AÇÃO\n[ Z ]', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '12px',
      color: '#ffd700',
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    actionContainer.add([actionBg, actionLabel]);

    actionBg.on('pointerdown', () => {
      actionBg.fillColor = 0xd4af37;
      actionLabel.setColor('#000000');
      actionContainer.setScale(0.92);

      // Disparar ação lógica
      InputManager.emitAction('CONFIRM');

      // Se houver diálogo aberto, avança
      if (this.dialogueBox && this.dialogueBox.visible) {
        this.dialogueBox.skipOrNext();
      }
    });

    const resetActionBtn = () => {
      actionBg.fillColor = 0x1a252f;
      actionLabel.setColor('#ffd700');
      actionContainer.setScale(1.0);
    };

    actionBg.on('pointerup', resetActionBtn);
    actionBg.on('pointerout', resetActionBtn);

    this.touchControlsContainer.add(actionContainer);

    // Botão de Menu / Pausa [MENU / ESC]
    const menuBtnX = 720;
    const menuBtnY = 410;

    const menuContainer = this.add.container(menuBtnX, menuBtnY);
    const menuBg = this.add.circle(0, 0, 24, 0x222222, 0.85);
    menuBg.setStrokeStyle(2, 0x888888, 0.8);
    menuBg.setInteractive({ useHandCursor: true });

    const menuLabel = this.add.text(0, 0, 'MENU', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '10px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    menuContainer.add([menuBg, menuLabel]);

    menuBg.on('pointerdown', () => {
      menuBg.fillColor = 0x555555;
      menuContainer.setScale(0.92);
      InputManager.emitAction('MENU');
    });

    const resetMenuBtn = () => {
      menuBg.fillColor = 0x222222;
      menuContainer.setScale(1.0);
    };

    menuBg.on('pointerup', resetMenuBtn);
    menuBg.on('pointerout', resetMenuBtn);

    this.touchControlsContainer.add(menuContainer);

    // ==========================================
    // BOTÃO VIRTUAL FIXO DE MOCHILA [📦 MOCHILA]
    // ==========================================
    const bagBtnX = 720;
    const bagBtnY = 320;

    const bagContainer = this.add.container(bagBtnX, bagBtnY);
    const bagBg = this.add.circle(0, 0, 26, 0x1f2937, 0.9);
    bagBg.setStrokeStyle(2, 0xd4af37, 0.9);
    bagBg.setInteractive({ useHandCursor: true });

    const bagLabel = this.add.text(0, -2, '📦\nMOCHILA', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '8px',
      color: '#ffd700',
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    bagContainer.add([bagBg, bagLabel]);

    bagBg.on('pointerdown', () => {
      bagBg.fillColor = 0xd4af37;
      bagLabel.setColor('#000000');
      bagContainer.setScale(0.92);
      this.toggleInventory();
    });

    const resetBagBtn = () => {
      bagBg.fillColor = 0x1f2937;
      bagLabel.setColor('#ffd700');
      bagContainer.setScale(1.0);
    };

    bagBg.on('pointerup', resetBagBtn);
    bagBg.on('pointerout', resetBagBtn);

    this.touchControlsContainer.add(bagContainer);

    // Ouvinte Global do Game para Alternar Mochila
    this.game.events.off('toggleInventory');
    this.game.events.on('toggleInventory', () => {
      this.toggleInventory();
    });

    // Ouvintes Diretos de Teclado no UIScene (I, B, X, Shift)
    if (this.input && this.input.keyboard) {
      this.input.keyboard.on('keydown-I', () => this.toggleInventory());
      this.input.keyboard.on('keydown-B', () => this.toggleInventory());
      this.input.keyboard.on('keydown-X', () => {
        if (!this.dialogueBox || !this.dialogueBox.visible) {
          this.toggleInventory();
        }
      });
    }

    // Listener de Atalho de Teclado via InputManager
    InputManager.onAction('INVENTORY', () => {
      this.toggleInventory();
    });
  }

  toggleInventory() {
    if (this.isTogglingInventory) return;
    this.isTogglingInventory = true;
    this.time.delayedCall(250, () => {
      this.isTogglingInventory = false;
    });

    if (this.scene.isActive('InventoryScene')) {
      const invScene = this.scene.get('InventoryScene');
      if (invScene && typeof invScene.closeInventory === 'function') {
        invScene.closeInventory();
      } else {
        this.scene.stop('InventoryScene');
      }
      return;
    }

    if (this.dialogueBox && this.dialogueBox.visible) {
      return; // Não abre inventário durante diálogo
    }

    // Identificar a cena de jogo ativa que esteja executando e não esteja previamente pausada
    const gameScenes = ['TavernScene', 'RastphenCityScene', 'TempleScene', 'ForestRouteScene', 'DungeonScene', 'GameScene'];
    const activeKey = gameScenes.find(key => this.scene.isActive(key) && !this.scene.isPaused(key));

    if (activeKey) {
      const activeScene = this.scene.get(activeKey);
      if (activeScene && activeScene.player && !activeScene.player.canInteract()) {
        return; // Não abre se estiver em transição ou interação ativa
      }

      Logger.info('UIScene', `Pausando [${activeKey}] para abrir Mochila (InventoryScene).`);
      this.scene.pause(activeKey);
      this.scene.launch('InventoryScene', {
        previousSceneKey: activeKey,
        player: activeScene ? activeScene.player : null
      });
    }
  }

  isDialogueActive() {
    return this.dialogueBox && this.dialogueBox.visible;
  }

  /**
   * Configura o ouvinte de eventos globais de conquistas.
   */
  setupAchievementToast() {
    this.achievementQueue = [];
    this.isToastShowing = false;

    this.game.events.off('achievementUnlocked');
    this.game.events.on('achievementUnlocked', (ach) => {
      this.achievementQueue.push(ach);
      if (!this.isToastShowing) {
        this.processNextAchievementToast();
      }
    });
  }

  /**
   * Processa a fila de notificações flutuantes (Toast) de conquistas no topo da tela.
   */
  processNextAchievementToast() {
    if (this.achievementQueue.length === 0) {
      this.isToastShowing = false;
      return;
    }

    this.isToastShowing = true;
    const ach = this.achievementQueue.shift();

    const toastContainer = this.add.container(400, -90).setDepth(6000).setScrollFactor(0);

    const toastBg = this.add.rectangle(0, 0, 520, 64, 0x0f0e17, 0.95);
    toastBg.setStrokeStyle(2, 0xd4af37, 1);

    const goldAccent = this.add.rectangle(-254, 0, 8, 60, 0xffd700);

    const iconText = this.add.text(-220, 0, ach.icon || '🏆', {
      fontSize: '26px'
    }).setOrigin(0.5);

    const headerText = this.add.text(-190, -14, '🏆 CONQUISTA DESBLOQUEADA!', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '11px',
      color: '#ffd700',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5);

    const titleText = this.add.text(-190, 10, `${ach.title}: ${ach.description}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '11px',
      color: '#ffffff',
      fontStyle: 'bold',
      wordWrap: { width: 420 }
    }).setOrigin(0, 0.5);

    toastContainer.add([toastBg, goldAccent, iconText, headerText, titleText]);

    // Animação: Slide Down -> Brilho -> Slide Up
    this.tweens.add({
      targets: toastContainer,
      y: 50,
      duration: 450,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: goldAccent,
          alpha: 0.3,
          yoyo: true,
          repeat: 3,
          duration: 300
        });

        this.time.delayedCall(3600, () => {
          this.tweens.add({
            targets: toastContainer,
            y: -90,
            alpha: 0,
            duration: 400,
            ease: 'Power2',
            onComplete: () => {
              toastContainer.destroy();
              this.processNextAchievementToast();
            }
          });
        });
      }
    });
  }
}
