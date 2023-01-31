const { ctr } = require('@cowellness/cw-micro-service')()

class sportsAuthorizationActions {
  async getSportAuthorization (data, reply) {
    try {
      const payroll = await ctr.sportsAuthorization.getSportAuthorization(data.ownerId, data.profileId)
      reply.cwSendSuccess({
        data: payroll,
        message: 'reply.sportsAuthorization.get.success'
      })
    } catch (e) {
      reply.cwSendFail({
        message: 'reply.sportsAuthorization.get.error',
        data: e
      })
    }
  }

  async addUpdateCourse (data, reply) {
    try {
      const payroll = await ctr.sportsAuthorization.addCourse(data.ownerId, data.profileId, data.interestIds)
      reply.cwSendSuccess({
        data: payroll,
        message: 'reply.course.add.success'
      })
    } catch (e) {
      reply.cwSendFail({
        message: 'reply.course.add.error',
        data: e
      })
    }
  }

  async addUpdatePrivate (data, reply) {
    try {
      const payroll = await ctr.sportsAuthorization.addPrivate(data.ownerId, data.profileId, data.interestIds)
      reply.cwSendSuccess({
        data: payroll,
        message: 'reply.private.add.success'
      })
    } catch (e) {
      reply.cwSendFail({
        message: 'reply.private.add.error',
        data: e
      })
    }
  }
}

module.exports = sportsAuthorizationActions
