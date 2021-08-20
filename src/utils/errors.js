/** Basic Error class for exceptions in service */
class CurrencyServiceError extends Error {
  /**
   * @param {{
   *  message: string,
   *  httpCode?: number,
   * }} params
   */
  constructor({ message, httpCode = 500 }) {
    super(message)

    this.httpCode = httpCode
  }
}
module.exports.CurrencyServiceError = CurrencyServiceError

class BadRequestError extends CurrencyServiceError {
  /**
   * @param {{
   *  message?: string,
   *  httpCode?: number,
   * }} params
   */
  constructor({ message = 'Bad request', httpCode = 400 } = {}) {
    super({ message, httpCode })
  }
}
module.exports.BadRequestError = BadRequestError
