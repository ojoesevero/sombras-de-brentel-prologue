import Phaser from 'phaser';
import InventoryManager from '../services/InventoryManager.js';
import Logger from '../utils/Logger.js';

export default class ShopUI extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, x, y);
    this.scene = scene;

    const bg = scene.add.rectangle(0, 0, 400, 300, 0x111111, 0.95);
    bg.setStrokeStyle(4, 0xd4af37);
    this.add(bg);

    this.title = scene.add.text(0, -120, 'Balcão da Hilda', { fontSize: '24px', fill: '#ffd700', fontStyle: 'bold' }).setOrigin(0.5);
    this.add(this.title);

    this.goldText = scene.add.text(0, -90, `Ouro: ${InventoryManager.gold} PO`, { fontSize: '16px', fill: '#ffffff' }).setOrigin(0.5);
    this.add(this.goldText);

    this.stock = [
      { id: 'potion_heal', name: 'Poção de Vida', price: 20 },
      { id: 'dwarven_ale', name: 'Cerveja Anã', price: 15 }
    ];

    this.itemTexts = [];
    this.stock.forEach((item, index) => {
      const yPos = -40 + (index * 40);
      const text = scene.add.text(0, yPos, `${item.name} - ${item.price} PO`, { fontSize: '18px', fill: '#aaaaaa' })
        .setOrigin(0.5)
        .setInteractive();
      
      text.on('pointerdown', () => this.buyItem(item));
      text.on('pointerover', () => text.setColor('#ffffff'));
      text.on('pointerout', () => text.setColor('#aaaaaa'));

      this.itemTexts.push(text);
      this.add(text);
    });

    const closeBtn = scene.add.text(0, 100, 'Fechar', { fontSize: '18px', fill: '#ff5555' }).setOrigin(0.5).setInteractive();
    closeBtn.on('pointerdown', () => this.closeShop());
    this.add(closeBtn);

    scene.add.existing(this);
    this.setVisible(false);
  }

  buyItem(item) {
    if (InventoryManager.gold >= item.price) {
      InventoryManager.gold -= item.price;
      InventoryManager.addItem(item.id, 1);
      this.goldText.setText(`Ouro: ${InventoryManager.gold} PO`);
      Logger.info('ShopUI', `Comprou ${item.name} por ${item.price} PO`);
    } else {
      Logger.warn('ShopUI', 'Ouro insuficiente para comprar o item.');
      this.scene.cameras.main.shake(100, 0.01);
    }
  }

  openShop() {
    this.goldText.setText(`Ouro: ${InventoryManager.gold} PO`);
    this.setVisible(true);
  }

  closeShop() {
    this.setVisible(false);
    this.emit('shopClosed');
  }
}
