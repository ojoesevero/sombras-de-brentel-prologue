import Phaser from 'phaser';
import Logger from '../utils/Logger.js';

/**
 * Cena Genérica de Transição e Carregamento entre Grandes Atos da Campanha.
 * Exibe título de capítulo, subtítulo e parágrafo de lore para transição cinematográfica.
 */
export default class ActTransitionScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ActTransitionScene' });
  }

  init(data) {
    this.actNumber = data.actNumber || 'II';
    this.actTitle = data.actTitle || 'Ato II: As Muralhas de Rastphen';
    this.actSubtitle = data.actSubtitle || 'O Refúgio de Pedra e a Febre do Templo';
    this.loreText = data.loreText || 'Deixando para trás a segurança da Taverna, o ar se torna gélido sob a sombra dos portões de Rastphen...';
    this.targetScene = data.targetScene || 'RastphenCityScene';
    this.targetData = data.targetData || {};
    this.autoAdvanceDelay = data.autoAdvanceDelay || 3500;
  }

  create() {
    Logger.info('ActTransitionScene', `Exibindo transição narrativa para [${this.actTitle}].`);
    this.cameras.main.resetFX();
    this.cameras.main.fadeIn(600, 0, 0, 0);

    this.isTransitioning = false;

    // Fundo negro com vinheta escura
    this.add.rectangle(0, 0, 800, 600, 0x050508).setOrigin(0);

    // Borda estilizada
    const frame = this.add.graphics();
    frame.lineStyle(2, 0xd4af37, 0.4);
    frame.strokeRect(50, 50, 700, 500);

    // Número do Ato (Romano) em marca d'água de fundo
    this.add.text(400, 270, this.actNumber, {
      fontFamily: 'Georgia, serif',
      fontSize: '180px',
      color: '#12121e',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Título Principal
    this.add.text(400, 160, this.actTitle.toUpperCase(), {
      fontFamily: 'Georgia, serif',
      fontSize: '24px',
      color: '#ffd700',
      fontStyle: 'bold',
      letterSpacing: 2
    }).setOrigin(0.5);

    // Subtítulo
    if (this.actSubtitle) {
      this.add.text(400, 200, this.actSubtitle, {
        fontFamily: 'Georgia, serif',
        fontSize: '15px',
        color: '#aaaaaa',
        fontStyle: 'italic'
      }).setOrigin(0.5);
    }

    // Linha divisória
    const line = this.add.graphics();
    line.lineStyle(1, 0xd4af37, 0.6);
    line.lineBetween(220, 230, 580, 230);

    // Parágrafo Narrativo de Lore
    this.add.text(400, 310, this.loreText, {
      fontFamily: 'Georgia, serif',
      fontSize: '16px',
      color: '#e2e2e2',
      align: 'center',
      lineSpacing: 10,
      wordWrap: { width: 600 }
    }).setOrigin(0.5);

    // Indicador Pulsante de Prosseguir
    this.promptText = this.add.text(400, 480, '▼ Toque ou pressione [Espaço] para avançar', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '13px',
      color: '#d4af37'
    }).setOrigin(0.5);

    this.tweens.add({
      targets: this.promptText,
      alpha: 0.3,
      duration: 500,
      yoyo: true,
      repeat: -1
    });

    // Ação de transição
    const proceed = () => {
      this.proceedToTarget();
    };

    this.input.on('pointerdown', proceed);
    if (this.input.keyboard) {
      this.input.keyboard.on('keydown-SPACE', proceed);
      this.input.keyboard.on('keydown-ENTER', proceed);
      this.input.keyboard.on('keydown-Z', proceed);
    }

    // Auto-avanço opcional após alguns segundos caso o jogador não toque
    this.autoTimer = this.time.delayedCall(this.autoAdvanceDelay, () => {
      this.proceedToTarget();
    });
  }

  proceedToTarget() {
    if (this.isTransitioning) return;
    this.isTransitioning = true;

    if (this.autoTimer) {
      this.autoTimer.remove();
      this.autoTimer = null;
    }

    this.cameras.main.fadeOut(600, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start(this.targetScene, this.targetData);
    });
  }
}
