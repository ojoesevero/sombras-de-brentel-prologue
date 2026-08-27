import Phaser from 'phaser';
import InputManager from '../services/InputManager.js';
import Logger from '../utils/Logger.js';

/**
 * Cena de Pausa (Overlay).
 * Congela a cena anterior e aguarda instruções.
 */
export default class PauseScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PauseScene' });
  }

  init(data) {
    this.pausedScene = data.sceneKey;
  }

  create() {
    Logger.info('PauseScene', `Jogo pausado. Cena original: ${this.pausedScene}`);

    // Fundo semi-transparente
    this.add.rectangle(0, 0, 800, 600, 0x000000, 0.75).setOrigin(0);
    this.add.text(400, 150, 'PAUSADO', { fontSize: '48px', fill: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);

    this.options = [
      { text: 'Continuar', action: () => this.resumeGame() },
      { text: 'Opções', action: () => this.openSettings() },
      { text: 'Sair para o Menu', action: () => this.quitToMenu() }
    ];

    this.selectedIndex = 0;
    this.menuTexts = [];

    this.options.forEach((opt, index) => {
      const y = 300 + index * 50;
      const t = this.add.text(400, y, opt.text, { fontSize: '24px', fill: '#aaaaaa' })
        .setOrigin(0.5)
        .setInteractive();

      t.on('pointerdown', opt.action);
      t.on('pointerover', () => this.setSelection(index));

      this.menuTexts.push(t);
    });

    InputManager.init(this);
    InputManager.onAction('DOWN', () => this.moveSelection(1));
    InputManager.onAction('UP', () => this.moveSelection(-1));
    InputManager.onAction('CONFIRM', () => this.options[this.selectedIndex].action());
    InputManager.onAction('MENU', () => this.resumeGame());
    InputManager.onAction('CANCEL', () => this.resumeGame());

    this.updateSelectionVisuals();
  }

  setSelection(index) {
    this.selectedIndex = index;
    this.updateSelectionVisuals();
  }

  moveSelection(direction) {
    this.selectedIndex += direction;
    if (this.selectedIndex < 0) this.selectedIndex = this.options.length - 1;
    if (this.selectedIndex >= this.options.length) this.selectedIndex = 0;
    this.updateSelectionVisuals();
  }

  updateSelectionVisuals() {
    this.menuTexts.forEach((t, i) => {
      if (i === this.selectedIndex) {
        t.setColor('#ffd700');
        t.setText(`> ${this.options[i].text} <`);
      } else {
        t.setColor('#aaaaaa');
        t.setText(this.options[i].text);
      }
    });
  }

  resumeGame() {
    Logger.info('PauseScene', 'Retomando jogo.');
    
    // Reacoplar o input na cena principal antes de retomar
    const activeScene = this.scene.get(this.pausedScene);
    InputManager.init(activeScene);
    
    this.scene.resume(this.pausedScene);
    this.scene.stop();
  }

  openSettings() {
    Logger.info('PauseScene', 'Abrindo configurações do pause.');
    this.scene.stop(this.pausedScene);
    this.scene.start('SettingsScene'); 
  }

  quitToMenu() {
    Logger.info('PauseScene', 'Retornando ao Menu Principal.');
    this.scene.stop(this.pausedScene);
    this.scene.start('MenuScene');
  }
}
