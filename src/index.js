const {  } = require('./utils/config')
const { log, LOG_LEVELS } = require('./utils/logging')

async function run() {
}

run()
  .catch(err => log(LOG_LEVELS.error, err))
