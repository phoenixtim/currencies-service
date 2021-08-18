const path = require('path')
const winston = require('winston')

const { DEBUG, LOGS_FOLDER_PATH } = require('./config')

/**
 * @typedef {(
 *  'error' | 'warn' | 'info' | 'http' | 'verbose' | 'debug' | 'silly'
 * )} LogLevel
 */

const LOG_LEVELS = {
  /** @type {LogLevel} */
  error: 'error',
  /** @type {LogLevel} */
  warn: 'warn',
  /** @type {LogLevel} */
  info: 'info',
  /** @type {LogLevel} */
  http: 'http',
  /** @type {LogLevel} */
  verbose: 'verbose',
  /** @type {LogLevel} */
  debug: 'debug',
  /** @type {LogLevel} */
  silly: 'silly',
}
module.exports.LOG_LEVELS = LOG_LEVELS

const formatError = winston.format(info => {
  let formattedMessage = info.message
  if (info instanceof Error) {
    formattedMessage = info.stack
  } else if (info.message instanceof Error) {
    formattedMessage = info.message.stack
  }

  return {
    ...info,
    message: formattedMessage,
  }
})

const logger = winston.createLogger({
  level: DEBUG ? LOG_LEVELS.debug : LOG_LEVELS.info,
  format: winston.format.combine(
    formatError(),
    winston.format.timestamp(),
    winston.format.json(),
  ),
  defaultMeta: {},
  transports: [
    // Можно настроить отдельный транспорт с отдельным форматом для ошибок.
    // Или для отправки в logstash/elasticsearch/куда-то ещё.
    new winston.transports.File({
      filename: path.join(LOGS_FOLDER_PATH, 'error.log'),
      level: LOG_LEVELS.error,
    }),
    new winston.transports.File({
      filename: path.join(LOGS_FOLDER_PATH, 'combined.log'),
    }),
  ],
})

if (DEBUG) {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.align(),
      winston.format.printf(
        ({ timestamp, level, message }) => `${timestamp} ${level}: ${message}`,
      ),
    ),
  }))
}

module.exports.logger = logger
module.exports.log = logger.log.bind(logger)
