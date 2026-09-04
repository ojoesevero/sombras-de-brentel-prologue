import Phaser from 'phaser';
import InventoryManager from '../services/InventoryManager.js';
import Logger from '../utils/Logger.js';

/**
 * YanilShopScene - Loja e Empório do Mercenário Yanil Resty.
 * Baseada no lore de mercadorias raras e tecidos de Walldarten (Capítulo 7).
 * Permite compra e troca de mantos, elixires, pergaminhos arcanos e relíquias com ouro.
 */
export default class YanilShopScene extends Phaser.Scene {
  constructor() {
    super({ key: 'YanilShopScene' });
  }

  init(data) {
    this.previousSceneKey = data.previousSceneKey || data.sceneKey || 'RastphenCityScene';
    this.playerEntity = data.player || null;
    Logger.info('YanilShopScene', `Loja de Yanil Resty aberta como overlay de [${this.previousSceneKey}].`);
  }

  create() {
    const width = 800;
    const height = 600;

    // 1. Backdrop escurecido com clique para fechar
    const backdrop = this.add.rectangle(0, 0, width, height, 0x000000, 0.82).setOrigin(0).setInteractive();
    backdrop.on('pointerdown', () => this.closeShop());

    // 2. Painel Central
    const panelW = 720;
    const panelH = 520;
    const panelContainer = this.add.container(width / 2, height / 2);

    const panelBg = this.add.rectangle(0, 0, panelW, panelH, 0x0b0f19, 0.98);
    panelBg.setStrokeStyle(3, 0xd4af37, 1);
    panelContainer.add(panelBg);

    // Moldura interna
    const innerFrame = this.add.rectangle(0, 0, panelW - 14, panelH - 14, 0x111928, 0.4);
    innerFrame.setStrokeStyle(1, 0x1f2937, 0.8);
    panelContainer.add(innerFrame);

    // Cabeçalho e Título
    const titleText = this.add.text(-panelW / 2 + 30, -panelH / 2 + 25, '⚖️ EMPÓRIO DE TECIDOS E RELÍQUIAS — YANIL RESTY', {
      fontFamily: 'Georgia, serif',
      fontSize: '18px',
      color: '#ffd700',
      fontStyle: 'bold',
      letterSpacing: 1
    });

    // Contador de Ouro do Jogador
    this.goldText = this.add.text(panelW / 2 - 170, -panelH / 2 + 22, `🪙 Ouro: ${InventoryManager.gold} PO`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '15px',
      color: '#ffd700',
      fontStyle: 'bold',
      backgroundColor: '#1f1608',
      padding: { x: 8, y: 4 }
    });

    // Botão Fechar [X]
    const closeBtn = this.add.text(panelW / 2 - 35, -panelH / 2 + 20, '✖', {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#ff6b6b',
      fontStyle: 'bold'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    closeBtn.on('pointerdown', () => this.closeShop());
    closeBtn.on('pointerover', () => closeBtn.setColor('#ff4757'));
    closeBtn.on('pointerout', () => closeBtn.setColor('#ff6b6b'));

    panelContainer.add([titleText, this.goldText, closeBtn]);

    // Banner de Lore do Yanil Resty (Capítulo 7)
    const quoteContainer = this.add.container(0, -panelH / 2 + 65);
    const quoteBg = this.add.rectangle(0, 0, panelW - 50, 36, 0x1f2937, 0.7);
    quoteBg.setStrokeStyle(1, 0x374151);

    const quoteText = this.add.text(0, 0, '"Sedas raras de Walldarten, mantos reforçados e poções da fronteira sul. Se tem ouro, temos negócio!"', {
      fontFamily: 'Georgia, serif',
      fontSize: '12px',
      color: '#e5e7eb',
      fontStyle: 'italic',
      align: 'center'
    }).setOrigin(0.5);

    quoteContainer.add([quoteBg, quoteText]);
    panelContainer.add(quoteContainer);

    // Divisor
    const divider = this.add.graphics();
    divider.lineStyle(1, 0xd4af37, 0.4);
    divider.lineBetween(-panelW / 2 + 20, -panelH / 2 + 90, panelW / 2 - 20, -panelH / 2 + 90);
    panelContainer.add(divider);

    // 3. Catálogo de Produtos de Yanil Resty
    this.stock = [
      { id: 'manto_elfico', name: 'Manto Élfico de Yanil', price: 75, icon: '🧣', desc: 'Tecido élfico encantado que concede +4 de Defesa permanente.', type: 'equipment' },
      { id: 'seda_walldarten', name: 'Seda Rara de Walldarten', price: 60, icon: '🧵', desc: 'Tecido nobre de contrabando do Cap. 7. Item de lore e prestígio.', type: 'lore' },
      { id: 'amuleto_brentel', name: 'Amuleto Protetor de Brentel', price: 90, icon: '🛡️', desc: 'Relíquia forjada em Rastphen (+30 Max HP e +2 DEF).', type: 'equipment' },
      { id: 'pergaminho_trovao', name: 'Pergaminho do Trovão', price: 50, icon: '📜', desc: 'Libera descargas elétricas instantâneas (+15 Ataque).', type: 'scroll' },
      { id: 'fury_elixir', name: 'Elixir Dracônico', price: 40, icon: '🔥', desc: 'Extrato alquímico que restaura +50 pontos de Fúria.', type: 'consumable' },
      { id: 'potion_large', name: 'Poção Grande de Cura', price: 45, icon: '🍷', desc: 'Infusão curativa concentrada que restaura +100 HP.', type: 'consumable' },
      { id: 'potion_heal', name: 'Poção de Vida Padrão', price: 20, icon: '🧪', desc: 'Poção de ervas da montanha que restaura +50 HP.', type: 'consumable' }
    ];

    this.selectedIndex = 0;
    this.listContainer = this.add.container(-panelW / 2 + 30, -panelH / 2 + 105);
    panelContainer.add(this.listContainer);

    // 4. Painel de Detalhes da Mercadoria Selecionada (Lado Direito)
    this.detailsContainer = this.add.container(panelW / 2 - 230, -panelH / 2 + 105);
    panelContainer.add(this.detailsContainer);

    this.renderStockList();

    // Rodapé de Ajuda
    const footer = this.add.text(0, panelH / 2 - 20, 'Navegar: [Setas / WASD]  |  Comprar: [Z / Espaço / Toque]  |  Sair: [X / Shift / ESC]', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '11px',
      color: '#9ca3af'
    }).setOrigin(0.5);
    panelContainer.add(footer);

    this.setupKeyboard();
  }

