import Phaser from 'phaser';
import Logger from '../utils/Logger.js';

/**
 * Estados da Máquina de Estados Finita (FSM) do Jogador.
 */
export const PlayerState = {
  IDLE: 'IDLE',
  WALKING: 'WALKING',
  INTERACTING: 'INTERACTING',
  TRANSITIONING: 'TRANSITIONING',
  PAUSED: 'PAUSED'
};

/**
 * Classe Player (Entidade e GameObject)
 * Representa Rhogar Tordan tanto como entidade de combate (atributos/fúria)
 * quanto como GameObject físico do Arcade Physics em cenas de exploração.
 */
export default class Player extends Phaser.GameObjects.Rectangle {
  /**
   * Construtor flexível: pode ser chamado sem argumentos (modelo de combate puro)
   * ou com (scene, x, y, width, height, color) como GameObject no mundo aberto.
   */
  constructor(scene = null, x = 0, y = 0, width = 32, height = 32, color = 0x2980b9) {
    if (scene) {
      super(scene, x, y, width, height, color);
      scene.add.existing(this);
      scene.physics.add.existing(this, false);
      this.body.setSize(width, height);
      this.body.setCollideWorldBounds(true);
    } else {
      super({ scene: null, add: () => {} }, 0, 0, 0, 0, 0);
    }

    // Atributos de Combate
    this.name = 'Rhogar Tordan';
    this.maxHp = 120;
    this.hp = 120;
    this.attack = 18;
    this.defense = 8;
    this.fury = 0;
    this.maxFury = 100;

    // FSM de Exploração
    this.state = PlayerState.IDLE;
    this.moveSpeed = 220;

    // Ouvintes para eventos globais de diálogo
    if (scene && scene.game && scene.game.events) {
      this._onDialogueOpened = () => {
        this.setState(PlayerState.INTERACTING);
      };
      this._onDialogueClosed = () => {
        if (this.state === PlayerState.INTERACTING) {
          this.setState(PlayerState.IDLE);
        }
      };

      scene.game.events.on('dialogueOpened', this._onDialogueOpened);
      scene.game.events.on('dialogueClosed', this._onDialogueClosed);

      scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
        scene.game.events.off('dialogueOpened', this._onDialogueOpened);
        scene.game.events.off('dialogueClosed', this._onDialogueClosed);
      });
    }
  }

  /**
   * Define o estado atual do jogador.
   * @param {string} newState - Membro de PlayerState
   */
  setState(newState) {
    if (this.state === newState) return;
    this.state = newState;

    if (this.body && (newState === PlayerState.INTERACTING || newState === PlayerState.TRANSITIONING || newState === PlayerState.PAUSED)) {
      this.body.setVelocity(0, 0);
    }
  }

  /**
   * Atualização de movimentação baseada na FSM.
   * @param {Object} cursors - Cursors do teclado (up, down, left, right)
   * @param {Object} wasd - Teclas W, A, S, D
   * @param {number} customSpeed - Velocidade opcional
   */
  handleMovement(cursors, wasd = {}, customSpeed = null) {
    if (!this.body) return;

    if (this.state === PlayerState.INTERACTING || this.state === PlayerState.TRANSITIONING || this.state === PlayerState.PAUSED) {
      this.body.setVelocity(0, 0);
      return;
    }

    const speed = customSpeed || this.moveSpeed;
    let velX = 0;
    let velY = 0;

    const left = (cursors?.left?.isDown) || (wasd?.a?.isDown);
    const right = (cursors?.right?.isDown) || (wasd?.d?.isDown);
    const up = (cursors?.up?.isDown) || (wasd?.w?.isDown);
    const down = (cursors?.down?.isDown) || (wasd?.s?.isDown);

    if (left) velX = -speed;
    else if (right) velX = speed;

    if (up) velY = -speed;
    else if (down) velY = speed;

    // Normalização diagonal
    if (velX !== 0 && velY !== 0) {
      velX *= 0.7071;
      velY *= 0.7071;
    }

    this.body.setVelocity(velX, velY);

    if (velX !== 0 || velY !== 0) {
      this.state = PlayerState.WALKING;
    } else {
      this.state = PlayerState.IDLE;
    }
  }

  /**
   * Verifica se o jogador pode interagir com o mundo ou portais.
   * @returns {boolean}
   */
  canInteract() {
    return this.state === PlayerState.IDLE || this.state === PlayerState.WALKING;
  }

  // --- MÉTODOS DE COMBATE ---

  takeDamage(amount) {
    const actualDamage = Math.max(1, amount - this.defense);
    this.hp -= actualDamage;
    if (this.hp < 0) this.hp = 0;
    
    this.fury += 15;
    if (this.fury > this.maxFury) this.fury = this.maxFury;

    Logger.info('Player', `${this.name} sofreu ${actualDamage} de dano e gerou fúria. HP: ${this.hp}, Fúria: ${this.fury}`);
    return actualDamage;
  }

  basicAttack(target) {
    const damage = Math.max(1, this.attack);
    target.hp -= damage;
    if (target.hp < 0) target.hp = 0;

    this.fury += 10;
    if (this.fury > this.maxFury) this.fury = this.maxFury;

    Logger.info('Player', `${this.name} atacou ${target.name} causando ${damage} de dano.`);
    return damage;
  }

  electricBreath(target) {
    if (this.fury < 50) {
      Logger.warn('Player', 'Fúria insuficiente para Sopro Elétrico.');
      return 0;
    }

    this.fury -= 50;
    const damage = Math.floor(this.attack * 2.5);
    target.hp -= damage;
    if (target.hp < 0) target.hp = 0;

    Logger.info('Player', `${this.name} usou Sopro Elétrico em ${target.name} causando ${damage} de dano!`);
    return damage;
  }

  isAlive() {
    return this.hp > 0;
  }
}
