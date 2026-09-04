import Phaser from 'phaser';
import Logger from '../utils/Logger.js';

/**
 * Singleton gerenciador de Entradas (Input).
 * Padroniza a interpretação de comandos de teclado e Gamepad.
 * @module InputManager
 */
class InputManager extends Phaser.Events.EventEmitter {
  constructor() {
    super();
    if (InputManager.instance) {
      return InputManager.instance;
    }
    InputManager.instance = this;
    this.scene = null;
    this.lastGamepadState = {};
    this.virtualKeys = {
      up: false,
      down: false,
      left: false,
      right: false
    };
    this.ignoreInputs = false;
    this.interactionLock = false;
  }

  /**
   * Define o estado contínuo de uma tecla virtual (Touch/D-Pad).
   * @param {string} key - 'up' | 'down' | 'left' | 'right'
   * @param {boolean} isDown
   */
  setVirtualKey(key, isDown) {
    if (this.virtualKeys[key] !== undefined) {
      this.virtualKeys[key] = !!isDown;
    }
  }

  /**
   * Retorna se a tecla virtual está pressionada.
   * @param {string} key
   * @returns {boolean}
   */
  isVirtualDown(key) {
    return !!this.virtualKeys[key];
  }

  /**
   * Reseta todas as teclas virtuais pressionadas.
   */
  resetVirtualKeys() {
    this.virtualKeys.up = false;
    this.virtualKeys.down = false;
    this.virtualKeys.left = false;
    this.virtualKeys.right = false;
  }

  /**
   * Limpa todos os ouvintes de teclado, eventos e polling de update vinculados à cena atual.
   */
  cleanListeners() {
    this.resetVirtualKeys();
    if (this.scene) {
      if (this.scene.input && this.scene.input.keyboard) {
        this.scene.input.keyboard.off('keydown', this.handleKeyboard, this);
      }
      if (this.scene.events) {
        this.scene.events.off(Phaser.Scenes.Events.UPDATE, this.update, this);
      }
    }
  }

