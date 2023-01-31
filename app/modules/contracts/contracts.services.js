const { ctr, rabbitmq } = require('@cowellness/cw-micro-service')()

rabbitmq.consume('/settings/contracts/get', (msg) => {
  const filter = msg.data
  return ctr.contracts.find(filter)
})

/**
 * Reads default switch coming from setting service
 */
rabbitmq.consume('/settings/contract/active/new/', (msg) => {
  const data = msg.data
  return ctr.contracts.switchDefault(data.previousId, data.currentId, data.type, data.role, data.preApproval)
})
