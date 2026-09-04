import Phaser from 'phaser';
import InputManager from '../services/InputManager.js';
import WorldManager from '../services/WorldManager.js';
import InventoryManager from '../services/InventoryManager.js';
import AchievementManager from '../services/AchievementManager.js';
import QuestManager from '../services/QuestManager.js';
import Logger from '../utils/Logger.js';
import Player, { PlayerState } from '../entities/Player.js';
import DevShortcuts from '../utils/DevShortcuts.js';
import { AssetsConfig } from '../config/assets.js';

/**
 * TempleNorthScene - Ala Norte do Templo de Palmem (Enfermaria).
 * Cenário onde repousa o monge Gunther, ferido pelas sombras.
 */
export default class TempleNorthScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TempleNorthScene' });
  }

  init(data) {
    this.spawnData = data || {};
  }

  create() {
    Logger.info('TempleNorthScene', 'Entrando na Ala Norte do Templo (Enfermaria).');
    this.cameras.main.resetFX();
    this.cameras.main.fadeIn(400, 0, 0, 0);

    // Dimensões do mapa da Enfermaria (800x680 para permitir livre locomoção e saída)
    this.physics.world.setBounds(0, 0, 800, 680);
    this.cameras.main.setBounds(0, 0, 800, 680);

    // Piso de Pedra Sagrada
    this.add.tileSprite(400, 340, 800, 680, AssetsConfig.tiles.temple_floor).setOrigin(0.5);

    // Tapete Central da Enfermaria
    this.add.rectangle(400, 320, 160, 520, 0x8b0000).setDepth(1);
    this.add.rectangle(400, 320, 148, 514, 0xb71540).setDepth(1);
    this.add.rectangle(400, 320, 140, 510, 0x780218).setDepth(1);

    this.staticGroup = this.physics.add.staticGroup();

    // Paredes e Colunas
    const addWall = (x, y, w, h) => {
      const wall = this.add.rectangle(x, y, w, h, 0x111118, 0.95);
      this.physics.add.existing(wall, true);
      this.staticGroup.add(wall);
    };

    addWall(400, 10, 800, 20); // Parede Norte
    addWall(10, 340, 20, 680);  // Parede Oeste
    addWall(790, 340, 20, 680); // Parede Leste
    addWall(180, 670, 340, 20); // Parede Sul Esquerda
    addWall(620, 670, 340, 20); // Parede Sul Direita

    // Pilares
    const addPillar = (x, y) => {
      this.add.ellipse(x, y + 26, 44, 14, 0x000000, 0.35).setDepth(1);
      const p = this.add.image(x, y, AssetsConfig.tiles.temple_pillar).setDepth(2);
      this.physics.add.existing(p, true);
      this.staticGroup.add(p);
    };
    addPillar(180, 200); addPillar(620, 200);
    addPillar(180, 420); addPillar(620, 420);

    // 1. Leito de Enfermagem (Cama de Madeira com Lençóis)
    this.bed = this.add.image(400, 200, AssetsConfig.tiles.bed || 'tex_bed').setDepth(2);
    this.physics.add.existing(this.bed, true);
    if (this.bed.body) {
      this.bed.body.setSize(56, 76);
    }
    this.staticGroup.add(this.bed);

    // 2. Sprite do Monge Gunther repousando ferido sobre a cama
    this.guntherSprite = this.add.sprite(400, 195, AssetsConfig.sprites.gunther || 'spr_gunther').setDepth(3);
    this.tweens.add({
      targets: this.guntherSprite,
      scaleY: 0.94,
      alpha: 0.9,
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Iluminação e Velas da Enfermaria
    const candleL = this.add.circle(340, 180, 18, 0xffa502, 0.35).setDepth(1).setBlendMode(Phaser.BlendModes.ADD);
    const candleR = this.add.circle(460, 180, 18, 0xffa502, 0.35).setDepth(1).setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({
      targets: [candleL, candleR],
      alpha: 0.55,
      scale: 1.25,
      duration: 500,
      yoyo: true,
      repeat: -1
    });

    // Tag do Monge Gunther
    this.add.text(400, 145, 'MONGE GUNTHER (FERIDO)', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '9px',
      color: '#ff7675',
      fontStyle: 'bold',
      backgroundColor: 'rgba(0,0,0,0.7)',
      padding: { x: 5, y: 2 }
    }).setOrigin(0.5).setDepth(4);

    // Portal Sul de Retorno ao Santuário (Posicionado confortavelmente dentro da área caminhável)
    this.add.text(400, 550, '▼ SANTUÁRIO PRINCIPAL', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '8px',
      color: '#2ed573',
      fontStyle: 'bold',
      backgroundColor: 'rgba(10, 10, 16, 0.8)',
      padding: { x: 4, y: 1 }
    }).setOrigin(0.5).setDepth(3);

    // Transições movidas para depois da criação do jogador

    // Interagíveis da Ala Norte
    this.interactables = [
      { id: 'gunther_bed', x: 400, y: 220 }
    ];

    // Jogador (Spawn)
    const spawnX = this.spawnData.x || 400;
    const spawnY = this.spawnData.y || 520;
    this.player = new Player(this, spawnX, spawnY, 32, 32, 0x0055ff);
    this.player.setDepth(10);
    this.physics.add.collider(this.player, this.staticGroup);

    // Transições de Mapa data-driven
    this.transitions = WorldManager.buildTransitions(this);

    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

    // Prompt Flutuante de Interação [Espaço]
    this.interactPrompt = this.add.text(0, 0, ' [Espaço] Interagir ', {
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#000000',
      backgroundColor: '#ffd700',
      padding: { x: 4, y: 2 }
    }).setOrigin(0.5).setDepth(50).setVisible(false);

    // Injeção de InputManager
    InputManager.init(this);
    this.setupInputs();

    // Caching de teclado
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = {
      w: this.input.keyboard.addKey('W'),
      a: this.input.keyboard.addKey('A'),
      s: this.input.keyboard.addKey('S'),
      d: this.input.keyboard.addKey('D')
    };

    this.events.on(Phaser.Scenes.Events.RESUME, () => {
      InputManager.init(this);
      this.setupInputs();
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      InputManager.cleanListeners();
    });

    if (import.meta.env?.DEV) {
      DevShortcuts.register(this);
    }
  }

  setupInputs() {
    InputManager.onAction('CONFIRM', () => {
      if (!this.sys || !this.sys.isActive()) return;
      if (this.player && !this.player.canInteract()) {
        this.game.events.emit('advanceDialogue');
        return;
      }

      if (this.currentInteractable) {
        this.openInteraction(this.currentInteractable);
      }
    });

    InputManager.onAction('MENU', () => {
      if (!this.sys || !this.sys.isActive()) return;
      if (this.player && !this.player.canInteract()) return;
      this.scene.pause();
      this.scene.launch('PauseScene', { sceneKey: 'TempleNorthScene' });
    });

    InputManager.onAction('INVENTORY', () => {
      if (!this.sys || !this.sys.isActive()) return;
      this.game.events.emit('toggleInventory');
    });
  }

  openInteraction(id) {
    if (id === 'gunther_bed') {
      this.player.setState(PlayerState.INTERACTING);
      const alreadyVisited = this.registry.get('visitedGunther');

      if (!alreadyVisited) {
        this.registry.set('visitedGunther', true);
        InventoryManager.addItem('potion_heal', 1);
        AchievementManager.unlock('ach_gunther_potion', this.game);
        this.player.showFloatingText('+1 Poção de Vida de Gunther! 🧪', '#2ecc71');

        this.game.events.emit('openDialogue', [
          {
            character: 'Monge Gunther',
            portraitKey: AssetsConfig.sprites.gunther || 'spr_npc_default',
            text: '*Tossindo fracamente...* Rhogar... É você, bravo guerreiro? Eu tentei purificar a orla sul da fazenda, mas as feras sombrias... elas emboscaram nossa comitiva...'
          },
          {
            character: 'Monge Gunther',
            portraitKey: AssetsConfig.sprites.gunther || 'spr_npc_default',
            text: 'Pegue esta Poção de Vida abençoada (+50 HP). Guardei-a para quem pudesse levar a luz de volta àquelas terras corrompidas. Tome muito cuidado no Portão Sul de Rastphen!'
          },
          {
            character: 'Rhogar Tordan',
            portraitKey: AssetsConfig.sprites.rhogar || 'spr_rhogar',
            text: 'Descanse, irmão Gunther. As chamas da minha vingança e o aço da minha lâmina purificarão cada abominação nas estradas de Brentel.'
          }
        ]);
      } else {
        this.game.events.emit('openDialogue', [
          {
            character: 'Monge Gunther',
            portraitKey: AssetsConfig.sprites.gunther || 'spr_npc_default',
            text: 'Que a graça de Palmem guie seus passos, Rhogar... O Portão Sul da cidade de Rastphen o levará em direção à Fazenda dos Halflings e à Masmorra do Bosque Cinzento.'
          }
        ]);
      }
    }
  }

  update(time, delta) {
    if (this.player) {
      this.player.update(time, delta);
    }

    if (!this.input.keyboard.enabled) return;

    this.player.handleMovement(this.cursors, this.wasd, 160);

    // Verificação de proximidade com o leito de Gunther
    let closest = null;
    let closestDist = Infinity;

    this.interactables.forEach(ent => {
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, ent.x, ent.y);
      if (dist <= 75 && dist < closestDist) {
        closestDist = dist;
        closest = ent;
      }
    });

    if (closest && this.player.canInteract()) {
      this.currentInteractable = closest.id;
      this.interactPrompt.setPosition(this.player.x, this.player.y - 30);
      this.interactPrompt.setVisible(true);
    } else {
      this.currentInteractable = null;
      this.interactPrompt.setVisible(false);
    }
  }
}
