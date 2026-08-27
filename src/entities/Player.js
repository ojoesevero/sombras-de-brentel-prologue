import Logger from '../utils/Logger.js';

/**
 * Modelo de Estado do Jogador
 * Representa Rhogar Tordan, gerenciando vida, atributos e habilidades.
 */
export default class Player {
  /**
   * Inicializa o estado base do jogador.
   */
  constructor() {
    this.name = 'Rhogar Tordan';
    this.maxHp = 120;
    this.hp = 120;
    this.attack = 18;
    this.defense = 8;
    this.fury = 0;
    this.maxFury = 100;
  }

  /**
   * Aplica dano ao jogador, mitigado pela defesa, e aumenta a fúria.
   * @param {number} amount - Dano bruto recebido.
   * @returns {number} O dano real sofrido após mitigação.
   */
  takeDamage(amount) {
    const actualDamage = Math.max(1, amount - this.defense);
    this.hp -= actualDamage;
    if (this.hp < 0) this.hp = 0;
    
    this.fury += 15;
    if (this.fury > this.maxFury) this.fury = this.maxFury;

    Logger.info('Player', `${this.name} sofreu ${actualDamage} de dano e gerou fúria. HP: ${this.hp}, Fúria: ${this.fury}`);
    return actualDamage;
  }

  /**
   * Executa um ataque básico no alvo, gerando fúria.
   * @param {Object} target - O inimigo alvo do ataque.
   * @returns {number} Dano causado.
   */
  basicAttack(target) {
    const damage = Math.max(1, this.attack);
    target.hp -= damage;
    if (target.hp < 0) target.hp = 0;

    this.fury += 10;
    if (this.fury > this.maxFury) this.fury = this.maxFury;

    Logger.info('Player', `${this.name} atacou ${target.name} causando ${damage} de dano.`);
    return damage;
  }

  /**
   * Habilidade especial: Sopro Elétrico. Consome 50 de fúria.
   * @param {Object} target - O inimigo alvo.
   * @returns {number} Dano causado. Retorna 0 se fúria insuficiente.
   */
  electricBreath(target) {
    if (this.fury < 50) {
      Logger.warn('Player', 'Fúria insuficiente para Sopro Elétrico.');
      return 0;
    }

    this.fury -= 50;
    const damage = Math.floor(this.attack * 2.5); // Ignora parte da defesa / Dano massivo
    target.hp -= damage;
    if (target.hp < 0) target.hp = 0;

    Logger.info('Player', `${this.name} usou Sopro Elétrico em ${target.name} causando ${damage} de dano!`);
    return damage;
  }

  /**
   * Verifica se o jogador continua vivo.
   * @returns {boolean} True se hp > 0.
   */
  isAlive() {
    return this.hp > 0;
  }
}
