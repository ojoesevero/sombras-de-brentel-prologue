import Phaser from 'phaser';
import DialogueBox from '../ui/DialogueBox.js';
import Logger from '../utils/Logger.js';

/**
 * Cena Global de Interface de Usuário (Overlay UIScene).
 * Executada em paralelo no topo das cenas ativas de exploração.
 * Gerencia a instância única de DialogueBox e o HUD de Objetivos.
 */
export default class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UIScene' });
  }

  create() {
    Logger.info('UIScene', 'Inicializando UIScene (Overlay global de UI).');

    // 1. HUD de Objetivos no topo direito
    this.objectiveText = this.add.text(400, 20, '', {
      fontFamily: 'Arial',
      fontSize: '15px',
      color: '#ffd700',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(3000);

    // 2. Caixa de Diálogos Global
    this.dialogueBox = new DialogueBox(this, 50, 440, 700, 140);
    this.dialogueBox.setDepth(3000);
    this.dialogueBox.setScrollFactor(0);
    this.dialogueBox.setVisible(false);

    // Eventos do DialogueBox
    this.dialogueBox.on('dialogueComplete', () => {
      this.dialogueBox.setVisible(false);
      this.game.events.emit('dialogueClosed');
    });

    // 3. Ouvintes de Eventos Globais (game.events)
    this.game.events.off('openDialogue');
    this.game.events.on('openDialogue', (dialogueNodes) => {
      if (!dialogueNodes) return;
      this.dialogueBox.setVisible(true);
      this.dialogueBox.startDialogue(dialogueNodes);
      this.game.events.emit('dialogueOpened');
    });

    this.game.events.off('advanceDialogue');
    this.game.events.on('advanceDialogue', () => {
      if (this.dialogueBox.visible) {
        this.dialogueBox.skipOrNext();
      }
    });

    this.game.events.off('closeDialogue');
    this.game.events.on('closeDialogue', () => {
      this.dialogueBox.setVisible(false);
      this.dialogueBox.closeDialogue();
      this.game.events.emit('dialogueClosed');
    });

    this.game.events.off('updateObjective');
    this.game.events.on('updateObjective', (text) => {
      if (this.objectiveText) {
        this.objectiveText.setText(text || '');
      }
    });

    // Limpeza de eventos ao desligar cena
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off('openDialogue');
      this.game.events.off('advanceDialogue');
      this.game.events.off('closeDialogue');
      this.game.events.off('updateObjective');
    });
  }

  isDialogueActive() {
    return this.dialogueBox && this.dialogueBox.visible;
  }
}
