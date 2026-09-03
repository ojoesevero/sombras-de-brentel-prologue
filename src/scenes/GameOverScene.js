import Phaser from 'phaser';
import InputManager from '../services/InputManager.js';
import SaveManager from '../services/SaveManager.js';
import InventoryManager from '../services/InventoryManager.js';
import QuestManager from '../services/QuestManager.js';
import Logger from '../utils/Logger.js';

/**
 * Cena de Game Over.
 */
export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data) {
    this.previousScene = data.previousScene || 'MenuScene';
  }

  create() {
    Logger.info('GameOverScene', 'O jogador foi derrotado. Iniciando tela de Game Over.');
    
    // Fundo escuro com fade-in vermelho
    const bg = this.add.rectangle(0, 0, 800, 600, 0x330000).setOrigin(0);
    bg.setAlpha(0);
    this.tweens.add({
      targets: bg,
      alpha: 0.8,
      duration: 1500
    });

    this.add.text(400, 150, 'VOCÊ SUCUMBIU', { fontSize: '48px', fill: '#ff0000', fontStyle: 'bold' }).setOrigin(0.5);

    this.options = [
      { text: 'Tentar Novamente', action: () => this.retry() }
    ];

    if (SaveManager.hasSave()) {
      this.options.push({ text: 'Carregar Último Ponto', action: () => this.loadSave() });
    }

    this.options.push({ text: 'Menu Principal', action: () => this.goToMenu() });

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
    if (!this.sys || !this.sys.isActive() || !this.menuTexts) return;
    this.menuTexts.forEach((t, i) => {
      if (!t || !t.active || !t.scene || !t.style) return;
      try {
        if (i === this.selectedIndex) {
          t.setColor('#ffffff');
          t.setText(`> ${this.options[i].text} <`);
        } else {
          t.setColor('#aaaaaa');
          t.setText(this.options[i].text);
        }
      } catch (err) {
        // Ignora falhas de renderização em transição
      }
    });
  }

  retry() {
    Logger.info('GameOverScene', 'Reiniciando a jornada.');
    InputManager.cleanListeners();
    this.scene.launch('UIScene');
    if (this.previousScene && this.previousScene !== 'GameOverScene' && this.previousScene !== 'BattleScene') {
      this.scene.start(this.previousScene);
    } else {
      this.scene.start('TavernScene');
    }
  }

  loadSave() {
    Logger.info('GameOverScene', 'Carregando save.');
    const saveData = SaveManager.loadGame();
    if (!saveData) {
      this.retry();
      return;
    }

    if (saveData.inventory) {
      InventoryManager.loadFromStorage(saveData.inventory);
    }
    if (saveData.quests) {
      QuestManager.init(saveData.quests);
    }

    const targetScene = saveData.player?.scene || saveData.player?.checkpoint || 'TavernScene';
    const spawnData = {
      x: saveData.player?.x,
      y: saveData.player?.y,
      loadedData: saveData
    };

    InputManager.cleanListeners();
    this.scene.launch('UIScene');
    this.scene.start(targetScene, spawnData);
  }

  goToMenu() {
    Logger.info('GameOverScene', 'Voltando ao menu principal.');
    InputManager.cleanListeners();
    this.scene.stop('UIScene');
    this.scene.start('MenuScene');
  }
}
