import Phaser from 'phaser';
import Logger from '../utils/Logger.js';
import QuestManager from '../services/QuestManager.js';
import { AssetsConfig } from '../config/assets.js';

/**
 * Cena de Prólogo Narrativo ("Novo Jogo").
 * Apresenta a introdução da lore e do universo de "Os Seis Contra o Abismo" antes do Ato I.
 */
export default class IntroStoryScene extends Phaser.Scene {
  constructor() {
    super({ key: 'IntroStoryScene' });
  }

  create() {
    Logger.info('IntroStoryScene', 'Iniciando narrativa de introdução do Prólogo.');
    this.cameras.main.resetFX();
    this.cameras.main.fadeIn(800, 0, 0, 0);

    // Fundo escuro com gradiente sombrio
    this.add.rectangle(0, 0, 800, 600, 0x07070a).setOrigin(0);

    // Efeito de partículas sutis (brasas / poeira arcana flutuante)
    if (this.textures.exists(AssetsConfig?.fx?.particle_star)) {
      this.add.particles(400, 300, AssetsConfig.fx.particle_star, {
        speed: { min: 10, max: 30 },
        angle: { min: 240, max: 300 },
        scale: { start: 0.4, end: 0 },
        alpha: { start: 0.3, end: 0 },
        lifespan: 4000,
        frequency: 200,
        blendMode: 'ADD'
      });
    }

    // Moldura decorativa
    const frame = this.add.graphics();
    frame.lineStyle(2, 0xd4af37, 0.4);
    frame.strokeRect(40, 40, 720, 520);
    frame.lineStyle(1, 0x444444, 0.6);
    frame.strokeRect(44, 44, 712, 512);

    // Título do Capítulo Introdutório
    this.add.text(400, 80, 'SOMBRAS DE BRENTEL: PRÓLOGO', {
      fontFamily: 'Georgia, serif',
      fontSize: '22px',
      color: '#d4af37',
      fontStyle: 'bold',
      letterSpacing: 2
    }).setOrigin(0.5);

    this.add.text(400, 110, 'Crônicas de "Os Seis Contra o Abismo: A Floresta Cinzenta"', {
      fontFamily: 'Georgia, serif',
      fontSize: '13px',
      color: '#888888',
      fontStyle: 'italic'
    }).setOrigin(0.5);

    // Divisor dourado
    const divider = this.add.graphics();
    divider.lineStyle(1, 0xd4af37, 0.5);
    divider.lineBetween(200, 130, 600, 130);

    // Parágrafos da História
    this.paragraphs = [
      'No continente de Brentel, onde a natureza selvagem e os perigos ocultos se entrelaçam, forças ancestrais despertam nas sombras de um mundo corrompido pela pestilência.',
      'O acólito meio-elfo Joseph Sylven e o bárbaro draconato Rhogar Tordan trilham destinos atados pelo caos e pela ordem, unidos pela necessidade brutal de sobrevivência.',
      'Após um confronto impiedoso contra as patrulhas mercenárias do capitão Iksar e uma fuga desesperada pelas ravinas rochosas, seus caminhos foram cravados a ferro e sangue.',
      'Agora, sob a névoa densa das imediações de Rastphen, as portas de madeira da Taverna Cauda do Dragão oferecem um breve fôlego... antes que o Abismo cobre o seu tributo.'
    ];

    this.currentParaIndex = 0;
    this.textObjects = [];

    // Container para o texto narrativo
    this.loreContainer = this.add.container(400, 200);

    // Instruções de Avanço
    this.nextPrompt = this.add.text(400, 520, '▼ Pressione [Espaço] ou Toque na tela para prosseguir', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '13px',
      color: '#ffd700'
    }).setOrigin(0.5);

    this.tweens.add({
      targets: this.nextPrompt,
      alpha: 0.3,
      duration: 600,
      yoyo: true,
      repeat: -1
    });

    // Botão discreto de Pular História
    const skipBtn = this.add.text(710, 60, '[Pular >>]', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '13px',
      color: '#777777'
    }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });

    skipBtn.on('pointerover', () => skipBtn.setColor('#ffffff'));
    skipBtn.on('pointerout', () => skipBtn.setColor('#777777'));
    skipBtn.on('pointerdown', () => this.finishIntro());

    // Bindings de Input
    const advanceAction = () => {
      this.advanceParagraph();
    };

    this.input.on('pointerdown', (pointer) => {
      // Ignorar toque se clicou exatamente no botão pular
      if (pointer.x > 620 && pointer.y < 90) return;
      advanceAction();
    });

    if (this.input.keyboard) {
      this.input.keyboard.on('keydown-SPACE', advanceAction);
      this.input.keyboard.on('keydown-ENTER', advanceAction);
      this.input.keyboard.on('keydown-Z', advanceAction);
      this.input.keyboard.on('keydown-ESC', () => this.finishIntro());
    }

    this.displayCurrentParagraph();
  }

  displayCurrentParagraph() {
    if (this.currentParaIndex >= this.paragraphs.length) {
      this.finishIntro();
      return;
    }

    const textStr = this.paragraphs[this.currentParaIndex];
    const yPos = this.currentParaIndex * 75;

    const pText = this.add.text(0, yPos, textStr, {
      fontFamily: 'Georgia, serif',
      fontSize: '16px',
      color: '#e0e0e0',
      align: 'center',
      lineSpacing: 8,
      wordWrap: { width: 640 }
    }).setOrigin(0.5, 0);

    pText.setAlpha(0);
    this.loreContainer.add(pText);
    this.textObjects.push(pText);

    this.tweens.add({
      targets: pText,
      alpha: 1,
      y: yPos - 5,
      duration: 600,
      ease: 'Quad.easeOut'
    });
  }

  advanceParagraph() {
    if (this.isEnding) return;

    this.currentParaIndex++;
    if (this.currentParaIndex < this.paragraphs.length) {
      this.displayCurrentParagraph();
    } else {
      this.finishIntro();
    }
  }

  finishIntro() {
    if (this.isEnding) return;
    this.isEnding = true;

    Logger.info('IntroStoryScene', 'História concluída. Iniciando ActIntroScene para Ato I.');

    QuestManager.resetQuests();

    this.cameras.main.fadeOut(800, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start('ActIntroScene', {
        actNumber: 'ATO I',
        actRoman: 'I',
        actTitle: 'A Taverna Cauda do Dragão',
        loreText: 'No continente de Brentel, no ano de 312 D.I., caminhos imprevisíveis cruzam a vida de heróis marcados pelo destino. O acólito meio-elfo Joseph Sylven, devoto de Lízan, e o bárbaro draconato Rhogar encontram-se na metrópole de Rastphen. Nas mesas da Taverna Cauda do Dragão, segredos e sussurros dão início a uma jornada implacável.',
        nextScene: 'TavernScene',
        spawnData: { x: 400, y: 500 }
      });
    });
  }
}
