import Phaser from 'phaser';
import InventoryManager from '../services/InventoryManager.js';
import Logger from '../utils/Logger.js';
import InputManager from '../services/InputManager.js';

import QuestManager from '../services/QuestManager.js';

/**
 * Interface Modal de Loja/Cardápio da Taverna (ShopUI).
 * Permite compra de itens via teclado e toque.
 */
export default class ShopUI extends Phaser.GameObjects.Container {
  /**
   * @param {Phaser.Scene} scene 
   * @param {number} x 
   * @param {number} y 
   */
  constructor(scene, x, y) {
    super(scene, x, y);
    this.scene = scene;

    // Fundo ornamental
    const bg = scene.add.rectangle(0, 0, 400, 300, 0x111111, 0.95);
    bg.setStrokeStyle(4, 0xd4af37);
    this.add(bg);

    this.title = scene.add.text(0, -120, 'Balcão da Hilda', {
      fontFamily: 'Georgia, serif',
      fontSize: '24px',
      color: '#ffd700',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.add(this.title);

    this.goldText = scene.add.text(0, -90, `Ouro: ${InventoryManager.gold} PO`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      color: '#ffffff'
    }).setOrigin(0.5);
    this.add(this.goldText);

    this.stock = [];
    this.itemTexts = [];
    this.selectables = [];

    this.closeBtn = scene.add.text(0, 100, 'Fechar', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      color: '#ff5555'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

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

    // Limpeza de listeners no descarte
    this.on('destroy', () => {
      this.unbindInputListeners();
    });
  }

  /**
   * Executa a transação de compra de item.
   * @param {Object} item 
   */
  buyItem(item) {
    if (!item) return;
    if (InventoryManager.gold >= item.price) {
      InventoryManager.removeGold(item.price);
      const qty = item.id === 'dwarven_ale' ? 3 : 1;
      InventoryManager.addItem(item.id, qty);
      if (this.goldText && this.goldText.active) {
        this.goldText.setText(`Ouro: ${InventoryManager.gold} PO`);
      }
      Logger.info('ShopUI', `Comprou ${item.name} por ${item.price} PO`);
      if (this.scene && this.scene.cameras && this.scene.cameras.main) {
        this.scene.cameras.main.flash(150, 212, 175, 55, 0.3);
      }
    } else {
      Logger.warn('ShopUI', 'Ouro insuficiente para comprar o item.');
      if (this.scene && this.scene.cameras && this.scene.cameras.main) {
        this.scene.cameras.main.shake(100, 0.01);
      }
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
    this.scene.sound.play('sfx_ui_hover', { volume: 0.3 });
    this.selectables.forEach((text, i) => {
      if (!text || !text.active || !text.scene) return;
      try {
        if (i === this.selectedIndex) {
          text.setColor('#ffff00');
          text.setBackgroundColor('#333300');
        } else {
          text.setBackgroundColor('transparent');
          text.setColor(text === this.closeBtn ? '#ff5555' : '#aaaaaa');
        }
      } catch (err) {
        // Ignora erros de renderização transientes
      }
    });
  }

  bindInputListeners() {
    this.unbindInputListeners();
    InputManager.on('UP', this.handleUp);
    InputManager.on('DOWN', this.handleDown);
    InputManager.on('CONFIRM', this.handleConfirm);
    InputManager.on('CANCEL', this.handleCancel);
  }

  unbindInputListeners() {
    InputManager.off('UP', this.handleUp);
    InputManager.off('DOWN', this.handleDown);
    InputManager.off('CONFIRM', this.handleConfirm);
    InputManager.off('CANCEL', this.handleCancel);
  }

  buildStock(customStock = null) {
    this.itemTexts.forEach(t => { this.remove(t); t.destroy(); });
    this.itemTexts = [];
    this.selectables = [];
    
    if (customStock) {
      this.stock = customStock.map(item => {
        if (!item.name) {
          const dbItem = InventoryManager.itemDatabase[item.id];
          item.name = dbItem ? dbItem.name : 'Item Desconhecido';
        }
        return item;
      });
    } else {
      const isPostFlashback = QuestManager.isQuestCompleted('quest_01_flashback');
      this.stock = [
        { id: 'dwarven_ale', name: 'Cerveja Anã (3 doses)', price: 15 }
      ];
      
      if (isPostFlashback) {
        this.stock.unshift({ id: 'potion_heal', name: 'Poção de Vida', price: 20 });
      }
    }

    this.stock.forEach((item, index) => {
      const yPos = -40 + (index * 40);
      const text = this.scene.add.text(0, yPos, `${item.name} - ${item.price} PO`, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px',
        color: '#aaaaaa'
      })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });
      
      text.on('pointerdown', () => this.buyItem(item));
      text.on('pointerover', () => {
        this.selectedIndex = index;
        this.updateSelection();
      });

      this.itemTexts.push(text);
      this.selectables.push(text);
      this.add(text);
    });
    
    this.selectables.push(this.closeBtn);
  }

  openShop(customStock = null) {
    this.buildStock(customStock);
    if (this.goldText && this.goldText.active) {
      this.goldText.setText(`Ouro: ${InventoryManager.gold} PO`);
    }
    this.setVisible(true);
    this.selectedIndex = 0;
    this.updateSelection();
    this.bindInputListeners();
  }

  closeShop() {
    this.setVisible(false);
    this.unbindInputListeners();
    this.emit('shopClosed');
  }
}
