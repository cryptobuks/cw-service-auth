const { ctr, rabbitmq } = require('@cowellness/cw-micro-service')()

rabbitmq.consume('/settings/bio/get', (msg) => {
  const filter = msg.data
  return ctr.bio.find(filter)
})
