import Phaser from 'phaser';
import InputManager from '../services/InputManager.js';
import InventoryManager from '../services/InventoryManager.js';
import AchievementManager from '../services/AchievementManager.js';
import ShopUI from '../ui/ShopUI.js';
import WorldMapUI from '../ui/WorldMapUI.js';
import QuestManager from '../services/QuestManager.js';
import WorldManager from '../services/WorldManager.js';
import Logger from '../utils/Logger.js';
import AudioManager from '../audio/AudioManager.js';
import Player, { PlayerState } from '../entities/Player.js';
import DevShortcuts from '../utils/DevShortcuts.js';
import { AssetsConfig } from '../config/assets.js';
import NPCWalker from '../entities/NPCWalker.js';

/**
 * Cena de Exploração Top-Down da Taverna Cauda do Dragão.
 * @module TavernScene
 */
export default class TavernScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TavernScene' });
  }

  init(data) {
    this.returnedFromFlashback = data.returnedFromFlashback || false;
    this.battleOutcome = data.battleOutcome || null;
    this.spawnData = data || {};
  }

  create() {
    AudioManager.init(this);
    window.playBGM(this, 'bgm_fogo_ouro_cerveja');
    Logger.info('TavernScene', 'Renderizando Taverna Cauda do Dragão (Pixel Art).');
    this.interactions = this.cache.json.get('tavern_interactions');
    
    // Inicializar QuestManager se necessário
    const questsData = this.cache.json.get('quests');
    if (Object.keys(QuestManager.quests).length === 0) {
      QuestManager.init(questsData);
    }

    if (this.input.keyboard) this.input.keyboard.enabled = true;
    this.cameras.main.resetFX();
    this.cameras.main.fadeIn(400, 0, 0, 0);

    // 1. Fundo Atmosférico de Pixel Art (assoalho de madeira, paredes de pedra e tapete rúnico)
    this.add.image(400, 300, AssetsConfig.backgrounds.tavern).setDepth(0);

    // 2. Iluminação Dinâmica da Lareira e Partículas de Brasas
    const hearthLight = this.add.circle(400, 45, 95, 0xffa502, 0.22)
      .setDepth(1)
      .setBlendMode(Phaser.BlendModes.ADD);

    this.tweens.add({
      targets: hearthLight,
      alpha: 0.38,
      scale: 1.12,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    if (this.textures.exists(AssetsConfig.fx.particle_ember)) {
      this.add.particles(400, 40, AssetsConfig.fx.particle_ember, {
        speedY: { min: -35, max: -12 },
        speedX: { min: -15, max: 15 },
        scale: { start: 0.6, end: 0 },
        alpha: { start: 0.8, end: 0 },
        lifespan: 1500,
        frequency: 180,
        blendMode: 'ADD'
      }).setDepth(2);
    }

    // 3. Sistema Físico de Colisões (Paredes invisíveis)
    this.staticGroup = this.physics.add.staticGroup();
    
    const addInvisibleBoundary = (x, y, w, h) => {
      const r = this.add.rectangle(x, y, w, h, 0x000000, 0);
      this.physics.add.existing(r, true);
      this.staticGroup.add(r);
    };

    // Limites de Borda (Paredes da Taverna)
    addInvisibleBoundary(400, 35, 800, 70); // Parede norte e lareira
    addInvisibleBoundary(400, 595, 800, 10); // Parede sul
    addInvisibleBoundary(5, 300, 10, 600);   // Parede oeste
    addInvisibleBoundary(795, 300, 10, 600); // Parede leste

    // 4. Mobílias e Colisores em Sprites/Imagens
    const counter = this.add.image(400, 100, AssetsConfig.tiles.counter).setDepth(2);
    this.physics.add.existing(counter, true);
    this.staticGroup.add(counter);

    const mesa1 = this.add.image(200, 300, AssetsConfig.tiles.table).setDepth(2);
    this.physics.add.existing(mesa1, true);
    this.staticGroup.add(mesa1);

    const mesa2 = this.add.image(600, 300, AssetsConfig.tiles.table).setDepth(2);
    this.physics.add.existing(mesa2, true);
    this.staticGroup.add(mesa2);

    // 5. NPCs e Entidades de Interação
    this.interactables = [
      { id: 'balcao_taverna', x: 400, y: 140 },
      { id: 'hilda', x: 200, y: 135 },
      { id: 'placa_regras', x: 200, y: 100 },
      { id: 'quadro_avisos', x: 600, y: 100 },
      { id: 'john_bardem', x: 100, y: 500 },
      { id: 'veronica_stinfy', x: 200, y: 250 },
      { id: 'traudon_alicia', x: 600, y: 250 },
      { id: 'joseph_sylven', x: 700, y: 500 }
    ];

    // 6. Renderizar NPCs com Sprites de Pixel Art, Sombras e Tags
    this.npcSprites = {};
    this.interactables.forEach(ent => {
      let textureKey = 'spr_npc_default';
      const isProp = ent.id.startsWith('placa') || ent.id.startsWith('quadro');

      if (ent.id === 'hilda') textureKey = AssetsConfig.sprites.hilda;
      else if (ent.id === 'joseph_sylven') textureKey = AssetsConfig.sprites.joseph;
      else if (ent.id === 'veronica_stinfy') textureKey = AssetsConfig.sprites.veronica;
      else if (ent.id === 'john_bardem') textureKey = AssetsConfig.sprites.john;
      else if (ent.id === 'traudon_alicia') textureKey = AssetsConfig.sprites.traudon;
      else if (ent.id === 'quadro_avisos') textureKey = AssetsConfig.tiles.noticeboard;
      else if (ent.id === 'placa_regras') textureKey = AssetsConfig.tiles.rules;

      if (!this.textures.exists(textureKey)) {
        textureKey = isProp ? 'tex_noticeboard' : 'spr_npc_default';
      }

      // Sombra projetada sob os pés de personagens vivos
      if (!isProp) {
        this.add.ellipse(ent.x, ent.y + 13, 22, 8, 0x000000, 0.35).setDepth(2);
      }

      const sprite = this.add.sprite(ent.x, ent.y, textureKey).setDepth(3);
      this.npcSprites[ent.id] = sprite;

      // Micro-animação sutil de respiração para personagens vivos
      if (!isProp) {
        this.tweens.add({
          targets: sprite,
          scaleY: 0.95,
          duration: 1100 + Math.random() * 400,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      }

      // Etiqueta de identificação estilizada
      const displayName = ent.id.replace(/_/g, ' ').toUpperCase();
      this.add.text(ent.x, ent.y - 23, displayName, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '9px',
        color: '#ffd700',
        fontStyle: 'bold',
        backgroundColor: 'rgba(10, 10, 16, 0.75)',
        padding: { x: 4, y: 2 }
      }).setOrigin(0.5).setDepth(4);
    });

    // 7. Garçonete Ambulante (NPCWalker com waypoints de atendimento)
    this.waitress = new NPCWalker(this, 350, 180, AssetsConfig.sprites.waitress, {
      name: 'Gisela',
      speed: 40,
      depth: 3,
      waypoints: [
        { x: 350, y: 180, waitTime: 3000 },
        { x: 260, y: 280, waitTime: 3500 },
        { x: 400, y: 320, waitTime: 2000 },
        { x: 540, y: 280, waitTime: 3500 },
        { x: 450, y: 180, waitTime: 2500 }
      ]
    });
    this.interactables.push({ id: 'gisela_waitress', x: 350, y: 180, isWalker: true });

    // Instanciação do Jogador (Player com FSM)
    let isNewGameIntro = !this.registry.get('introCutscenePlayed') && !this.returnedFromFlashback;
    let spawnX = this.spawnData.x || (WorldManager.getSpawn()?.x || 400);
    let spawnY = this.spawnData.y || (WorldManager.getSpawn()?.y || 500);

    if (isNewGameIntro) {
      spawnX = 400;
      spawnY = 580; // Starting at the door
    }

    this.player = new Player(this, spawnX, spawnY, 32, 32, 0x2980b9);
    if (this.spawnData?.loadedData?.player) {
      this.player.loadState(this.spawnData.loadedData.player);
    }
    this.physics.add.collider(this.player, this.staticGroup);

    if (isNewGameIntro) {
      this.registry.set('introCutscenePlayed', true);
      this.player.setState(PlayerState.TRANSITIONING); // blocks input
      this.tweens.add({
        targets: this.player,
        y: 500,
        duration: 2500,
        ease: 'Sine.easeInOut',
        onComplete: () => {
          this.player.setState(PlayerState.IDLE);
          this.game.events.emit('openDialogue', [
            {
              character: 'Rhogar Tordan',
              portraitKey: AssetsConfig.sprites.rhogar || 'spr_rhogar',
              text: '*Suspiro exausto* Finalmente... um lugar para descansar a mente...'
            }
          ]);
        }
      });
    }

    // Portas Data-Driven via WorldManager
    WorldManager.buildTransitions(this);

    // Indicador UI Flutuante de Interação
    this.interactPrompt = this.add.text(0, 0, '▼ [Z] Interagir', { fontSize: '14px', fill: '#ffff00', backgroundColor: '#000' }).setOrigin(0.5);
    this.interactPrompt.setVisible(false);
    this.interactPrompt.setDepth(10);
    
    // Shop UI delegada para UIScene (removida instância local)
    this.game.events.on('globalShopClosed', () => {
      if (this.player && this.player.state === PlayerState.INTERACTING) {
        if (InventoryManager.hasItem('dwarven_ale') && !this.registry.get('drankBeer')) {
          this._startBeerDrinkingEvent(0);
        } else {
          this.player.setState(PlayerState.IDLE);
        }
      }
    });

    this.currentInteractable = null;
    this.visitedNPCs = new Set();

    InputManager.init(this);
    this.setupInputs();

    this.updateHUD();

    // Listener global para fim de diálogo
    this._onGlobalDialogueClosed = () => {
      const target = this.activeDialogueTarget;
      const josephType = this.activeDialogueJosephType;
      this.activeDialogueTarget = null;
      this.activeDialogueJosephType = null;

      // Retomar patrulha da garçonete se estava conversando
      if (this.waitress) {
        this.waitress.resumePatrol();
      }

      // Controle do Flashback no Joseph Sylven
      if (target === 'joseph_sylven' && (josephType === 'joseph_flashback_ready' || this.registry.get('drankBeer'))) {
        if (!QuestManager.isQuestCompleted('quest_01_flashback')) {
          Logger.info('TavernScene', 'Rhogar bebeu a cerveja e lembrou do passado. Iniciando Flashback de Estayler...');
          
          if (this.scene.get('UIScene') && this.scene.get('UIScene').dialogueBox) {
            this.scene.get('UIScene').dialogueBox.closeDialogue();
          }

          this.cameras.main.fadeOut(500, 255, 255, 255);
          this.time.delayedCall(550, () => {
            this.scene.start('GameScene'); 
          });
        }
      }
    };

    this.game.events.on('dialogueClosed', this._onGlobalDialogueClosed);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off('dialogueClosed', this._onGlobalDialogueClosed);
    });

    // Caching de teclado para prevenir Garbage Collection per-frame
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = {
      w: this.input.keyboard.addKey('W'),
      a: this.input.keyboard.addKey('A'),
      s: this.input.keyboard.addKey('S'),
      d: this.input.keyboard.addKey('D')
    };

    // Restaurar listeners de input ao retomar da pausa/overlay
    this.events.on(Phaser.Scenes.Events.RESUME, () => {
      InputManager.init(this);
      if (typeof this.setupInputs === 'function') {
        this.setupInputs();
      }
      this.updateHUD();
    });

    // Atalhos de desenvolvedor protegidos por ambiente DEV
    if (import.meta.env?.DEV) {
      DevShortcuts.register(this);
    }
  }

  setupInputs() {
    this.events.off(Phaser.Scenes.Events.RESUME, this._bgmResumeHandler, this);
    this._bgmResumeHandler = () => {
      AudioManager.init(this);
      window.playBGM(this, 'bgm_fogo_ouro_cerveja');
    };
    this.events.on(Phaser.Scenes.Events.RESUME, this._bgmResumeHandler, this);

    InputManager.onAction('CONFIRM', () => {
      if (this.player && !this.player.canInteract()) {
        if (this.currentMapUI) {
          this.currentMapUI.closeMap();
          this.currentMapUI = null;
          this.player.setState(PlayerState.IDLE);
        } else {
          this.game.events.emit('advanceDialogue');
        }
        return;
      }

      if (this.currentInteractable) {
        Logger.info('Intent', `Iniciando interação com [${this.currentInteractable}].`);
        this.openInteraction(this.currentInteractable);
      }
    });

    InputManager.onAction('CANCEL', () => {
      if (this.currentMapUI) {
        this.currentMapUI.closeMap();
        this.currentMapUI = null;
        this.player.setState(PlayerState.IDLE);
      }
    });

    InputManager.onAction('MENU', () => {
      if (this.player && !this.player.canInteract()) return;
      this.scene.pause();
      this.scene.launch('PauseScene', { sceneKey: 'TavernScene' });
    });

    InputManager.onAction('INVENTORY', () => {
      this.game.events.emit('toggleInventory');
    });
  }

  openInteraction(id) {
    this.activeDialogueTarget = id;
    this.openHildaShopOnClose = false;

    const talkedToJosephInitial = !!this.registry.get('talkedToJosephInitial');
    const talkedToAll = !!this.registry.get('talkedToAllClients');
    const josephRequestedBeer = !!this.registry.get('josephRequestedBeer');
    const drankBeer = !!this.registry.get('drankBeer') || (this.player?.beersDrunkCount > 0);
    const isPostFlashback = QuestManager.isQuestCompleted('quest_01_flashback');

    if (id === 'balcao_taverna' || id === 'counter') {
      this.player.setState(PlayerState.INTERACTING);
      
      const hasAle = InventoryManager.hasItem('dwarven_ale');

      if (hasAle) {
        this._startBeerDrinkingEvent(0);
      } else {
        this.game.events.emit('openDialogue', [
          {
            character: 'Hilda Barba-de-Ferro',
            portraitKey: AssetsConfig.sprites.hilda,
            text: 'Ei! Tire as mãos daí! Vá comprar uma bebida com a Hilda ali no canto!'
          }
        ]);
      }
    } else if (id === 'hilda') {
      this.player.setState(PlayerState.INTERACTING);
      
      if (this.scene.get('UIScene') && typeof this.scene.get('UIScene').openShop === 'function') {
         this.scene.get('UIScene').openShop([{ id: 'dwarven_ale', price: 15 }, { id: 'dragon_snack', price: 10 }, { id: 'water', price: 5 }]);
      }
    } else if (id === 'quadro_avisos') {
      this.player.setState(PlayerState.INTERACTING);
      this.currentMapUI = new WorldMapUI(this, 400, 300);
      this.currentMapUI.setDepth(60);
    } else if (id === 'joseph_sylven') {
      this.player.setState(PlayerState.INTERACTING);

      if (isPostFlashback) {
        this.game.events.emit('openDialogue', [
          {
            character: 'Joseph Sylven',
            portraitKey: AssetsConfig.sprites.joseph,
            text: 'Você reviveu as dores de Estayler, Rhogar... mas a verdadeira batalha começa agora. Saia da taverna pela porta sul e vá até a Cidade de Rastphen. O Templo de Palmem ao norte é nosso primeiro destino!'
          }
        ]);
      } else if (!talkedToJosephInitial) {
        this.registry.set('talkedToJosephInitial', true);
        this.activeDialogueJosephType = 'joseph_initial';
        this.game.events.emit('openDialogue', [
          {
            character: 'Joseph Sylven',
            portraitKey: AssetsConfig.sprites.joseph,
            text: 'Rhogar! Bom ver você desperto. As sombras do culto de Brentel estão se movendo pelas estradas do sul. Vá conversar com nossos companheiros no salão — Verônica, John e Traudon — para entender a situação antes de partirmos.'
          }
        ]);
        this.updateHUD();
      } else if (!talkedToAll) {
        const remaining = 3 - this.visitedNPCs.size;
        this.game.events.emit('openDialogue', [
          {
            character: 'Joseph Sylven',
            portraitKey: AssetsConfig.sprites.joseph,
            text: `Ainda faltam companheiros para você consultar no salão (${this.visitedNPCs.size}/3). Vá falar com eles!`
          }
        ]);
      } else if (talkedToAll && !drankBeer) {
        this.registry.set('josephRequestedBeer', true);
        this.game.events.emit('openDialogue', [
          {
            character: 'Joseph Sylven',
            portraitKey: AssetsConfig.sprites.joseph,
            text: 'Rhogar, você parece tenso. Suas escamas estão faiscando de ansiedade. Vá até a Hilda no balcão, compre uma boa Cerveja Anã e beba na sua mochila para acalmar a mente antes de relembrarmos Estayler.'
          }
        ]);
        this.updateHUD();
      } else if (drankBeer) {
        this.activeDialogueJosephType = 'joseph_flashback_ready';
        this.game.events.emit('openDialogue', [
          {
            character: 'Joseph Sylven',
            portraitKey: AssetsConfig.sprites.joseph,
            text: 'Agora sim, sua respiração estabilizou. Feche os olhos, Rhogar... Lembre-se do que aconteceu naquele dia nas ravinas de Estayler...'
          }
        ]);
      }
    } else if (['veronica_stinfy', 'traudon_alicia', 'john_bardem'].includes(id)) {
      this.player.setState(PlayerState.INTERACTING);

      if (isPostFlashback) {
        // Diálogos pós-flashback com missões individuais
        if (id === 'veronica_stinfy') {
          this.game.events.emit('openDialogue', [
            {
              character: 'Verônica Stinfy',
              portraitKey: AssetsConfig.sprites.veronica,
              text: 'Rhogar! Sinto perturbações arcanas e corrupção vindas do Templo de Palmem ao norte de Rastphen. Vá até lá e investigue as anomalias com a Sacerdotisa Ilídiz!'
            }
          ]);
        } else if (id === 'john_bardem') {
          this.game.events.emit('openDialogue', [
            {
              character: 'John Bardem',
              portraitKey: AssetsConfig.sprites.john,
              text: 'Os camponeses relatam rastros de sangue e criaturas de chifres rondando a Fazenda dos Halflings ao sul. Mantenha sua lâmina afiada!'
            }
          ]);
        } else if (id === 'traudon_alicia') {
          this.game.events.emit('openDialogue', [
            {
              character: 'Traudon & Alícia',
              portraitKey: AssetsConfig.sprites.traudon,
              text: 'O druida da colina enviou um alerta: as raízes da Floresta Cinzenta estão apodrecendo. O caminho para o sul através do portão de Rastphen é perigoso, não se aventure desarmado.'
            }
          ]);
        }
      } else if (!talkedToJosephInitial) {
        // Redirecionamento obrigatório para Joseph no início
        let redirectText = 'Fale com Joseph primeiro, temos assuntos mais urgentes antes de qualquer conversa.';
        if (id === 'veronica_stinfy') redirectText = 'Rhogar, vá falar com Joseph primeiro. Ele tem informações cruciais sobre os acontecimentos recentes.';
        else if (id === 'john_bardem') redirectText = 'Joseph está esperando por você perto da lareira. Converse com ele primeiro!';
        else if (id === 'traudon_alicia') redirectText = 'Acalme-se, draconato. Fale com Joseph antes de começarmos a planejar.';

        this.game.events.emit('openDialogue', [
          {
            character: id === 'veronica_stinfy' ? 'Verônica Stinfy' : id === 'john_bardem' ? 'John Bardem' : 'Traudon & Alícia',
            portraitKey: AssetsConfig.sprites[id.split('_')[0]] || 'spr_npc_default',
            text: redirectText
          }
        ]);
      } else {
        // Diálogo normal com o herói durante a coleta de informações
        if (id === 'traudon_alicia' && !this.registry.get('aliciaGaveGold')) {
          this.registry.set('aliciaGaveGold', true);
          
          const requiredGold = 15;
          let goldGiven = 0;
          if (InventoryManager.gold < requiredGold) {
            goldGiven = requiredGold - InventoryManager.gold;
            InventoryManager.addGold(goldGiven);
            this.player.showFloatingText(`+${goldGiven} Ouro de Alícia! 🪙`, '#ffd700');
          }

          this.game.events.emit('openDialogue', [
            {
              character: 'Traudon',
              portraitKey: AssetsConfig.sprites.traudon,
              text: 'Rhogar, as florestas de Brentel estão inquietas... Sentimos o pulsar de necromancia corrompendo a terra.'
            },
            {
              character: 'Alícia',
              portraitKey: AssetsConfig.sprites.traudon,
              text: goldGiven > 0 
                ? `Rhogar, você parece exausto e sem dinheiro suficiente. Tome estas ${goldGiven} moedas para inteirar o preço de uma Cerveja Anã no balcão de Hilda!`
                : 'Rhogar, você parece exausto. Compre uma boa rodada de cerveja no balcão de Hilda para aliviar essa tensão!'
            }
          ]);
        } else {
          const dialogue = this.interactions[id];
          if (dialogue) {
            this.game.events.emit('openDialogue', dialogue);
          }
        }

        this.visitedNPCs.add(id);
        if (this.visitedNPCs.has('veronica_stinfy') && this.visitedNPCs.has('traudon_alicia') && this.visitedNPCs.has('john_bardem')) {
          this.registry.set('talkedToAllClients', true);
          Logger.info('TavernScene', 'Todos os 3 companheiros consultados. Retorno a Joseph liberado.');
        }
        this.updateHUD();
      }
    } else if (id === 'gisela_waitress') {
      this.player.setState(PlayerState.INTERACTING);
      if (this.waitress) this.waitress.pauseForDialogue(this.player.x);

      if (isPostFlashback) {
        this.game.events.emit('openDialogue', [
          {
            character: 'Gisela (Garçonete)',
            portraitKey: AssetsConfig.sprites.waitress,
            text: 'As ruas de Rastphen estão vazias lá fora... As pessoas têm medo da escuridão. Tome cuidado, guerreiro.'
          }
        ]);
        return;
      }

      const waitressCount = (this.registry.get('waitressInteractionsCount') || 0) + 1;
      this.registry.set('waitressInteractionsCount', waitressCount);

      if (waitressCount === 1) {
        this.game.events.emit('openDialogue', [
          {
            character: 'Gisela (Garçonete)',
            portraitKey: AssetsConfig.sprites.waitress,
            text: 'Olá, guerreiro! Para pedir bebidas ou provisões, fale diretamente com a Hilda no balcão principal.'
          }
        ]);
      } else if (waitressCount === 2) {
        this.game.events.emit('openDialogue', [
          {
            character: 'Gisela (Garçonete)',
            portraitKey: AssetsConfig.sprites.waitress,
            text: 'Ainda com sede? Como eu disse, a dona Hilda é quem cuida dos barris e das vendas no balcão.'
          }
        ]);
      } else if (waitressCount === 3) {
        InventoryManager.addItem('dwarven_ale', 3);
        this.player.showFloatingText('+3 Cerveja Anã (3 doses) Recebida! 🍺', '#f39c12');
        AchievementManager.unlock('ach_free_beer', this.game);
        this.updateHUD();

        this._startBeerDrinkingEvent(0);
      } else {
        this.game.events.emit('openDialogue', [
          {
            character: 'Gisela (Garçonete)',
            portraitKey: AssetsConfig.sprites.waitress,
            text: 'Aproveite sua cerveja! Se eu entregar mais uma de graça, a Hilda desconta tudo do meu salário.'
          }
        ]);
      }
    } else {
      const dialogue = this.interactions[id];
      if (dialogue) {
        this.game.events.emit('openDialogue', dialogue);
      }
    }
  }

  updateHUD() {
    let text = '';
    const talkedToJosephInitial = !!this.registry.get('talkedToJosephInitial');
    const talkedToAll = !!this.registry.get('talkedToAllClients');
    const drankBeer = !!this.registry.get('drankBeer') || (this.player?.beersDrunkCount > 0);
    const isPostFlashback = QuestManager.isQuestCompleted('quest_01_flashback');

    if (isPostFlashback) {
      text = 'Objetivo: Saia da Taverna e vá ao Templo de Palmem ao norte de Rastphen';
    } else if (!talkedToJosephInitial) {
      text = 'Objetivo: Fale com Joseph Sylven no salão da Taverna';
    } else if (!talkedToAll) {
      const clientCount = (this.visitedNPCs.has('veronica_stinfy') ? 1 : 0) +
                          (this.visitedNPCs.has('traudon_alicia') ? 1 : 0) +
                          (this.visitedNPCs.has('john_bardem') ? 1 : 0);
      text = `Objetivo: Converse com os companheiros no salão (${clientCount}/3)`;
    } else if (!drankBeer) {
      text = 'Objetivo: Compre e beba uma Cerveja Anã com Hilda no balcão';
    } else {
      text = 'Objetivo: Fale com Joseph Sylven para relembrar Estayler';
    }
    this.game.events.emit('updateObjective', text);
  }

  update(time, delta) {
    if (this.player) {
      this.player.update(time, delta);
    }

    if (!this.input.keyboard.enabled) return;

    if (this.returnedFromFlashback) {
      this.returnedFromFlashback = false;
      Logger.info('TavernScene', 'Retornou do Flashback. Missões atualizadas.');
      this.updateHUD();
    }

    // Controle de movimento via FSM do Player (usando instâncias em cache)
    this.player.handleMovement(this.cursors, this.wasd, 160);

    // Sincronizar coordenadas móveis da garçonete
    const giselaEntry = this.interactables.find(e => e.id === 'gisela_waitress');
    if (giselaEntry && this.waitress) {
      giselaEntry.x = this.waitress.x;
      giselaEntry.y = this.waitress.y;
    }

    // Sistema de Gatilhos Espaciais
    let closest = null;
    let closestDist = Infinity;

    this.interactables.forEach(ent => {
      let dist;
      // Para o balcão da taverna (permite interação fluida ao longo de toda a extensão x: 280 a 520)
      if (ent.id === 'balcao_taverna') {
        const clampedX = Phaser.Math.Clamp(this.player.x, 280, 520);
        dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, clampedX, ent.y);
      } else {
        dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, ent.x, ent.y);
      }

      let maxRange = 65;
      if (ent.id === 'hilda') {
        maxRange = 150; // Permite interação confortável através do balcão sem bloqueio de colisão
      } else if (ent.id === 'balcao_taverna') {
        maxRange = 125;
      }

      if (dist <= maxRange && dist < closestDist) {
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

  _startBeerDrinkingEvent(currentSips = 0) {
    this.player.setState(PlayerState.INTERACTING);
    const text = currentSips === 0 
      ? 'Você adquiriu uma Cerveja Anã. Tomar um gole agora?'
      : 'Tomar mais um gole?';

    this.game.events.emit('openDialogue', [
      {
        character: 'Sistema',
        text: text,
        choices: [
          {
            text: '[Sim]',
            callback: () => {
              this._handleSip(currentSips + 1);
            }
          },
          {
            text: '[Não]',
            callback: () => {
              this.game.events.emit('openDialogue', [
                {
                  character: 'Rhogar Tordan',
                  portraitKey: AssetsConfig.sprites.rhogar || 'spr_rhogar',
                  text: 'Já chega. É melhor eu falar com o Joseph.'
                }
              ]);
            }
          }
        ]
      }
    ]);
  }

  _handleSip(sipCount) {
    // Consume 1 dose
    InventoryManager.useItem('dwarven_ale', this.player);
    this.registry.set('drankBeer', true);
    this.updateHUD();

    if (sipCount < 3) {
      this.time.delayedCall(1200, () => {
        this._startBeerDrinkingEvent(sipCount);
      });
    } else {
      this.time.delayedCall(1200, () => {
        this.game.events.emit('openDialogue', [
          {
            character: 'Rhogar Tordan',
            portraitKey: AssetsConfig.sprites.rhogar || 'spr_rhogar',
            text: 'Acho que foi demais...'
          }
        ]);
      });
    }
  }
}
