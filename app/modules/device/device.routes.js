const { ctr, redisJson } = require('@cowellness/cw-micro-service')()
const config = require('config')
const routeSchema = require('./device.schema')

const tokenRules = {
  domain: '*',
  path: '/',
  secure: config.options.isSecure,
  httpOnly: true,
  sameSite: config.options.sameSite,
  expires: new Date()
}

async function generateDeviceTokenNSend (reply, gym, hostname) {
  const cwtoken = await reply.jwtSign({
    _id: gym.company.devices[0]._id.toString()
  }, { expiresIn: config.options.duration })
  // tokenRules.domain = '.' + hostname
  if (tokenRules.domain) delete tokenRules.domain
  const currentDate = new Date()
  tokenRules.expires = new Date(currentDate.setDate(currentDate.getDate() + config.options.cookieExpire))
  await redisJson.set(cwtoken, { _id: gym.company.devices[0]._id.toString(), type: 'gymDevice', name: gym.company.devices[0].name, gymid: gym._id.toString(), permission: {} }, { expire: config.options.durationInSec })
  return reply.setCookie('cwtoken', cwtoken, tokenRules).code(200).cwsendSuccess({ data: gym, auth: { cwtoken: cwtoken, duration: '+' + config.options.duration } })
}

module.exports = async function (fastify, opts, done) {
  fastify.get('/login/:gymId/:deviceId', routeSchema.deviceLogin, async function (request, reply) {
    try {
      const resp = await ctr.device.deviceLogin(request.params.gymId, request.params.deviceId)
      if (resp) {
        await generateDeviceTokenNSend(reply, resp, request.hostname)
      } else {
        return reply.cwsendFail({
          message: 'Invalid device information',
          _message: 'Invalid device information'
        })
      }
    } catch (e) {
      return reply.cwsendFail({
        message: e.message,
        _message: e
      })
    }
  })

  done()
}
