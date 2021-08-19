const {  } = require('./utils/config')
const { connect: connectDb, disconnect: disconnectDb } = require('./services/mongoDb')
const { log, LOG_LEVELS } = require('./utils/logging')

async function run() {
  await connectDb()

  await disconnectDb()
}

run()
  .catch(err => log(LOG_LEVELS.error, err))
