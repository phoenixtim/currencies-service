const mongoose = require('mongoose')

const { MONGODB } = require('../utils/config')
const { CurrencyServiceError } = require('../utils/errors')
const { log, LOG_LEVELS } = require('../utils/logging')

async function connect() {
  await mongoose.connect(MONGODB.url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true,
    autoReconnect: Boolean(MONGODB.reconnectTries),
    reconnectTries: MONGODB.reconnectTries,
    reconnectInterval: MONGODB.reconnectInterval * 1000,
  })
}
module.exports.connect = connect

module.exports.disconnect = mongoose.disconnect

mongoose.connection.on('error', err => {
  log(LOG_LEVELS.error, err)
})

mongoose.connection.on('reconnectFailed', async () => {
  log(
    LOG_LEVELS.error,
    // TODO: добавить класс ошибки с базой, и возвращать в exit его код
    new CurrencyServiceError('Unable to reconnect to MongoDB'),
  )
  process.exit(1)
})
