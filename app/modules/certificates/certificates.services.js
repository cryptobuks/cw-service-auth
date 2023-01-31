const { ctr, rabbitmq } = require('@cowellness/cw-micro-service')()

rabbitmq.consume('/settings/certificates/get', (msg) => {
  const filter = msg.data
  return ctr.certificates.find(filter)
})
