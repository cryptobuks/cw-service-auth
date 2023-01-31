const { ctr, rabbitmq } = require('@cowellness/cw-micro-service')()

rabbitmq.consume('/settings/device/get', (msg) => {
  const filter = msg.data
  return ctr.device.find(filter)
})
