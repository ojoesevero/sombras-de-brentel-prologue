import Phaser from 'phaser';
import { AssetsConfig } from '../config/assets.js';
import Logger from '../utils/Logger.js';

/**
 * PreloadScene - Carregamento Robusto e Gerador de Pipeline Pixel Art.
 * Exibe barra de carregamento fluida, carrega bancos JSON e gera texturas
 * procedurais detalhadas em Pixel Art como fallback resiliente contra assets ausentes.
 */
export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload() {
    this.createLoadingUI();

    // Tratamento resiliente de erros para assets opcionais
    this.load.on('loaderror', (fileObj) => {
      Logger.warn('PreloadScene', `Arquivo ausente: ${fileObj.src}. Fallback procedural ativado.`);
    });

    // 1. Carregamento dos Bancos Data-Driven
    this.load.json('dialogues', './data/dialogues.json');
    this.load.json('enemies', './data/enemies.json');
    this.load.json('tavern_interactions', './data/tavern_interactions.json');
    this.load.json('act2_interactions', './data/act2_interactions.json');
    this.load.json('quests', './data/quests.json');
    this.load.json('dungeon_enemies', './data/dungeon_enemies.json');
    this.load.json('thought_interactions', './data/thought_interactions.json');
    this.load.json('map_transitions', './data/map_transitions.json');

    // 2. Atualização visual da barra de progresso
    this.load.on('progress', (value) => {
      if (this.progressBar) {
        this.progressBar.clear();
        this.progressBar.fillStyle(0xd4af37, 1);
        this.progressBar.fillRect(242, 322, 316 * value, 20);
      }
      if (this.percentText) {
        this.percentText.setText(`${Math.floor(value * 100)}%`);
      }
    });

    this.load.on('fileprogress', (file) => {
      if (this.assetText) {
        this.assetText.setText(`Carregando: ${file.key}`);
      }
    });
  }

  createLoadingUI() {
    const width = 800;
    const height = 600;

    this.add.rectangle(0, 0, width, height, 0x07070b).setOrigin(0);

    // Título do Jogo
    this.add.text(width / 2, 230, 'SOMBRAS DE BRENTEL', {
      fontFamily: 'Georgia, serif',
      fontSize: '28px',
      color: '#ffd700',
      fontStyle: 'bold',
      letterSpacing: 2
    }).setOrigin(0.5);

    this.add.text(width / 2, 265, 'Preparando texturas e recursos de Pixel Art...', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '13px',
      color: '#888888',
      fontStyle: 'italic'
    }).setOrigin(0.5);

    // Borda da barra de progresso
    const progressBox = this.add.graphics();
    progressBox.lineStyle(2, 0xd4af37, 0.8);
    progressBox.strokeRect(240, 320, 320, 24);
    progressBox.fillStyle(0x1a1a24, 0.9);
    progressBox.fillRect(240, 320, 320, 24);

    this.progressBar = this.add.graphics();

    this.percentText = this.add.text(width / 2, 360, '0%', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.assetText = this.add.text(width / 2, 385, 'Iniciando pipeline...', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '11px',
      color: '#666666'
    }).setOrigin(0.5);
  }

  create() {
    Logger.info('PreloadScene', 'Bancos carregados. Construindo texturas procedurais Pixel Art...');

    // 1. Cenário Detalhado da Taverna (bg_tavern)
    this.generateTavernBackgroundTexture();

    // 2. Mobílias e Elementos de Mapa
    this.generateFurnitureTextures();

    // 3. Sprites de Personagens em Pixel Art
    this.generateCharacterPixelSprites();

    // 4. Retratos e Molduras de UI
    this.generatePortraitAndUITextures();

    // 5. Efeitos de Partículas
    this.generateFXTextures();

    Logger.info('PreloadScene', 'Pipeline de Pixel Art inicializado com sucesso.');
    this.scene.start('IntroSplashScene');
  }

  /**
   * Gera o background ilustrado da Taverna com assoalho de tábuas de madeira,
   * paredes rústicas, tapete rúnico e lareira de pedra.
   */
  generateTavernBackgroundTexture() {
    if (this.textures.exists('bg_tavern')) return;

    const g = this.make.graphics({ x: 0, y: 0, add: false });

    // Assoalho de madeira escura com tábuas alternadas (Pixel Art Wood Floor)
    const plankH = 30;
    const colors = [0x3c2415, 0x482c1a, 0x341f12, 0x422817];
    for (let y = 0; y < 600; y += plankH) {
      const colIdx = Math.floor(y / plankH) % colors.length;
      g.fillStyle(colors[colIdx], 1);
      g.fillRect(0, y, 800, plankH);

      // Linha de junção das tábuas
      g.fillStyle(0x1a0f08, 0.6);
      g.fillRect(0, y + plankH - 2, 800, 2);

      // Junções verticais alternadas simulando pregos e pontas de prancha
      const offset = (Math.floor(y / plankH) % 2) * 120;
      for (let x = offset; x < 800; x += 240) {
        g.fillStyle(0x1a0f08, 0.6);
        g.fillRect(x, y, 2, plankH - 2);
        // Prego de ferro
        g.fillStyle(0x111111, 0.8);
        g.fillRect(x + 4, y + 4, 2, 2);
      }
    }

    // Paredes superiores de pedra e madeira (y: 0 a 75)
    g.fillStyle(0x1c1714, 1);
    g.fillRect(0, 0, 800, 75);
    g.fillStyle(0x2d241e, 1);
    for (let bx = 0; bx < 800; bx += 40) {
      g.fillRect(bx, 0, 38, 35);
      g.fillRect(bx + 20, 37, 38, 35);
    }
    // Viga mestra de carvalho entre a parede e o chão
    g.fillStyle(0x27160c, 1);
    g.fillRect(0, 72, 800, 8);
    g.fillStyle(0xd4af37, 0.3);
    g.fillRect(0, 72, 800, 1);

    // Tapete no centro da Taverna (x: 180, y: 380, w: 440, h: 180)
    g.fillStyle(0x6b1d1d, 0.95); // Vinho/Bordô
    g.fillRect(180, 380, 440, 180);
    // Borda dourada do tapete
    g.lineStyle(4, 0xd4af37, 0.9);
    g.strokeRect(184, 384, 432, 172);
    // Linhas decorativas internas
    g.lineStyle(2, 0x8b2626, 0.8);
    g.strokeRect(196, 396, 408, 148);

    // Lareira rústica de pedra entalhada (x: 340, y: 0, w: 120, h: 75)
    g.fillStyle(0x3e3e42, 1);
    g.fillRect(340, 5, 120, 68);
    g.fillStyle(0x1e1e20, 1);
    g.fillRect(352, 22, 96, 51);
    // Brasa intensa na lareira
    g.fillStyle(0xd35400, 1);
    g.fillRect(362, 50, 76, 20);
    g.fillStyle(0xf39c12, 1);
    g.fillRect(372, 55, 56, 15);
    g.fillStyle(0xfff200, 1);
    g.fillRect(384, 60, 32, 10);

    g.generateTexture('bg_tavern', 800, 600);
    g.destroy();
  }

  /**
   * Gera as texturas das mobílias da taverna (Balcão, Mesas, Avisos).
   */
  generateFurnitureTextures() {
    // 1. Balcão de Carvalho Polido (tex_counter: 400x60)
    if (!this.textures.exists('tex_counter')) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      // Madeira sólida do tampo
      g.fillStyle(0x4a2a18, 1);
      g.fillRect(0, 0, 400, 60);
      // Borda de latão polido
      g.fillStyle(0xc59b27, 1);
      g.fillRect(0, 0, 400, 5);
      g.fillRect(0, 55, 400, 5);
      // Efeito de brilho no tampo
      g.fillStyle(0x5c341e, 1);
      g.fillRect(4, 8, 392, 20);
      // Detalhes de canecas na mesa
      [80, 160, 240, 320].forEach(cx => {
        g.fillStyle(0xd4af37, 1);
        g.fillRect(cx, 16, 12, 16);
        g.fillStyle(0xffffff, 0.9); // Colarinho de espuma
        g.fillRect(cx, 14, 12, 4);
      });
      g.generateTexture('tex_counter', 400, 60);
      g.destroy();
    }

    // 2. Mesa Redonda de Taverna (tex_table: 80x80)
    if (!this.textures.exists('tex_table')) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      // Sombra da mesa
      g.fillStyle(0x1a0f08, 0.5);
      g.fillCircle(40, 42, 38);
      // Tampo de madeira
      g.fillStyle(0x54321d, 1);
      g.fillCircle(40, 38, 36);
      g.fillStyle(0x6a3f25, 1);
      g.fillCircle(40, 38, 32);
      // Ranhuras de pranchas
      g.lineStyle(2, 0x3d2314, 0.8);
      g.lineBetween(15, 38, 65, 38);
      g.lineBetween(40, 15, 40, 61);
      // Vela acesa no centro da mesa
      g.fillStyle(0xecf0f1, 1);
      g.fillRect(38, 32, 4, 8);
      g.fillStyle(0xffa502, 1);
      g.fillCircle(40, 30, 4);
      g.generateTexture('tex_table', 80, 80);
      g.destroy();
    }

    // 3. Quadro de Avisos (tex_noticeboard: 32x32)
    if (!this.textures.exists('tex_noticeboard')) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0x4a2c16, 1);
      g.fillRect(0, 0, 32, 32);
      g.lineStyle(2, 0x2e190b, 1);
      g.strokeRect(1, 1, 30, 30);
      // Pergaminhos fixados
      g.fillStyle(0xecf0f1, 1);
      g.fillRect(6, 6, 9, 12);
      g.fillRect(17, 8, 10, 14);
      // Taxinhas vermelhas
      g.fillStyle(0xe74c3c, 1);
      g.fillRect(10, 6, 2, 2);
      g.fillRect(21, 8, 2, 2);
      g.generateTexture('tex_noticeboard', 32, 32);
      g.destroy();
    }

    // 4. Placa de Regras (tex_rules: 32x32)
    if (!this.textures.exists('tex_rules')) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0x3e2312, 1);
      g.fillRect(2, 2, 28, 28);
      g.fillStyle(0xf5cd79, 1);
      g.fillRect(6, 6, 20, 20);
      // Linhas escritas
      g.fillStyle(0x2f3542, 1);
      g.fillRect(8, 10, 16, 2);
      g.fillRect(8, 14, 16, 2);
      g.fillRect(8, 18, 12, 2);
      g.generateTexture('tex_rules', 32, 32);
      g.destroy();
    }
  }

  /**
   * Gera avatares de personagens em Pixel Art nítida (32x32) com paletas vibrantes.
   */
  generateCharacterPixelSprites() {
    const makeSprite = (key, drawFn) => {
      if (this.textures.exists(key)) return;
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      drawFn(g);
      g.generateTexture(key, 32, 32);
      g.destroy();
    };

    // 1. Rhogar Tordan (Draconato: Escamas Cobalto, Armadura de Aço e Chifres Dourados)
    makeSprite(AssetsConfig.sprites.rhogar, (g) => {
      // Corpo / Peitoral
      g.fillStyle(0x1e3799, 1); // Escamas azul cobalto
      g.fillRect(10, 8, 12, 10);
      g.fillStyle(0xdcdde1, 1); // Peitoral de aço
      g.fillRect(8, 16, 16, 11);
      g.fillStyle(0xd4af37, 1); // Ombreiras douradas
      g.fillRect(6, 15, 4, 6);
      g.fillRect(22, 15, 4, 6);
      // Cabeça e Chifres dracônicos
      g.fillStyle(0xf39c12, 1); // Chifres
      g.fillRect(7, 4, 4, 6);
      g.fillRect(21, 4, 4, 6);
      // Olhos flamejantes
      g.fillStyle(0xe74c3c, 1);
      g.fillRect(11, 11, 2, 2);
      g.fillRect(19, 11, 2, 2);
      // Pernas / Botas pesadas
      g.fillStyle(0x2f3640, 1);
      g.fillRect(9, 27, 5, 5);
      g.fillRect(18, 27, 5, 5);
    });

    // 2. Hilda Barba-de-Ferro (Anã da Taverna: Tranças Ruivas e Avental)
    makeSprite(AssetsConfig.sprites.hilda, (g) => {
      g.fillStyle(0xd35400, 1); // Cabelos/Tranças ruivas
      g.fillRect(8, 6, 16, 10);
      g.fillStyle(0xf5cd79, 1); // Rosto
      g.fillRect(11, 8, 10, 8);
      g.fillStyle(0x795548, 1); // Vestimenta
      g.fillRect(9, 16, 14, 11);
      g.fillStyle(0xffffff, 0.9); // Avental branco
      g.fillRect(11, 17, 10, 9);
      // Caneca de cerveja dourada
      g.fillStyle(0xf1c40f, 1);
      g.fillRect(22, 18, 6, 8);
      g.fillStyle(0xffffff, 1); // Espuma
      g.fillRect(22, 16, 6, 3);
      g.fillStyle(0x4a2a18, 1); // Botas
      g.fillRect(10, 27, 5, 5);
      g.fillRect(17, 27, 5, 5);
    });

    // 3. Joseph Sylven (Acólito Meio-Elfo: Túnica Verde Esmeralda e Manto)
    makeSprite(AssetsConfig.sprites.joseph, (g) => {
      g.fillStyle(0xf5cd79, 1); // Rosto
      g.fillRect(12, 7, 8, 8);
      g.fillStyle(0xf1c40f, 1); // Cabelos louros élficos
      g.fillRect(10, 5, 12, 5);
      g.fillStyle(0x27ae60, 1); // Túnica esmeralda
      g.fillRect(9, 15, 14, 12);
      g.fillStyle(0xecf0f1, 1); // Estola/Faixa sagrada
      g.fillRect(14, 15, 4, 12);
      // Amuleto dourado de Lízan
      g.fillStyle(0xffd700, 1);
      g.fillRect(15, 17, 2, 4);
      g.fillStyle(0x2c3e50, 1); // Sapatos
      g.fillRect(11, 27, 4, 5);
      g.fillRect(17, 27, 4, 5);
    });

    // 4. Verônica Stinfy (Arcanista: Manto Púrpura e Tomo Arcano)
    makeSprite(AssetsConfig.sprites.veronica, (g) => {
      g.fillStyle(0x2d3436, 1); // Cabelos escuros
      g.fillRect(9, 5, 14, 12);
      g.fillStyle(0xf8c291, 1); // Rosto
      g.fillRect(12, 8, 8, 7);
      g.fillStyle(0x6c5ce7, 1); // Robe violeta/púrpura
      g.fillRect(8, 15, 16, 12);
      // Livro arcano brilhante na mão
      g.fillStyle(0x0984e3, 1);
      g.fillRect(22, 17, 6, 8);
      g.fillStyle(0xa29bfe, 1);
      g.fillRect(23, 19, 4, 4);
      g.fillStyle(0x1e272e, 1);
      g.fillRect(11, 27, 4, 5);
      g.fillRect(17, 27, 4, 5);
    });

    // 5. John Bardem (Caçador: Capuz Cinza-Escuro e Aljava)
    makeSprite(AssetsConfig.sprites.john, (g) => {
      g.fillStyle(0x2d3436, 1); // Capuz
      g.fillRect(10, 5, 12, 10);
      g.fillStyle(0xdfe6e9, 1); // Rosto nas sombras
      g.fillRect(12, 9, 8, 6);
      g.fillStyle(0x636e72, 1); // Colete de couro
      g.fillRect(9, 15, 14, 12);
      // Aljava de flechas nas costas
      g.fillStyle(0xd63031, 1);
      g.fillRect(6, 13, 3, 10);
      g.fillStyle(0x2d3436, 1); // Calças
      g.fillRect(10, 27, 5, 5);
      g.fillRect(17, 27, 5, 5);
    });

    // 6. Traudon & Alícia (Druida da Colina: Tons Terrosos)
    makeSprite(AssetsConfig.sprites.traudon, (g) => {
      g.fillStyle(0x57606f, 1); // Barba grisalha
      g.fillRect(9, 11, 14, 8);
      g.fillStyle(0xa0522d, 1); // Túnica de carvalho
      g.fillRect(8, 16, 16, 11);
      // Cajado com gema verde
      g.fillStyle(0x535c68, 1);
      g.fillRect(5, 8, 3, 22);
      g.fillStyle(0x2ed573, 1);
      g.fillRect(4, 5, 5, 5);
      g.fillStyle(0x2f3542, 1);
      g.fillRect(10, 27, 5, 5);
      g.fillRect(17, 27, 5, 5);
    });

    // 7. Soldado da Guarda de Rastphen (spr_guard)
    makeSprite(AssetsConfig.sprites.guard, (g) => {
      g.fillStyle(0x7f8c8d, 1); // Elmo de ferro
      g.fillRect(10, 5, 12, 10);
      g.fillStyle(0xbdc3c7, 1); // Armadura
      g.fillRect(9, 15, 14, 12);
      g.fillStyle(0xc0392b, 1); // Capa vermelha
      g.fillRect(6, 16, 3, 11);
      g.fillRect(23, 16, 3, 11);
      g.fillStyle(0x2c3e50, 1);
      g.fillRect(10, 27, 5, 5);
      g.fillRect(17, 27, 5, 5);
    });

    // 8. Iksar (spr_iksar)
    makeSprite(AssetsConfig.sprites.iksar, (g) => {
      g.fillStyle(0x962d2d, 1); // Armadura vermelha carmesim
      g.fillRect(8, 8, 16, 18);
      g.fillStyle(0xffd700, 1); // Detalhes dourados
      g.fillRect(6, 10, 4, 8);
      g.fillRect(22, 10, 4, 8);
      g.fillStyle(0x111111, 1);
      g.fillRect(10, 26, 5, 6);
      g.fillRect(17, 26, 5, 6);
    });

    // 9. NPC Default
    makeSprite('spr_npc_default', (g) => {
      g.fillStyle(0x34495e, 1);
      g.fillRect(10, 6, 12, 10);
      g.fillStyle(0xbdc3c7, 1);
      g.fillRect(9, 16, 14, 11);
      g.fillStyle(0x2c3e50, 1);
      g.fillRect(10, 27, 5, 5);
      g.fillRect(17, 27, 5, 5);
    });
  }

  /**
   * Gera retratos e molduras para o sistema de diálogo.
   */
  generatePortraitAndUITextures() {
    Object.values(AssetsConfig.portraits).forEach(key => {
      if (this.textures.exists(key)) return;
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0x222233, 1);
      g.fillRect(0, 0, 128, 128);
      g.lineStyle(4, 0xd4af37, 1);
      g.strokeRect(2, 2, 124, 124);
      g.lineStyle(2, 0x111118, 1);
      g.strokeRect(6, 6, 116, 116);
      g.generateTexture(key, 128, 128);
      g.destroy();
    });
  }

  /**
   * Gera texturas de partículas e efeitos visuais.
   */
  generateFXTextures() {
    // 1. Estrela / Centelha Dourada
    if (!this.textures.exists(AssetsConfig.fx.particle_star)) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0xffd700, 1);
      g.fillCircle(8, 8, 6);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(8, 8, 3);
      g.generateTexture(AssetsConfig.fx.particle_star, 16, 16);
      g.destroy();
    }

    // 2. Centelha Elétrica
    if (!this.textures.exists(AssetsConfig.fx.particle_lightning)) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0x00d2d3, 1);
      g.fillRect(0, 0, 16, 4);
      g.fillStyle(0xffffff, 1);
      g.fillRect(2, 1, 12, 2);
      g.generateTexture(AssetsConfig.fx.particle_lightning, 16, 4);
      g.destroy();
    }

    // 3. Brasa Incandescente da Lareira (fx_ember)
    if (!this.textures.exists(AssetsConfig.fx.particle_ember)) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0xff793f, 1);
      g.fillCircle(4, 4, 4);
      g.fillStyle(0xffda79, 1);
      g.fillCircle(4, 4, 2);
      g.generateTexture(AssetsConfig.fx.particle_ember, 8, 8);
      g.destroy();
    }
  }
}
