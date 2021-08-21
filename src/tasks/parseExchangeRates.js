const { ArgumentParser } = require('argparse')

const { BANKS } = require('../constants')
const { parser: bankOfThailandParser } = require('../parsers/bankOfThailand')
const { parser: centralBankRfParser } = require('../parsers/centralBankRF')
const { connect: connectDb, disconnect: disconnectDb } = require('../services/mongoDb')
const { log, LOG_LEVELS } = require('../utils/logging')

const argsParser = new ArgumentParser({
  description: 'Script to parse currency exchange rate of specified banks',
})
argsParser.add_argument('-b', '--banks', {
  help: 'bank IDs separated by whitespace',
  nargs: '+',
  metavar: 'BANK_ID',
})

/**
 * @param {string} bankId
 * @returns {import('../parsers/base').BaseParser}
 */
function getParser(bankId) {
  let parser
  switch (bankId) {
    case BANKS.TH.id: parser = bankOfThailandParser; break
    case BANKS.RU.id: parser = centralBankRfParser; break
    default:
      log(LOG_LEVELS.error, `Unknown bank ID ${bankId}`)
      break
  }

  return parser
}

async function run() {
  /**
   * @type {{ banks: string[] }}
   */
  const { banks: bankIds } = argsParser.parse_args()

  await connectDb()

  const parsers = bankIds.map(bankId => getParser(bankId)).filter(parser => Boolean(parser))
  await Promise.all(parsers.map(parser => parser.parse()))

  await disconnectDb()

  log({
    level: LOG_LEVELS.info,
    message: `All exchange rates parsed`,
  })
}

run()
  .catch(err => log(LOG_LEVELS.error, err))
