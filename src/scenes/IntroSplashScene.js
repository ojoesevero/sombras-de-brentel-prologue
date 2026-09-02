import Phaser from 'phaser';
import Logger from '../utils/Logger.js';

/**
 * Cena de Introdução e Seleção de Modo (PC / Mobile).
 * Apresenta a produtora, o desenvolvedor, os créditos literários e permite a escolha de controle.
 */
export default class IntroSplashScene extends Phaser.Scene {
  constructor() {
    super({ key: 'IntroSplashScene' });
  }

  create() {
    Logger.info('IntroSplashScene', 'Iniciando sequência de telas de abertura.');
    this.cameras.main.resetFX();
    this.cameras.main.setBackgroundColor('#000000');

    this.currentStep = 0;
    this.isTransitioning = false;

    // Conteúdo das 3 telas cinematográficas iniciais
    this.splashData = [
      {
        title: 'VELHOS GAMES',
        subtitle: 'PRODUTORA',
        color: '#d4af37',
        subColor: '#ffffff'
      },
      {
        title: 'Desenvolvido por',
        subtitle: 'Joe Severo',
        color: '#aaaaaa',
        subColor: '#ffd700'
      },
      {
        title: 'Baseado no livro',
        subtitle: 'Os Seis Contra o Abismo\nA Floresta Cinzenta',
        author: 'Escrito por Thiago Schardosin',
        color: '#888888',
        subColor: '#d4af37'
      }
    ];

    // Container visual centralizado
    this.contentContainer = this.add.container(400, 300);

    this.mainText = this.add.text(0, -30, '', {
      fontFamily: 'Georgia, serif',
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold',
      align: 'center'
    }).setOrigin(0.5);

    this.subText = this.add.text(0, 30, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '22px',
      color: '#d4af37',
      align: 'center'
    }).setOrigin(0.5);

    this.extraText = this.add.text(0, 80, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      color: '#cccccc',
      fontStyle: 'italic',
      align: 'center'
    }).setOrigin(0.5);

    this.contentContainer.add([this.mainText, this.subText, this.extraText]);

    // Instrução discreta de skip/avanço
    this.skipHint = this.add.text(400, 560, 'Toque ou pressione [Espaço] para avançar', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '12px',
      color: '#555555'
    }).setOrigin(0.5);

    // Controles para avançar rapidamente
    const nextAction = () => {
      if (this.currentStep < 3 && !this.isTransitioning) {
        this.advanceStep();
      }
    };

    this.input.on('pointerdown', (pointer) => {
      // Se já estiver na tela de seleção de modo (step 3), os botões cuidam do evento
      if (this.currentStep < 3) {
        nextAction();
      }
    });

    if (this.input.keyboard) {
      this.input.keyboard.on('keydown-SPACE', nextAction);
      this.input.keyboard.on('keydown-ENTER', nextAction);
      this.input.keyboard.on('keydown-Z', nextAction);
    }

    this.showStep(0);
  }

  showStep(stepIndex) {
    this.currentStep = stepIndex;
    this.isTransitioning = false;

    if (stepIndex < 3) {
      const data = this.splashData[stepIndex];
      this.mainText.setText(data.title);
      this.mainText.setColor(data.color);
      this.subText.setText(data.subtitle);
      this.subText.setColor(data.subColor);
      this.extraText.setText(data.author || '');

      this.contentContainer.setAlpha(0);

      // Fade in suave
      this.tweens.add({
        targets: this.contentContainer,
        alpha: 1,
        duration: 800,
        ease: 'Quad.easeInOut',
        onComplete: () => {
          // Temporizador automático de permanência na tela
          this.stepTimer = this.time.delayedCall(2200, () => {
            this.advanceStep();
          });
        }
      });
    } else {
      this.showModeSelection();
    }
  }

  advanceStep() {
    if (this.isTransitioning) return;
    this.isTransitioning = true;

    if (this.stepTimer) {
      this.stepTimer.remove();
      this.stepTimer = null;
    }

    this.tweens.add({
      targets: this.contentContainer,
      alpha: 0,
      duration: 500,
      ease: 'Quad.easeInOut',
      onComplete: () => {
        this.showStep(this.currentStep + 1);
      }
    });
  }

  /**
   * Tela 4: Painel Interativo de Seleção de Modo de Controle (PC / Mobile)
   */
  showModeSelection() {
    this.skipHint.setVisible(false);
    this.contentContainer.removeAll(true);
    this.contentContainer.setAlpha(1);

    // Detectar dispositivo automaticamente para pré-seleção recomendada
    const isTouchDevice = (
      this.sys.game.device.os.android ||
      this.sys.game.device.os.iOS ||
      ('ontouchstart' in window) ||
      (navigator.maxTouchPoints > 0)
    );

    const savedMode = localStorage.getItem('controlMode') || (isTouchDevice ? 'mobile' : 'pc');

    // Título da Escolha
    const title = this.add.text(0, -120, 'ESCOLHA O MODO DE CONTROLE', {
      fontFamily: 'Georgia, serif',
      fontSize: '26px',
      color: '#d4af37',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const subtitle = this.add.text(0, -75, 'Você poderá alterar isso a qualquer momento nas Opções.', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      color: '#aaaaaa'
    }).setOrigin(0.5);

    this.contentContainer.add([title, subtitle]);

    // Botão 1: PC (Teclado)
    const btnPC = this.createModeButton(
      -160, 20,
      '💻 PC (Teclado)',
      'Setas / WASD para mover\nZ / Espaço para agir',
      savedMode === 'pc',
      () => this.selectMode('pc')
    );

    // Botão 2: Mobile (Touch na Tela)
    const btnMobile = this.createModeButton(
      160, 20,
      '📱 Mobile (Touch)',
      'D-Pad Virtual na tela\nBotão tátil para interagir',
      savedMode === 'mobile',
      () => this.selectMode('mobile')
    );

    this.contentContainer.add([btnPC, btnMobile]);
  }

  createModeButton(x, y, label, description, isRecommended, onClick) {
    const container = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, 260, 110, 0x181818, 0.95);
    bg.setStrokeStyle(2, isRecommended ? 0xd4af37 : 0x444444);
    bg.setInteractive({ useHandCursor: true });

    if (isRecommended) {
      const badge = this.add.text(0, -58, 'RECOMENDADO', {
        fontSize: '11px',
        color: '#000000',
        backgroundColor: '#ffd700',
        padding: { x: 6, y: 2 }
      }).setOrigin(0.5);
      container.add(badge);
    }

    const titleText = this.add.text(0, -20, label, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const descText = this.add.text(0, 20, description, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '12px',
      color: '#888888',
      align: 'center'
    }).setOrigin(0.5);

    container.add([bg, titleText, descText]);

    bg.on('pointerover', () => {
      bg.fillColor = 0x282828;
      bg.setStrokeStyle(3, 0xffd700);
      titleText.setColor('#ffd700');
    });

    bg.on('pointerout', () => {
      bg.fillColor = 0x181818;
      bg.setStrokeStyle(2, isRecommended ? 0xd4af37 : 0x444444);
      titleText.setColor('#ffffff');
    });

    bg.on('pointerdown', onClick);

    return container;
  }

  selectMode(mode) {
    Logger.info('IntroSplashScene', `Modo de controle selecionado: ${mode}`);
    
    // Armazenar no Registry do Phaser e em LocalStorage
    this.registry.set('controlMode', mode);
    try {
      localStorage.setItem('controlMode', mode);
    } catch (e) {
      Logger.warn('IntroSplashScene', 'Falha ao gravar no localStorage.', e);
    }

    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start('MenuScene');
    });
  }
}