  renderStockList() {
    this.listContainer.removeAll(true);

    const itemW = 430;
    const itemH = 48;
    const gap = 8;

    this.stock.forEach((item, index) => {
      const isSelected = index === this.selectedIndex;
      const yPos = index * (itemH + gap);

      const row = this.add.container(0, yPos);

      // Fundo da linha
      const rowBg = this.add.rectangle(0, 0, itemW, itemH, isSelected ? 0x1f2937 : 0x111827).setOrigin(0);
      rowBg.setStrokeStyle(isSelected ? 2 : 1, isSelected ? 0xd4af37 : 0x374151, 1);
      rowBg.setInteractive({ useHandCursor: true });

      // Ícone
      const icon = this.add.text(25, itemH / 2, item.icon, { fontSize: '20px' }).setOrigin(0.5);

      // Nome do item
      const name = this.add.text(50, itemH / 2 - 8, item.name, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '13px',
        fontStyle: 'bold',
        color: isSelected ? '#ffd700' : '#f9fafb'
      }).setOrigin(0, 0.5);

      // Preço em ouro
      const priceText = this.add.text(itemW - 80, itemH / 2, `${item.price} PO`, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '13px',
        fontStyle: 'bold',
        color: InventoryManager.gold >= item.price ? '#ffd700' : '#ef4444'
      }).setOrigin(0, 0.5);

      // Quantidade já possuída na mochila
      const existing = InventoryManager.items.find(i => i.id === item.id);
      const ownedQty = existing ? existing.quantity : 0;
      const ownedText = this.add.text(itemW - 15, itemH / 2, `(${ownedQty})`, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '11px',
        color: '#9ca3af'
      }).setOrigin(1, 0.5);

      row.add([rowBg, icon, name, priceText, ownedText]);

      rowBg.on('pointerdown', () => {
        if (this.selectedIndex === index) {
          this.buySelectedItem();
        } else {
          this.selectedIndex = index;
          this.renderStockList();
        }
      });

      rowBg.on('pointerover', () => {
        if (this.selectedIndex !== index) {
          this.selectedIndex = index;
          this.renderStockList();
        }
      });

