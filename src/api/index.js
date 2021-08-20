const Router = require('@koa/router')

const banks = require('./banks')
const currencies = require('./currencies')

const router = new Router({
  prefix: '/api',
})

router.get('/banks', banks.listValidateMiddleware, banks.list)

router.get(
  '/currencies/exchange-rates',
  currencies.exchangeRatesValidateMiddleware,
  currencies.exchangeRates,
)
router.put('/currencies/convert', currencies.convertValidateMiddleware, currencies.convert)

module.exports = router
