import Phaser from 'phaser';

/**
 * Estados da FSM do NPCWalker.
 */
export const NPCWalkerState = {
  IDLE: 'IDLE',
  WALKING: 'WALKING',
  PAUSED: 'PAUSED'
};

/**
 * Entidade NPC com rotina autônoma de movimentação, waypoints e animações.
 * Suporta alternância entre IDLE e WALKING, espelhamento direcional (flipX),
 * sombra dinâmica e pausa automática para diálogos.
 */
export default class NPCWalker extends Phaser.GameObjects.Container {
  /**
   * @param {Phaser.Scene} scene - Cena do Phaser.
   * @param {number} x - Posição X inicial.
   * @param {number} y - Posição Y inicial.
   * @param {string} textureKey - Chave da textura do sprite.
   * @param {object} [options] - Configurações opcionais.
   */
  constructor(scene, x, y, textureKey, options = {}) {
    super(scene, x, y);

    this.name = options.name || 'NPC';
    this.speed = options.speed || 45; // Pixels por segundo
    this.loop = options.loop !== false;
    this.waypoints = options.waypoints || [];
    this.currentWaypointIndex = 0;
    this.state = NPCWalkerState.IDLE;
    this.isPausedForDialogue = false;

    // 1. Sombra projetada sob os pés
    this.shadow = scene.add.ellipse(0, 13, 22, 8, 0x000000, 0.35);
    this.add(this.shadow);

    // 2. Sprite principal de Pixel Art
    this.sprite = scene.add.sprite(0, 0, textureKey);
    this.add(this.sprite);

    // 3. Etiqueta de identificação visual
    if (options.showLabel !== false) {
      this.label = scene.add.text(0, -23, this.name.toUpperCase(), {
        fontFamily: 'Arial, sans-serif',
        fontSize: '9px',
        color: '#ffd700',
        fontStyle: 'bold',
        backgroundColor: 'rgba(10, 10, 16, 0.75)',
        padding: { x: 4, y: 2 }
      }).setOrigin(0.5);
      this.add(this.label);
    }

    this.setDepth(options.depth || 3);
    scene.add.existing(this);

    // Tweens ativos
    this.moveTween = null;
    this.breathTween = null;
    this.waitTimer = null;

    if (this.waypoints.length > 0) {
      this.startPatrol();
    } else {
      this.startIdleBreathing();
    }
  }

  /**
   * Define novos waypoints e inicia a patrulha.
   * @param {Array<{x: number, y: number, waitTime?: number}>} waypoints
   */
  setWaypoints(waypoints, loop = true) {
    this.waypoints = waypoints;
    this.loop = loop;
    this.currentWaypointIndex = 0;
    this.startPatrol();
  }

  startPatrol() {
    if (this.waypoints.length === 0) return;
    this.moveToNextWaypoint();
  }

  moveToNextWaypoint() {
    if (this.isPausedForDialogue) return;

    const target = this.waypoints[this.currentWaypointIndex];
    if (!target) return;

    this.stopIdleBreathing();
    this.state = NPCWalkerState.WALKING;

    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const distance = Math.hypot(dx, dy);

    // Orientação do sprite (espelhamento)
    if (dx < -2) {
      this.sprite.setFlipX(true);
    } else if (dx > 2) {
      this.sprite.setFlipX(false);
    }

    const duration = Math.max(300, (distance / this.speed) * 1000);

    // Micro-bobbing ao caminhar
    const walkBob = this.scene.tweens.add({
      targets: this.sprite,
      scaleY: 0.94,
      duration: 200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    this.moveTween = this.scene.tweens.add({
      targets: this,
      x: target.x,
      y: target.y,
      duration: duration,
      ease: 'Linear',
      onComplete: () => {
        walkBob.stop();
        this.sprite.setScale(1);
        this.onReachedWaypoint(target);
      }
    });
  }

  onReachedWaypoint(waypoint) {
    this.state = NPCWalkerState.IDLE;
    this.startIdleBreathing();

    const wait = waypoint.waitTime !== undefined ? waypoint.waitTime : 2000;

    this.waitTimer = this.scene.time.delayedCall(wait, () => {
      if (this.isPausedForDialogue) return;

      this.currentWaypointIndex++;
      if (this.currentWaypointIndex >= this.waypoints.length) {
        if (this.loop) {
          this.currentWaypointIndex = 0;
          this.moveToNextWaypoint();
        }
      } else {
        this.moveToNextWaypoint();
      }
    });
  }

  startIdleBreathing() {
    this.stopIdleBreathing();
    this.breathTween = this.scene.tweens.add({
      targets: this.sprite,
      scaleY: 0.96,
      duration: 1000 + Math.random() * 300,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  stopIdleBreathing() {
    if (this.breathTween) {
      this.breathTween.stop();
      this.breathTween = null;
      this.sprite.setScale(1);
    }
  }

  /**
   * Pausa o trajeto do NPC para interagir com o jogador.
   * Vira o NPC na direção do jogador.
   * @param {number} [playerX]
   */
  pauseForDialogue(playerX) {
    this.isPausedForDialogue = true;
    this.state = NPCWalkerState.PAUSED;

    if (this.moveTween) {
      this.moveTween.pause();
    }
    if (this.waitTimer) {
      this.waitTimer.paused = true;
    }

    if (playerX !== undefined) {
      this.sprite.setFlipX(playerX < this.x);
    }

    this.startIdleBreathing();
  }

  /**
   * Retoma a patrulha após o fim do diálogo.
   */
  resumePatrol() {
    this.isPausedForDialogue = false;

    if (this.waitTimer && this.waitTimer.paused) {
      this.waitTimer.paused = false;
    } else if (this.moveTween && this.moveTween.isPaused()) {
      this.state = NPCWalkerState.WALKING;
      this.moveTween.resume();
    } else {
      this.moveToNextWaypoint();
    }
  }

  destroy(fromScene) {
    if (this.moveTween) this.moveTween.stop();
    if (this.breathTween) this.breathTween.stop();
    if (this.waitTimer) this.waitTimer.remove();
    super.destroy(fromScene);
  }
}