      this.listContainer.add(row);
    });

    this.renderDetails();
    if (this.goldText) {
      this.goldText.setText(`🪙 Ouro: ${InventoryManager.gold} PO`);
    }
  }

  renderDetails() {
    this.detailsContainer.removeAll(true);

    const w = 210;
    const h = 385;

    const bg = this.add.rectangle(0, 0, w, h, 0x111827, 0.95).setOrigin(0);
    bg.setStrokeStyle(1, 0x374151, 1);
    this.detailsContainer.add(bg);

    const item = this.stock[this.selectedIndex];
    if (!item) return;

    // Ícone Grande
    const bigIcon = this.add.text(w / 2, 50, item.icon, { fontSize: '48px' }).setOrigin(0.5);

    // Nome
    const nameText = this.add.text(w / 2, 95, item.name, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#ffd700',
      align: 'center',
      wordWrap: { width: w - 20 }
    }).setOrigin(0.5);

    // Divisor
    const div = this.add.graphics();
    div.lineStyle(1, 0x374151, 0.8);
    div.lineBetween(15, 125, w - 15, 125);

    // Descrição detalhada
    const descText = this.add.text(15, 138, item.desc, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '12px',
      color: '#d1d5db',
      wordWrap: { width: w - 30 }
    });

    // Preço
    const priceLabel = this.add.text(15, 250, `Preço: ${item.price} PO`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#ffd700'
    });

    // Quantidade atual na mochila
    const existing = InventoryManager.items.find(i => i.id === item.id);
    const ownedQty = existing ? existing.quantity : 0;
    const ownedLabel = this.add.text(15, 275, `Em posse: ${ownedQty} unidade(s)`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '12px',
      color: '#9ca3af'
    });

    // Botão de Comprar
    const canAfford = InventoryManager.gold >= item.price;
    const btnContainer = this.add.container(w / 2, 335);

    const btnBg = this.add.rectangle(0, 0, w - 30, 40, canAfford ? 0xd4af37 : 0x374151).setOrigin(0.5);
    btnBg.setStrokeStyle(1, canAfford ? 0xf39c12 : 0x4b5563);

    const btnLabel = this.add.text(0, 0, canAfford ? 'COMPRAR' : 'SEM OURO', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '13px',
      fontStyle: 'bold',
      color: canAfford ? '#000000' : '#9ca3af'
    }).setOrigin(0.5);

    btnContainer.add([btnBg, btnLabel]);

    if (canAfford) {
      btnBg.setInteractive({ useHandCursor: true });
      btnBg.on('pointerdown', () => this.buySelectedItem());
      btnBg.on('pointerover', () => btnBg.fillColor = 0xf1c40f);
      btnBg.on('pointerout', () => btnBg.fillColor = 0xd4af37);
    }

    this.detailsContainer.add([bigIcon, nameText, div, descText, priceLabel, ownedLabel, btnContainer]);
  }

  buySelectedItem() {
    const item = this.stock[this.selectedIndex];
    if (!item) return;

    if (InventoryManager.gold >= item.price) {
      InventoryManager.gold -= item.price;
      InventoryManager.addItem(item.id, 1);
      Logger.info('YanilShopScene', `Comprou ${item.name} por ${item.price} PO.`);

      // Feedback visual e sonoro
      this.cameras.main.flash(200, 241, 196, 15, 0.4);

      this.renderStockList();
    } else {
      Logger.warn('YanilShopScene', 'Ouro insuficiente para adquirir mercadoria de Yanil.');
      this.cameras.main.shake(120, 0.015);
    }
  }

  setupKeyboard() {
    this.input.keyboard.on('keydown-UP', () => {
      this.selectedIndex = Math.max(0, this.selectedIndex - 1);
      this.renderStockList();
    });
    this.input.keyboard.on('keydown-W', () => {
      this.selectedIndex = Math.max(0, this.selectedIndex - 1);
      this.renderStockList();
    });

    this.input.keyboard.on('keydown-DOWN', () => {
      this.selectedIndex = Math.min(this.stock.length - 1, this.selectedIndex + 1);
      this.renderStockList();
    });
    this.input.keyboard.on('keydown-S', () => {
      this.selectedIndex = Math.min(this.stock.length - 1, this.selectedIndex + 1);
      this.renderStockList();
    });

    this.input.keyboard.on('keydown-SPACE', () => this.buySelectedItem());
    this.input.keyboard.on('keydown-ENTER', () => this.buySelectedItem());
    this.input.keyboard.on('keydown-Z', () => this.buySelectedItem());

    this.input.keyboard.on('keydown-ESC', () => this.closeShop());
    this.input.keyboard.on('keydown-X', () => this.closeShop());
    this.input.keyboard.on('keydown-SHIFT', () => this.closeShop());

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard.removeAllListeners();
    });
  }

  closeShop() {
    Logger.info('YanilShopScene', `Fechando empório de Yanil e retomando [${this.previousSceneKey}].`);
    this.scene.stop();
    if (this.previousSceneKey && this.scene.isPaused(this.previousSceneKey)) {
      this.scene.resume(this.previousSceneKey);
    }
  }
}
