const {  } = require('./utils/config')
const { connect: connectDb } = require('./services/mongoDb')
const { log, LOG_LEVELS } = require('./utils/logging')

async function run() {
  await connectDb()
}

run()
  .catch(err => log(LOG_LEVELS.error, err))
