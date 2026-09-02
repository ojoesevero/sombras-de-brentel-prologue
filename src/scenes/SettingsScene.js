import Phaser from 'phaser';
import InputManager from '../services/InputManager.js';
import AudioManager from '../audio/AudioManager.js';
import Logger from '../utils/Logger.js';

/**
 * Cena de Configurações (Settings).
 * Permite ajustar modo de controle (PC/Mobile), volumes e alternar tela cheia.
 */
export default class SettingsScene extends Phaser.Scene {
  constructor() {
    super({ key: 'SettingsScene' });
  }

  create() {
    this.add.rectangle(0, 0, 800, 600, 0x111111).setOrigin(0);
    this.add.text(400, 80, 'OPÇÕES GERAIS', {
      fontFamily: 'Georgia, serif',
      fontSize: '34px',
      fill: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const currentMode = this.registry.get('controlMode') || localStorage.getItem('controlMode') || 'pc';
    this.controlMode = currentMode;

    this.options = [
      { text: `Controles: ${this.controlMode === 'mobile' ? 'Mobile (Touch)' : 'PC (Teclado)'}`, action: () => this.toggleControlMode() },
      { text: 'Volume BGM: 100%', action: () => this.toggleBGM() },
      { text: 'Volume SFX: 100%', action: () => this.toggleSFX() },
      { text: 'Tela Cheia / Janela', action: () => this.toggleFullscreen() },
      { text: 'Voltar ao Menu', action: () => this.goBack() }
    ];

    this.bgmVol = 1.0;
    this.sfxVol = 1.0;
    this.selectedIndex = 0;
    this.menuTexts = [];

    this.options.forEach((opt, index) => {
      const y = 180 + index * 60;
      const t = this.add.text(400, y, opt.text, {
        fontFamily: 'Georgia, serif',
        fontSize: '22px',
        fill: '#aaaaaa'
      })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

      t.on('pointerdown', opt.action);
      t.on('pointerover', () => this.setSelection(index));

      this.menuTexts.push(t);
    });

    InputManager.init(this);
    InputManager.onAction('DOWN', () => this.moveSelection(1));
    InputManager.onAction('UP', () => this.moveSelection(-1));
    InputManager.onAction('CONFIRM', () => this.options[this.selectedIndex].action());
    InputManager.onAction('CANCEL', () => this.goBack());

    this.updateSelectionVisuals();
    Logger.info('SettingsScene', 'Opções renderizadas.');
  }

  toggleControlMode() {
    this.controlMode = this.controlMode === 'pc' ? 'mobile' : 'pc';
    this.registry.set('controlMode', this.controlMode);
    try {
      localStorage.setItem('controlMode', this.controlMode);
    } catch (e) {
      Logger.warn('SettingsScene', 'Falha ao salvar no localStorage', e);
    }

    this.game.events.emit('controlModeChanged', this.controlMode);
    this.options[0].text = `Controles: ${this.controlMode === 'mobile' ? 'Mobile (Touch)' : 'PC (Teclado)'}`;
    this.updateSelectionVisuals();
    Logger.info('SettingsScene', `Modo de controle alterado para: ${this.controlMode}`);
  }

  toggleBGM() {
    this.bgmVol = this.bgmVol >= 1.0 ? 0 : this.bgmVol + 0.25;
    AudioManager.setBGMVolume(this.bgmVol);
    this.options[1].text = `Volume BGM: ${Math.round(this.bgmVol * 100)}%`;
    this.updateSelectionVisuals();
    Logger.info('SettingsScene', `BGM alterado para ${this.bgmVol}`);
  }

  toggleSFX() {
    this.sfxVol = this.sfxVol >= 1.0 ? 0 : this.sfxVol + 0.25;
    AudioManager.setSFXVolume(this.sfxVol);
    this.options[2].text = `Volume SFX: ${Math.round(this.sfxVol * 100)}%`;
    this.updateSelectionVisuals();
    Logger.info('SettingsScene', `SFX alterado para ${this.sfxVol}`);
  }

  toggleFullscreen() {
    if (this.scale.isFullscreen) {
      this.scale.stopFullscreen();
      Logger.info('SettingsScene', 'Saiu do modo Fullscreen.');
    } else {
      this.scale.startFullscreen();
      Logger.info('SettingsScene', 'Entrou no modo Fullscreen.');
    }
  }

  goBack() {
    this.scene.start('MenuScene');
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
    this.menuTexts.forEach((textObj, i) => {
      if (i === this.selectedIndex) {
        textObj.setColor('#ffd700');
        textObj.setText(`> ${this.options[i].text} <`);
      } else {
        textObj.setColor('#aaaaaa');
        textObj.setText(this.options[i].text);
      }
    });
  }
}
