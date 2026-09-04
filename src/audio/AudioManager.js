import Logger from '../utils/Logger.js';

/**
 * Singleton de gerenciamento de áudio.
 * Orquestra BGM (Background Music) e SFX (Sound Effects) com suporte a fades.
 * @module AudioManager
 */
class AudioManager {
  constructor() {
    if (AudioManager.instance) {
      return AudioManager.instance;
    }
    this.currentBGM = null;
    this.currentBGMKey = null;
    this.bgmVolume = 1.0;
    this.sfxVolume = 1.0;
    this.scene = null;
    AudioManager.instance = this;
  }

  /**
   * Registra a cena ativa para orquestração sonora.
   * @param {Phaser.Scene} scene - Cena do Phaser ativa.
   */
  init(scene) {
    this.scene = scene;
    Logger.info('AudioManager', 'Instância associada à cena atual.');

    if (!window.playBGM) {
      window.playBGM = (sceneContext, key, volume = 0.35) => {
        if (!sceneContext || !sceneContext.sound) {
          Logger.warn('AudioManager', 'Cena inválida para playBGM.');
          return;
        }

        if (window.currentBGMKey === key && window.currentBGMInstance?.isPlaying) {
          return;
        }

        if (window.currentBGMInstance) {
          window.currentBGMInstance.stop();
          window.currentBGMInstance.destroy();
          window.currentBGMInstance = null;
        }

        try {
          window.currentBGMInstance = sceneContext.sound.add(key, { loop: true, volume: volume });
          window.currentBGMKey = key;
          window.currentBGMInstance.play();
          Logger.info('AudioManager', `BGM global ${key} iniciada com volume ${volume}.`);
        } catch (e) {
          Logger.error('AudioManager', `Falha ao tocar BGM global ${key}: ${e.message}`);
        }
      };
    }
  }

  /**
   * Toca música de fundo em loop com suporte a fade-in (e crossfade caso outra já esteja tocando).
   * @param {string} key - Chave do áudio.
   * @param {Object} [config] - Configuração extra, como fadeDuration.
   */
  playBGM(key, config = { fadeDuration: 1000 }) {
    if (!this.scene) {
      Logger.warn('AudioManager', 'Tentativa de tocar BGM sem cena registrada.');
      return;
    }

    if (this.currentBGMKey === key) {
      return; // Já está tocando
    }

    if (this.currentBGM) {
      this.currentBGM.stop();
    }

    try {
      this.currentBGM = this.scene.sound.add(key, { loop: true, volume: 0 });
      this.currentBGMKey = key;
      window.currentBGMKey = key;
      this.currentBGM.play();
      this.scene.tweens.add({
        targets: this.currentBGM,
        volume: this.bgmVolume * 0.3,
        duration: config.fadeDuration || 1000
      });
      Logger.info('AudioManager', `BGM ${key} iniciada.`);
    } catch (e) {
      Logger.warn('AudioManager', `Não foi possível tocar a BGM ${key} (arquivo pode não estar carregado).`, e);
    }
  }

  /**
   * Interrompe a trilha sonora atual com fade-out suave.
   * @param {number} fadeDuration - Tempo do fade em ms.
   */
  stopBGM(fadeDuration = 1000) {
    if (this.currentBGM && this.scene) {
      this.scene.tweens.add({
        targets: this.currentBGM,
        volume: 0,
        duration: fadeDuration,
        onComplete: () => {
          this.currentBGM.stop();
          this.currentBGM.destroy();
          this.currentBGM = null;
          this.currentBGMKey = null;
          window.currentBGMKey = null;
          Logger.info('AudioManager', 'BGM parada com fade-out.');
        }
      });
    }
  }

  /**
   * Executa um efeito sonoro pontual.
   * @param {string} key - Chave do SFX.
   * @param {Object} [config] - Configuração do áudio.
   */
  playSFX(key, config = {}) {
    if (!this.scene) return;
    try {
      this.scene.sound.play(key, { ...config, volume: this.sfxVolume });
      Logger.debug('AudioManager', `SFX ${key} executado.`);
    } catch (e) {
      Logger.warn('AudioManager', `Não foi possível tocar o SFX ${key}.`);
    }
  }

  /**
   * Define o volume global para a BGM.
   * @param {number} volume - Volume (0.0 a 1.0).
   */
  setBGMVolume(volume) {
    this.bgmVolume = volume;
    if (this.currentBGM) {
      this.currentBGM.setVolume(volume);
    }
  }

  /**
   * Define o volume global para os efeitos.
   * @param {number} volume - Volume (0.0 a 1.0).
   */
  setSFXVolume(volume) {
    this.sfxVolume = volume;
  }
}

const audioManagerInstance = new AudioManager();
export default audioManagerInstance;
