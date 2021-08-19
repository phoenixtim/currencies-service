/** @typedef {import('../repositories/exchangeRates').ExchangeRateValues} ExchangeRateValues */

const { default: axios } = require('axios')
const { xml2js } = require('xml-js')

const { BANKS } = require('../constants')
const { log, LOG_LEVELS } = require('../utils/logging')
const { BaseParser } = require('./base')

class BankOfThailandParser extends BaseParser {
  constructor() {
    super()

    /**
     * @protected
     * @constant
     */
    this.bank = BANKS.TH
    /** @protected */
    this.logAdditionalData = {
      level: LOG_LEVELS.error,
      module: 'parsers',
      parser: 'BankOfThailandParser',
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
    const exchangeRateByCurrencies = {}

    const data = xml2js(rawData, { compact: false })
    data.elements[0].elements.forEach(({ type, name, attributes, elements }) => {
      if (type !== 'element' || name !== 'item') return

      const {
        priceType, baseCurrency, targetCurrency, price,
      } = (this.parseExchangeRateItem({ type, name, attributes, elements }) || {})
      if (!priceType || !baseCurrency || !targetCurrency || !price) return

      if (!exchangeRateByCurrencies[baseCurrency]) exchangeRateByCurrencies[baseCurrency] = {}
      exchangeRateByCurrencies[baseCurrency][targetCurrency] = {
        ...exchangeRateByCurrencies[baseCurrency][targetCurrency],
        [priceType]: price,
      }
    })

    /** @type {ExchangeRateValues[]} */
    const exchangeRates = []
    Object.entries(exchangeRateByCurrencies).forEach(([baseCurrency, targetCurrencyRates]) => {
      Object.entries(targetCurrencyRates).forEach(([targetCurrency, price]) => {
        exchangeRates.push({
          bank: this.bank.id,
          currencyBase: baseCurrency,
          currencyTarget: targetCurrency,
          price,
        })
      })
    })

    return exchangeRates
  }

  /**
   * @protected
   * @param {import('xml-js').Element} item
   */
  parseExchangeRateItem({ type, name, attributes, elements }) {
    const titleElement = elements.find(({ name: elemName }) => elemName === 'title')
    const baseCurrencyElement = elements.find(
      ({ name: elemName }) => elemName === 'cb:baseCurrency',
    )
    const targetCurrencyElement = elements.find(
      ({ name: elemName }) => elemName === 'cb:targetCurrency',
    )
    const priceElement = elements.find(({ name: elemName }) => elemName === 'cb:value')
    if (!titleElement || !baseCurrencyElement || !targetCurrencyElement || !priceElement) {
      log({
        ...this.logAdditionalData,
        message: 'Item element not match conditions',
        element: { type, name, attributes, elements },
      })
      return
    }

    /** @type {string} */
    // @ts-ignore
    const baseCurrency = baseCurrencyElement.elements
      .find(({ type: elemType }) => elemType === 'text')?.text
    /** @type {string} */
    // @ts-ignore
    const targetCurrency = targetCurrencyElement.elements
      .find(({ type: elemType }) => elemType === 'text')?.text
    const priceRaw = priceElement.elements.find(({ type: elemType }) => elemType === 'text')?.text
    // @ts-ignore
    const price = parseFloat(priceRaw)
    const title = titleElement.elements.find(({ type: elemType }) => elemType === 'text')?.text
    let priceType
    // @ts-ignore
    if (title.includes('Buying')) priceType = this.PRICE_TYPES.buy
    // @ts-ignore
    else if (title.includes('Selling')) priceType = this.PRICE_TYPES.sell
    else return

    if (!priceType || !baseCurrency || !targetCurrency || Number.isNaN(price)) {
      log({
        ...this.logAdditionalData,
        message: 'Failed to get required data from item element',
        element: { type, name, attributes, elements },
        data: { priceType, baseCurrency, targetCurrency, price },
      })
      return
    }

    // eslint-disable-next-line consistent-return
    return { priceType, baseCurrency, targetCurrency, price }
  }
}
module.exports.parser = new BankOfThailandParser()
