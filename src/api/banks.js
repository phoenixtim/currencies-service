const Joi = require('joi')
const validator = require('koa-joi-validate-middleware')

const { BanksRepository } = require('../repositories/banks')
const { errorCallback } = require('../utils/validation')

module.exports.listValidateMiddleware = validator.create({
  query: Joi.object({
    country: Joi.string().length(2).uppercase(),
  }),
}, errorCallback)

/**
 * @param {import('koa').Context} ctx
 */
module.exports.list = async ctx => {
  const { country } = ctx.query
  // @ts-ignore
  const banks = await BanksRepository.find({ filter: { countryCode: country } })

  ctx.body = {
    payload: {
      items: banks,
    },
  }
}
