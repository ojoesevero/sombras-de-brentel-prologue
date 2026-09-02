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
  }

  isDialogueActive() {
    return this.dialogueBox && this.dialogueBox.visible;
  }
}
