import Phaser from 'phaser';
import InputManager from '../services/InputManager.js';
import WorldManager from '../services/WorldManager.js';
import QuestManager from '../services/QuestManager.js';
import Logger from '../utils/Logger.js';
import AudioManager from '../audio/AudioManager.js';
import Player from '../entities/Player.js';
import DevShortcuts from '../utils/DevShortcuts.js';
import { AssetsConfig } from '../config/assets.js';
import EnvironmentFX from '../utils/EnvironmentFX.js';
import NPCWalker from '../entities/NPCWalker.js';

/**
 * Cena Hub de Mundo Aberto - Rastphen.
 */
export default class RastphenCityScene extends Phaser.Scene {
  constructor() {
    super({ key: 'RastphenCityScene' });
  }

  init(data) {
    this.spawnData = data || {};
  }

  create() {
    AudioManager.init(this);
    window.playBGM(this, 'bgm_muralhas_medo');
    Logger.info('RastphenCityScene', 'Renderizando mapa aberto da cidade.');
    this.cameras.main.resetFX();
    this.cameras.main.fadeIn(400, 0, 0, 0);

    // Limites da malha urbana (2400x1800)
    // Limites da malha urbana (2400x1800)
    this.physics.world.setBounds(0, 0, 2400, 1800);
    this.add.rectangle(0, 0, 2400, 1800, 0x3d3d3d).setOrigin(0); // Piso basalto escuro

    // 1. Camadas Visuais de Caminhos (Avenidas de Paralelepípedos e Terra Batida)
    // Avenida Norte-Sul: Templo (y: 370) -> Praça Central (y: 900) -> Portão Sul (y: 1750)
    this.add.rectangle(1200, 1060, 180, 1380, 0x5a554e).setOrigin(0.5); // Base de terra
    this.add.rectangle(1200, 1060, 140, 1380, 0x757069).setOrigin(0.5); // Paralelepípedos
    for (let py = 380; py <= 1740; py += 40) {
      this.add.rectangle(1200, py, 136, 2, 0x47433e, 0.45);
    }

    // Avenida Leste-Oeste: Taverna (x: 300, y: 800) -> Praça Central (x: 1200, y: 900)
    this.add.rectangle(750, 850, 900, 150, 0x5a554e).setOrigin(0.5);
    this.add.rectangle(750, 850, 900, 110, 0x757069).setOrigin(0.5);
    for (let px = 320; px <= 1180; px += 40) {
      this.add.rectangle(px, 850, 2, 106, 0x47433e, 0.45);
    }

    // Praça Central do Mercado (Ladrilhos em Anel Circular)
    this.add.circle(1200, 900, 230, 0x5a554e);
    this.add.circle(1200, 900, 200, 0x827c73);
    this.add.circle(1200, 900, 160, 0x6e6860);
    this.add.circle(1200, 900, 60, 0x44403b);
    this.add.text(1200, 900, 'PRAÇA CENTRAL\nMERCADO DE RASTPHEN', {
      fontFamily: 'Georgia, serif',
      fontSize: '12px',
      color: '#ffd700',
      fontStyle: 'bold',
      align: 'center'
    }).setOrigin(0.5);

    this.staticGroup = this.physics.add.staticGroup();

    // Procedural de construções e muralhas
    const addBuilding = (x, y, w, h, name = null) => {
      const b = this.add.rectangle(x, y, w, h, 0x222226);
      b.setStrokeStyle(3, 0x3e3e48);
      this.physics.add.existing(b, true);
      this.staticGroup.add(b);
      if (name) {
        this.add.text(x, y, name, {
          fontFamily: 'Arial',
          fontSize: '18px',
          color: '#ffffff',
          fontStyle: 'bold',
          backgroundColor: 'rgba(0,0,0,0.7)',
          padding: { x: 8, y: 4 }
        }).setOrigin(0.5).setDepth(4);
      }
    };
    window.playBGM(this, 'bgm_muralhas_medo');
    Logger.info('RastphenCityScene', 'Renderizando mapa aberto da cidade.');
    this.cameras.main.resetFX();
    this.cameras.main.fadeIn(400, 0, 0, 0);

    // Limites da malha urbana (2400x1800)
    // Limites da malha urbana (2400x1800)
    this.physics.world.setBounds(0, 0, 2400, 1800);
    this.add.rectangle(0, 0, 2400, 1800, 0x3d3d3d).setOrigin(0); // Piso basalto escuro

    // 1. Camadas Visuais de Caminhos (Avenidas de Paralelepípedos e Terra Batida)
    // Avenida Norte-Sul: Templo (y: 370) -> Praça Central (y: 900) -> Portão Sul (y: 1750)
    this.add.rectangle(1200, 1060, 180, 1380, 0x5a554e).setOrigin(0.5); // Base de terra
    this.add.rectangle(1200, 1060, 140, 1380, 0x757069).setOrigin(0.5); // Paralelepípedos
    for (let py = 380; py <= 1740; py += 40) {
      this.add.rectangle(1200, py, 136, 2, 0x47433e, 0.45);
    }

    // Avenida Leste-Oeste: Taverna (x: 300, y: 800) -> Praça Central (x: 1200, y: 900)
    this.add.rectangle(750, 850, 900, 150, 0x5a554e).setOrigin(0.5);
    this.add.rectangle(750, 850, 900, 110, 0x757069).setOrigin(0.5);
    for (let px = 320; px <= 1180; px += 40) {
      this.add.rectangle(px, 850, 2, 106, 0x47433e, 0.45);
    }

    // Praça Central do Mercado (Ladrilhos em Anel Circular)
    this.add.circle(1200, 900, 230, 0x5a554e);
    this.add.circle(1200, 900, 200, 0x827c73);
    this.add.circle(1200, 900, 160, 0x6e6860);
    this.add.circle(1200, 900, 60, 0x44403b);
    this.add.text(1200, 900, 'PRAÇA CENTRAL\nMERCADO DE RASTPHEN', {
      fontFamily: 'Georgia, serif',
      fontSize: '12px',
      color: '#ffd700',
      fontStyle: 'bold',
      align: 'center'
    }).setOrigin(0.5);



    // Muralhas da Cidade
    addBuilding(1200, 15, 2400, 30);  // Muro Norte
    addBuilding(15, 900, 30, 1800);   // Muro Oeste
    addBuilding(2385, 900, 30, 1800); // Muro Leste
    
    // Monumentos Principais
    addBuilding(1200, 200, 600, 280, 'TEMPLO DE PALMEM');
    addBuilding(300, 800, 420, 280, 'TAVERNA CAUDA DO DRAGÃO');
    addBuilding(2000, 800, 380, 260, 'QUARTEL DA GUARDA');

    // Casas Trancadas (Pontos de Tensão)
    this.house1 = this.add.rectangle(700, 1300, 180, 150, 0x3e2723);
    this.house1.setStrokeStyle(3, 0x1a1110);
    this.physics.add.existing(this.house1, true);
    this.staticGroup.add(this.house1);

    this.house2 = this.add.rectangle(1700, 1200, 200, 150, 0x3e2723);
    this.house2.setStrokeStyle(3, 0x1a1110);
    this.physics.add.existing(this.house2, true);
    this.staticGroup.add(this.house2);

    // 2. Decoração Urbana: Barracas de Feira na Praça Central
    const addMarketStall = (x, y, colorPrimary, colorStripe, label) => {
      this.add.ellipse(x, y + 25, 80, 22, 0x000000, 0.4).setDepth(1);
      const stall = this.add.rectangle(x, y, 76, 44, colorPrimary).setDepth(2);
      stall.setStrokeStyle(2, 0x111111);
      this.physics.add.existing(stall, true);
      this.staticGroup.add(stall);

      // Toldo listrado
      for (let sx = -30; sx <= 30; sx += 15) {
        this.add.rectangle(x + sx, y - 8, 8, 26, colorStripe).setDepth(3);
      }

      this.add.text(x, y - 30, label, {
        fontFamily: 'Arial',
        fontSize: '8px',
        color: '#ffd700',
        fontStyle: 'bold',
        backgroundColor: 'rgba(0,0,0,0.75)',
        padding: { x: 3, y: 1 }
      }).setOrigin(0.5).setDepth(4);
    };

    addMarketStall(1060, 830, 0x2980b9, 0xffffff, 'BARRACA DE TECIDOS');
    addMarketStall(1340, 830, 0xc0392b, 0xf1c40f, 'BARRACA DE ESPECIARIAS');
    addMarketStall(1060, 970, 0x27ae60, 0xf39c12, 'FRUTAS & PROVISÕES');
    addMarketStall(1340, 970, 0x8e44ad, 0xecf0f1, 'ARTESANATO & POÇÕES');

    // Carroças de mercadores estacionadas (`tex_cart`)
    this.add.image(920, 880, 'tex_cart').setScale(0.8).setDepth(2);
    this.add.image(1480, 920, 'tex_cart').setScale(0.8).setFlipX(true).setDepth(2);

    // Árvores de rua e postes de iluminação
    const addStreetTree = (x, y) => {
      this.add.ellipse(x, y + 20, 36, 14, 0x000000, 0.4).setDepth(1);
      const tree = this.add.circle(x, y, 22, 0x27ae60).setDepth(2);
      this.add.circle(x - 4, y - 4, 16, 0x2ecc71).setDepth(2);
      this.physics.add.existing(tree, true);
      this.staticGroup.add(tree);
    };

    addStreetTree(1100, 480); addStreetTree(1300, 480);
    addStreetTree(1100, 680); addStreetTree(1300, 680);
    addStreetTree(1100, 1200); addStreetTree(1300, 1200);
    addStreetTree(1100, 1450); addStreetTree(1300, 1450);

    // Efeitos Ambientais: Pássaros voando pelo céu da cidade
    EnvironmentFX.addFlyingBirds(this, { x: 0, y: 0, w: 2400, h: 1800 });

    // 3. NPCs da Cidade e Comércio
    this.staticGroupNPCs = this.physics.add.staticGroup();
    
    // Mercador Yânil Resty (Ponto Fixo de Comércio)
    this.add.ellipse(1200, 863, 22, 8, 0x000000, 0.35).setDepth(2);
    this.mercadorYanil = this.add.sprite(1200, 850, AssetsConfig.sprites.yanil || 'spr_yanil').setDepth(3);
    this.physics.add.existing(this.mercadorYanil, true);
    this.staticGroupNPCs.add(this.mercadorYanil);
    this.add.text(1200, 828, 'YANIL RESTY (LOJA)', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '9px',
      color: '#ffd700',
      fontStyle: 'bold',
      backgroundColor: 'rgba(10, 10, 16, 0.75)',
      padding: { x: 4, y: 2 }
    }).setOrigin(0.5).setDepth(4);

