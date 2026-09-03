import Phaser from 'phaser';
import Logger from '../utils/Logger.js';
import InputManager from '../services/InputManager.js';
import AchievementManager from '../services/AchievementManager.js';

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
   * Construtor da Entidade Player (GameObject).
   * @param {Phaser.Scene} scene - Cena ativa do Phaser.
   * @param {number} x - Posição X.
   * @param {number} y - Posição Y.
   * @param {number} width - Largura.
   * @param {number} height - Altura.
   * @param {number} color - Cor hexadecimal.
   */
  constructor(scene, x = 0, y = 0, width = 32, height = 32, color = 0x2980b9) {
    super(scene, x, y, width, height, color);
    
    if (scene && scene.add) {
      scene.add.existing(this);
    }
    if (scene && scene.physics && scene.physics.add) {
      scene.physics.add.existing(this, false);
      if (this.body) {
        this.body.setSize(width, height);
        this.body.setCollideWorldBounds(true);
      }
    }

    // Renderização em Pixel Art (Sprite sobreposto com sombra)
    this.sprite = null;
    this.shadow = null;
    if (scene && scene.textures && scene.textures.exists('spr_rhogar')) {
      this.setFillStyle(0x000000, 0); // Oculta o retângulo geométrico de colisão
      this.shadow = scene.add.ellipse(x, y + 13, 22, 8, 0x000000, 0.35);
      this.sprite = scene.add.sprite(x, y, 'spr_rhogar');
      if (this.depth !== undefined) {
        this.shadow.setDepth(this.depth);
        this.sprite.setDepth(this.depth + 1);
      }
    }

    // Atributos de Combate e Progressão
    this.name = 'Rhogar Tordan';
    this.level = 1;
    this.xp = 0;
    this.xpToNextLevel = 100;
    this.maxHp = 120;
    this.hp = 120;
    this.attack = 18;
    this.defense = 8;
    this.fury = 0;
    this.maxFury = 100;
    this.electricBreathCost = 50;
    this.electricBreathMultiplier = 2.5;

    // Mecânica de Embriaguez e Cervejas
    this.isDrunk = false;
    this.drunkTimer = 0;
    this.beersDrunkCount = 0;
    this.dizzyContainer = null;
    this.dizzyTween = null;

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
        if (this.dizzyContainer) {
          this.dizzyContainer.destroy();
          this.dizzyContainer = null;
        }
      });
    }
  }

  /**
   * Restaura o estado de atributos a partir de um objeto salvo.
   * @param {Object} state 
   */
  loadState(state) {
    if (!state) return;
    if (state.name) this.name = state.name;
    if (state.level !== undefined) this.level = state.level;
    if (state.xp !== undefined) this.xp = state.xp;
    if (state.xpToNextLevel !== undefined) this.xpToNextLevel = state.xpToNextLevel;
    if (state.maxHp !== undefined) this.maxHp = state.maxHp;
    if (state.hp !== undefined) this.hp = Math.min(state.hp, this.maxHp);
    if (state.attack !== undefined) this.attack = state.attack;
    if (state.defense !== undefined) this.defense = state.defense;
    if (state.fury !== undefined) this.fury = state.fury;
    if (state.maxFury !== undefined) this.maxFury = state.maxFury;
    if (state.electricBreathCost !== undefined) this.electricBreathCost = state.electricBreathCost;
    if (state.electricBreathMultiplier !== undefined) this.electricBreathMultiplier = state.electricBreathMultiplier;
    if (state.equippedWeapon) this.equippedWeapon = state.equippedWeapon;
    if (state.checkpoint) this.checkpoint = state.checkpoint;
  }

  /**
   * Retorna os atributos vitais do jogador.
   * @returns {Object}
   */
  getState() {
    return {
      name: this.name,
      level: this.level,
      xp: this.xp,
      xpToNextLevel: this.xpToNextLevel,
      hp: this.hp,
      maxHp: this.maxHp,
      attack: this.attack,
      defense: this.defense,
      fury: this.fury,
      maxFury: this.maxFury,
      electricBreathCost: this.electricBreathCost,
      electricBreathMultiplier: this.electricBreathMultiplier,
      equippedWeapon: this.equippedWeapon,
      checkpoint: this.checkpoint
    };
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
   * Atualização de movimentação baseada na FSM com suporte a inversão por embriaguez.
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

    let left = (cursors?.left?.isDown) || (wasd?.a?.isDown) || InputManager.isVirtualDown('left');
    let right = (cursors?.right?.isDown) || (wasd?.d?.isDown) || InputManager.isVirtualDown('right');
    let up = (cursors?.up?.isDown) || (wasd?.w?.isDown) || InputManager.isVirtualDown('up');
    let down = (cursors?.down?.isDown) || (wasd?.s?.isDown) || InputManager.isVirtualDown('down');

    // Inversão embriagada de controles se estiver bêbado
    if (this.isDrunk) {
      const tempLeft = left;
      left = right;
      right = tempLeft;

      const tempUp = up;
      up = down;
      down = tempUp;
    }

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

    // Orientação do sprite
    if (velX < 0) {
      this.facingDirection = 'left';
      if (this.avatar) this.avatar.setFlipX(true);
    } else if (velX > 0) {
      this.facingDirection = 'right';
      if (this.avatar) this.avatar.setFlipX(false);
    }
  }

  /**
   * Consome uma cerveja anã, recupera recursos e aplica embriaguez se atingir 3 doses.
   */
  consumeBeer() {
    this.beersDrunkCount = (this.beersDrunkCount || 0) + 1;
    this.fury = Math.min((this.fury || 0) + 30, this.maxFury || 100);
    this.hp = Math.min((this.hp || 120) + 20, this.maxHp || 120);

    // Feedback visual do consumo
    this.showFloatingText('Glup, glup, glup 🍺', '#f1c40f');
    Logger.info('Player', `${this.name} bebeu uma cerveja anã (Total consumidas: ${this.beersDrunkCount}).`);

    // Ativar embriaguez ao atingir 3 ou mais cervejas
    if (this.beersDrunkCount >= 3) {
      this.activateDrunkState(20000); // 20 segundos estritos
    }
  }

  /**
   * Ativa o estado de embriaguez por um período determinado.
   * @param {number} durationMs - Duração em milissegundos
   */
  activateDrunkState(durationMs = 20000) {
    this.isDrunk = true;
    this.drunkTimer = durationMs;
    this.showFloatingText('💫 Tonto de cerveja! Controles Invertidos!', '#e74c3c');
    this.createDizzyEffect();
    AchievementManager.unlock('ach_drunk', this.scene);
    Logger.info('Player', `Estado de embriaguez ativado por ${durationMs / 1000}s.`);
  }

  /**
   * Cria o efeito visual de tontura sobre o sprite.
   */
  createDizzyEffect() {
    if (this.dizzyContainer || !this.scene || !this.scene.add) return;
    this.dizzyContainer = this.scene.add.container(this.x, this.y - 32).setDepth((this.depth || 10) + 10);
    const star1 = this.scene.add.text(-12, 0, '💫', { fontSize: '13px' }).setOrigin(0.5);
    const star2 = this.scene.add.text(12, 0, '😵', { fontSize: '13px' }).setOrigin(0.5);
    this.dizzyContainer.add([star1, star2]);

    if (this.scene.tweens) {
      this.dizzyTween = this.scene.tweens.add({
        targets: [star1, star2],
        y: -6,
        duration: 600,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }
  }

  /**
   * Remove o estado de embriaguez e limpa os efeitos visuais.
   */
  clearDrunkState() {
    this.isDrunk = false;
    this.drunkTimer = 0;
    if (this.dizzyTween) {
      this.dizzyTween.stop();
      this.dizzyTween = null;
    }
    if (this.dizzyContainer) {
      this.dizzyContainer.destroy();
      this.dizzyContainer = null;
    }
    this.showFloatingText('A cabeça clareou...', '#2ecc71');
    Logger.info('Player', 'Efeito de embriaguez dissipado.');
  }

  /**
   * Exibe um texto flutuante animado acima do jogador.
   * @param {string} msg 
   * @param {string} color 
   */
  showFloatingText(msg, color = '#ffffff') {
    if (!this.scene || !this.scene.add) return;
    const txt = this.scene.add.text(this.x, this.y - 20, msg, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '12px',
      color: color,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(100);

    if (this.scene.tweens) {
      this.scene.tweens.add({
        targets: txt,
        y: this.y - 55,
        alpha: 0,
        duration: 1800,
        ease: 'Power1',
        onComplete: () => txt.destroy()
      });
    }
  }

  /**
   * Atualização por frame do jogador para controle de timers de status.
   * @param {number} time 
   * @param {number} delta 
   */
  update(time, delta) {
    // Atualização do timer de embriaguez
    if (this.isDrunk && this.drunkTimer > 0) {
      this.drunkTimer -= delta || 16;
      if (this.dizzyContainer) {
        this.dizzyContainer.setPosition(this.x, this.y - 32);
      }
      if (this.drunkTimer <= 0) {
        this.clearDrunkState();
      }
    }
  }

  preUpdate(time, delta) {
    if (super.preUpdate) {
      super.preUpdate(time, delta);
    }
    if (this.sprite) {
      this.sprite.setPosition(this.x, this.y);
      if (this.shadow) {
        this.shadow.setPosition(this.x, this.y + 13);
      }
    }
  }

  destroy(fromScene) {
    if (this.sprite) {
      this.sprite.destroy();
      this.sprite = null;
    }
    if (this.shadow) {
      this.shadow.destroy();
      this.shadow = null;
    }
    super.destroy(fromScene);
  }

  /**
   * Verifica se o jogador pode interagir com o mundo ou portais.
   * @returns {boolean}
   */
  canInteract() {
    return this.state === PlayerState.IDLE || this.state === PlayerState.WALKING;
  }

  // --- MÉTODOS DE COMBATE ---

  /**
   * Calcula o dano mitigado pela defesa com variação aleatória de 10%.
   * @param {number} rawAttack - Poder bruto de ataque.
   * @param {number} targetDefense - Defesa do alvo.
   * @param {number} [variance=0.1] - Taxa de variação percentual.
   * @returns {number} Dano real infligido (mínimo de 1).
   */
  calculateDamage(rawAttack, targetDefense = 0, variance = 0.1) {
    const baseDamage = Math.max(1, rawAttack - (targetDefense || 0));
    const min = Math.floor(baseDamage * (1 - variance));
    const max = Math.ceil(baseDamage * (1 + variance));
    const variation = min === max ? min : (Math.floor(Math.random() * (max - min + 1)) + min);
    return Math.max(1, variation);
  }

  takeDamage(amount) {
    const actualDamage = this.calculateDamage(amount, this.defense);
    this.hp -= actualDamage;
    if (this.hp < 0) this.hp = 0;
    
    this.fury += 15;
    if (this.fury > this.maxFury) this.fury = this.maxFury;

    Logger.info('Player', `${this.name} sofreu ${actualDamage} de dano (Mitigado por ${this.defense} DEF). HP: ${this.hp}, Fúria: ${this.fury}`);
    return actualDamage;
  }

  basicAttack(target) {
    const targetDef = target.def || target.defense || 0;
    const damage = this.calculateDamage(this.attack, targetDef);
    target.hp -= damage;
    if (target.hp < 0) target.hp = 0;

    this.fury += 10;
    if (this.fury > this.maxFury) this.fury = this.maxFury;

    Logger.info('Player', `${this.name} atacou ${target.name} causando ${damage} de dano.`);
    return damage;
  }

  // --- MÉTODOS DE PROGRESSÃO (XP E LEVEL UP) ---

  /**
   * Concede experiência ao jogador e processa potenciais subidas de nível.
   * @param {number} amount - Quantidade de XP a ser somada.
   * @returns {Object} Resultado do ganho de XP com detalhes de level up se ocorrido.
   */
  gainXP(amount) {
    if (!amount || amount <= 0) return { leveledUp: false, xpGained: 0, currentLevel: this.level };
    
    this.xp += amount;
    Logger.info('Player', `${this.name} ganhou ${amount} XP. (${this.xp}/${this.xpToNextLevel})`);
    
    const initialLevel = this.level;
    const levelsGained = [];

    while (this.xp >= this.xpToNextLevel) {
      this.xp -= this.xpToNextLevel;
      const statBonus = this.levelUp();
      levelsGained.push(statBonus);
    }

    const didLevelUp = this.level > initialLevel;
    return {
      leveledUp: didLevelUp,
      xpGained: amount,
      oldLevel: initialLevel,
      currentLevel: this.level,
      levelsGained: levelsGained
    };
  }

  /**
   * Executa a subida de nível, melhorando atributos vitais e eficiência de combate.
   * @returns {Object} Bônus concedidos neste nível.
   */
  levelUp() {
    this.level += 1;
    const hpGain = 25;
    const atkGain = 3;
    const defGain = 2;

    this.maxHp += hpGain;
    this.hp = this.maxHp; // Cura total ao subir de nível
    this.attack += atkGain;
    this.defense += defGain;
    
    // Aumento de eficiência do Sopro Elétrico e recursos de Fúria
    this.electricBreathCost = Math.max(35, this.electricBreathCost - 5);
    this.electricBreathMultiplier = +(this.electricBreathMultiplier + 0.2).toFixed(1);
    this.xpToNextLevel = Math.floor(this.xpToNextLevel * 1.5);

    Logger.info('Player', `★ LEVEL UP! ${this.name} atingiu o Nível ${this.level}! HP: +${hpGain}, ATQ: +${atkGain}, DEF: +${defGain}, Custo Sopro: ${this.electricBreathCost}`);

    if (this.scene && this.scene.game && this.scene.game.events) {
      this.scene.game.events.emit('playerLevelUp', {
        level: this.level,
        hpGain,
        atkGain,
        defGain,
        electricBreathCost: this.electricBreathCost
      });
    }

    return {
      level: this.level,
      hpGain,
      atkGain,
      defGain,
      newMaxHp: this.maxHp,
      newAttack: this.attack,
      newDefense: this.defense,
      electricBreathCost: this.electricBreathCost
    };
  }

  electricBreath(target) {
    const cost = this.electricBreathCost || 50;
    if (this.fury < cost) {
      Logger.warn('Player', `Fúria insuficiente para Sopro Elétrico (Requer ${cost}).`);
      return 0;
    }

    this.fury -= cost;
    // Sopro penetra 50% da defesa do alvo
    const targetDef = Math.floor((target.def || target.defense || 0) * 0.5);
    const multiplier = this.electricBreathMultiplier || 2.5;
    const rawAttack = Math.floor(this.attack * multiplier);
    const damage = this.calculateDamage(rawAttack, targetDef);
    
    target.hp -= damage;
    if (target.hp < 0) target.hp = 0;

    Logger.info('Player', `${this.name} usou Sopro Elétrico (x${multiplier}) em ${target.name} causando ${damage} de dano!`);
    return damage;
  }

  isAlive() {
    return this.hp > 0;
  }
}
