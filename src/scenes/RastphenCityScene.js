import Phaser from 'phaser';
import InputManager from '../services/InputManager.js';
import WorldManager from '../services/WorldManager.js';
import QuestManager from '../services/QuestManager.js';
import Logger from '../utils/Logger.js';
import Player from '../entities/Player.js';
import DevShortcuts from '../utils/DevShortcuts.js';

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
    Logger.info('RastphenCityScene', 'Renderizando mapa aberto da cidade.');
    this.cameras.main.resetFX();
    this.cameras.main.fadeIn(400, 0, 0, 0);

    // Limites da malha urbana (2400x1800)
    this.physics.world.setBounds(0, 0, 2400, 1800);
    this.add.rectangle(0, 0, 2400, 1800, 0x4a4a4a).setOrigin(0); // Piso basalto

    this.staticGroup = this.physics.add.staticGroup();

    // Procedural genérico de construções e muralhas
    const addBuilding = (x, y, w, h) => {
      const b = this.add.rectangle(x, y, w, h, 0x2d2d2d);
      this.physics.add.existing(b, true);
      this.staticGroup.add(b);
    };

    // Muralhas da Cidade
    addBuilding(1200, 10, 2400, 40);  // Muro Norte
    addBuilding(10, 900, 20, 1800);   // Muro Oeste
    addBuilding(2390, 900, 20, 1800); // Muro Leste
    
    // Praça Central (Decalques)
    this.add.circle(1200, 900, 150, 0x666666);
    this.add.text(1200, 900, 'Mercado Central', { fill: '#aaa' }).setOrigin(0.5);

    // Monumentos e Construções Relevantes
    addBuilding(1200, 200, 600, 300);
    this.add.text(1200, 250, 'Templo de Palmem', { fill: '#fff', fontSize: '24px' }).setOrigin(0.5);

    addBuilding(300, 800, 400, 300);
    this.add.text(300, 800, 'Taverna Cauda do Dragão', { fill: '#fff', fontSize: '20px' }).setOrigin(0.5);

    // NPCs da Cidade
    this.staticGroupNPCs = this.physics.add.staticGroup();
    
    this.mercadorYanil = this.add.rectangle(1200, 850, 32, 32, 0xf1c40f);
    this.physics.add.existing(this.mercadorYanil, true);
    this.staticGroupNPCs.add(this.mercadorYanil);
    this.add.text(1200, 850, 'Yânil', { fill: '#fff' }).setOrigin(0.5);

    this.guardaTelmer = this.add.rectangle(1100, 1750, 32, 32, 0xf1c40f);
    this.physics.add.existing(this.guardaTelmer, true);
    this.staticGroupNPCs.add(this.guardaTelmer);

    this.guardaBreno = this.add.rectangle(1300, 1750, 32, 32, 0xf1c40f);
    this.physics.add.existing(this.guardaBreno, true);
    this.staticGroupNPCs.add(this.guardaBreno);

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
  }

  setupInputs() {
    InputManager.onAction('CONFIRM', () => {
      if (this.player && !this.player.canInteract()) {
        Logger.info('Intent', 'Input Z/ESPAÇO: Avançando diálogo na UIScene.');
        this.game.events.emit('advanceDialogue');
        return;
      }

      if (this.currentInteractTarget) {
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
  }

  update() {
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
  }
}
