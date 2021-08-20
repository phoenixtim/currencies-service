/** @typedef {import('../repositories/exchangeRates').ExchangeRateValues} ExchangeRateValues */

const { ExchangeRatesRepository } = require('../repositories/exchangeRates')
const { log, LOG_LEVELS } = require('../utils/logging')

class BaseParser {
  constructor() {
    this.PRICE_TYPES = {
      buy: 'buy',
      sell: 'sell',
    }
    /** @protected */
    this.bank = {}
    /** @protected */
    this.logAdditionalData = {
      level: LOG_LEVELS.error,
      module: 'parsers',
      parser: 'BaseParser',
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

    log({
      ...this.logAdditionalData,
      level: LOG_LEVELS.info,
      message: `Exchange rates from bank ${this.bank?.id} (${this.bank?.name}) saved`,
    })
  }
}
module.exports.BaseParser = BaseParser
