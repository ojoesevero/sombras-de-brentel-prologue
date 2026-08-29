import Logger from '../utils/Logger.js';
import InventoryManager from './InventoryManager.js';
import QuestManager from './QuestManager.js';

/**
 * Módulo de Persistência (Save Manager).
 * Salva e Carrega dados do jogo via Electron IPC com Fallback (LocalStorage / In-Memory).
 * Utiliza Base64 para inibir edições triviais de estado.
 * @module SaveManager
 */
class SaveManager {
  constructor() {
    if (SaveManager.instance) {
      return SaveManager.instance;
    }
    this.saveKey = 'sombras_brentel_save';
    this._memoryStore = null; // Fallback para ambientes de teste puros
    SaveManager.instance = this;
  }

  /**
   * Codifica um objeto JS para string Base64 com suporte total a UTF-8.
   * @private
   */
  _encode(data) {
    const str = JSON.stringify(data);
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(str, 'utf8').toString('base64');
    }
    return btoa(unescape(encodeURIComponent(str)));
  }

  /**
   * Decodifica uma string Base64 de volta para objeto JS.
   * @private
   */
  _decode(encoded) {
    if (typeof Buffer !== 'undefined') {
      const jsonStr = Buffer.from(encoded, 'base64').toString('utf8');
      return JSON.parse(jsonStr);
    }
    return JSON.parse(decodeURIComponent(escape(atob(encoded))));
  }

  /**
   * Constrói o pacote completo de dados persistíveis.
   * @param {Object} [playerData] - Instância de Player ou objeto com dados do jogador.
   * @returns {Object} Pacote unificado de estado do jogo.
   */
  buildSavePayload(playerData) {
    let playerState = null;
    if (playerData) {
      playerState = {
        name: playerData.name || 'Rhogar Tordan',
        hp: playerData.hp !== undefined ? playerData.hp : 120,
        maxHp: playerData.maxHp !== undefined ? playerData.maxHp : 120,
        attack: playerData.attack !== undefined ? playerData.attack : 18,
        defense: playerData.defense !== undefined ? playerData.defense : 8,
        fury: playerData.fury !== undefined ? playerData.fury : 0,
        maxFury: playerData.maxFury !== undefined ? playerData.maxFury : 100,
        equippedWeapon: playerData.equippedWeapon || 'Lâmina de Brentel',
        checkpoint: playerData.checkpoint || (playerData.scene?.scene?.key) || 'TavernScene',
        scene: playerData.currentScene || (playerData.scene?.scene?.key) || playerData.checkpoint || 'TavernScene',
        x: playerData.x !== undefined ? playerData.x : 400,
        y: playerData.y !== undefined ? playerData.y : 500
      };
    }

    return {
      player: playerState,
      inventory: InventoryManager.saveToStorage(),
      quests: QuestManager.quests,
      savedAt: new Date().toISOString()
    };
  }

  /**
   * Serializa e persiste o estado do jogo.
   * @param {Object} [playerData] - Os dados do jogador.
   * @returns {boolean} true se salvo com sucesso.
   */
  saveGame(playerData = null) {
    try {
      const payload = this.buildSavePayload(playerData);
      const encodedData = this._encode(payload);

      // 1. Electron IPC seguro via preload
      if (typeof window !== 'undefined' && window.electronAPI && typeof window.electronAPI.saveGame === 'function') {
        const res = window.electronAPI.saveGame(encodedData);
        if (res && res.success !== false) {
          Logger.info('SaveManager', 'Progresso salvo com sucesso via Electron IPC (savegame.dat).');
          return true;
        }
      }

      // 2. Fallback para LocalStorage (Navegador)
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.saveKey, encodedData);
        Logger.info('SaveManager', 'Progresso salvo com sucesso via LocalStorage.');
        return true;
      }

      // 3. Fallback em memória (Testes / Node puro)
      this._memoryStore = encodedData;
      Logger.info('SaveManager', 'Progresso salvo em memória.');
      return true;
    } catch (error) {
      Logger.error('SaveManager', 'Falha ao realizar salvamento de jogo.', error);
      return false;
    }
  }

  /**
   * Recupera e desserializa o progresso armazenado.
   * @returns {Object|null} Estado completo do jogo ou null se inexistente.
   */
  loadGame() {
    try {
      let encodedData = null;

      // 1. Electron IPC seguro
      if (typeof window !== 'undefined' && window.electronAPI && typeof window.electronAPI.loadGame === 'function') {
        const res = window.electronAPI.loadGame();
        if (res && res.data) {
          encodedData = res.data;
          Logger.info('SaveManager', 'Progresso lido do FileSystem (Electron IPC).');
        }
      }

      // 2. Fallback LocalStorage
      if (!encodedData && typeof localStorage !== 'undefined') {
        encodedData = localStorage.getItem(this.saveKey);
        if (encodedData) {
          Logger.info('SaveManager', 'Progresso lido do LocalStorage.');
        }
      }

      // 3. Fallback em memória
      if (!encodedData && this._memoryStore) {
        encodedData = this._memoryStore;
      }

      if (encodedData) {
        const decoded = this._decode(encodedData);
        return decoded;
      }
      return null;
    } catch (error) {
      Logger.error('SaveManager', 'Falha ao carregar progresso de jogo.', error);
      return null;
    }
  }

  /**
   * Verifica rapidamente se já existe algum save legível.
   * @returns {boolean}
   */
  hasSave() {
    if (typeof window !== 'undefined' && window.electronAPI && typeof window.electronAPI.hasSave === 'function') {
      const exists = window.electronAPI.hasSave();
      if (exists) return true;
    }

    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(this.saveKey) !== null;
    }

    return this._memoryStore !== null;
  }

  /**
   * Limpa os registros de salvamento (usado em permadeath ou reset de testes).
   */
  clearSave() {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.saveKey);
    }
    this._memoryStore = null;
  }
}

const saveManagerInstance = new SaveManager();
export default saveManagerInstance;

