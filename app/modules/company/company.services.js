const { ctr, rabbitmq } = require('@cowellness/cw-micro-service')()
const routeSchema = require('./company.schema')

rabbitmq.consume('/settings/company/get', (msg) => {
  const filter = msg.data
  return ctr.company.find(filter)
})

rabbitmq.consume('/auth/company/profile/detail', (msg) => {
  const resp = ctr.company.findByIdDynamicFields(msg.data.profileId, msg.data.fields)
  return resp
}, routeSchema.profileDetail)

rabbitmq.consume('/auth/company/profiles/detail', (msg) => {
  const resp = ctr.company.findByIdsDynamicFields(msg.data.profileIds, msg.data.fields)
  return resp
}, routeSchema.profileDetail)
