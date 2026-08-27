import Phaser from 'phaser';

export default class WorldMapUI extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, x, y);
    this.scene = scene;

    const bg = scene.add.rectangle(0, 0, 700, 500, 0x1a1a1a, 0.95);
    bg.setStrokeStyle(4, 0xd4af37);
    this.add(bg);

    const title = scene.add.text(0, -210, 'Mapa de Walldarten & Reino de Brentel', { fontSize: '26px', fill: '#ffd700', fontStyle: 'bold' }).setOrigin(0.5);
    this.add(title);

    const rastphen = scene.add.text(0, -110, 'Rastphen (Local Atual)\nCidade fortificada, Taverna Cauda do Dragão e Templo de Palmem.', { fontSize: '18px', fill: '#00ff00', align: 'center', lineSpacing: 5 }).setOrigin(0.5);
    this.add(rastphen);

    const estayler = scene.add.text(0, -30, 'Avenida de Estayler (Norte)\nTerritório de Granster - Local do confronto na carroça de escravos.', { fontSize: '16px', fill: '#aaaaaa', align: 'center', lineSpacing: 5 }).setOrigin(0.5);
    this.add(estayler);

    const forest = scene.add.text(0, 50, 'Estrada Sul & Bosque Cinzento\nFlorestas densas, ruínas antigas e relatos de corruptores abissais.', { fontSize: '16px', fill: '#ffaa00', align: 'center', lineSpacing: 5 }).setOrigin(0.5);
    this.add(forest);

    const ravinas = scene.add.text(0, 130, 'Ravinas do Deserto (Sudoeste)\nGrutas ao sudoeste onde a Espada Bastarda foi forjada.', { fontSize: '16px', fill: '#aaaaaa', align: 'center', lineSpacing: 5 }).setOrigin(0.5);
    this.add(ravinas);

    const closePrompt = scene.add.text(0, 210, '▼ Pressione [Z] ou [ESC] para Fechar o Mapa', { fontSize: '14px', fill: '#ffffff' }).setOrigin(0.5);
    
    this.scene.tweens.add({
      targets: closePrompt,
      alpha: 0.3,
      duration: 500,
      yoyo: true,
      repeat: -1
    });

    this.add(closePrompt);

    scene.add.existing(this);
  }

  closeMap() {
    this.destroy();
  }
}
