const { ctr, rabbitmq, redisJson } = require('@cowellness/cw-micro-service')()
const config = require('config')
const validationSchema = require('./profile.schema')
rabbitmq.consume('/auth/profile/get', (msg) => {
  const filter = msg.data
  return ctr.profile.find(filter)
})

rabbitmq.consume('/auth/verify/token', async (msg) => {
  const message = msg.data
  const hasErrors = rabbitmq.validate(validationSchema.tokenSchema, message)
  if (hasErrors) {
    return {
      errors: hasErrors,
      result: 'failed'
    }
  }
  const data = await redisJson.get(message.token)
  if (data && data.type && data.type === 'gymDevice') await redisJson.set(message.token, data, { expire: config.options.durationInSec })
  return data
})

rabbitmq.consume('/auth/profiles/setBackground', async ({ data }) => {
  for (const id of data.ids) {
    await ctr.profile.setbackground(id, data.backgroundId)
  }
  return true
})

rabbitmq.consume('/auth/profile/getProfilesFiltered', async ({ data }) => {
  return ctr.profile.getProfileFiltered(data || {})
})

rabbitmq.consume('/auth/profile/create', async ({ data }) => {
  return ctr.profile.createTemporaryProfile(data)
})

rabbitmq.consume('/auth/stats/background/image', async (msg) => {
  return ctr.profile.getBackgroundStats()
})

rabbitmq.consume('/auth/stats/sportinterest', async (msg) => {
  return ctr.profile.getSportInterestStats()
})

rabbitmq.consume('/auth/stats/countries', async (msg) => {
  return ctr.profile.getCountriesStats()
})

rabbitmq.consume('/auth/stats/getContactStats', async (msg) => {
  return ctr.profile.getContactStats()
})

rabbitmq.consume('/auth/stats/getContactBySports', async (msg) => {
  return ctr.profile.getContactBySports()
})

rabbitmq.consume('/auth/profile/checkBackgroundChange', async ({ data }) => {
  return ctr.profile.checkBackgroundChange(data.profileId, data.oldBackgroundId)
})

rabbitmq.consume('/auth/stats/getChatStats', async (msg) => {
  return ctr.profile.getChatStats()
})

rabbitmq.consume('/auth/stats/getAcquisitionStats', async (msg) => {
  return ctr.profile.getAcquisitionStats()
})

rabbitmq.consume('/auth/profile/getCowellnessByCountry', ({ data }) => {
  return ctr.profile.getCowellnessByCountry(data.code)
})

rabbitmq.consume('/auth/profile/pin/set', ({ data }) => {
  return ctr.profile.setAuthPin(data.profileId, data.pin)
})

rabbitmq.consume('/auth/profile/pin/get', ({ data }) => {
  return ctr.profile.getAuthPin(data.profileId)
})

rabbitmq.consume('/auth/profile/suspendTemporary', () => {
  ctr.profile.suspendTemporary()
  ctr.relation.suspendTemporary()
})
// cron
rabbitmq.send('/cron/append', {
  name: 'auth:profile:suspend-temporary',
  type: 'cron',
  update: true,
  crontab: '0 0 * * *', // every day at 00:00
  commands: [{
    type: 'rabbitmq',
    queue: '/auth/profile/suspendTemporary',
    msg: 'check'
  }]
})
