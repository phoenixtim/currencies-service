/** @typedef {import('../repositories/exchangeRates').ExchangeRateValues} ExchangeRateValues */

const { default: axios } = require('axios')
const { xml2js } = require('xml-js')

const { BANKS } = require('../constants')
const { log, LOG_LEVELS } = require('../utils/logging')
const { BaseParser } = require('./base')

class CentralBankRfParser extends BaseParser {
  constructor() {
    super()

    /**
     * @protected
     * @constant
     */
    this.bank = BANKS.RU
    /** @protected */
    this.logAdditionalData = {
      level: LOG_LEVELS.error,
      module: 'parsers',
      parser: 'CentralBankRfParser',
    }
  }

  async parse() {
    const rawData = await this.getRawData()
    const exchangeRates = this.parseExchangeRates(rawData)
    await this.saveData(exchangeRates)
  }

  /**
   * @protected
   * @returns {Promise<string>}
   */
  async getRawData() {
    let response
    try {
      response = await axios.get(this.bank.exchangeRatesUrl)
    } catch (err) {
      /** @type {object} */
      const logData = {
        ...this.logAdditionalData,
        message: 'Failed to get data from bank',
      }
      if (err.response) {
        logData.response = {
          data: err.response.data,
          status: err.response.status,
          headers: err.response.headers,
        }
      } else {
        logData.error = err
      }
      log(logData)
    }

    return response.data
  }

  /**
   * @protected
   * @param {string} rawData
   */
  parseExchangeRates(rawData) {
    const baseCurrency = 'RUB'
    const exchangeRateByCurrencies = { [baseCurrency]: {} }

    const data = xml2js(rawData, { compact: false })
    data.elements[0].elements.forEach(({ type, name, attributes, elements }) => {
      if (type !== 'element' || name !== 'Valute') return

      const {
        targetCurrency, price,
      } = (this.parseExchangeRateItem({ type, name, attributes, elements }) || {})
      if (!targetCurrency || !price) return

      exchangeRateByCurrencies[baseCurrency][targetCurrency] = {
        [this.PRICE_TYPES.buy]: price,
        [this.PRICE_TYPES.sell]: price,
      }
    })

    /** @type {ExchangeRateValues[]} */
    const exchangeRates = []
    Object.entries(exchangeRateByCurrencies).forEach(
      ([currentBaseCurrency, targetCurrencyRates]) => {
        Object.entries(targetCurrencyRates).forEach(([targetCurrency, price]) => {
          exchangeRates.push({
            bank: this.bank.id,
            currencyBase: currentBaseCurrency,
            currencyTarget: targetCurrency,
            price,
          })
        })
      },
    )

    return exchangeRates
  }

  /**
   * @protected
   * @param {import('xml-js').Element} item
   */
  parseExchangeRateItem({ type, name, attributes, elements }) {
    const nominalElement = elements.find(({ name: elemName }) => elemName === 'Nominal')
    const targetCurrencyElement = elements.find(({ name: elemName }) => elemName === 'CharCode')
    const priceElement = elements.find(({ name: elemName }) => elemName === 'Value')
    if (!nominalElement || !targetCurrencyElement || !priceElement) {
      log({
        ...this.logAdditionalData,
        message: 'Item element not match conditions',
        element: { type, name, attributes, elements },
      })
      return
    }

    /** @type {string} */
    // @ts-ignore
    const targetCurrency = targetCurrencyElement.elements
      .find(({ type: elemType }) => elemType === 'text')?.text
    const priceRaw = priceElement.elements.find(({ type: elemType }) => elemType === 'text')?.text
    // @ts-ignore
    const price = parseFloat(priceRaw.replace(',', '.'))
    const nominalRaw = nominalElement.elements.find(
      ({ type: elemType }) => elemType === 'text',
    )?.text
    // @ts-ignore
    const nominal = parseFloat(nominalRaw.replace(',', '.'))

    if (!targetCurrency || Number.isNaN(price) || Number.isNaN(nominal)) {
      log({
        ...this.logAdditionalData,
        message: 'Failed to get required data from item element',
        element: { type, name, attributes, elements },
        data: { targetCurrency, price, nominal },
      })
      return
    }

    // eslint-disable-next-line consistent-return
    return {
      targetCurrency,
      price: price / nominal,
    }
  }
}
module.exports.parser = new CentralBankRfParser()
