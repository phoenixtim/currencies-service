// Здесь может быть какая-то обработка параметров из конфига.
// Возвращаемый тип не описывал, потому что IDE его сама подтянула.
function getConfig() {
  // eslint-disable-next-line global-require
  const config = require('../../config.json')

  return config
}

module.exports = getConfig()
