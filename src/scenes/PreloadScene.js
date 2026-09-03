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
    // 4. Retratos e Molduras de UI
    this.generatePortraitAndUITextures();

    // 5. Efeitos de Partículas
    this.generateFXTextures();

    // 6. Efeitos Ambientais (Folhas, Pássaros, Névoa)
    this.generateEnvironmentalTextures();

    // 7. Cenários e Adereços do Ato II (Estrada da Fazenda)
    this.generateAct2Textures();

    // 8. Cenários e Adereços do Ato III (Masmorra do Bosque Cinzento)
    this.generateAct3Textures();

    // 9. Cenários e Adereços do Templo de Palmem
    this.generateTempleTextures();

    // 10. Baús de Tesouro e Partículas de Moeda
    this.generateChestAndCoinTextures();

    // 11. Carroça Detalhada em Pixel Art
    this.generateCartTexture();

    Logger.info('PreloadScene', 'Pipeline de Pixel Art, Templo, Baús e Carroça inicializado.');
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

    // 7. Soldado da Guarda de Rastphen (spr_guard - Chibi Micro Pixel Art)
    makeSprite(AssetsConfig.sprites.guard, (g) => {
      // Elmo de ferro polido com viseira e pluma
      g.fillStyle(0x7f8c8d, 1); // Elmo base
      g.fillRect(9, 4, 14, 11);
      g.fillStyle(0xbdc3c7, 1); // Brilho de metal no elmo
      g.fillRect(10, 4, 12, 3);
      g.fillStyle(0xd63031, 1); // Pluma vermelha de capitão no topo
      g.fillRect(14, 1, 4, 4);
      g.fillRect(16, 2, 3, 3);
      // Fenda da viseira de combate
      g.fillStyle(0x1e272e, 1);
      g.fillRect(11, 9, 10, 3);
      g.fillStyle(0xf1c40f, 1); // Olhar determinado através da fenda
      g.fillRect(13, 10, 2, 1);
      g.fillRect(17, 10, 2, 1);
      // Armadura peitoral de aço com rebites e ombreiras
      g.fillStyle(0xbdc3c7, 1); // Peitoral
      g.fillRect(8, 15, 16, 11);
      g.fillStyle(0xd4af37, 1); // Detalhe dourado no peitoral e ombreiras
      g.fillRect(6, 14, 4, 6);
      g.fillRect(22, 14, 4, 6);
      g.fillRect(10, 18, 12, 2);
      // Capa carmesim drapeada
      g.fillStyle(0x962d2d, 1);
      g.fillRect(5, 16, 3, 11);
      g.fillRect(24, 16, 3, 11);
      // Cinto de couro com fivela de latão
      g.fillStyle(0x4a2a18, 1);
      g.fillRect(9, 23, 14, 3);
      g.fillStyle(0xf1c40f, 1);
      g.fillRect(15, 23, 2, 3);
      // Botas pesadas de ferro
      g.fillStyle(0x2f3542, 1);
      g.fillRect(9, 26, 5, 6);
      g.fillRect(18, 26, 5, 6);
    });

    // 7.1. Soldado Mercenário Inimigo (spr_soldier - Micro Pixel Art)
    makeSprite(AssetsConfig.sprites.soldier, (g) => {
      // Elmo de ferro escuro cônico com nasal
      g.fillStyle(0x57606f, 1);
      g.fillRect(10, 4, 12, 11);
      g.fillStyle(0x747d8c, 1);
      g.fillRect(11, 4, 10, 3);
      // Fenda e nasal
      g.fillStyle(0x1e272e, 1);
      g.fillRect(11, 9, 4, 2);
      g.fillRect(17, 9, 4, 2);
      g.fillStyle(0x57606f, 1); // Protetor nasal
      g.fillRect(15, 8, 2, 5);
      // Cota de malha e gibão de couro reforçado
      g.fillStyle(0x8395a7, 1); // Malha
      g.fillRect(8, 15, 16, 11);
      g.fillStyle(0x5d4037, 1); // Colete de couro
      g.fillRect(10, 16, 12, 9);
      // Rebites de ferro
      g.fillStyle(0xdcdde1, 1);
      g.fillRect(11, 17, 2, 2);
      g.fillRect(19, 17, 2, 2);
      // Braço com adaga / espada curta
      g.fillStyle(0xdcdde1, 1);
      g.fillRect(4, 16, 3, 8);
      // Calças e botas
      g.fillStyle(0x2f3542, 1);
      g.fillRect(9, 26, 5, 6);
      g.fillRect(18, 26, 5, 6);
    });

    // 7.2. Ilídiz (spr_ilidiz - Acólita Sagrada)
    makeSprite(AssetsConfig.sprites.ilidiz, (g) => {
      // Capuz e manto lilás suave
      g.fillStyle(0x8e44ad, 1);
      g.fillRect(9, 4, 14, 11);
      g.fillStyle(0x9b59b6, 1);
      g.fillRect(10, 5, 12, 9);
      // Rosto delicado
      g.fillStyle(0xf8c291, 1);
      g.fillRect(12, 8, 8, 7);
      // Olhos expressivos
      g.fillStyle(0x2980b9, 1);
      g.fillRect(13, 10, 2, 2);
      g.fillRect(17, 10, 2, 2);
      // Túnica lilás com estola branca
      g.fillStyle(0x6c5ce7, 1);
      g.fillRect(8, 15, 16, 12);
      g.fillStyle(0xffffff, 0.9); // Estola sagrada
      g.fillRect(13, 15, 6, 12);
      // Amuleto de Lízan dourado
      g.fillStyle(0xffd700, 1);
      g.fillRect(15, 17, 2, 4);
      // Sapatos
      g.fillStyle(0x34495e, 1);
      g.fillRect(11, 27, 4, 5);
      g.fillRect(17, 27, 4, 5);
    });

    // 7.3. Mercador e Mercenário Yânil Resty (spr_yanil - Cap. 7)
    makeSprite(AssetsConfig.sprites.yanil, (g) => {
      // Turbante / Capuz azul marinho com pena exótica
      g.fillStyle(0x1e3799, 1);
      g.fillRect(9, 4, 14, 11);
      g.fillStyle(0x4a69bd, 1);
      g.fillRect(10, 4, 12, 4);
      g.fillStyle(0xffd700, 1); // Broche dourado
      g.fillRect(14, 5, 4, 3);
      // Rosto astuto
      g.fillStyle(0xf5cd79, 1);
      g.fillRect(11, 8, 10, 7);
      g.fillStyle(0x2d3436, 1); // Cavanhaque fino
      g.fillRect(14, 13, 4, 2);
      // Sobretudo nobre azul-noite com gola de veludo
      g.fillStyle(0x0c2461, 1);
      g.fillRect(8, 15, 16, 12);
      g.fillStyle(0xb71540, 1); // Faixa carmesim na cintura
      g.fillRect(8, 22, 16, 3);
      // Rolo de tecido raro preso às costas
      g.fillStyle(0xe58e26, 1);
      g.fillRect(5, 14, 3, 11);
      // Botas de couro de viagem
      g.fillStyle(0x4a2a18, 1);
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

    // 9. Garçonete da Taverna (spr_waitress)
    makeSprite(AssetsConfig.sprites.waitress, (g) => {
      g.fillStyle(0x8b2626, 1); // Vestido vinho/bordô
      g.fillRect(8, 14, 16, 13);
      g.fillStyle(0xffffff, 0.95); // Avental de renda branco
      g.fillRect(10, 16, 12, 10);
      g.fillStyle(0xd35400, 1); // Cabelos castanhos avermelhados
      g.fillRect(9, 6, 14, 8);
      g.fillStyle(0xf5cd79, 1); // Rosto
      g.fillRect(11, 8, 10, 7);
      // Bandeja de servir com canecas
      g.fillStyle(0x7f8c8d, 1);
      g.fillRect(20, 17, 10, 3);
      g.fillStyle(0xf1c40f, 1); // Caneca dourada na bandeja
      g.fillRect(22, 12, 4, 5);
      g.fillStyle(0x2f3542, 1); // Sapatos
      g.fillRect(11, 27, 4, 5);
      g.fillRect(17, 27, 4, 5);
    });

    // 10. Cultista Abissal (spr_cultist)
    makeSprite(AssetsConfig.sprites.cultist, (g) => {
      g.fillStyle(0x2d132c, 1); // Manto negro-púrpura
      g.fillRect(8, 7, 16, 20);
      g.fillStyle(0x801336, 1); // Detalhes de borda em carmesim
      g.fillRect(6, 12, 3, 14);
      g.fillRect(23, 12, 3, 14);
      // Olhos arcanos brilhantes nas sombras do capuz
      g.fillStyle(0x9b59b6, 1);
      g.fillRect(11, 10, 3, 2);
      g.fillRect(18, 10, 3, 2);
      // Talismã profano
      g.fillStyle(0xe74c3c, 1);
      g.fillRect(15, 18, 3, 4);
    });

    // 11. Goblin Chibi em Pixel Art (spr_goblin: 32x32)
    makeSprite(AssetsConfig.sprites.goblin, (g) => {
      // Orelhas pontudas largas características de goblin
      g.fillStyle(0x1e824c, 1);
      g.fillTriangle(2, 12, 10, 8, 10, 15); // Orelha esquerda
      g.fillTriangle(30, 12, 22, 8, 22, 15); // Orelha direita

      // Cabeça grande desproporcional Chibi (tom verde musgo escuro)
      g.fillStyle(0x27ae60, 1);
      g.fillRect(8, 6, 16, 13);
      g.fillStyle(0x1e824c, 1); // Sombra sob o maxilar e testa
      g.fillRect(8, 16, 16, 3);
      g.fillRect(10, 6, 12, 2);

      // Nariz pontudo
      g.fillStyle(0x166038, 1);
      g.fillRect(15, 12, 2, 3);

      // Olhos vermelhos brilhantes característicos
      g.fillStyle(0xff4757, 1);
      g.fillRect(11, 10, 3, 3);
      g.fillRect(18, 10, 3, 3);
      // Brilho da pupila
      g.fillStyle(0xffffff, 1);
      g.fillRect(11, 10, 1, 1);
      g.fillRect(18, 10, 1, 1);

      // Boca com presas inferiores afiadas
      g.fillStyle(0x145a32, 1);
      g.fillRect(12, 16, 8, 2);
      g.fillStyle(0xffffff, 1); // Presas brancas
      g.fillRect(13, 15, 2, 2);
      g.fillRect(17, 15, 2, 2);

      // Corpo com trapos de couro marrom
      g.fillStyle(0x5d4037, 1);
      g.fillRect(10, 19, 12, 8);
      g.fillStyle(0x795548, 1); // Cinto de couro com fivela
      g.fillRect(9, 23, 14, 2);
      g.fillStyle(0xd4af37, 1); // Fivela de latão
      g.fillRect(15, 23, 2, 2);

      // Braço segurando adaga de ferro dentada
      g.fillStyle(0x27ae60, 1);
      g.fillRect(5, 20, 5, 4);
      g.fillStyle(0xbdc3c7, 1); // Lâmina de ferro
      g.fillRect(2, 17, 4, 7);
      g.fillStyle(0x7f8c8d, 1);
      g.fillRect(2, 17, 2, 7);

      // Pernas curtas com pés de garra
      g.fillStyle(0x1e824c, 1);
      g.fillRect(11, 27, 4, 5);
      g.fillRect(17, 27, 4, 5);
    });

    // 12. NPC Default
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

  /**
   * Gera texturas para os efeitos ambientais (folhas caídas, pássaros voando e névoa).
   */
  generateEnvironmentalTextures() {
    // 1. Folha de Outono / Vento (fx_leaf: 8x6)
    if (!this.textures.exists('fx_leaf')) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0xe67e22, 1); // Âmbar alaranjado
      g.fillEllipse(4, 3, 4, 2);
      g.fillStyle(0xd35400, 1); // Nervura da folha
      g.fillRect(1, 3, 6, 1);
      g.fillStyle(0x795548, 1); // Caule
      g.fillRect(7, 3, 2, 1);
      g.generateTexture('fx_leaf', 10, 6);
      g.destroy();
    }

    // 2. Pássaro em Voo (tex_bird: 12x8)
    if (!this.textures.exists('tex_bird')) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0x1e272e, 1); // Silhueta escura
      // Corpo
      g.fillRect(4, 3, 5, 2);
      // Asa esquerda
      g.fillRect(1, 1, 4, 2);
      // Asa direita
      g.fillRect(7, 1, 4, 2);
      // Bico
      g.fillStyle(0xf39c12, 1);
      g.fillRect(9, 4, 2, 1);
      g.generateTexture('tex_bird', 12, 8);
      g.destroy();
    }

    // 3. Névoa Translúcida Horizontal (tex_fog: 256x256)
    if (!this.textures.exists('tex_fog')) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0x718093, 0.4);
      g.fillCircle(64, 64, 60);
      g.fillCircle(192, 80, 70);
      g.fillCircle(128, 180, 80);
      g.fillStyle(0x2f3640, 0.25);
      g.fillRect(0, 0, 256, 256);
      g.generateTexture('tex_fog', 256, 256);
      g.destroy();
    }
  }

  /**
   * Gera texturas do Ato II: Estrada da Fazenda, cercas, celeiro arrombado e rastros.
   */
  generateAct2Textures() {
    // 1. Estrada de Terra com ranhuras (tex_dirt_road: 64x64)
    if (!this.textures.exists('tex_dirt_road')) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0x4a301a, 1);
      g.fillRect(0, 0, 64, 64);
      g.fillStyle(0x5c3c21, 1);
      g.fillRect(8, 0, 18, 64);
      g.fillRect(38, 0, 18, 64);
      // Pedregulhos e ranhuras
      g.fillStyle(0x2d1c0e, 0.7);
      g.fillRect(14, 12, 4, 40);
      g.fillRect(44, 8, 4, 46);
      g.fillStyle(0x78532f, 0.8);
      g.fillCircle(20, 25, 2);
      g.fillCircle(50, 45, 3);
      g.generateTexture('tex_dirt_road', 64, 64);
      g.destroy();
    }

    // 2. Cerca de Madeira Rústica (tex_fence: 64x24)
    if (!this.textures.exists('tex_fence')) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      // Postes verticais
      g.fillStyle(0x54321d, 1);
      g.fillRect(4, 2, 8, 20);
      g.fillRect(52, 2, 8, 20);
      // Travessas horizontais
      g.fillStyle(0x6e4125, 1);
      g.fillRect(0, 6, 64, 5);
      g.fillRect(0, 15, 64, 5);
      // Pregos de ferro
      g.fillStyle(0x111111, 0.9);
      g.fillRect(8, 8, 2, 2);
      g.fillRect(56, 8, 2, 2);
      g.fillRect(8, 17, 2, 2);
      g.fillRect(56, 17, 2, 2);
      g.generateTexture('tex_fence', 64, 24);
      g.destroy();
    }

    // 3. Celeiro Arrombado (tex_barn: 120x100)
    if (!this.textures.exists('tex_barn')) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      // Parede de tábuas de madeira avermelhada envelhecida
      g.fillStyle(0x59251f, 1);
      g.fillRect(0, 20, 120, 80);
      // Telhado rústico com cumeeira
      g.fillStyle(0x2d1310, 1);
      g.fillTriangle(0, 22, 60, 0, 120, 22);
      // Porta esburacada / arrombada
      g.fillStyle(0x150b09, 1);
      g.fillRect(40, 45, 40, 55);
      // Tábuas quebradas e lascas
      g.fillStyle(0x8a3a2f, 1);
      g.fillRect(36, 48, 12, 6);
      g.fillRect(72, 70, 14, 5);
      // Marcas de garras monstruosas na lateral
      g.fillStyle(0x111111, 0.9);
      g.fillRect(88, 38, 3, 22);
      g.fillRect(94, 40, 3, 20);
      g.fillRect(100, 39, 3, 21);
      g.generateTexture('tex_barn', 120, 100);
      g.destroy();
    }

    // 4. Rastros de Criatura / Sangue Negro (tex_beast_tracks: 32x32)
    if (!this.textures.exists('tex_beast_tracks')) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      // Pegadas pesadas de besta de 3 dedos com garras
      g.fillStyle(0x190d18, 0.85); // Icor negro
      g.fillEllipse(16, 20, 12, 8);
      g.fillCircle(11, 10, 3);
      g.fillCircle(16, 8, 3);
      g.fillCircle(21, 10, 3);
      // Manchas de arranhão
      g.fillStyle(0x401020, 0.7);
      g.fillRect(6, 24, 4, 3);
      g.fillRect(22, 26, 5, 2);
      g.generateTexture('tex_beast_tracks', 32, 32);
      g.destroy();
    }
  }

  /**
   * Gera texturas do Ato III: Masmorra, pilares de madeira avermelhada, altares rúnicos e portão lacrado.
   */
  generateAct3Textures() {
    // 1. Pilar de Pedra e Tronco Avermelhado (tex_redwood_pillar: 60x60)
    if (!this.textures.exists('tex_redwood_pillar')) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      // Base de pedra esculpida
      g.fillStyle(0x232429, 1);
      g.fillRect(4, 4, 52, 52);
      g.lineStyle(3, 0x111215, 1);
      g.strokeRect(4, 4, 52, 52);
      // Núcleo de cerne avermelhado antigo (Redwood antigo de Brentel)
      g.fillStyle(0x4a1818, 1);
      g.fillRect(12, 12, 36, 36);
      g.fillStyle(0x6e2424, 1);
      g.fillCircle(30, 30, 12);
      // Runa cravada na pedra
      g.fillStyle(0x9b59b6, 0.8);
      g.fillRect(28, 18, 4, 24);
      g.fillRect(22, 28, 16, 4);
      g.generateTexture('tex_redwood_pillar', 60, 60);
      g.destroy();
    }

    // 2. Altar Rúnico de Purificação (tex_altar_rune: 40x40)
    if (!this.textures.exists('tex_altar_rune')) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      // Pedestal de basalto
      g.fillStyle(0x1e1e24, 1);
      g.fillRect(2, 2, 36, 36);
      g.lineStyle(2, 0xd4af37, 0.7);
      g.strokeRect(4, 4, 32, 32);
      // Runa central mágica (Violeta/Púrpura)
      g.fillStyle(0x8e44ad, 1);
      g.fillCircle(20, 20, 10);
      g.fillStyle(0xffffff, 0.9);
      g.fillRect(18, 14, 4, 12);
      g.fillRect(14, 18, 12, 4);
      g.generateTexture('tex_altar_rune', 40, 40);
      g.destroy();
    }

    // 3. Grande Portão Sul Lacrado (tex_sealed_gate: 120x60)
    if (!this.textures.exists('tex_sealed_gate')) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      // Arco de pedra gótico
      g.fillStyle(0x16161b, 1);
      g.fillRect(0, 0, 120, 60);
      g.lineStyle(3, 0x2c2c36, 1);
      g.strokeRect(2, 2, 116, 56);
      // Grades de ferro forjado
      g.fillStyle(0x353b48, 1);
      for (let gx = 16; gx < 110; gx += 14) {
        g.fillRect(gx, 10, 4, 44);
      }
      // Selo arcano colossal central com correntes mágicas
      g.fillStyle(0x8e44ad, 0.9);
      g.fillCircle(60, 30, 16);
      g.lineStyle(2, 0x00d2d3, 1);
      g.strokeCircle(60, 30, 20);
      // Cristal do selo
      g.fillStyle(0xffffff, 1);
      g.fillCircle(60, 30, 6);
      g.generateTexture('tex_sealed_gate', 120, 60);
      g.destroy();
    }
  }

  /**
   * Gera texturas para o Templo de Palmem (piso marmorizado, pilares com capitéis, altar solene e leito).
   */
  generateTempleTextures() {
    // 1. Piso de Mármore Envelhecido com detalhes dourados (tex_temple_floor: 64x64)
    if (!this.textures.exists('tex_temple_floor')) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0xe8ecef, 1); // Mármore claro
      g.fillRect(0, 0, 64, 64);
      // Ranhuras dos ladrilhos
      g.lineStyle(1, 0xb0bec5, 0.8);
      g.strokeRect(0, 0, 32, 32);
      g.strokeRect(32, 0, 32, 32);
      g.strokeRect(0, 32, 32, 32);
      g.strokeRect(32, 32, 32, 32);
      // Mosaico central dourado
      g.fillStyle(0xd4af37, 0.4);
      g.fillRect(14, 14, 4, 4);
      g.fillRect(46, 14, 4, 4);
      g.fillRect(14, 46, 4, 4);
      g.fillRect(46, 46, 4, 4);
      g.generateTexture('tex_temple_floor', 64, 64);
      g.destroy();
    }

    // 2. Pilar de Mármore e Ouro (tex_temple_pillar: 40x60)
    if (!this.textures.exists('tex_temple_pillar')) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      // Base quadrada de pedra
      g.fillStyle(0xcfd8dc, 1);
      g.fillRect(4, 48, 32, 12);
      g.fillStyle(0xd4af37, 1); // Anel de ouro na base
      g.fillRect(4, 46, 32, 2);
      // Fuste do pilar com caneluras
      g.fillStyle(0xf5f6fa, 1);
      g.fillRect(8, 10, 24, 36);
      g.fillStyle(0xdcdde1, 1);
      g.fillRect(12, 10, 3, 36);
      g.fillRect(19, 10, 3, 36);
      g.fillRect(26, 10, 3, 36);
      // Capitel superior entalhado
      g.fillStyle(0xd4af37, 1);
      g.fillRect(4, 8, 32, 2);
      g.fillStyle(0xcfd8dc, 1);
      g.fillRect(2, 0, 36, 8);
      g.generateTexture('tex_temple_pillar', 40, 60);
      g.destroy();
    }

    // 3. Altar Sagrado de Palmem com Velas e Tecido Branco/Dourado (tex_temple_altar: 120x60)
    if (!this.textures.exists('tex_temple_altar')) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      // Pedestal de mármore branco
      g.fillStyle(0xdfe6e9, 1);
      g.fillRect(10, 10, 100, 48);
      // Toalha sagrada com acabamento dourado
      g.fillStyle(0xffffff, 1);
      g.fillRect(6, 14, 108, 20);
      g.fillStyle(0xd4af37, 1);
      g.fillRect(6, 32, 108, 4);
      // Símbolo sagrado do Sol de Palmem entalhado
      g.fillStyle(0xf1c40f, 1);
      g.fillCircle(60, 24, 7);
      g.fillStyle(0xd4af37, 1);
      g.fillRect(58, 12, 4, 24);
      g.fillRect(48, 22, 24, 4);
      // Velas votivas acesas nos dois lados
      g.fillStyle(0xf5f6fa, 1); // Vela esquerda
      g.fillRect(18, 4, 6, 12);
      g.fillStyle(0xff793f, 1); // Chama esquerda
      g.fillCircle(21, 2, 3);
      g.fillStyle(0xf5f6fa, 1); // Vela direita
      g.fillRect(96, 4, 6, 12);
      g.fillStyle(0xff793f, 1); // Chama direita
      g.fillCircle(99, 2, 3);
      g.generateTexture('tex_temple_altar', 120, 60);
      g.destroy();
    }

    // 4. Sacerdotisa de Palmem (spr_sacerdotisa: 32x32)
    if (!this.textures.exists('spr_sacerdotisa')) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      // Manto branco imaculado e véu
      g.fillStyle(0xf5f6fa, 1);
      g.fillRect(8, 12, 16, 16);
      // Faixas douradas sacerdotais
      g.fillStyle(0xd4af37, 1);
      g.fillRect(14, 12, 4, 16);
      g.fillRect(8, 26, 16, 2);
      // Rosto sereno
      g.fillStyle(0xf5cd79, 1);
      g.fillRect(11, 6, 10, 7);
      // Véu sagrado na cabeça com tiara prateada
      g.fillStyle(0xffffff, 1);
      g.fillRect(9, 3, 14, 4);
      g.fillStyle(0x74b9ff, 1); // Gema na tiara
      g.fillRect(15, 3, 2, 2);
      g.generateTexture('spr_sacerdotisa', 32, 32);
      g.destroy();
    }

    // 5. Leito de Enfermaria com Gruther (spr_gruther_bed: 80x100)
    if (!this.textures.exists('spr_gruther_bed')) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      // Estrutura da cama de carvalho
      g.fillStyle(0x54321d, 1);
      g.fillRect(4, 4, 72, 92);
      // Cabeceira
      g.fillStyle(0x3e2312, 1);
      g.fillRect(4, 4, 72, 14);
      // Lençóis brancos dobrados
      g.fillStyle(0xecf0f1, 1);
      g.fillRect(10, 24, 60, 68);
      // Travesseiro
      g.fillStyle(0xffffff, 1);
      g.fillRect(16, 12, 48, 12);
      // Gruther (halfling adormecido com febre)
      g.fillStyle(0xd2b48c, 1);
      g.fillCircle(40, 20, 7);
      g.fillStyle(0x8b4513, 1); // Cabelos castanhos
      g.fillRect(34, 14, 12, 4);
      // Pano úmido na testa para a febre
      g.fillStyle(0x74b9ff, 1);
      g.fillRect(36, 17, 8, 3);
      g.generateTexture('spr_gruther_bed', 80, 100);
      g.destroy();
    }
  }

  /**
   * Gera texturas para Baús de Tesouro (fechado, aberto) e partículas de moedas douradas.
   */
  generateChestAndCoinTextures() {
    // 1. Baú Fechado em Pixel Art (tex_chest_closed: 32x24)
    if (!this.textures.exists('tex_chest_closed')) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      // Madeira carvalho do baú
      g.fillStyle(0x795548, 1);
      g.fillRect(2, 6, 28, 16);
      // Tampa abaulada
      g.fillStyle(0x5d4037, 1);
      g.fillRect(2, 2, 28, 6);
      // Cintas de ferro reforçado
      g.fillStyle(0x37474f, 1);
      g.fillRect(6, 2, 4, 20);
      g.fillRect(22, 2, 4, 20);
      // Fechadura dourada de latão
      g.fillStyle(0xffd700, 1);
      g.fillRect(14, 10, 4, 5);
      g.fillStyle(0x111111, 1);
      g.fillRect(15, 12, 2, 2);
      g.generateTexture('tex_chest_closed', 32, 24);
      g.destroy();
    }

    // 2. Baú Aberto em Pixel Art (tex_chest_open: 32x28)
    if (!this.textures.exists('tex_chest_open')) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      // Base do baú
      g.fillStyle(0x795548, 1);
      g.fillRect(2, 10, 28, 16);
      // Cintas de ferro
      g.fillStyle(0x37474f, 1);
      g.fillRect(6, 10, 4, 16);
      g.fillRect(22, 10, 4, 16);
      // Interior brilhando em ouro e rubis
      g.fillStyle(0xffd700, 1);
      g.fillRect(4, 8, 24, 6);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(10, 10, 2);
      g.fillCircle(20, 11, 2);
      g.fillStyle(0xe74c3c, 1); // Gema vermelha
      g.fillRect(15, 9, 3, 3);
      // Tampa erguida para trás
      g.fillStyle(0x5d4037, 1);
      g.fillRect(2, 0, 28, 7);
      g.fillStyle(0x37474f, 1);
      g.fillRect(6, 0, 4, 7);
      g.fillRect(22, 0, 4, 7);
      g.generateTexture('tex_chest_open', 32, 28);
      g.destroy();
    }

    // 3. Moeda de Ouro (fx_coin: 8x8)
    if (!this.textures.exists('fx_coin')) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0xffd700, 1);
      g.fillCircle(4, 4, 4);
      g.fillStyle(0xfff176, 1);
      g.fillCircle(3, 3, 2);
      g.fillStyle(0xb78103, 1);
      g.fillRect(3, 3, 2, 2);
      g.generateTexture('fx_coin', 8, 8);
      g.destroy();
    }
  }

  /**
   * Gera a Carroça de Madeira com Lona e Rodas detalhadas em Pixel Art (tex_cart: 220x130).
   */
  generateCartTexture() {
    if (this.textures.exists('tex_cart')) return;

    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const w = 220;
    const h = 130;

    // Sombra oval projetada sob a carroça
    g.fillStyle(0x000000, 0.4);
    g.fillEllipse(110, 118, 100, 12);

    // Viga mestra do chassi e engate frontal
    g.fillStyle(0x3e2723, 1);
    g.fillRect(15, 88, 190, 10);
    g.fillStyle(0x27160c, 1);
    g.fillRect(5, 92, 25, 6); // Lança de tração
    g.fillStyle(0x57606f, 1); // Anel de ferro da ponta da lança
    g.strokeCircle(6, 95, 4);

    // Estrutura / Corpo da Carroça (Pranchas de carvalho envelhecido)
    const plankColors = [0x5d4037, 0x4e342e, 0x6d4c41, 0x3e2723];
    for (let i = 0; i < 4; i++) {
      g.fillStyle(plankColors[i % plankColors.length], 1);
      g.fillRect(30, 56 + (i * 8), 160, 8);
      // Ranhura entre pranchas
      g.fillStyle(0x1a0f08, 0.7);
      g.fillRect(30, 56 + (i * 8) + 7, 160, 1);
    }

    // Reforços verticais de ferro e pregos
    [30, 70, 110, 150, 190].forEach(bx => {
      g.fillStyle(0x2d3436, 1);
      g.fillRect(bx - 3, 54, 6, 36);
      g.fillStyle(0x636e72, 1);
      g.fillRect(bx - 2, 54, 2, 36); // Brilho de metal
      // Rebites / Pregos
      g.fillStyle(0xdcdde1, 1);
      g.fillRect(bx - 1, 58, 2, 2);
      g.fillRect(bx - 1, 72, 2, 2);
      g.fillRect(bx - 1, 84, 2, 2);
    });

    // Banco do cocheiro frontal
    g.fillStyle(0x4e342e, 1);
    g.fillRect(16, 68, 16, 8);
    g.fillStyle(0x27160c, 1);
    g.fillRect(14, 76, 18, 4);

    // Lona / Toldo Arqueado (Canvas Cover com vincos e sombreamento)
    // Fundo escuro do interior visto pelas aberturas
    g.fillStyle(0x1a120b, 1);
    g.fillRoundedRect(35, 12, 150, 48, 20);

    // Toldo de tecido cru / lona clara
    g.fillStyle(0xede6d6, 1);
    g.fillRoundedRect(33, 10, 154, 48, 22);

    // Sombreamento degradê e dobras da lona
    g.fillStyle(0xd5ccb8, 1);
    g.fillRoundedRect(35, 20, 150, 36, 10);
    g.fillStyle(0xbab09c, 1);
    g.fillRoundedRect(35, 36, 150, 20, 4);

    // 5 Arcos de suporte estruturais de madeira sob a lona
    [38, 72, 110, 148, 182].forEach(ax => {
      g.lineStyle(3, 0x6d4c41, 0.9);
      g.beginPath();
      g.moveTo(ax, 56);
      g.lineTo(ax, 10);
      g.strokePath();

      // Cordas de amarração presas aos ganchos laterais
      g.lineStyle(1, 0x8d6e63, 0.8);
      g.lineBetween(ax, 54, ax, 66);
      g.fillStyle(0x2d3436, 1);
      g.fillCircle(ax, 66, 2); // Gancho de ferro
    });

    // Barra de grade de cela de escravos visível na traseira aberta
    g.fillStyle(0x2f3542, 1);
    for (let barX = 165; barX <= 185; barX += 5) {
      g.fillRect(barX, 22, 2, 34);
    }

    // Lanterna de viagem frontal acesa com brilho dourado
    g.fillStyle(0x2d3436, 1);
    g.fillRect(18, 52, 2, 8); // Gancho
    g.fillStyle(0xd4af37, 1); // Armação da lanterna
    g.fillRect(15, 58, 8, 10);
    g.fillStyle(0xffa502, 1); // Vidro com fogo
    g.fillRect(17, 60, 4, 6);
    g.fillStyle(0xfff200, 1); // Núcleo da chama
    g.fillRect(18, 62, 2, 3);

    // Rodas Pesadas com Raios de Madeira e Aro de Aço
    const drawWheel = (cx, cy, radius) => {
      // Sombra traseira da roda
      g.fillStyle(0x111111, 0.5);
      g.fillCircle(cx, cy + 2, radius);

      // Aro externo de ferro negro
      g.fillStyle(0x2d3436, 1);
      g.fillCircle(cx, cy, radius);

      // Aro de madeira interno
      g.fillStyle(0x5d4037, 1);
      g.fillCircle(cx, cy, radius - 3);
      g.fillStyle(0x3e2723, 1);
      g.fillCircle(cx, cy, radius - 5);

      // 8 Raios de madeira
      g.lineStyle(2, 0x8d6e63, 1);
      for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
        g.beginPath();
        g.moveTo(cx, cy);
        g.lineTo(cx + Math.cos(angle) * (radius - 5), cy + Math.sin(angle) * (radius - 5));
        g.strokePath();
      }

      // Cubo central da roda com rebite dourado
      g.fillStyle(0x2d3436, 1);
      g.fillCircle(cx, cy, 5);
      g.fillStyle(0xd4af37, 1);
      g.fillCircle(cx, cy, 2);
    };

    // Roda Traseira Maior (x: 65, y: 98, r: 24)
    drawWheel(65, 98, 24);

    // Roda Dianteira (x: 160, y: 100, r: 21)
    drawWheel(160, 100, 21);

    g.generateTexture('tex_cart', w, h);
    g.destroy();
  }
}

