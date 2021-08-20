const Joi = require('joi')
const validator = require('koa-joi-validate-middleware')

const { API: { LIMIT }, BANKS } = require('../constants')
const { BanksRepository } = require('../repositories/banks')
const { ExchangeRatesRepository } = require('../repositories/exchangeRates')
const { BadRequestError } = require('../utils/errors')
const { errorCallback } = require('../utils/validation')

module.exports.exchangeRatesValidateMiddleware = validator.create({
  query: Joi.object({
    bank_id: Joi.string().regex(/^\w+$/),
    limit: Joi.number().max(LIMIT.MAX).default(LIMIT.DEFAULT),
    offset: Joi.number(),
  }),
}, errorCallback)

/**
 * @param {import('koa').Context} ctx
 */
module.exports.exchangeRates = async ctx => {
  const { bank_id: bankId, limit, offset } = ctx.query
  // @ts-ignore
  const bank = await BanksRepository.findOne({ id: bankId })
  if (!bank) throw new BadRequestError({ message: `Bank not found by id ${bankId}` })

  const exchangeRates = await ExchangeRatesRepository.find({
    filter: { bank: bank.id },
    // @ts-ignore
    limit: limit ? parseInt(limit, 10) : LIMIT.DEFAULT,
    // @ts-ignore
    offset: offset && parseInt(offset, 10),
  })
  const exchangeRatesTotal = await ExchangeRatesRepository.count({ bank: bank.id })

  ctx.body = {
    payload: {
      total: exchangeRatesTotal,
      items: exchangeRates,
    },
  }
}

module.exports.convertValidateMiddleware = validator.create({
  body: Joi.object({
    bank_id: Joi.string().regex(/^\w+$/),
    amount: Joi.number(),
    currency_from: Joi.string().regex(/^\w+$/).length(3).required(),
    currency_to: Joi.string().regex(/^\w+$/).length(3).required(),
  }),
}, errorCallback)

/**
 * @param {import('koa').Context} ctx
 */
module.exports.convert = async ctx => {
  const {
    bank_id: bankId = BANKS.TH.id,
    amount: amountRaw = 1,
    currency_from: currencyFrom,
    currency_to: currencyTo,
  } = ctx.request.body
  // @ts-ignore
  const bank = await BanksRepository.findOne({ id: bankId })
  if (!bank) throw new BadRequestError({ message: `Bank not found by id ${bankId}` })

  const exchangeRate = await ExchangeRatesRepository.findOne({
    bank: bank.id,
    // @ts-ignore
    currencyBase: [currencyFrom, currencyTo],
    // @ts-ignore
    currencyTarget: [currencyFrom, currencyTo],
  })
  if (!exchangeRate) {
    throw new BadRequestError({
      message: `Currencies pair ${currencyFrom}/${currencyTo} not found for bank id ${bankId}`,
    })
  }

  // @ts-ignore
  const amount = parseInt(amountRaw, 10)
  let resultAmount
  if (currencyFrom === exchangeRate.currencyBase) {
    resultAmount = amount / exchangeRate.price.sell
  } else {
    resultAmount = amount * exchangeRate.price.buy
  }

  ctx.body = {
    payload: {
      amount: resultAmount,
    },
  }
}
