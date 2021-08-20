/** @typedef {import('./base').BaseRepositoryItem} BaseRepositoryItem */
/** @typedef {import('./base').BaseRepositoryValues} BaseRepositoryValues */

const { BaseRepository } = require('./base')
const { BANKS } = require('../constants')

const banksArray = Object.values(BANKS).map(({ id, name, countryCode }) => ({
  id,
  name,
  countryCode,
}))

/**
 * @typedef {{
 *  name?: string,
 *  countryCode?: string,
 * }} BankSpecificValues
 */
/** @typedef {(BaseRepositoryValues & BankSpecificValues)} BankValues */
/** @typedef {(BaseRepositoryItem & BankSpecificValues)} BankType */

class BanksRepository extends BaseRepository {
  /**
   * @param {BankValues} filter
   * @returns {Promise<BankType>}
   */
  static async findOne(filter) {
    const bank = banksArray.find(BanksRepository.getFilterFunction(filter))

    return this.format(bank)
  }

  /**
   * @param {object} params
   * @param {BankValues=} params.filter
   * @param {number=} params.limit
   * @param {number=} params.offset
   * @returns {Promise<BankType[]>}
   */
  static async find({ filter, limit, offset = 0 }) {
    const banks = banksArray.filter(BanksRepository.getFilterFunction(filter))
      // @ts-ignore
      .slice(offset, Number.isNaN(parseInt(limit, 10)) ? undefined : limit + offset)

    return banks.map(this.format)
  }

  /**
   * @protected
   * @param {object} item
   * @returns {BankType}
   */
  static format(item) {
    return item ? {
      id: item.id,
      name: item.name,
      countryCode: item.countryCode,
    } : null
  }

  /**
   * @protected
   * @param {BankValues} filter
   */
  static getFilterFunction({ id, name, countryCode } = {}) {
    /**
     * @param {BankType} item
     */
    return item => {
      let match = true
      if (id) match = id === item.id
      if (name) match = item.name.includes(name)
      if (countryCode) match = countryCode === item.countryCode

      return match
    }
  }
}
module.exports.BanksRepository = BanksRepository
