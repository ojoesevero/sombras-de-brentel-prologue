import Phaser from 'phaser';
import SaveManager from '../services/SaveManager.js';
import QuestManager from '../services/QuestManager.js';
import WorldManager from '../services/WorldManager.js';
import Logger from '../utils/Logger.js';
import AudioManager from '../audio/AudioManager.js';

/**
 * Cena de Recompensa (Reward Scene).
 * Executada após vitórias-chave. Aplica aquisições, atualiza o lore e força persistência de disco.
 */
export default class RewardScene extends Phaser.Scene {
  constructor() {
    super({ key: 'RewardScene' });
  }

  /**
   * @param {Object} data - Contexto propagado entre cenas (ex: objeto { player }).
   */
  init(data) {
    this.player = data.player;
    this.returnScene = data.returnScene || 'TavernScene';
    this.isOverlay = data.isOverlay || false;
    this.isFlashback = data.isFlashback || false;
    Logger.info('RewardScene', `Cena de Recompensa iniciada. Retorno agendado para: ${this.returnScene}`);
  }

  create() {
    AudioManager.init(this);
    if (window.currentBGMInstance) {
      window.currentBGMInstance.stop();
      window.currentBGMInstance.destroy();
      window.currentBGMInstance = null;
      window.currentBGMKey = null;
    }
    this.cameras.main.resetFX();
    this.cameras.main.fadeIn(400, 0, 0, 0);
    this.sound.play('sfx_item_coin', { volume: 0.5 });

    // Fundo escurecido e lore
    this.add.rectangle(0, 0, 800, 600, 0x050510).setOrigin(0);
    
    if (this.isFlashback) {
      this.add.text(400, 140, 'Caverna nas Ravinas ao Sudoeste', { fontSize: '24px', fill: '#ffd700', fontStyle: 'bold' }).setOrigin(0.5);
      this.add.text(400, 190, 'Escapando dos guardas, Rhogar e Ilídiz encontram refúgio seguro.', { fontSize: '15px', fill: '#ccc' }).setOrigin(0.5);
      this.add.text(400, 240, 'Entre os destroços antigos, uma lâmina colossal brilha na escuridão...', { fontSize: '16px', fill: '#d4af37', fontStyle: 'italic' }).setOrigin(0.5);
      
      this.swordText = this.add.text(400, 310, 'Recompensa: Espada Bastarda Serrilhada (+20 ATQ)\n+100 XP de Batalha', { fontSize: '20px', fill: '#2ecc71', fontStyle: 'bold', align: 'center' }).setOrigin(0.5);
    } else {
      this.add.text(400, 140, '★ Vitória Conquistada! ★', { fontSize: '28px', fill: '#ffd700', fontStyle: 'bold' }).setOrigin(0.5);
      const xpAmount = this.player?.xp || 50;
      this.swordText = this.add.text(400, 280, `Recompensa: Espólios e Experiência\nNível Atual: ${this.player?.level || 1}  •  HP: ${this.player?.hp || 120}/${this.player?.maxHp || 120}`, { fontSize: '18px', fill: '#2ecc71', fontStyle: 'bold', align: 'center' }).setOrigin(0.5);
    }
    
    // Pulse Effect na arma
    this.tweens.add({
      targets: this.swordText,
      scaleX: 1.05,
      scaleY: 1.05,
      yoyo: true,
      repeat: -1,
      duration: 1000
    });

    // Modificação de Entidade e Persistência
    if (this.player) {
      if (this.isFlashback) {
        this.player.equippedWeapon = 'Espada Bastarda Serrilhada';
        this.player.attack += 20;
        this.player.checkpoint = 'Caverna das Ravinas Sudoeste';
      } else {
        // Sustentabilidade: Recupera 25% da Vida Máxima após vitórias no mapa aberto
        const healAmount = Math.floor(this.player.maxHp * 0.25);
        this.player.hp = Math.min(this.player.hp + healAmount, this.player.maxHp);
      }
      
      // Auto-save
      SaveManager.saveGame(this.player);
    }

    // Botão de conclusão do Prólogo
    const btnContainer = this.add.container(400, 500);
    const btnRect = this.add.rectangle(0, 0, 250, 50, 0x222222).setInteractive();
    btnRect.setStrokeStyle(2, 0x555555);
    const btnText = this.add.text(0, 0, 'Continuar', { fontSize: '18px', fill: '#ffffff' }).setOrigin(0.5);
    btnContainer.add([btnRect, btnText]);

    // Foco Inicial Ativo
    btnRect.setStrokeStyle(4, 0xd4af37);
    btnRect.fillColor = 0x333333;

    this.isTransitioning = false;
    
    const proceed = () => {
      if (this.isTransitioning) return;
      this.isTransitioning = true;
      
      Logger.info('RewardScene', `Retornando para a cena: ${this.returnScene}`);
      
      if (this.isFlashback) {
        this.registry.set('hasCompletedFlashback', true);
        QuestManager.advanceQuest('quest_01_flashback', 'completed');
        QuestManager.advanceQuest('quest_02_temple', 'active');
        
        WorldManager.transitionTo(this, 'TavernScene', { 
          x: 700, 
          y: 480, 
          returnedFromFlashback: true, 
          battleOutcome: 'victory' 
        });
        return;
      }

      this.cameras.main.fadeOut(1000, 0, 0, 0);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        if (this.isOverlay) {
          this.scene.resume(this.returnScene);
          this.scene.stop();
        } else {
          this.scene.start(this.returnScene, { returnedFromFlashback: this.isFlashback, battleOutcome: 'victory' });
        }
      });
    };

    btnRect.on('pointerdown', proceed);
    
    // Suporte 100% a Teclado (Z, Espaço, Enter)
    this.input.keyboard.on('keydown-Z', proceed);
    this.input.keyboard.on('keydown-SPACE', proceed);
    this.input.keyboard.on('keydown-ENTER', proceed);
  }

  // Prevenir leaks de input se a cena for destruída
  shutdown() {
    this.input.keyboard.off('keydown-Z');
    this.input.keyboard.off('keydown-SPACE');
    this.input.keyboard.off('keydown-ENTER');
  }
}
