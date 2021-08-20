const { log, LOG_LEVELS } = require('./utils/logging')
const { CurrencyServiceError } = require('./utils/errors')

/**
 * @param {import("koa").Context} ctx
 * @param {Function} next
 */
module.exports.errorsMiddleware = async (ctx, next) => {
  try {
    await next()
  } catch (err) {
    const httpCode = err instanceof CurrencyServiceError ? err.httpCode : 500
    const level = httpCode >= 500 ? LOG_LEVELS.error : LOG_LEVELS.info
    log(level, err)

    ctx.status = httpCode
    ctx.body = {
      message: err.message,
    }
  }
}
