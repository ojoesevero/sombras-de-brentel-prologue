import Phaser from 'phaser';
import InventoryManager from '../services/InventoryManager.js';
import Logger from '../utils/Logger.js';
import InputManager from '../services/InputManager.js';

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
    this.selectables = [];
    
    this.stock.forEach((item, index) => {
      const yPos = -40 + (index * 40);
      const text = scene.add.text(0, yPos, `${item.name} - ${item.price} PO`, { fontSize: '18px', fill: '#aaaaaa' })
        .setOrigin(0.5)
        .setInteractive();
      
      text.on('pointerdown', () => this.buyItem(item));
      text.on('pointerover', () => {
        this.selectedIndex = index;
        this.updateSelection();
      });

      this.itemTexts.push(text);
      this.selectables.push(text);
      this.add(text);
    });

    this.closeBtn = scene.add.text(0, 100, 'Fechar', { fontSize: '18px', fill: '#ff5555' }).setOrigin(0.5).setInteractive();
    this.closeBtn.on('pointerdown', () => this.closeShop());
    this.closeBtn.on('pointerover', () => {
      this.selectedIndex = this.selectables.length - 1;
      this.updateSelection();
    });
    this.add(this.closeBtn);
    this.selectables.push(this.closeBtn);

    scene.add.existing(this);
    this.setVisible(false);
    this.selectedIndex = 0;
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

  handleUp = () => {
    if (!this.visible) return;
    this.selectedIndex--;
    if (this.selectedIndex < 0) this.selectedIndex = this.selectables.length - 1;
    this.updateSelection();
  };

  handleDown = () => {
    if (!this.visible) return;
    this.selectedIndex++;
    if (this.selectedIndex >= this.selectables.length) this.selectedIndex = 0;
    this.updateSelection();
  };

  handleConfirm = () => {
    if (!this.visible) return;
    if (this.selectables[this.selectedIndex] === this.closeBtn) {
      this.closeShop();
    } else {
      this.buyItem(this.stock[this.selectedIndex]);
    }
  };

  handleCancel = () => {
    if (!this.visible) return;
    this.closeShop();
  };

  updateSelection() {
    this.selectables.forEach((text, i) => {
      if (i === this.selectedIndex) {
        text.setColor('#ffff00');
        text.setBackgroundColor('#333300'); // Fundo iluminado (destaque visual)
      } else {
        text.setBackgroundColor('transparent');
        text.setColor(text === this.closeBtn ? '#ff5555' : '#aaaaaa');
      }
    });
  }

  openShop() {
    this.goldText.setText(`Ouro: ${InventoryManager.gold} PO`);
    this.setVisible(true);
    this.selectedIndex = 0;
    this.updateSelection();
    
    InputManager.on('UP', this.handleUp);
    InputManager.on('DOWN', this.handleDown);
    InputManager.on('CONFIRM', this.handleConfirm);
    InputManager.on('CANCEL', this.handleCancel);
  }

  closeShop() {
    this.setVisible(false);
    InputManager.off('UP', this.handleUp);
    InputManager.off('DOWN', this.handleDown);
    InputManager.off('CONFIRM', this.handleConfirm);
    InputManager.off('CANCEL', this.handleCancel);
    this.emit('shopClosed');
  }
}
