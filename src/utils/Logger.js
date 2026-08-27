/**
 * Utilitário de Registro de Logs (Singleton).
 * Provê funções estruturadas de log com timestamp, nível e contexto.
 * @module Logger
 */

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
    return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
  }

  /**
   * Registra uma mensagem informativa.
   * @param {string} context - O contexto ou módulo de onde o log se origina (ex: 'GameScene', 'Network').
   * @param {string} message - A mensagem principal do log.
   * @param {Object} [data] - Objeto opcional com dados adicionais a serem registrados.
   */
  info(context, message, data = null) {
    const prefix = `[${this._getTimestamp()}] [INFO] [${context}]`;
    if (data) {
      console.info(`${prefix} ${message}`, data);
    } else {
      console.info(`${prefix} ${message}`);
    }
  }

  /**
   * Registra um aviso (warning).
   * @param {string} context - O contexto ou módulo de onde o log se origina.
   * @param {string} message - A mensagem de aviso.
   * @param {Object} [data] - Objeto opcional com dados adicionais a serem registrados.
   */
  warn(context, message, data = null) {
    const prefix = `[${this._getTimestamp()}] [WARN] [${context}]`;
    if (data) {
      console.warn(`${prefix} ${message}`, data);
    } else {
      console.warn(`${prefix} ${message}`);
    }
  }

  /**
   * Registra um erro.
   * @param {string} context - O contexto ou módulo de onde o erro se origina.
   * @param {string} message - A mensagem de erro.
   * @param {Error|Object} [error] - O objeto de erro associado para stack trace.
   */
  error(context, message, error = null) {
    const prefix = `[${this._getTimestamp()}] [ERROR] [${context}]`;
    if (error) {
      console.error(`${prefix} ${message}`, error);
    } else {
      console.error(`${prefix} ${message}`);
    }
  }

  /**
   * Registra uma mensagem de depuração.
   * @param {string} context - O contexto ou módulo de onde o log se origina.
   * @param {string} message - A mensagem de depuração.
   * @param {Object} [data] - Objeto opcional com dados adicionais.
   */
  debug(context, message, data = null) {
    const prefix = `[${this._getTimestamp()}] [DEBUG] [${context}]`;
    if (data) {
      console.debug(`${prefix} ${message}`, data);
    } else {
      console.debug(`${prefix} ${message}`);
    }
  }
}

const loggerInstance = new Logger();
Object.freeze(loggerInstance);

export default loggerInstance;