    // Guardas do Portão Sul
    this.add.ellipse(1100, 1763, 22, 8, 0x000000, 0.35).setDepth(2);
    this.guardaTelmer = this.add.sprite(1100, 1750, AssetsConfig.sprites.guard).setDepth(3);
    this.physics.add.existing(this.guardaTelmer, true);
    this.staticGroupNPCs.add(this.guardaTelmer);
    this.add.text(1100, 1728, 'TELMER', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '9px',
      color: '#ffd700',
      fontStyle: 'bold',
      backgroundColor: 'rgba(10, 10, 16, 0.75)',
      padding: { x: 4, y: 2 }
    }).setOrigin(0.5).setDepth(4);

    this.add.ellipse(1300, 1763, 22, 8, 0x000000, 0.35).setDepth(2);
    this.guardaBreno = this.add.sprite(1300, 1750, AssetsConfig.sprites.guard).setDepth(3);
    this.physics.add.existing(this.guardaBreno, true);
    this.staticGroupNPCs.add(this.guardaBreno);
    this.add.text(1300, 1728, 'BRENO', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '9px',
      color: '#ffd700',
      fontStyle: 'bold',
      backgroundColor: 'rgba(10, 10, 16, 0.75)',
      padding: { x: 4, y: 2 }
    }).setOrigin(0.5).setDepth(4);

    // 4. População Viva: Guardas em Movimento Contínuo (NPCWalker)
    this.walkers = [];

    // Guarda da Praça
    this.cityPatrol = new NPCWalker(this, 1100, 950, AssetsConfig.sprites.guard, {
      name: 'Vigia de Rastphen',
      speed: 40,
      depth: 3,
      waypoints: [
        { x: 1100, y: 950, waitTime: 2500 },
        { x: 1300, y: 950, waitTime: 2500 },
        { x: 1200, y: 1060, waitTime: 2000 }
      ]
    });
    this.walkers.push(this.cityPatrol);

    // Ronda de Soldados do Portão Norte/Templo
    this.soldierSquad = new NPCWalker(this, 1200, 480, AssetsConfig.sprites.soldier || AssetsConfig.sprites.guard, {
      name: 'Soldado de Patrulha',
      speed: 45,
      depth: 3,
      waypoints: [
        { x: 1200, y: 480, waitTime: 2000 },
        { x: 1200, y: 750, waitTime: 1800 },
        { x: 1150, y: 600, waitTime: 1500 }
      ]
    });
    this.walkers.push(this.soldierSquad);

    // Cidadãos removidos (Lei Marcial / Toque de Recolher)
    /*
    this.civilianTobias = new NPCWalker(this, 550, 850, AssetsConfig.sprites.veronica || 'spr_npc_default', { ... });
    this.walkers.push(this.civilianTobias);
    this.civilianMartha = new NPCWalker(this, 1150, 1020, 'spr_npc_default', { ... });
    this.walkers.push(this.civilianMartha);
    */

    // Patrulhas Mecânicas nos Guardas do Portão Sul
    this.tweens.add({
      targets: this.guardaTelmer,
      x: '+= 120',
      duration: 4000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    this.tweens.add({
      targets: this.guardaBreno,
      x: '-= 120',
      duration: 4000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Instanciação do Jogador (Player com FSM)
    const spawnX = this.spawnData.x || (WorldManager.getSpawn()?.x || 1200);
    const spawnY = this.spawnData.y || (WorldManager.getSpawn()?.y || 900);
    this.player = new Player(this, spawnX, spawnY, 32, 32, 0x2980b9);
    if (this.spawnData?.loadedData?.player) {
      this.player.loadState(this.spawnData.loadedData.player);
    }
    
    this.physics.add.collider(this.player, this.staticGroup);
    this.physics.add.collider(this.player, this.staticGroupNPCs);

    // Estabilidade Óptica (Camera Tracking)
    this.cameras.main.setBounds(0, 0, 2400, 1800);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    // Portas e Triggers Data-Driven
    WorldManager.buildTransitions(this);

    // Interações e Diálogos
    this.interactionsData = this.cache.json.get('act2_interactions');
    this.interactIndicator = this.add.text(0, 0, '[Z]', { fontSize: '16px', fill: '#ffff00', fontStyle: 'bold' }).setOrigin(0.5).setVisible(false);
    this.currentInteractTarget = null;
    
    this.setupInteractions();

    // Inputs e Pause
    InputManager.init(this);
    if (this.input.keyboard) {
      this.input.keyboard.enabled = true;
    }

    // Caching de teclado para prevenir Garbage Collection per-frame
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = {
      w: this.input.keyboard.addKey('W'),
      a: this.input.keyboard.addKey('A'),
      s: this.input.keyboard.addKey('S'),
      d: this.input.keyboard.addKey('D')
    };

    this.setupInputs();

    // Restaurar listeners de input ao retomar da pausa/overlay
    this.events.on(Phaser.Scenes.Events.RESUME, () => {
      InputManager.init(this);
      if (typeof this.setupInputs === 'function') {
        this.setupInputs();
      }
    });

    // Atalhos de Desenvolvedor protegidos por ambiente DEV
    if (import.meta.env?.DEV) {
      DevShortcuts.register(this);
    }

    // Filtro Frio e Neblina (Atmosfera do Culto)
    const gameWidth = this.sys.game.config.width;
    const gameHeight = this.sys.game.config.height;
    this.coldFilter = this.add.rectangle(0, 0, gameWidth, gameHeight, 0x001a33, 0.35).setOrigin(0).setScrollFactor(0).setDepth(900);
    this.fog = this.add.tileSprite(0, 0, gameWidth, gameHeight, 'tex_fog')
        .setOrigin(0).setScrollFactor(0).setDepth(901).setBlendMode(Phaser.BlendModes.SCREEN).setAlpha(0.25);
  }

  setupInputs() {
    this.events.off(Phaser.Scenes.Events.RESUME, this._bgmResumeHandler, this);
    this._bgmResumeHandler = () => {
      AudioManager.init(this);
      window.playBGM(this, 'bgm_muralhas_medo');
    };
    this.events.on(Phaser.Scenes.Events.RESUME, this._bgmResumeHandler, this);

    InputManager.onAction('CONFIRM', () => {
      if (this.player && !this.player.canInteract()) {
        Logger.info('Intent', 'Input Z/ESPAÇO: Avançando diálogo na UIScene.');
        this.game.events.emit('advanceDialogue');
        return;
      }

      if (this.currentInteractTarget) {
        if (this.currentInteractTarget === 'mercador_yanil') {
          Logger.info('Intent', 'Abrindo loja do Mercador Yanil Resty.');
          this.interactIndicator.setVisible(false);
          this.scene.pause();
          this.scene.launch('YanilShopScene', {
            previousSceneKey: 'RastphenCityScene',
            player: this.player
          });
          return;
        }

        if (this.currentInteractTarget === 'porta_trancada') {
          Logger.info('Intent', 'Interação com porta trancada (Morador Aterrorizado).');
          this.interactIndicator.setVisible(false);
          this.game.events.emit('openDialogue', [{
            character: 'Morador Aterrorizado (Sussurro)',
            text: 'Vá embora! Não abrimos para forasteiros antes do amanhecer! O culto está observando...'
          }]);
          return;
        }

        let data = this.interactionsData ? this.interactionsData[this.currentInteractTarget] : null;
        if (data) {
          if (data.nodes) data = data.nodes;
          Logger.info('Intent', `Iniciando interação com [${this.currentInteractTarget}].`);
          this.interactIndicator.setVisible(false);
          this.game.events.emit('openDialogue', data);
        } else {
          Logger.warn('RastphenCityScene', `Nenhum dado de diálogo para ${this.currentInteractTarget}`);
        }
      }
    });

    InputManager.onAction('MENU', () => {
      if (this.player && !this.player.canInteract()) return;
      this.scene.pause();
      this.scene.launch('PauseScene', { sceneKey: 'RastphenCityScene' });
    });
  }

  setupInteractions() {
    this.interactZones = this.physics.add.group();

    const addZone = (target, id) => {
      const zone = this.add.zone(target.x, target.y, target.width ? target.width + 40 : 90, target.height ? target.height + 40 : 90);
      this.physics.add.existing(zone, true);
      zone.interactId = id;
      zone.targetEntity = target;
      this.interactZones.add(zone);
    };

    addZone(this.mercadorYanil, 'mercador_yanil');
    addZone(this.guardaTelmer, 'guardas_muralha');
    addZone(this.guardaBreno, 'guardas_muralha');
    addZone(this.house1, 'porta_trancada');
    addZone(this.house2, 'porta_trancada');
  }

  update(time, delta) {
    if (this.player) {
      this.player.update(time, delta);
    }

    if (this.walkers) {
      this.walkers.forEach(w => {
        if (typeof w.update === 'function') {
          w.update(time, delta);
        }
      });
    }

    if (!this.input.keyboard || !this.input.keyboard.enabled) return;
    
    // Controle de movimento delegado ao Player (FSM com instâncias em cache)
    this.player.handleMovement(this.cursors, this.wasd, 250);

    // Checar zonas de interação
    let touching = false;
    this.physics.overlap(this.player, this.interactZones, (player, zone) => {
      touching = true;
      this.currentInteractTarget = zone.interactId;
      this.interactIndicator.setPosition(zone.targetEntity.x, zone.targetEntity.y - 40);
      this.interactIndicator.setVisible(true);
    });

    if (!touching) {
      this.currentInteractTarget = null;
      this.interactIndicator.setVisible(false);
    }
    
    // Animação da neblina
    if (this.fog) {
      this.fog.tilePositionX += 0.3;
    }
  }
}
