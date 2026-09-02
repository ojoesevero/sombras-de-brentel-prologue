import Phaser from 'phaser';
import Logger from '../utils/Logger.js';

/**
 * Cena de Introdução Narrativa por Ato (ActIntroScene).
 * Apresenta a crônica e o lore oficial do livro antes do início do gameplay de cada Ato.
 */
export default class ActIntroScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ActIntroScene' });
  }

  init(data) {
    this.actNumber = data.actNumber || 'ATO I';
    this.actRoman = data.actRoman || this.extractRoman(this.actNumber);
    this.actTitle = data.actTitle || 'A Taverna Cauda do Dragão';
    this.loreText = data.loreText || '';
    this.nextScene = data.nextScene || data.targetScene || 'TavernScene';
    this.spawnData = data.spawnData || data.targetData || {};
  }

  extractRoman(str) {
    if (!str) return 'I';
    const match = str.match(/\b(I|II|III|IV|V|VI)\b/i);
    return match ? match[1].toUpperCase() : 'I';
  }

  create() {
    Logger.info('ActIntroScene', `Exibindo introdução de ${this.actNumber} — ${this.actTitle}`);
    this.cameras.main.resetFX();
    this.cameras.main.fadeIn(800, 0, 0, 0);

    this.isTransitioning = false;

    // Fundo pergaminho escuro profundo
    this.add.rectangle(0, 0, 800, 600, 0x0a0a0e).setOrigin(0);

    // Marca d'água sutil com numeral romano ao centro
    this.add.text(400, 300, this.actRoman, {
      fontFamily: 'Georgia, serif',
      fontSize: '200px',
      color: '#151522',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Borda clássica dourada de RPG
    const frame = this.add.graphics();
    frame.lineStyle(2, 0xd4af37, 0.6);
    frame.strokeRect(40, 40, 720, 520);
    frame.lineStyle(1, 0x555555, 0.4);
    frame.strokeRect(46, 46, 708, 508);

    // Título do Ato em destaque
    const fullHeading = `${this.actNumber.toUpperCase()} — ${this.actTitle.toUpperCase()}`;
    this.add.text(400, 110, fullHeading, {
      fontFamily: 'Georgia, serif',
      fontSize: '22px',
      color: '#ffd700',
      fontStyle: 'bold',
      letterSpacing: 2,
      align: 'center',
      wordWrap: { width: 660 }
    }).setOrigin(0.5);

    // Linha divisória ornamental dourada
    const divider = this.add.graphics();
    divider.lineStyle(2, 0xd4af37, 0.7);
    divider.lineBetween(220, 150, 580, 150);
    divider.fillStyle(0xd4af37, 1);
    divider.fillCircle(400, 150, 4);

    // Bloco de Texto Narrativo Centralizado (Crônica do Livro)
    this.loreTextBox = this.add.text(400, 310, this.loreText, {
      fontFamily: 'Georgia, serif',
      fontSize: '18px',
      color: '#f0f0f0',
      align: 'center',
      lineSpacing: 12,
      wordWrap: { width: 620 }
    }).setOrigin(0.5);

    // Rodapé de Ação com Animação Pulsante
    this.promptText = this.add.text(400, 510, '▼ Pressione ESPAÇO ou Toque na Tela para Continuar', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '13px',
      color: '#ffd700',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.tweens.add({
      targets: this.promptText,
      alpha: 0.25,
      duration: 550,
      yoyo: true,
      repeat: -1
    });

    // Controles para avançar
    const proceed = () => {
      this.finishIntro();
    };

    this.input.on('pointerdown', proceed);
    if (this.input.keyboard) {
      this.input.keyboard.on('keydown-SPACE', proceed);
      this.input.keyboard.on('keydown-ENTER', proceed);
      this.input.keyboard.on('keydown-Z', proceed);
    }
  }

  finishIntro() {
    if (this.isTransitioning) return;
    this.isTransitioning = true;

    Logger.info('ActIntroScene', `Transicionando para o gameplay: ${this.nextScene}`);

    this.cameras.main.fadeOut(600, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      // Garantir que a UIScene esteja em execução para HUD e controles touch
      if (!this.scene.isActive('UIScene')) {
        this.scene.launch('UIScene');
      }
      this.scene.start(this.nextScene, this.spawnData);
    });
  }
}