  /**
   * Inicializa o input listener na cena atual.
   * @param {Phaser.Scene} scene - A cena ativa.
   */
  init(scene) {
    if (!scene) return;
    
    // Desvincula listeners da cena anterior para erradicar vazamentos de memória (State Leaks)
    this.cleanListeners();
    
    this.scene = scene;

    // Configurar Teclado
    if (scene.input && scene.input.keyboard) {
      this.keys = scene.input.keyboard.addKeys({
        UP: Phaser.Input.Keyboard.KeyCodes.UP,
        DOWN: Phaser.Input.Keyboard.KeyCodes.DOWN,
        LEFT: Phaser.Input.Keyboard.KeyCodes.LEFT,
        RIGHT: Phaser.Input.Keyboard.KeyCodes.RIGHT,
        W: Phaser.Input.Keyboard.KeyCodes.W,
        S: Phaser.Input.Keyboard.KeyCodes.S,
        A: Phaser.Input.Keyboard.KeyCodes.A,
        D: Phaser.Input.Keyboard.KeyCodes.D,
        CONFIRM1: Phaser.Input.Keyboard.KeyCodes.SPACE,
        CONFIRM2: Phaser.Input.Keyboard.KeyCodes.ENTER,
        CONFIRM3: Phaser.Input.Keyboard.KeyCodes.Z,
        CANCEL1: Phaser.Input.Keyboard.KeyCodes.X,
        CANCEL2: Phaser.Input.Keyboard.KeyCodes.ESC,
        MENU: Phaser.Input.Keyboard.KeyCodes.ESC
      });

      scene.input.keyboard.on('keydown', this.handleKeyboard, this);
    }
    
    if (scene.events) {
      scene.events.on(Phaser.Scenes.Events.UPDATE, this.update, this);
      
      // Auto-limpeza ao desligar ou destruir a cena
      scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
        this.cleanListeners();
      });
      scene.events.once(Phaser.Scenes.Events.DESTROY, () => {
        this.cleanListeners();
      });
    }
    
    Logger.info('InputManager', 'InputManager acoplado à cena atual.');
  }

  /**
   * Trata inputs diretos do teclado via eventos discretos.
   */
  handleKeyboard(event) {
    if (!event) return;

    if (event.stopPropagation) {
      event.stopPropagation();
    }
    if (event.stopImmediatePropagation) {
      event.stopImmediatePropagation();
    }

    switch (event.keyCode) {
      case Phaser.Input.Keyboard.KeyCodes.UP:
      case Phaser.Input.Keyboard.KeyCodes.W:
        this.emitAction('UP');
        break;
      case Phaser.Input.Keyboard.KeyCodes.DOWN:
      case Phaser.Input.Keyboard.KeyCodes.S:
        this.emitAction('DOWN');
        break;
      case Phaser.Input.Keyboard.KeyCodes.LEFT:
      case Phaser.Input.Keyboard.KeyCodes.A:
        this.emitAction('LEFT');
        break;
      case Phaser.Input.Keyboard.KeyCodes.RIGHT:
      case Phaser.Input.Keyboard.KeyCodes.D:
        this.emitAction('RIGHT');
        break;
      case Phaser.Input.Keyboard.KeyCodes.SPACE:
      case Phaser.Input.Keyboard.KeyCodes.ENTER:
      case Phaser.Input.Keyboard.KeyCodes.Z:
        this.emitAction('CONFIRM');
        break;
      case Phaser.Input.Keyboard.KeyCodes.SHIFT:
      case Phaser.Input.Keyboard.KeyCodes.I:
        this.emitAction('INVENTORY');
        break;
      case Phaser.Input.Keyboard.KeyCodes.X:
        this.emitAction('INVENTORY');
        this.emitAction('CANCEL');
        break;
      case Phaser.Input.Keyboard.KeyCodes.ESC:
        this.emitAction('CANCEL');
        this.emitAction('MENU');
        break;
    }
  }

  /**
   * Monitora joysticks/gamepads de modo contínuo na Engine.
   */
  update() {
    if (!this.scene || !this.scene.input.gamepad) return;

    const pad = this.scene.input.gamepad.getPad(0);
    if (!pad) return;

    const checkButton = (btn, action) => {
      const isDown = pad[btn];
      if (isDown && !this.lastGamepadState[action]) {
        this.emitAction(action);
      }
      this.lastGamepadState[action] = isDown;
    };

    checkButton('up', 'UP');
    checkButton('down', 'DOWN');
    checkButton('left', 'LEFT');
    checkButton('right', 'RIGHT');
    checkButton('A', 'CONFIRM');
    checkButton('B', 'CANCEL');
  }

  emitAction(action) {
    if (this.ignoreInputs || this.interactionLock) return;

    if (action === 'CONFIRM') {
      const ui = this.scene && typeof this.scene.scene.get === 'function' ? this.scene.scene.get('UIScene') : null;
      if (ui && typeof ui.isDialogueActive === 'function' && ui.isDialogueActive()) {
        ui.game.events.emit('advanceDialogue');
        
        this.interactionLock = true;
        if (this.scene && this.scene.time) {
          this.scene.time.delayedCall(250, () => {
            this.interactionLock = false;
          });
        } else {
          setTimeout(() => { this.interactionLock = false; }, 250);
        }
        return;
      }
    }

    if (action === 'INVENTORY') {
      const now = Date.now();
      if (this._lastInventoryTime && (now - this._lastInventoryTime < 250)) {
        return;
      }
      this._lastInventoryTime = now;
    }
    this.emit(action);
    const sceneName = (this.scene && this.scene.scene) ? this.scene.scene.key : 'Global';
    Logger.input('KEY_EVENT', action, sceneName);
  }

  /**
   * Assina um callback para eventos lógicos.
   * @param {string} action - Ex: 'UP', 'CONFIRM'.
   * @param {Function} callback 
   */
  onAction(action, callback) {
    this.on(action, callback);
  }
}

const inputManagerInstance = new InputManager();
export default inputManagerInstance;
