const { ctr, rabbitmq } = require('@cowellness/cw-micro-service')()

rabbitmq.consume('/auth/cwmodules/getGymList', () => {
  return ctr.cwmodules.getGymList()
})
