import Phaser from 'phaser';
import Logger from '../utils/Logger.js';
export default class DialogueBox extends Phaser.GameObjects.Container {
  constructor(scene, x, y, width, height) {
    super(scene, x, y);
    this.baseY = y;
    this.boxWidth = width;
    this.boxHeight = height;

    // Background
    this.graphics = scene.add.graphics();
    this.updateBackgroundSize(this.boxHeight);
    this.add(this.graphics);

    // Retrato dinâmico
    this.portraitImage = scene.add.image(10, 10, '').setOrigin(0, 0);
    this.portraitImage.setDisplaySize(120, 120);
    this.portraitImage.setVisible(false);
    this.add(this.portraitImage);

    const textMarginX = 140; 

    // Name text
    this.nameText = scene.add.text(textMarginX, 15, '', {
      fontFamily: 'Arial',
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#ffd700'
    });
    this.add(this.nameText);

    // Dialogue text
    this.dialogueText = scene.add.text(textMarginX, 45, '', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#ffffff',
      wordWrap: { width: width - textMarginX - 20 }
    });
    this.add(this.dialogueText);

    // Prompt text (blinking)
    this.promptText = scene.add.text(width - 20, height - 25, '▼ [Espaço / Z / Toque]', {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: '#ffd700',
      fontStyle: 'bold'
    }).setOrigin(1, 0);
    this.promptText.setVisible(false);
    this.add(this.promptText);

    // Zona de toque interativa local cobrindo a caixa de diálogo
    this.touchZone = scene.add.zone(0, 0, width, height).setOrigin(0, 0).setInteractive({ useHandCursor: true });
    this.add(this.touchZone);
    this.touchZone.on('pointerdown', (pointer, localX, localY, event) => {
      if (this.visible && this.isOpen) {
        if (event && event.stopPropagation) event.stopPropagation();
        this.skipOrNext();
      }
    });

    // Blinking tween
    scene.tweens.add({
      targets: this.promptText,
      alpha: 0.2,
      duration: 500,
      yoyo: true,
      repeat: -1
    });

    scene.add.existing(this);

    this.isTyping = false;
    this.fullText = '';
    this.currentText = '';
    this.typingTimer = null;
    this.choicesContainer = scene.add.container(textMarginX, 100);
    this.add(this.choicesContainer);
    this.currentChoiceIndex = 0;
    this.hasChoices = false;
    this.activeChoices = [];
    this.tempResponseNode = null;

    // Listener global de toque na tela (Mobile & Pointer)
    this.handleGlobalPointerDown = (pointer) => {
      if (this.visible && this.isOpen) {
        // Se houver opções ativas, o clique nas opções tem prioridade
        if (this.hasChoices) {
          // Se clicou fora das opções enquanto tem choices, não cancela, mas pode focar ou avançar
          return;
        }
        this.skipOrNext();
      }
    };

    scene.input.on('pointerdown', this.handleGlobalPointerDown);

    // Destrutor de segurança para evitar Memory Leak do timer e binds
    this.on('destroy', () => {
      this.clearChoices();
      if (this.typingTimer) {
        this.typingTimer.remove();
        this.typingTimer = null;
      }
      if (this.scene && this.scene.input) {
        this.scene.input.off('pointerdown', this.handleGlobalPointerDown);
        if (this.scene.input.keyboard) {
          this.scene.input.keyboard.off('keydown-UP', this.handleUp, this);
          this.scene.input.keyboard.off('keydown-DOWN', this.handleDown, this);
          this.scene.input.keyboard.off('keydown-W', this.handleUp, this);
          this.scene.input.keyboard.off('keydown-S', this.handleDown, this);
        }
      }
    });

