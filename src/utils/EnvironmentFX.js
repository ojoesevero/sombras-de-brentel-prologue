import Phaser from 'phaser';
import Logger from './Logger.js';

/**
 * Utilitário modular para Efeitos Ambientais Dinâmicos (Vento, Pássaros, Folhas e Névoa).
 * Projetado para Pixel Art e alta performance.
 */
export default class EnvironmentFX {
  /**
   * Adiciona vento com folhas de outono flutuando suavemente pela tela.
   * @param {Phaser.Scene} scene 
   * @param {{x?: number, y?: number, w?: number, h?: number}} [bounds]
   * @returns {Phaser.GameObjects.Particles.ParticleEmitter|null}
   */
  static addWindLeaves(scene, bounds = { x: 0, y: 0, w: 1600, h: 1200 }) {
    if (!scene || !scene.add) return null;

    const textureKey = scene.textures.exists('fx_leaf') ? 'fx_leaf' : 'fx_star';

    const emitter = scene.add.particles(0, 0, textureKey, {
      emitZone: {
        source: new Phaser.Geom.Rectangle(bounds.x || 0, bounds.y || 0, bounds.w || 1600, 100),
        type: 'random'
      },
      speedX: { min: 30, max: 80 },
      speedY: { min: 20, max: 55 },
      scale: { start: 0.8, end: 0.4 },
      alpha: { start: 0.85, end: 0 },
      angle: { min: -30, max: 45 },
      rotate: { min: -180, max: 180 },
      lifespan: { min: 6000, max: 9000 },
      frequency: 450,
      quantity: 1
    });

    emitter.setDepth(15);
    return emitter;
  }

  /**
   * Aplica oscilação sinusoidal suave nas copas das árvores simulando brisa viva.
   * @param {Phaser.Scene} scene 
   * @param {Array<Phaser.GameObjects.GameObject>} treeObjects 
   */
  static addTreeSway(scene, treeObjects) {
    if (!scene || !treeObjects || treeObjects.length === 0) return;

    treeObjects.forEach((tree, idx) => {
      const delay = (idx * 170) % 1200;
      const duration = 2200 + ((idx * 230) % 800);

      scene.tweens.add({
        targets: tree,
        scaleX: (tree.scaleX || 1) * 1.04,
        rotation: 0.025,
        duration: duration,
        delay: delay,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    });
  }

  /**
   * Spawna pequenos pássaros em pixel art cruzando o topo do cenário em intervalos aleatórios.
   * @param {Phaser.Scene} scene 
   * @param {{x?: number, y?: number, w?: number, h?: number}} [bounds]
   */
  static addFlyingBirds(scene, bounds = { x: 0, y: 0, w: 1600, h: 1200 }) {
    if (!scene || !scene.add) return;

    const spawnBird = () => {
      if (!scene || !scene.sys || !scene.sys.isActive()) return;

      const goingRight = Math.random() > 0.5;
      const startX = goingRight ? (bounds.x || 0) - 40 : (bounds.x || 0) + (bounds.w || 1600) + 40;
      const targetX = goingRight ? (bounds.x || 0) + (bounds.w || 1600) + 40 : (bounds.x || 0) - 40;
      const startY = (bounds.y || 0) + Phaser.Math.Between(40, 260);

      const bird = scene.add.sprite(startX, startY, 'tex_bird');
      bird.setDepth(25);
      bird.setFlipX(!goingRight);

      // Batimento de asas suave
      const flapTween = scene.tweens.add({
        targets: bird,
        scaleY: 0.6,
        duration: 150,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      // Ondulação na trajetória de voo
      const waveTween = scene.tweens.add({
        targets: bird,
        y: startY + Phaser.Math.Between(-30, 30),
        duration: 1200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      // Deslocamento horizontal através do cenário
      const duration = Phaser.Math.Between(9000, 14000);
      scene.tweens.add({
        targets: bird,
        x: targetX,
        duration: duration,
        ease: 'Linear',
        onComplete: () => {
          flapTween.stop();
          waveTween.stop();
          bird.destroy();
        }
      });

      // Agendar próximo pássaro (intervalo aleatório entre 8 e 16 segundos)
      const nextDelay = Phaser.Math.Between(8000, 16000);
      scene.time.delayedCall(nextDelay, spawnBird);
    };

    // Primeiro pássaro com delay de 3 segundos
    scene.time.delayedCall(3000, spawnBird);
  }

  /**
   * Adiciona uma camada de névoa translúcida horizontal rastejante (Ato III).
   * @param {Phaser.Scene} scene 
   * @param {{x?: number, y?: number, w?: number, h?: number}} [bounds]
   * @returns {Phaser.GameObjects.TileSprite|null}
   */
  static addAtmosphericFog(scene, bounds = { x: 0, y: 0, w: 1600, h: 1200 }) {
    if (!scene || !scene.add) return null;

    const texKey = scene.textures.exists('tex_fog') ? 'tex_fog' : null;
    if (!texKey) return null;

    const fog = scene.add.tileSprite(
      (bounds.x || 0) + (bounds.w || 1600) / 2,
      (bounds.y || 0) + (bounds.h || 1200) / 2,
      bounds.w || 1600,
      bounds.h || 1200,
      'tex_fog'
    );

    fog.setDepth(20);
    fog.setAlpha(0.25);
    fog.setBlendMode(Phaser.BlendModes.SCREEN);

    // Movimentação contínua da névoa
    scene.events.on(Phaser.Scenes.Events.UPDATE, () => {
      if (fog && fog.active) {
        fog.tilePositionX += 0.35;
      }
    });

    return fog;
  }
}
