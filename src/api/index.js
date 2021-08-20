const Router = require('@koa/router')

const banks = require('./banks')
const currencies = require('./currencies')

const router = new Router({
  prefix: '/api',
})

router.get('/banks', banks.listValidateMiddleware, banks.list)

module.exports = router
