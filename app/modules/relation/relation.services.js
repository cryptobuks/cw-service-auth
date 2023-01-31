const { ctr, rabbitmq } = require('@cowellness/cw-micro-service')()
const routeSchema = require('./relation.schema')

rabbitmq.consume('/auth/relation/get', async (msg) => {
  const data = msg.data
  return await ctr.relation.findRelation(data.profileId)
}, { schema: routeSchema.relationGet })

rabbitmq.consume('/auth/relation/create', ({ data }) => {
  return ctr.relation.createTemporaryRelation(data)
})

rabbitmq.consume('/auth/relation/verify', async (msg) => {
  const data = msg.data
  return await ctr.relation.verifyUserRelation(data.businessId, data.profileId)
}, { schema: routeSchema.verify })

rabbitmq.consume('/auth/relation/business/user/role', async (msg) => {
  const data = msg.data
  return await ctr.relation.getGymNUserRole(data.businessId, data.profileId)
}, { schema: routeSchema.businessUserRole })

rabbitmq.consume('/auth/relation/assigned', async (msg) => {
  const data = msg.data
  return await ctr.relation.getAssignedUser(data.businessId, data.profileIds)
}, { schema: routeSchema.assignedProfiles })
