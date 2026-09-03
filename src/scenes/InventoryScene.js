import Phaser from 'phaser';
import InventoryManager from '../services/InventoryManager.js';
import Logger from '../utils/Logger.js';

/**
 * InventoryScene - Cena de Sobreposição Modal de Mochila e Inventário.
 * Exibe a grade limpa de itens (Ouro, Poções, Pergaminhos, Equipamentos e Lore),
 * permitindo navegação por teclado (Setas/WASD, Z/Enter, X/Shift/ESC) e toque mobile.
 */
export default class InventoryScene extends Phaser.Scene {
  constructor() {
    super({ key: 'InventoryScene' });
  }

  init(data) {
    this.previousSceneKey = data.previousSceneKey || data.sceneKey || 'TavernScene';
    this.playerEntity = data.player || null;
    Logger.info('InventoryScene', `Inventário aberto como overlay de [${this.previousSceneKey}].`);
  }

  create() {
    const width = 800;
    const height = 600;

    // 1. Fundo escurecido semitransparente (Backdrop) com clique para fechar
    const backdrop = this.add.rectangle(0, 0, width, height, 0x000000, 0.78).setOrigin(0).setInteractive();
    backdrop.on('pointerdown', () => this.closeInventory());

    // 2. Painel Central Modal
    const panelW = 700;
    const panelH = 500;
    const panelX = width / 2;
    const panelY = height / 2;

    const panelContainer = this.add.container(panelX, panelY);

    // Caixa de fundo com borda ornamental dourada
    const panelBg = this.add.rectangle(0, 0, panelW, panelH, 0x0e1117, 0.98);
    panelBg.setStrokeStyle(3, 0xd4af37, 1);
    panelContainer.add(panelBg);

    // Moldura interna sutil
    const innerFrame = this.add.rectangle(0, 0, panelW - 16, panelH - 16, 0x161b22, 0.5);
    innerFrame.setStrokeStyle(1, 0x30363d, 0.8);
    panelContainer.add(innerFrame);

    // Cabeçalho da Janela
    const titleText = this.add.text(-panelW / 2 + 30, -panelH / 2 + 25, '🎒 MOCHILA DE RHOGAR TORDAN', {
      fontFamily: 'Georgia, serif',
      fontSize: '20px',
      color: '#ffd700',
      fontStyle: 'bold',
      letterSpacing: 1
    });

    // Contador de Ouro
    this.goldText = this.add.text(panelW / 2 - 170, -panelH / 2 + 25, `🪙 Ouro: ${InventoryManager.gold} PO`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      color: '#ffd700',
      fontStyle: 'bold',
      backgroundColor: '#1f1608',
      padding: { x: 8, y: 4 }
    });

    // Botão de Fechar [X] no topo direito
    const closeBtn = this.add.text(panelW / 2 - 35, -panelH / 2 + 22, '✖', {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#ff6b6b',
      fontStyle: 'bold'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    closeBtn.on('pointerdown', () => this.closeInventory());
    closeBtn.on('pointerover', () => closeBtn.setColor('#ff4757'));
    closeBtn.on('pointerout', () => closeBtn.setColor('#ff6b6b'));

    panelContainer.add([titleText, this.goldText, closeBtn]);

    // Resumo de Atributos do Jogador no topo
    const playerSummary = this.getPlayerSummaryText();
    this.summaryTextObj = this.add.text(-panelW / 2 + 30, -panelH / 2 + 55, playerSummary, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '12px',
      color: '#8b949e'
    });
    panelContainer.add(this.summaryTextObj);

    // Divisor Horizontal
    const divider = this.add.graphics();
    divider.lineStyle(1, 0xd4af37, 0.4);
    divider.lineBetween(-panelW / 2 + 20, -panelH / 2 + 75, panelW / 2 - 20, -panelH / 2 + 75);
    panelContainer.add(divider);

    // 3. Grid de Itens (Lado Esquerdo / Central)
    this.itemGridContainer = this.add.container(-panelW / 2 + 30, -panelH / 2 + 95);
    panelContainer.add(this.itemGridContainer);

    // 4. Painel de Detalhes do Item (Lado Direito)
    this.detailsContainer = this.add.container(panelW / 2 - 220, -panelH / 2 + 95);
    panelContainer.add(this.detailsContainer);

    this.selectedIndex = 0;
    this.slotContainers = [];

    // Inicializar e desenhar grade
    this.renderInventory();

    // Rodapé com dicas de comandos
    const helpFooter = this.add.text(0, panelH / 2 - 22, 'Navegar: [Setas / WASD]  |  Usar: [Z / Espaço / Toque]  |  Fechar: [X / Shift / ESC]', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '11px',
      color: '#6e7681'
    }).setOrigin(0.5);
    panelContainer.add(helpFooter);

