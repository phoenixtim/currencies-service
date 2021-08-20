const { log, LOG_LEVELS } = require('./logging')

/**
 * @param {import("koa").Context} ctx
 * @param {Error} err
 */
module.exports.errorCallback = (ctx, err) => {
  log(LOG_LEVELS.info, err)

  ctx.status = 400
  ctx.body = {
    message: err.message,
  }
}
