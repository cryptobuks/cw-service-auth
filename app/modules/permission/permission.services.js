const { ctr, rabbitmq } = require('@cowellness/cw-micro-service')()

rabbitmq.consume('/settings/roles/get', (msg) => {
  const filter = msg.data
  return ctr.permission.find(filter)
})
