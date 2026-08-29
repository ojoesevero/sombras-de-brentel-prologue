import Phaser from 'phaser';
import SaveManager from '../services/SaveManager.js';
import QuestManager from '../services/QuestManager.js';
import InventoryManager from '../services/InventoryManager.js';
import InputManager from '../services/InputManager.js';
import Logger from '../utils/Logger.js';

/**
 * Cena de Menu Principal do Jogo.
 */
export default class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    this.add.rectangle(0, 0, 800, 600, 0x080808).setOrigin(0);

    // Título Principal
    this.add.text(400, 150, 'Sombras de Brentel', { fontSize: '48px', fill: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
    this.add.text(400, 210, 'Prologue', { fontSize: '24px', fill: '#d4af37', fontStyle: 'italic' }).setOrigin(0.5);

    // Menu Array
    this.options = [
      { text: 'Novo Jogo', action: () => this.startNewGame() }
    ];

    if (SaveManager.hasSave()) {
      this.options.push({ text: 'Continuar', action: () => this.continueGame() });
    }

    this.options.push({ text: 'Opções', action: () => this.openSettings() });

    this.selectedIndex = 0;
    this.menuTexts = [];

    // Renderizar Menu
    this.options.forEach((opt, index) => {
      const y = 350 + index * 50;
      const t = this.add.text(400, y, opt.text, { fontSize: '24px', fill: '#aaaaaa' })
        .setOrigin(0.5)
        .setInteractive();

      t.on('pointerdown', opt.action);
      t.on('pointerover', () => this.setSelection(index));

      this.menuTexts.push(t);
    });

    // Injetar InputManager
    InputManager.init(this);
    InputManager.onAction('DOWN', () => this.moveSelection(1));
    InputManager.onAction('UP', () => this.moveSelection(-1));
    InputManager.onAction('CONFIRM', () => this.options[this.selectedIndex].action());

    this.updateSelectionVisuals();
    Logger.info('MenuScene', 'Cena de Menu criada e inputs vinculados.');
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
        textObj.setFontStyle('bold');
        textObj.setText(`> ${this.options[i].text} <`);
      } else {
        textObj.setColor('#aaaaaa');
        textObj.setFontStyle('normal');
        textObj.setText(this.options[i].text);
      }
    });
  }

  startNewGame() {
    Logger.info('MenuScene', 'Ação: Iniciar Novo Jogo (TavernScene)');
    QuestManager.resetQuests();
    this.scene.launch('UIScene');
    this.scene.start('TavernScene');
  }

  continueGame() {
    Logger.info('MenuScene', 'Ação: Continuar progresso salvo');
    const saveData = SaveManager.loadGame();
    if (!saveData) {
      Logger.warn('MenuScene', 'Nenhum save válido encontrado para continuar.');
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

    Logger.info('MenuScene', `Restaurando sessão para ${targetScene}`, spawnData);
    this.scene.launch('UIScene');
    this.scene.start(targetScene, spawnData);
  }

  openSettings() {
    Logger.info('MenuScene', 'Ação: Abrir Opções');
    this.scene.start('SettingsScene');
  }
}
