import Phaser from 'phaser';

export default class DemoEndScene extends Phaser.Scene {
  constructor() {
    super({ key: 'DemoEndScene' });
  }

  create() {
    this.add.rectangle(0, 0, 800, 600, 0x000000).setOrigin(0);

    this.add.text(400, 200, 'Os Seis Contra o Abismo:\nA Floresta Cinzenta', { fontSize: '32px', fill: '#ffd700', fontStyle: 'bold', align: 'center' }).setOrigin(0.5);
    this.add.text(400, 280, 'Obrigado por jogar o Prólogo.', { fontSize: '20px', fill: '#ffffff' }).setOrigin(0.5);

    const wishlistBtn = this.add.rectangle(400, 380, 400, 50, 0x111155).setInteractive();
    wishlistBtn.setStrokeStyle(2, 0x4444ff);
    this.add.text(400, 380, 'Adicione à Lista de Desejos na Steam', { fontSize: '18px', fill: '#fff' }).setOrigin(0.5);

    wishlistBtn.on('pointerdown', () => {
      console.log('Abrindo link da Steam...');
      try {
        const { shell } = window.require('electron');
        shell.openExternal('https://store.steampowered.com/');
      } catch (e) {
        window.open('https://store.steampowered.com/', '_blank');
      }
    });

    const menuBtn = this.add.text(400, 480, 'Retornar ao Menu', { fontSize: '20px', fill: '#aaaaaa' }).setOrigin(0.5).setInteractive();
    menuBtn.on('pointerdown', () => this.scene.start('MenuScene'));
  }
}
