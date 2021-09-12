/** @typedef {import('mongoose').Document} DocumentType */
/** @typedef {import('mongoose').Types.ObjectId} ObjectIdType */

/** @typedef {import('./base').MongoRepositoryItem} MongoRepositoryItem */
/** @typedef {import('./base').MongoRepositoryItemValues} MongoRepositoryItemValues */

const mongoose = require('mongoose')

const { EXCHANGE_RATES } = require('../utils/config')
const { MongoRepository } = require('./base')

const { Schema } = mongoose

/**
 * @typedef {{
 *  bank?: string,
 *  currencyBase?: string,
 *  currencyTarget?: string,
 *  price?: {
 *    buy?: number,
 *    sell?: number,
 *  },
 * }} ExchangeRateSpecificValues
 */
/** @typedef {(MongoRepositoryItemValues & ExchangeRateSpecificValues)} ExchangeRateValues */
/**
 * @typedef {{
 *  bank?: string,
 *  currencyBase?: string | string[],
 *  currencyTarget?: string | string[],
 *  price?: {
 *    buy?: number,
 *    sell?: number,
 *  },
 * }} ExchangeRateSpecificFilter
 */
/** @typedef {(MongoRepositoryItemValues & ExchangeRateSpecificFilter)} ExchangeRateFilter */
/** @typedef {(DocumentType & ExchangeRateSpecificValues)} ExchangeRateDocument */
/** @typedef {(MongoRepositoryItem & ExchangeRateSpecificValues)} ExchangeRateType */

const exchangeRateSchema = new Schema({
  bank: {
    type: String,
    index: true,
    required: true,
  },
  currencyBase: {
    type: String,
    index: true,
    required: true,
  },
  currencyTarget: {
    type: String,
    index: true,
    required: true,
  },
  price: {
    buy: Number,
    sell: Number,
  },
}, {
  timestamps: true,
})

// Время жизни, на случай, если новые данные не придут. Чтобы не выдавать (и не конвертировать)
//  неактуальные данные по валютам.
// Можно было сделать его выставлением флага в модели, вместо удаления, но, для простоты -
//  сделал так.
const ttlIndexName = 'updatedAt_ttl_1'
const ttlInSeconds = EXCHANGE_RATES.TTL * 60 * 60
if (EXCHANGE_RATES.TTL) {
  exchangeRateSchema.index({ updatedAt: 1 }, {
    name: ttlIndexName,
    expires: ttlInSeconds,
  })
}

const ExchangeRate = mongoose.model('ExchangeRate', exchangeRateSchema)

ExchangeRate.listIndexes(async (_, createdIndexes) => {
  const ttlIndex = createdIndexes ?
    createdIndexes.find(({ name }) => name === ttlIndexName) :
    undefined
  if (ttlIndex && ttlIndex.expireAfterSeconds !== ttlInSeconds) {
    await ExchangeRate.collection.dropIndex(ttlIndexName)
    await ExchangeRate.syncIndexes()
  }
})

class ExchangeRatesRepository extends MongoRepository {
  /**
   * @param {ExchangeRateValues} values
   * @returns {Promise<ExchangeRateType>}
   */
  static async upsert({ bank, currencyBase, currencyTarget, price }) {
    const exchangeRate = await ExchangeRate.findOneAndUpdate({
      bank,
      currencyBase,
      currencyTarget,
    }, {
      price,
    }, { upsert: true, new: true, lean: true })

    return ExchangeRatesRepository.format(exchangeRate)
  }

  /**
   * @param {ExchangeRateFilter} filter
   * @returns {Promise<ExchangeRateType>}
   */
  static async findOne(filter) {
    const exchangeRate = await ExchangeRate.findOne(ExchangeRatesRepository.formatFilter(filter))

    return ExchangeRatesRepository.format(exchangeRate)
  }

  /**
   * @param {object} params
   * @param {ExchangeRateFilter=} params.filter
   * @param {number=} params.limit
   * @param {number=} params.offset
   * @returns {Promise<ExchangeRateType[]>}
   */
  static async find({ filter, limit, offset } = {}) {
    const exchangeRates = await ExchangeRate.find(
      ExchangeRatesRepository.formatFilter(filter),
      undefined,
      {
        limit,
        skip: offset,
        sort: { bank: 1, currencyBase: 1, currencyTarget: 1 },
      },
    )

    return exchangeRates.map(ExchangeRatesRepository.format)
  }

  /**
   * @param {ExchangeRateFilter} filter
   * @returns {Promise<number>}
   */
  static async count(filter = {}) {
    const exchangeRatesNumber = await ExchangeRate.countDocuments(
      ExchangeRatesRepository.formatFilter(filter),
    )

    return exchangeRatesNumber
  }

  /**
   * @protected
   * @param {ExchangeRateDocument} item
   * @returns {ExchangeRateType}
   */
  static format(item) {
    return super.format(item)
  }

  /**
   * @protected
   * @param {ExchangeRateFilter} filter
   */
  static formatFilter({ bank, currencyBase, currencyTarget } = {}) {
    const filter = {}
    if (bank) filter.bank = bank
    if (currencyBase) {
      filter.currencyBase = ExchangeRatesRepository.formatArrayForFilter(currencyBase)
    }
    if (currencyTarget) {
      filter.currencyTarget = ExchangeRatesRepository.formatArrayForFilter(currencyTarget)
    }

    return filter
  }
}
module.exports.ExchangeRatesRepository = ExchangeRatesRepository
