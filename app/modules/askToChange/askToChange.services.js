const { ctr, rabbitmq } = require('@cowellness/cw-micro-service')()

rabbitmq.consume('/settings/askToChange/get', (msg) => {
  const filter = msg.data
  return ctr.askToChange.find(filter)
})
