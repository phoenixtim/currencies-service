const Koa = require('koa')
const bodyParser = require('koa-bodyparser')

const apiRouter = require('./api')
const { errorsMiddleware } = require('./middlewares')
const { connect: connectDb } = require('./services/mongoDb')
const { HOST, PORT } = require('./utils/config')
const { log, LOG_LEVELS } = require('./utils/logging')

const app = new Koa()

app.use(errorsMiddleware)
app.use(bodyParser())
app.use(apiRouter.routes()).use(apiRouter.allowedMethods())

async function run() {
  await connectDb()

  app.listen(PORT, HOST, () => {
    log(LOG_LEVELS.info, `Service started on http://${HOST}:${PORT}`)
  })
}

run()
  .catch(err => log(LOG_LEVELS.error, err))
