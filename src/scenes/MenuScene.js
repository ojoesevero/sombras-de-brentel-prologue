import Phaser from 'phaser';
import SaveManager from '../services/SaveManager.js';
import QuestManager from '../services/QuestManager.js';
import InventoryManager from '../services/InventoryManager.js';
import InputManager from '../services/InputManager.js';
import Logger from '../utils/Logger.js';

/**
 * Cena de Menu Principal do Jogo.
 * Inclui Novo Jogo (com prólogo de história), Continuar, Opções e Guia "Como Jogar".
 */
export default class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    this.add.rectangle(0, 0, 800, 600, 0x080808).setOrigin(0);

    // Título Principal
    this.add.text(400, 130, 'Sombras de Brentel', {
      fontFamily: 'Georgia, serif',
      fontSize: '48px',
      fill: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(400, 185, 'PROLOGUE', {
      fontFamily: 'Georgia, serif',
      fontSize: '22px',
      fill: '#d4af37',
      fontStyle: 'italic',
      letterSpacing: 4
    }).setOrigin(0.5);

    // Menu Array
    this.options = [
      { text: 'Novo Jogo', action: () => this.startNewGame() }
    ];

    if (SaveManager.hasSave()) {
      this.options.push({ text: 'Continuar', action: () => this.continueGame() });
    }

    this.options.push({ text: 'Como Jogar', action: () => this.openHowToPlay() });
    this.options.push({ text: 'Opções', action: () => this.openSettings() });

    this.selectedIndex = 0;
    this.menuTexts = [];
    this.modalContainer = null;

    // Renderizar Itens do Menu
    const startY = 270;
    this.options.forEach((opt, index) => {
      const y = startY + index * 50;
      const t = this.add.text(400, y, opt.text, {
        fontFamily: 'Georgia, serif',
        fontSize: '22px',
        fill: '#aaaaaa'
      })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

      t.on('pointerdown', () => {
        if (!this.modalContainer) opt.action();
      });
      t.on('pointerover', () => {
        if (!this.modalContainer) this.setSelection(index);
      });

      this.menuTexts.push(t);
    });

    // Injetar InputManager
    InputManager.init(this);
    this.setupInputs();

    this.updateSelectionVisuals();
    Logger.info('MenuScene', 'Cena de Menu criada e inputs vinculados.');
  }

  setupInputs() {
    InputManager.onAction('DOWN', () => {
      if (this.modalContainer) return;
      this.moveSelection(1);
    });

    InputManager.onAction('UP', () => {
      if (this.modalContainer) return;
      this.moveSelection(-1);
    });

    InputManager.onAction('CONFIRM', () => {
      if (this.modalContainer) {
        this.closeHowToPlay();
        return;
      }
      this.options[this.selectedIndex].action();
    });

    InputManager.onAction('CANCEL', () => {
      if (this.modalContainer) {
        this.closeHowToPlay();
      }
    });
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
    Logger.info('MenuScene', 'Ação: Iniciar Novo Jogo -> IntroStoryScene');
    QuestManager.resetQuests();
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start('IntroStoryScene');
    });
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

  /**
   * Painel Modal Explicativo: Como Jogar
   */
  openHowToPlay() {
    if (this.modalContainer) return;
    Logger.info('MenuScene', 'Ação: Abrir modal Como Jogar');

    this.modalContainer = this.add.container(400, 300);

    // Fundo escuro semi-transparente
    const backdrop = this.add.rectangle(0, 0, 800, 600, 0x000000, 0.75).setInteractive();
    
    // Painel Central
    const panel = this.add.rectangle(0, 0, 620, 420, 0x141418, 0.98);
    panel.setStrokeStyle(2, 0xd4af37);

    // Título
    const title = this.add.text(0, -170, 'COMO JOGAR', {
      fontFamily: 'Georgia, serif',
      fontSize: '24px',
      color: '#ffd700',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Linha divisória
    const line = this.add.graphics();
    line.lineStyle(1, 0xd4af37, 0.5);
    line.lineBetween(-260, -145, 260, -145);

    // Seção PC
    const pcTitle = this.add.text(-250, -125, '💻 CONTROLES NO PC (TECLADO):', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '15px',
      color: '#d4af37',
      fontStyle: 'bold'
    });

    const pcDesc = this.add.text(-250, -95, 
      '• Mover: Teclas de Setas (◄ ▲ ▼ ►) ou W, A, S, D\n' +
      '• Interagir / Falar / Confirmar: Tecla Z, ESPAÇO ou ENTER\n' +
      '• Combate: Escolha com as setas e confirme com Z ou ESPAÇO\n' +
      '• Menu de Pausa / Cancelar: Tecla ESC ou X', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '13px',
      color: '#dddddd',
      lineSpacing: 6
    });

    // Seção Mobile
    const mobileTitle = this.add.text(-250, 15, '📱 CONTROLES NO MOBILE (TOUCH NA TELA):', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '15px',
      color: '#00ffff',
      fontStyle: 'bold'
    });

    const mobileDesc = this.add.text(-250, 45, 
      '• Mover: D-Pad Virtual no canto inferior esquerdo (▲ ▼ ◄ ►)\n' +
      '• Ação / Interagir: Botão redondo [A] no canto inferior direito\n' +
      '• Avançar Diálogos: Toque no botão [A] ou na própria caixa de texto\n' +
      '• Menu de Pausa: Botão [MENU] no canto inferior direito', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '13px',
      color: '#dddddd',
      lineSpacing: 6
    });

    // Dica de configuração
    const tip = this.add.text(0, 140, '💡 Dica: Você pode alternar entre modo PC e Mobile a qualquer momento no menu Opções.', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '12px',
      color: '#aaaaaa',
      align: 'center'
    }).setOrigin(0.5);

    // Botão Fechar
    const closeBtn = this.add.rectangle(0, 175, 160, 36, 0x222222).setInteractive({ useHandCursor: true });
    closeBtn.setStrokeStyle(1, 0xd4af37);
    const closeText = this.add.text(0, 175, 'Entendido [Fechar]', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      color: '#ffffff'
    }).setOrigin(0.5);

    closeBtn.on('pointerover', () => {
      closeBtn.fillColor = 0xd4af37;
      closeText.setColor('#000000');
    });

    closeBtn.on('pointerout', () => {
      closeBtn.fillColor = 0x222222;
      closeText.setColor('#ffffff');
    });

    closeBtn.on('pointerdown', () => this.closeHowToPlay());
    backdrop.on('pointerdown', () => this.closeHowToPlay());

    this.modalContainer.add([
      backdrop, panel, title, line,
      pcTitle, pcDesc,
      mobileTitle, mobileDesc,
      tip, closeBtn, closeText
    ]);
  }

  closeHowToPlay() {
    if (this.modalContainer) {
      this.modalContainer.destroy();
      this.modalContainer = null;
    }
  }
}
