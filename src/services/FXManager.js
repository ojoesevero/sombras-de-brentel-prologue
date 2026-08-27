import Phaser from 'phaser';

/**
 * Singleton gerenciador de Efeitos Visuais (VFX).
 * Injeta 'Game Juice' como camera shakes, partículas, floating texts e flash screens.
 * @module FXManager
 */
class FXManager {
  constructor() {
    if (FXManager.instance) {
      return FXManager.instance;
    }
    FXManager.instance = this;
  }

  /**
   * Emite um clarão (flash) na tela inteira, útil para impactos críticos ou magias grandiosas.
   * @param {Phaser.Scene} scene 
   * @param {number} color 
   * @param {number} duration 
   */
  flashScreen(scene, color = 0xffffff, duration = 150) {
    scene.cameras.main.flash(duration, (color >> 16) & 0xff, (color >> 8) & 0xff, color & 0xff);
  }

  /**
   * Desenha um arco de corte físico e faz fade-out rápido.
   * @param {Phaser.Scene} scene 
   * @param {number} x 
   * @param {number} y 
   */
  createSlashEffect(scene, x, y) {
    const slash = scene.add.graphics();
    slash.lineStyle(4, 0xffffff, 1);
    slash.beginPath();
    slash.moveTo(x - 40, y - 40);
    slash.lineTo(x + 40, y + 40);
    slash.strokePath();

    scene.tweens.add({
      targets: slash,
      alpha: 0,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 150,
      onComplete: () => slash.destroy()
    });
  }

  /**
   * Dispara o Sopro Elétrico em zigue-zague da origem (Rhogar) até o Alvo.
   * @param {Phaser.Scene} scene 
   * @param {number} fromX 
   * @param {number} fromY 
   * @param {number} toX 
   * @param {number} toY 
   */
  createLightningBreathFX(scene, fromX, fromY, toX, toY) {
    const line = scene.add.graphics();
    line.lineStyle(6, 0x00ffff, 1);
    line.beginPath();
    line.moveTo(fromX, fromY);
    
    // Perturbação geométrica (zigue-zague) simples
    const midX = (fromX + toX) / 2 + Phaser.Math.Between(-40, 40);
    const midY = (fromY + toY) / 2 + Phaser.Math.Between(-40, 40);
    
    line.lineTo(midX, midY);
    line.lineTo(toX, toY);
    line.strokePath();

    scene.tweens.add({
      targets: line,
      alpha: 0,
      duration: 350,
      ease: 'Power2',
      onComplete: () => line.destroy()
    });
  }

  /**
   * Instancia um Floating Combat Text para denotar dano numérico visual subindo.
   * @param {Phaser.Scene} scene 
   * @param {number} x 
   * @param {number} y 
   * @param {number} amount 
   * @param {boolean} isCritical 
   */
  createDamageNumber(scene, x, y, amount, isCritical = false) {
    const color = isCritical ? '#ff0000' : '#ffffff';
    const size = isCritical ? '36px' : '22px';
    const text = scene.add.text(x, y - 20, `-${amount}`, { fontSize: size, fill: color, fontStyle: 'bold', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5);

    scene.tweens.add({
      targets: text,
      y: y - 80,
      alpha: 0,
      duration: 1000,
      ease: 'Cubic.easeOut',
      onComplete: () => text.destroy()
    });
  }
}

const fxManagerInstance = new FXManager();
export default fxManagerInstance;
