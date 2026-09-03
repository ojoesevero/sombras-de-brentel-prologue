import Phaser from 'phaser';
import DialogueBox from '../ui/DialogueBox.js';
import { AssetsConfig } from '../config/assets.js';
import Logger from '../utils/Logger.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    Logger.info('GameScene', 'Iniciando cutscene de Estayler com carroça e personagens em Pixel Art.');
    this.cameras.main.resetFX();
    this.cameras.main.fadeIn(400, 0, 0, 0);

    // 1. Cenário: Estrada rochosa de Estayler ao entardecer
    this.add.rectangle(0, 0, 800, 600, 0x1e1b18).setOrigin(0);

    // Detalhes do piso de paralelepípedo / terra batida
    for (let py = 180; py < 450; py += 30) {
      this.add.rectangle(400, py, 800, 2, 0x2d2720, 0.4);
    }

    // 2. Carroça de Escravos em Pixel Art Detalhado
    this.cartSprite = this.add.image(400, 230, 'tex_cart').setDepth(2);

    // Efeito sutil de balanço da carroça parada
    this.tweens.add({
      targets: this.cartSprite,
      y: 232,
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // 3. Guardas e Soldados Inimigos de Estayler (Chibi Pixel Art)
    // Guarda Esquerdo
    this.add.ellipse(280, 265, 24, 8, 0x000000, 0.4).setDepth(2);
    const guardLeft = this.add.sprite(280, 250, AssetsConfig.sprites.guard).setDepth(3);

    // Guarda Direito
    this.add.ellipse(520, 265, 24, 8, 0x000000, 0.4).setDepth(2);
    const guardRight = this.add.sprite(520, 250, AssetsConfig.sprites.soldier || AssetsConfig.sprites.guard).setDepth(3).setFlipX(true);

    // 4. Iksar (Oponente/Mercenário)
    this.add.ellipse(340, 325, 24, 8, 0x000000, 0.45).setDepth(2);
    this.iksarSprite = this.add.sprite(340, 310, AssetsConfig.sprites.iksar).setDepth(3);
    this.add.text(340, 285, 'IKSAR', {
      fontFamily: 'Arial',
      fontSize: '9px',
      color: '#ff4757',
      fontStyle: 'bold',
      backgroundColor: 'rgba(0,0,0,0.7)',
      padding: { x: 3, y: 1 }
    }).setOrigin(0.5).setDepth(4);

    // 5. Ilídiz (Acólita Prisioneira)
    this.add.ellipse(460, 325, 24, 8, 0x000000, 0.45).setDepth(2);
    this.ilidizSprite = this.add.sprite(460, 310, AssetsConfig.sprites.ilidiz).setDepth(3);
    this.add.text(460, 285, 'ILÍDIZ', {
      fontFamily: 'Arial',
      fontSize: '9px',
      color: '#a29bfe',
      fontStyle: 'bold',
      backgroundColor: 'rgba(0,0,0,0.7)',
      padding: { x: 3, y: 1 }
    }).setOrigin(0.5).setDepth(4);

    // 6. Rhogar Tordan (Draconato em posição de investida)
    this.add.ellipse(400, 385, 26, 8, 0x000000, 0.5).setDepth(2);
    this.rhogarSprite = this.add.sprite(400, 370, AssetsConfig.sprites.rhogar).setDepth(3);
    this.add.text(400, 345, 'RHOGAR', {
      fontFamily: 'Arial',
      fontSize: '9px',
      color: '#ffd700',
      fontStyle: 'bold',
      backgroundColor: 'rgba(0,0,0,0.7)',
      padding: { x: 3, y: 1 }
    }).setOrigin(0.5).setDepth(4);

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
