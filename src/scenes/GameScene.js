import Phaser from 'phaser';
import DialogueBox from '../ui/DialogueBox.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    this.cameras.main.resetFX();
    this.cameras.main.fadeIn(400, 0, 0, 0);

    // Cenário: rua de pedra
    this.add.rectangle(0, 0, 800, 600, 0x333333).setOrigin(0);
    // Carroça dos Escravos
    this.add.rectangle(400, 250, 200, 100, 0x5c4033).setOrigin(0.5);
    // Iksar (Oponente/Mercenário)
    this.add.rectangle(350, 320, 32, 32, 0xffd700).setOrigin(0.5);
    // Ilídiz (Acólita)
    this.add.rectangle(450, 320, 32, 32, 0xdda0dd).setOrigin(0.5);

    const dialoguesData = this.cache.json.get('dialogues') || {};
    const dialogueNodes = dialoguesData.intro_iksar || [
      { name: 'Iksar', text: 'Ora, ora... um draconato intrometido! Guardas, ensinem uma lição a esse lagarto!' },
      { name: 'Rhogar', text: 'Solte a garota, Iksar. Essa covardia termina aqui!' }
    ];

    this.dialogueBox = new DialogueBox(this, 50, 420, 700, 140);
    
    // Configurar Inputs
    const skipAction = () => {
      this.dialogueBox.skipOrNext();
    };

    this.input.keyboard.on('keydown-SPACE', skipAction);
    this.input.keyboard.on('keydown-ENTER', skipAction);
    this.input.keyboard.on('keydown-Z', skipAction);
    this.input.on('pointerdown', skipAction);

    // Transição Segura para Batalha
    this.dialogueBox.on('dialogueComplete', () => {
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.time.delayedCall(550, () => {
        this.scene.start('BattleScene', { 
          isFlashback: true, 
          enemyGroup: 'estayler_guards' 
        });
      });
    });

    this.dialogueBox.startDialogue(dialogueNodes);
  }
}