    // 5. Configuração de Inputs de Teclado
    this.setupKeyboard();
  }

  getPlayerSummaryText() {
    let lvl = 1, hp = 120, maxHp = 120, atk = 18, def = 8, fury = 0;
    if (this.playerEntity) {
      lvl = this.playerEntity.level || 1;
      hp = this.playerEntity.hp !== undefined ? this.playerEntity.hp : 120;
      maxHp = this.playerEntity.maxHp || 120;
      atk = this.playerEntity.attack || 18;
      def = this.playerEntity.defense || 8;
      fury = this.playerEntity.fury !== undefined ? this.playerEntity.fury : 0;
    }
    return `Nível ${lvl}  •  HP: ${hp}/${maxHp}  •  Fúria: ${fury}/100  •  ATQ: ${atk}  •  DEF: ${def}`;
  }

  renderInventory() {
    this.itemGridContainer.removeAll(true);
    this.slotContainers = [];

    const items = InventoryManager.items;
    const cols = 4;
    const slotW = 90;
    const slotH = 75;
    const gap = 10;

    const totalSlots = Math.max(12, Math.ceil(items.length / cols) * cols);

    for (let i = 0; i < totalSlots; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = col * (slotW + gap);
      const y = row * (slotH + gap);

      const slot = this.add.container(x, y);
      const isSelected = i === this.selectedIndex;
      const item = items[i] || null;

      // Fundo do slot
      const bg = this.add.rectangle(0, 0, slotW, slotH, isSelected ? 0x21262d : 0x161b22).setOrigin(0);
      bg.setStrokeStyle(isSelected ? 2 : 1, isSelected ? 0xd4af37 : 0x30363d, 1);
      bg.setInteractive({ useHandCursor: !!item });

      slot.add(bg);

      if (item) {
        // Ícone emoji / símbolo do item
        const icon = this.add.text(slotW / 2, 22, item.icon || '📦', {
          fontSize: '24px'
        }).setOrigin(0.5);

        // Nome compacto do item
        const name = this.add.text(slotW / 2, 48, item.name.length > 11 ? item.name.substring(0, 9) + '...' : item.name, {
          fontFamily: 'Arial, sans-serif',
          fontSize: '10px',
          color: '#e6edf3',
          align: 'center'
        }).setOrigin(0.5);

        // Badge de quantidade
        const qtyBadge = this.add.text(slotW - 6, slotH - 6, `x${item.quantity}`, {
          fontFamily: 'Arial, sans-serif',
          fontSize: '10px',
          fontStyle: 'bold',
          color: '#ffd700'
        }).setOrigin(1, 1);

        slot.add([icon, name, qtyBadge]);

        bg.on('pointerdown', () => {
          this.selectedIndex = i;
          this.renderInventory();
        });

        bg.on('pointerover', () => {
          if (this.selectedIndex !== i) {
            this.selectedIndex = i;
            this.renderInventory();
          }
        });
      } else {
        // Slot vazio
        const emptyDot = this.add.circle(slotW / 2, slotH / 2, 3, 0x30363d);
        slot.add(emptyDot);

        bg.on('pointerdown', () => {
          this.selectedIndex = i;
          this.renderInventory();
        });
      }

      this.itemGridContainer.add(slot);
      this.slotContainers.push({ container: slot, bg, item });
    }

    this.renderDetails();
    if (this.goldText) {
      this.goldText.setText(`🪙 Ouro: ${InventoryManager.gold} PO`);
    }
    if (this.summaryTextObj) {
      this.summaryTextObj.setText(this.getPlayerSummaryText());
    }
  }

  renderDetails() {
    this.detailsContainer.removeAll(true);

    const w = 190;
    const h = 330;

    // Fundo do painel de detalhes
    const bg = this.add.rectangle(0, 0, w, h, 0x161b22, 0.9).setOrigin(0);
    bg.setStrokeStyle(1, 0x30363d, 1);
    this.detailsContainer.add(bg);

    const item = InventoryManager.items[this.selectedIndex];

    if (!item) {
      const emptyIcon = this.add.text(w / 2, 80, '🎒', { fontSize: '42px' }).setOrigin(0.5);
      const placeholder = this.add.text(w / 2, 140, 'Mochila Vazia', {
        fontFamily: 'Georgia, serif',
        fontSize: '15px',
        fontStyle: 'bold',
        color: '#8b949e',
        align: 'center'
      }).setOrigin(0.5);
      const desc = this.add.text(w / 2, 185, 'Você ainda não possui itens.\nCompre provisões no balcão de Hilda ou com mercadores.', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '11px',
        color: '#6e7681',
        align: 'center',
        wordWrap: { width: w - 30 }
      }).setOrigin(0.5);
      this.detailsContainer.add([emptyIcon, placeholder, desc]);
      return;
    }

    // Ícone Grande
    const bigIcon = this.add.text(w / 2, 45, item.icon || '📦', {
      fontSize: '44px'
    }).setOrigin(0.5);

    // Nome Completo
    const nameText = this.add.text(w / 2, 85, item.name, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#ffd700',
      align: 'center',
      wordWrap: { width: w - 20 }
    }).setOrigin(0.5);

    // Categoria e Tipo
    const catText = this.add.text(w / 2, 112, `[${item.category || item.type || 'Geral'}]`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '11px',
      color: '#58a6ff'
    }).setOrigin(0.5);

    // Divisor
    const div = this.add.graphics();
    div.lineStyle(1, 0x30363d, 0.8);
    div.lineBetween(15, 128, w - 15, 128);

    // Descrição do Efeito
    const descText = this.add.text(15, 140, item.effectDesc || 'Item para uso na jornada.', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '12px',
      color: '#c9d1d9',
      wordWrap: { width: w - 30 }
    });

    // Quantidade em estoque
    const stockText = this.add.text(15, 220, `Quantidade: ${item.quantity}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '12px',
      color: '#8b949e'
    });

    // Valor de venda / compra
    const valText = this.add.text(15, 240, `Valor: ${item.value || 10} PO`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '12px',
      color: '#ffd700'
    });

    // Botão de Ação "Usar Item" (se consumível, equipamento ou pergaminho)
    const canUse = item.type === 'consumable' || item.type === 'equipment' || item.type === 'scroll';
    const btnY = 285;
    const btnContainer = this.add.container(w / 2, btnY);

    const btnBg = this.add.rectangle(0, 0, w - 30, 36, canUse ? 0x238636 : 0x21262d).setOrigin(0.5);
    btnBg.setStrokeStyle(1, canUse ? 0x2ea043 : 0x30363d);
    
    const btnLabel = this.add.text(0, 0, canUse ? (item.type === 'equipment' ? 'Equipar' : 'Usar Item') : 'Inspecionar', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '13px',
      fontStyle: 'bold',
      color: canUse ? '#ffffff' : '#8b949e'
    }).setOrigin(0.5);

    btnContainer.add([btnBg, btnLabel]);

    if (canUse) {
      btnBg.setInteractive({ useHandCursor: true });
      btnBg.on('pointerdown', () => this.useSelectedItem());
      btnBg.on('pointerover', () => btnBg.fillColor = 0x2ea043);
      btnBg.on('pointerout', () => btnBg.fillColor = 0x238636);
    }

    this.detailsContainer.add([bigIcon, nameText, catText, div, descText, stockText, valText, btnContainer]);
  }

  useSelectedItem() {
    const item = InventoryManager.items[this.selectedIndex];
    if (!item) return;

    const target = this.playerEntity || {
      hp: 120,
      maxHp: 120,
      attack: 18,
      defense: 8,
      fury: 0,
      maxFury: 100
    };

    const success = InventoryManager.useItem(item.id, target);
    if (success) {
      Logger.info('InventoryScene', `Usou item ${item.name}.`);
      this.cameras.main.flash(200, 46, 204, 113, 0.4);

      if (this.selectedIndex >= InventoryManager.items.length) {
        this.selectedIndex = Math.max(0, InventoryManager.items.length - 1);
      }
      this.renderInventory();
    }
  }

  setupKeyboard() {
    const cols = 4;

    this.input.keyboard.on('keydown-UP', () => {
      this.selectedIndex = Math.max(0, this.selectedIndex - cols);
      this.renderInventory();
    });
    this.input.keyboard.on('keydown-W', () => {
      this.selectedIndex = Math.max(0, this.selectedIndex - cols);
      this.renderInventory();
    });

    this.input.keyboard.on('keydown-DOWN', () => {
      const maxIdx = Math.max(0, InventoryManager.items.length - 1);
      this.selectedIndex = Math.min(maxIdx, this.selectedIndex + cols);
      this.renderInventory();
    });
    this.input.keyboard.on('keydown-S', () => {
      const maxIdx = Math.max(0, InventoryManager.items.length - 1);
      this.selectedIndex = Math.min(maxIdx, this.selectedIndex + cols);
      this.renderInventory();
    });

    this.input.keyboard.on('keydown-LEFT', () => {
      this.selectedIndex = Math.max(0, this.selectedIndex - 1);
      this.renderInventory();
    });
    this.input.keyboard.on('keydown-A', () => {
      this.selectedIndex = Math.max(0, this.selectedIndex - 1);
      this.renderInventory();
    });

    this.input.keyboard.on('keydown-RIGHT', () => {
      const maxIdx = Math.max(0, InventoryManager.items.length - 1);
      this.selectedIndex = Math.min(maxIdx, this.selectedIndex + 1);
      this.renderInventory();
    });
    this.input.keyboard.on('keydown-D', () => {
      const maxIdx = Math.max(0, InventoryManager.items.length - 1);
      this.selectedIndex = Math.min(maxIdx, this.selectedIndex + 1);
      this.renderInventory();
    });

    // Usar item
    this.input.keyboard.on('keydown-SPACE', () => this.useSelectedItem());
    this.input.keyboard.on('keydown-ENTER', () => this.useSelectedItem());
    this.input.keyboard.on('keydown-Z', () => this.useSelectedItem());

    // Fechar inventário
    this.input.keyboard.on('keydown-ESC', () => this.closeInventory());
    this.input.keyboard.on('keydown-X', () => this.closeInventory());
    this.input.keyboard.on('keydown-SHIFT', () => this.closeInventory());
    this.input.keyboard.on('keydown-I', () => this.closeInventory());
  }

  closeInventory() {
    Logger.info('InventoryScene', `Fechando inventário e retomando [${this.previousSceneKey}].`);
    this.scene.stop();
    if (this.previousSceneKey && this.scene.isPaused(this.previousSceneKey)) {
      this.scene.resume(this.previousSceneKey);
    }
  }
}
