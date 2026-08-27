import Logger from '../utils/Logger.js';

/**
 * Módulo de Persistência (Save Manager).
 * Salva e Carrega dados do jogador via FileSystem (Electron/Node) com Fallback (LocalStorage).
 * Utiliza Base64 para inibir edições triviais de estado.
 * @module SaveManager
 */
class SaveManager {
  constructor() {
    this.saveKey = 'sombras_brentel_save';
    // Determina se o ambiente possui 'process' (indicativo primário de Electron/Node)
    this.isElectron = typeof process !== 'undefined' && process.versions && process.versions.electron;
  }

  /**
   * Serializa e persiste o estado do jogador.
   * @param {Object} playerData - Os dados vitais e de progresso (HP, fúria, itens, checkpoint).
   */
  saveGame(playerData) {
    try {
      const dataString = JSON.stringify(playerData);
      const encodedData = btoa(unescape(encodeURIComponent(dataString))); // Suporte a UTF-8 (Acentos)

      if (this.isElectron && window.require) {
        const fs = window.require('fs');
        const path = window.require('path');
        const savePath = path.join(process.cwd(), 'savegame.dat');
        
        fs.writeFileSync(savePath, encodedData, 'utf-8');
        Logger.info('SaveManager', `Progresso salvo com sucesso via FileSystem: ${savePath}`);
        return;
      }
      
      // Fallback para ambiente Web / Web-view pura
      localStorage.setItem(this.saveKey, encodedData);
      Logger.info('SaveManager', 'Progresso salvo com sucesso via LocalStorage (Fallback).');
    } catch (error) {
      Logger.error('SaveManager', 'Falha ao realizar salvamento de jogo.', error);
    }
  }

  /**
   * Tenta recuperar e desserializar o progresso armazenado.
   * @returns {Object|null} Estado carregado do jogador ou null se não houver registros.
   */
  loadGame() {
    try {
      let encodedData = null;

      if (this.isElectron && window.require) {
        const fs = window.require('fs');
        const path = window.require('path');
        const savePath = path.join(process.cwd(), 'savegame.dat');

        if (fs.existsSync(savePath)) {
          encodedData = fs.readFileSync(savePath, 'utf-8');
          Logger.info('SaveManager', 'Progresso lido do FileSystem (Electron).');
        }
      }

      if (!encodedData) {
        encodedData = localStorage.getItem(this.saveKey);
        if (encodedData) Logger.info('SaveManager', 'Progresso lido do LocalStorage.');
      }

      if (encodedData) {
        return JSON.parse(decodeURIComponent(escape(atob(encodedData))));
      }
      return null;
    } catch (error) {
      Logger.error('SaveManager', 'Falha ao carregar progresso de jogo.', error);
      return null;
    }
  }

  /**
   * Verifica rapidamente se já existe algum *save* legível.
   * @returns {boolean}
   */
  hasSave() {
    return this.loadGame() !== null;
  }
}

const saveManagerInstance = new SaveManager();
Object.freeze(saveManagerInstance);
export default saveManagerInstance;
