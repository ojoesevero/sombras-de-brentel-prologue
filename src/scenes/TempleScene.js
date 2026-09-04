import Phaser from 'phaser';
import InputManager from '../services/InputManager.js';
import WorldManager from '../services/WorldManager.js';
import QuestManager from '../services/QuestManager.js';
import Logger from '../utils/Logger.js';
import AudioManager from '../audio/AudioManager.js';
import Player, { PlayerState } from '../entities/Player.js';
import DevShortcuts from '../utils/DevShortcuts.js';
import { AssetsConfig } from '../config/assets.js';

/**
 * Cena do Templo de Palmem (Ato II) - Santuário Principal.
 * Conecta ao sul com a Cidade de Rastphen e ao norte com a Ala Norte (Enfermaria).
 */
export default class TempleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TempleScene' });
  }

  init(data) {
    this.spawnData = data || {};
  }

  create() {
    AudioManager.init(this);
    window.playBGM(this, 'bgm_bencao_gunther');
    Logger.info('TempleScene', 'Renderizando Santuário do Templo de Palmem.');
    this.cameras.main.resetFX();
    this.cameras.main.fadeIn(400, 0, 0, 0);

    // Layout Sagrado (800x850)
    this.physics.world.setBounds(0, 0, 800, 850);
    this.cameras.main.setBounds(0, 0, 800, 850);

    // Piso Texturizado de Ladrilhos de Pedra e Mármore
    this.add.tileSprite(400, 425, 800, 850, AssetsConfig.tiles.temple_floor).setOrigin(0.5);

    // Tapete Cerimonial Central
    this.add.rectangle(400, 425, 96, 750, 0x8b0000).setDepth(1);
    this.add.rectangle(400, 425, 86, 740, 0xb71540).setDepth(1);
    this.add.rectangle(400, 425, 78, 730, 0x780218).setDepth(1);

    this.staticGroup = this.physics.add.staticGroup();

    // Limites de Paredes do Templo
    const addWall = (x, y, w, h) => {
      const wall = this.add.rectangle(x, y, w, h, 0x111118, 0.95);
      this.physics.add.existing(wall, true);
      this.staticGroup.add(wall);
    };

    // Paredes Externas
    addWall(180, 20, 320, 40); // Parede Norte Esquerda
    addWall(620, 20, 320, 40); // Parede Norte Direita
    addWall(10, 425, 20, 850);  // Parede Oeste
    addWall(790, 425, 20, 850); // Parede Leste
    addWall(180, 840, 360, 20); // Parede Sul Esquerda
    addWall(620, 840, 360, 20); // Parede Sul Direita

    // Portal / Passagem Norte (Acesso à Ala Norte / Enfermaria)
    this.add.rectangle(400, 30, 120, 20, 0x000000, 0.4).setDepth(1);
    this.add.text(400, 25, '▲ ALA NORTE (ENFERMARIA DE GUNTHER)', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '8px',
      color: '#a29bfe',
      fontStyle: 'bold',
      backgroundColor: 'rgba(10, 10, 16, 0.85)',
      padding: { x: 5, y: 2 }
    }).setOrigin(0.5).setDepth(3);

    // 1. Pilares de Mármore e Ouro com Capitéis
    const addPillar = (x, y) => {
      this.add.ellipse(x, y + 26, 44, 14, 0x000000, 0.35).setDepth(1);
      const p = this.add.image(x, y, AssetsConfig.tiles.temple_pillar).setDepth(2);
      this.physics.add.existing(p, true);
      this.staticGroup.add(p);
    };
    addPillar(180, 240); addPillar(620, 240);
    addPillar(180, 480); addPillar(620, 480);
    addPillar(180, 680); addPillar(620, 680);

    // 2. Altar Cerimonial de Palmem no Santuário
    this.altar = this.add.image(400, 460, AssetsConfig.tiles.temple_altar).setDepth(2);
    this.physics.add.existing(this.altar, true);
    this.staticGroup.add(this.altar);

    // Halo sagrado dourado ambiente do altar
    const altarHalo = this.add.circle(400, 460, 85, 0xf1c40f, 0.2)
      .setDepth(1)
      .setBlendMode(Phaser.BlendModes.ADD);

    this.tweens.add({
      targets: altarHalo,
      alpha: 0.36,
      scale: 1.15,
      duration: 1300,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Velas do altar
    const candleL = this.add.circle(362, 440, 16, 0xffa502, 0.35).setDepth(1).setBlendMode(Phaser.BlendModes.ADD);
    const candleR = this.add.circle(438, 440, 16, 0xffa502, 0.35).setDepth(1).setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({
      targets: [candleL, candleR],
      alpha: 0.55,
      scale: 1.3,
      duration: 450,
      yoyo: true,
      repeat: -1
    });

    this.add.text(400, 495, 'ALTAR DE PALMEM', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '9px',
      color: '#ffd700',
      fontStyle: 'bold',
      backgroundColor: 'rgba(10, 10, 16, 0.75)',
      padding: { x: 4, y: 2 }
    }).setOrigin(0.5).setDepth(3);

    // 3. Sacerdotisa de Palmem (Ilídiz)
    this.staticGroupNPCs = this.physics.add.staticGroup();
    
    this.add.ellipse(400, 363, 22, 8, 0x000000, 0.35).setDepth(2);
    this.sacerdotisa = this.add.sprite(400, 350, AssetsConfig.sprites.sacerdotisa).setDepth(3);
    this.physics.add.existing(this.sacerdotisa, true);
    this.staticGroupNPCs.add(this.sacerdotisa);

    this.tweens.add({
      targets: this.sacerdotisa,
      scaleY: 0.94,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    this.add.text(400, 320, 'SACERDOTISA ILIDIZ', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '9px',
      color: '#ffd700',
      fontStyle: 'bold',
      backgroundColor: 'rgba(10, 10, 16, 0.75)',
      padding: { x: 4, y: 2 }
    }).setOrigin(0.5).setDepth(4);

    // Spawn do Jogador
    const spawnX = this.spawnData.x || 400;
    const spawnY = this.spawnData.y || 760;
    this.player = new Player(this, spawnX, spawnY, 32, 32, 0x0055ff);
    this.player.setDepth(10);

    this.physics.add.collider(this.player, this.staticGroup);
    this.physics.add.collider(this.player, this.staticGroupNPCs);

    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

    // Transições data-driven de mapa
    this.transitions = WorldManager.buildTransitions(this);

    // Prompt Flutuante de Interação
    this.interactIndicator = this.add.text(0, 0, ' [Espaço] Falar ', {
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#000000',
      backgroundColor: '#ffd700',
      padding: { x: 4, y: 2 }
    }).setOrigin(0.5).setDepth(50).setVisible(false);

    // Entidades Interagíveis
    this.interactables = [
      { id: 'sacerdotisa_palmem', x: 400, y: 350 }
    ];

    // Injeção de InputManager
    InputManager.init(this);
    this.setupInputs();

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
      this.updateHUD();
    });

    this._onGlobalDialogueClosed = () => {
      if (this.player && this.player.canInteract && !this.player.canInteract()) {
        this.player.setState(PlayerState.IDLE);
      }
    };

    this._onChoiceSelected = (choiceId) => {
      if (choiceId === 'visit_gunther_yes') {
        this.registry.set('acceptedVisitGunther', true);
        if (!QuestManager.isQuestCompleted('quest_02_temple')) {
          QuestManager.advanceQuest('quest_02_temple', 'completed');
          QuestManager.advanceQuest('quest_03_investigate_farm', 'active');
        }
        this.updateHUD();
      } else if (choiceId === 'visit_gunther_no') {
        this.registry.set('acceptedVisitGunther', false);
        if (!QuestManager.isQuestCompleted('quest_02_temple')) {
          QuestManager.advanceQuest('quest_02_temple', 'completed');
          QuestManager.advanceQuest('quest_03_investigate_farm', 'active');
        }
        this.updateHUD();
      }
    };

    this.game.events.on('dialogueClosed', this._onGlobalDialogueClosed);
    this.game.events.on('dialogueChoiceSelected', this._onChoiceSelected);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off('dialogueClosed', this._onGlobalDialogueClosed);
      this.game.events.off('dialogueChoiceSelected', this._onChoiceSelected);
      InputManager.cleanListeners();
    });

    if (import.meta.env?.DEV) {
      DevShortcuts.register(this);
    }

    this.updateHUD();
  }

  setupInputs() {
    this.events.off(Phaser.Scenes.Events.RESUME, this._bgmResumeHandler, this);
    this._bgmResumeHandler = () => {
      AudioManager.init(this);
      window.playBGM(this, 'bgm_bencao_gunther');
    };
    this.events.on(Phaser.Scenes.Events.RESUME, this._bgmResumeHandler, this);

    InputManager.onAction('CONFIRM', () => {
      if (!this.sys || !this.sys.isActive()) return;
      if (this.player && !this.player.canInteract()) {
        this.game.events.emit('advanceDialogue');
        return;
      }

      if (this.currentInteractTarget) {
        this.activeDialogueTarget = this.currentInteractTarget;
        this.interactIndicator.setVisible(false);

        if (this.currentInteractTarget === 'sacerdotisa_palmem') {
          const guntherVisited = !!this.registry.get('visitedGunther');

          if (!QuestManager.isQuestCompleted('quest_02_temple')) {
             QuestManager.advanceQuest('quest_02_temple', 'completed');
             if (!window.gameState) window.gameState = { flags: {} };
             window.gameState.flags.talkedToPriestess = true;
             this.game.events.emit('updateObjective', 'Objetivo: Siga para a Estrada Sul em Rastphen (Fazenda dos Halflings)');
          }

          if (guntherVisited) {
            this.game.events.emit('openDialogue', [
              {
                character: 'Sacerdotisa Ilídiz',
                portraitKey: AssetsConfig.sprites.sacerdotisa,
                text: 'Obrigada por visitar Gunther na Ala Norte. Que a bênção e a luz de Palmem acompanhem sua jornada até a Fazenda dos Halflings ao sul.'
              }
            ]);
          } else {
            this.game.events.emit('openDialogue', [
              {
                character: 'Sacerdotisa Ilídiz',
                portraitKey: AssetsConfig.sprites.sacerdotisa,
                text: 'Rhogar, as altas muralhas de Rastphen sempre protegeram o sul de Walldarten, mas as sombras agora rastejam pelas estradas. Nosso jovem monge, Gunther, sobreviveu a um ataque na Fazenda dos Halflings... Ele está repousando na Ala Norte. Você pode ir vê-lo se desejar, ou pode seguir direto para o Portão Sul da cidade para investigar a fazenda.',
                choices: [
                  {
                    text: '[Sim] Visitar Gunther na Ala Norte de Repouso',
                    choiceId: 'visit_gunther_yes',
                    response: 'Gunther está descansando na Ala Norte. Suba pelo portal ao norte do altar para visitá-lo na enfermaria.'
                  },
                  {
                    text: '[Não] Seguir viagem diretamente para a Fazenda',
                    choiceId: 'visit_gunther_no',
                    response: 'Entendo a urgência de sua missão. Que a luz sagrada proteja sua lâmina contra o mal do sul.'
                  }
                ]
              }
            ]);
          }
        }
      }
    });

    InputManager.onAction('MENU', () => {
      if (!this.sys || !this.sys.isActive()) return;
      if (this.player && !this.player.canInteract()) return;
      this.scene.pause();
      this.scene.launch('PauseScene', { sceneKey: 'TempleScene' });
    });

    InputManager.onAction('INVENTORY', () => {
      if (!this.sys || !this.sys.isActive()) return;
      this.game.events.emit('toggleInventory');
    });
  }

  updateHUD() {
    let text = '';
    const guntherVisited = !!this.registry.get('visitedGunther');
    const acceptedVisit = !!this.registry.get('acceptedVisitGunther');
    const quest02Done = QuestManager.isQuestCompleted('quest_02_temple');

    if (guntherVisited || quest02Done) {
      text = 'Objetivo: Vá ao Portão Sul de Rastphen rumo à Fazenda dos Halflings';
    } else if (acceptedVisit) {
      text = 'Objetivo: Visite o monge Gunther na enfermaria da Ala Norte';
    } else {
      text = 'Objetivo: Fale com a Sacerdotisa Ilídiz no Templo de Palmem';
    }
    this.game.events.emit('updateObjective', text);
  }

  update(time, delta) {
    if (this.player) {
      this.player.update(time, delta);
    }

    if (!this.input.keyboard.enabled) return;

    this.player.handleMovement(this.cursors, this.wasd, 160);

    // Sistema de Gatilhos Espaciais
    let closest = null;
    let closestDist = Infinity;

    this.interactables.forEach(ent => {
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, ent.x, ent.y);
      if (dist <= 65 && dist < closestDist) {
        closestDist = dist;
        closest = ent;
      }
    });

    if (closest && this.player.canInteract()) {
      this.currentInteractTarget = closest.id;
      this.interactIndicator.setPosition(this.player.x, this.player.y - 30);
      this.interactIndicator.setVisible(true);
    } else {
      this.currentInteractTarget = null;
      this.interactIndicator.setVisible(false);
    }
  }
}