    this.scene.input.keyboard.on('keydown-UP', this.handleUp, this);
    this.scene.input.keyboard.on('keydown-DOWN', this.handleDown, this);
    this.scene.input.keyboard.on('keydown-W', this.handleUp, this);
    this.scene.input.keyboard.on('keydown-S', this.handleDown, this);
  }

  handleUp() {
    if (this.hasChoices && this.visible && !this.isTyping) {
      this.currentChoiceIndex--;
      if (this.currentChoiceIndex < 0) this.currentChoiceIndex = this.activeChoices.length - 1;
      this.updateChoicesVisuals();
    }
  }

  handleDown() {
    if (this.hasChoices && this.visible && !this.isTyping) {
      this.currentChoiceIndex++;
      if (this.currentChoiceIndex >= this.activeChoices.length) this.currentChoiceIndex = 0;
      this.updateChoicesVisuals();
    }
  }

  startDialogue(dialogueData) {
    this.isOpen = true;
    const rawNodes = Array.isArray(dialogueData.nodes) ? dialogueData.nodes : (Array.isArray(dialogueData) ? dialogueData : [dialogueData]);
    
    this.nodes = rawNodes.map(n => ({
      ...n,
      character: n.character || n.name || n.speaker || 'Narrador',
      text: n.text || ''
    }));

    Logger.dialogue('START', this.nodes[0].character, this.nodes[0].text);

    this.lineIndex = 0;
    this.tempResponseNode = null;
    this.showCurrentLine();
  }

  showCurrentLine() {
    this.clearChoices();
    const node = this.tempResponseNode || this.nodes[this.lineIndex];
    this.nameText.setText(node.character || node.speaker || '???');
    this.fullText = node.text;
    this.currentText = '';
    this.dialogueText.setText('');
    this.promptText.setVisible(false);
    this.isTyping = true;

    if (node.portraitKey && this.scene.textures.exists(node.portraitKey)) {
      this.portraitImage.setTexture(node.portraitKey);
      this.portraitImage.setVisible(true);
      this.portraitImage.setAlpha(0);
      this.portraitImage.x = 0;
      
      this.nameText.setX(140);
      this.dialogueText.setX(140);
      this.dialogueText.setStyle({ wordWrap: { width: this.boxWidth - 140 - 20 } });
      this.choicesContainer.setX(140);

      this.scene.tweens.add({
        targets: this.portraitImage,
        alpha: 1,
        x: 10,
        duration: 300,
        ease: 'Power2'
      });
    } else {
      this.portraitImage.setVisible(false);
      this.nameText.setX(20);
      this.dialogueText.setX(20);
      this.dialogueText.setStyle({ wordWrap: { width: this.boxWidth - 40 } });
      this.choicesContainer.setX(20);
    }

    if (this.typingTimer) {
      this.typingTimer.remove();
    }

    let charIndex = 0;
    this.typingTimer = this.scene.time.addEvent({
      delay: 25,
      repeat: this.fullText.length - 1,
      callback: () => {
        this.currentText += this.fullText[charIndex];
        this.dialogueText.setText(this.currentText);
        charIndex++;

        if (charIndex === this.fullText.length) {
          this.completeDialogue();
        }
      }
    });
  }

  /**
   * Atualiza a altura do fundo e da borda dourada com base na quantidade de conteúdo/opções.
   * @param {number} targetHeight - Altura alvo em pixels.
   */
  updateBackgroundSize(targetHeight) {
    const h = targetHeight || this.boxHeight;
    const extraHeight = h - this.boxHeight;
    
    // Desloca suavemente para cima caso a caixa aumente, garantindo que não estoure a tela
    if (this.baseY !== undefined) {
      this.setY(this.baseY - extraHeight);
    }

    if (this.graphics) {
      this.graphics.clear();
      this.graphics.fillStyle(0x000000, 0.85);
      this.graphics.fillRoundedRect(0, 0, this.boxWidth, h, 10);
      this.graphics.lineStyle(3, 0xd4af37, 1);
      this.graphics.strokeRoundedRect(0, 0, this.boxWidth, h, 10);
    }

    if (this.promptText) {
      this.promptText.setY(h - 25);
    }
  }

  completeDialogue() {
    this.isTyping = false;
    this.dialogueText.setText(this.fullText);
    
    if (this.typingTimer) {
      this.typingTimer.remove();
    }

    const node = this.tempResponseNode || this.nodes[this.lineIndex];
    if (node.choices && node.choices.length > 0) {
      this.promptText.setVisible(false);
      this.renderChoices(node.choices);
    } else {
      this.promptText.setVisible(true);
    }
  }

  clearChoices() {
    this.hasChoices = false;
    this.activeChoices = [];
    this.choicesContainer.removeAll(true);
    this.updateBackgroundSize(this.boxHeight);
  }

  renderChoices(choices) {
    this.hasChoices = true;
    this.currentChoiceIndex = 0;
    this.activeChoices = choices;
    this.choicesTextObjects = [];

    const baseHeight = this.boxHeight; // 140
    const extraHeightPerChoice = 35;
    const totalChoices = choices ? choices.length : 0;
    const dynamicHeight = baseHeight + (totalChoices > 1 ? (totalChoices - 1) * extraHeightPerChoice : 0);

    // Redimensiona o background e a borda dinamicamente
    this.updateBackgroundSize(dynamicHeight);

    choices.forEach((choice, index) => {
      const t = this.scene.add.text(0, index * 30, choice.text, {
        fontFamily: 'Arial',
        fontSize: '14px',
        color: '#ffffff'
      }).setInteractive();

      t.on('pointerdown', () => {
        this.currentChoiceIndex = index;
        this.selectChoice();
      });
      t.on('pointerover', () => {
        this.currentChoiceIndex = index;
        this.updateChoicesVisuals();
      });

      this.choicesContainer.add(t);
      this.choicesTextObjects.push(t);
    });
    this.updateChoicesVisuals();
  }

  updateChoicesVisuals() {
    if (!this.hasChoices) return;
    this.choicesTextObjects.forEach((t, index) => {
      if (index === this.currentChoiceIndex) {
        t.setColor('#ffff00');
        t.setText(`> ${this.activeChoices[index].text}`);
      } else {
        t.setColor('#ffffff');
        t.setText(this.activeChoices[index].text);
      }
    });
  }

  closeDialogue() {
    this.isOpen = false;
    this.isPrinting = false;
    this.isTyping = false;
    if (this.typingTimer) {
      this.typingTimer.remove();
      this.typingTimer = null;
    }
    this.clearChoices();
    this.setVisible(false);
    
    if (this.scene) {
      this.scene.isInteracting = false;
      this.scene.isDialogueOpen = false; 
    }
    
    Logger.dialogue('END', '', null);
    this.emit('dialogueComplete');
  }

  selectChoice() {
    const choice = this.activeChoices[this.currentChoiceIndex];
    Logger.dialogue('CHOICE', this.nodes[this.lineIndex].character || '???', choice.text);
    this.clearChoices();
    
    if (typeof choice.callback === 'function') {
      this.closeDialogue();
      choice.callback();
      return;
    }

    if (choice.response) {
      const speaker = this.nodes[this.lineIndex].character || this.nodes[this.lineIndex].speaker || '???';
      this.tempResponseNode = { speaker: speaker, text: choice.response, portraitKey: this.nodes[this.lineIndex].portraitKey };
      this.showCurrentLine();
    } else if (choice.nextNode) {
      this.tempResponseNode = null;
      this.lineIndex++;
      this.showCurrentLine();
    } else {
      this.tempResponseNode = null;
      this.lineIndex++;
      if (this.lineIndex < this.nodes.length) {
        this.showCurrentLine();
      } else {
        this.closeDialogue();
      }
    }
  }

  skipOrNext() {
    if (!this.visible) return;

    if (this.isTyping) {
      this.completeDialogue();
    } else if (this.hasChoices) {
      this.selectChoice();
    } else {
      if (this.tempResponseNode) {
        this.tempResponseNode = null;
        this.lineIndex++;
      } else {
        this.lineIndex++;
      }

      if (this.lineIndex < this.nodes.length) {
        Logger.dialogue('NEXT', this.nodes[this.lineIndex].character || '???', this.nodes[this.lineIndex].text);
        this.showCurrentLine();
      } else {
        this.closeDialogue();
      }
    }
  }
}
