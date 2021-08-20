/** @typedef {import('mongoose').Document} DocumentType */

/**
 * @typedef {{
 *  id: string,
 * }} BaseRepositoryItem
 */
/**
 * @typedef {{
 *  id?: string,
 * }} BaseRepositoryValues
 */

class BaseRepository {
  /**
   * @protected
   * @param {object} item
   * @returns {BaseRepositoryItem}
   */
  static format(item) {
    return item
  }
}
module.exports.BaseRepository = BaseRepository

/**
 * @typedef {{
 *  createdAt?: Date,
 *  updatedAt?: Date,
 * }} MongoRepositoryItemSpecificValues
 */
/**
 * @typedef {(
 *  BaseRepositoryValues & MongoRepositoryItemSpecificValues
 * )} MongoRepositoryItemValues
 */
/** @typedef {( BaseRepositoryItem & MongoRepositoryItemSpecificValues )} MongoRepositoryItem */

class MongoRepository extends BaseRepository {
  // TODO: перенести общие методы из ExchangeRatesRepository сюда

  /**
   * @protected
   * @param {DocumentType} item
   * @returns {MongoRepositoryItem}
   */
  static format(item) {
    if (!item) return null

    const itemData = item.toJSON ?
      item.toJSON() :
      item
    const formattedItem = {
      ...itemData,
      id: String(itemData._id),
    }

    delete formattedItem._id
    // eslint-disable-next-line no-underscore-dangle
    delete formattedItem.__v

    return formattedItem
  }

  /**
   * @protected
   * @param {any | any[]} value
   */
  static formatArrayForFilter(value) {
    if (!Array.isArray(value)) return value

    return { $in: value }
  }
}
module.exports.MongoRepository = MongoRepository
