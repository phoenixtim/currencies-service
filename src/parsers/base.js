/** @typedef {import('../repositories/exchangeRates').ExchangeRateValues} ExchangeRateValues */

const { ExchangeRatesRepository } = require('../repositories/exchangeRates')
const { log, LOG_LEVELS } = require('../utils/logging')

class BaseParser {
  constructor() {
    this.PRICE_TYPES = {
      buy: 'buy',
      sell: 'sell',
    }
  }

  /** @virtual */
  // eslint-disable-next-line class-methods-use-this
  async parse() {
    log(LOG_LEVELS.warn, 'parse method is not implemented')
  }

  /**
   * @protected
   * @param {ExchangeRateValues[]} exchangeRates
   */
  // eslint-disable-next-line class-methods-use-this
  async saveData(exchangeRates) {
    // TODO: лучше реализовать запись через bulkWrite, если будет время
    await Promise.all(exchangeRates.map(
      exchangeRate => ExchangeRatesRepository.upsert(exchangeRate),
    ))
  }
}
module.exports.BaseParser = BaseParser
