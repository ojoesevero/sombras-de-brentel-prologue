/**
 * Utilitário de Registro de Logs (Singleton).
 * Provê funções estruturadas de log com timestamp, nível e contexto.
 * @module Logger
 */

const ENABLE_FILE_LOGGING = true;

class Logger {
  constructor() {
    if (Logger.instance) {
      return Logger.instance;
    }
    Logger.instance = this;
  }

  /**
   * Retorna a data e hora atual formatada [YYYY-MM-DD HH:mm:ss]
   * @private
   * @returns {string} Timestamp formatado
   */
  _getTimestamp() {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    const mmm = String(now.getMilliseconds()).padStart(3, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}.${mmm}`;
  }

  /**
   * Escreve no arquivo de log via IPC se habilitado e rodando no Electron
   * @private
   */
  _writeToFile(logEntry) {
    if (ENABLE_FILE_LOGGING && typeof window !== 'undefined' && window.electronAPI && window.electronAPI.writeLog) {
      window.electronAPI.writeLog(logEntry + '\n');
    }
  }

  /**
   * Registra uma mensagem informativa.
   */
  info(context, message, data = null) {
    const prefix = `[${this._getTimestamp()}] [INFO] [${context}]`;
    const fullMsg = data ? `${prefix} ${message} ${JSON.stringify(data)}` : `${prefix} ${message}`;
    console.info(prefix, message, data || '');
    this._writeToFile(fullMsg);
  }

  /**
   * Registra um aviso (warning).
   */
  warn(context, message, data = null) {
    const prefix = `[${this._getTimestamp()}] [WARN] [${context}]`;
    const fullMsg = data ? `${prefix} ${message} ${JSON.stringify(data)}` : `${prefix} ${message}`;
    console.warn(prefix, message, data || '');
    this._writeToFile(fullMsg);
  }

  /**
   * Registra um erro.
   */
  error(context, message, error = null) {
    const prefix = `[${this._getTimestamp()}] [ERROR] [${context}]`;
    const errStr = error instanceof Error ? error.stack : JSON.stringify(error);
    const fullMsg = error ? `${prefix} ${message} ${errStr}` : `${prefix} ${message}`;
    console.error(prefix, message, error || '');
    this._writeToFile(fullMsg);
  }

  /**
   * Registra uma mensagem de depuração.
   */
  debug(context, message, data = null) {
    const prefix = `[${this._getTimestamp()}] [DEBUG] [${context}]`;
    const fullMsg = data ? `${prefix} ${message} ${JSON.stringify(data)}` : `${prefix} ${message}`;
    console.debug(prefix, message, data || '');
    this._writeToFile(fullMsg);
  }

  /**
   * Loga ações de input do teclado/gamepad.
   */
  input(key, action, sceneName) {
    const prefix = `[${this._getTimestamp()}] [INPUT] [${sceneName}]`;
    const msg = `${prefix} Key: ${key} -> Action: ${action}`;
    console.info(msg);
    this._writeToFile(msg);
  }

  /**
   * Loga eventos de diálogo.
   */
  dialogue(event, speaker, data = null) {
    const prefix = `[${this._getTimestamp()}] [DIALOGUE] [${event}]`;
    const fullMsg = data ? `${prefix} Speaker: ${speaker} | ${JSON.stringify(data)}` : `${prefix} Speaker: ${speaker}`;
    console.info(prefix, `Speaker: ${speaker}`, data || '');
    this._writeToFile(fullMsg);
  }

  /**
   * Loga transições de cena.
   */
  transition(fromScene, toScene, payload = null) {
    const prefix = `[${this._getTimestamp()}] [TRANSITION]`;
    const fullMsg = payload ? `${prefix} ${fromScene} -> ${toScene} | ${JSON.stringify(payload)}` : `${prefix} ${fromScene} -> ${toScene}`;
    console.info(prefix, `${fromScene} -> ${toScene}`, payload || '');
    this._writeToFile(fullMsg);
  }

  /**
   * Loga atualizações de quest.
   */
  quest(questId, status) {
    const prefix = `[${this._getTimestamp()}] [QUEST]`;
    const msg = `${prefix} ${questId} -> ${status}`;
    console.info(msg);
    this._writeToFile(msg);
  }
}

const loggerInstance = new Logger();
Object.freeze(loggerInstance);

if (typeof window !== 'undefined' && window.electronAPI?.writeLog) {
  window.electronAPI.writeLog('[INIT] Logger inicializado e conectado ao Electron.');
}

if (typeof window !== 'undefined') {
  window.onerror = (message, source, lineno, colno, error) => {
    loggerInstance.error('UnhandledException', `${message} at ${source}:${lineno}:${colno}`, error?.stack);
  };
  window.addEventListener('unhandledrejection', (event) => {
    loggerInstance.error('UnhandledRejection', event.reason?.message || event.reason, event.reason?.stack);
  });
}

export default loggerInstance;
