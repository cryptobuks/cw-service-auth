const { ctr } = require('@cowellness/cw-micro-service')()

class accessActions {
  async getAccess (data, reply) {
    try {
      const resp = await ctr.access.getAccess(data.invitedBy, data.invitedTo, data.action, data.assetId, data._request.headers['x-forwarded-for'] || 'IP NOT FOUND')
      reply.cwSendSuccess({ data: resp, message: 'reply.access.success' })
    } catch (e) {
      reply.cwSendFail({ data: e, message: 'reply.access.error' })
    }
  }

  async getCurrentRelationStatus (data, reply) {
    try {
      const resp = await ctr.access.getRelationStatus(data.invitedBy, data.invitedTo)
      reply.cwSendSuccess({ data: resp, message: 'reply.access.success' })
    } catch (e) {
      reply.cwSendFail({ data: e, message: 'reply.access.error' })
    }
  }

  async getAccessLog (data, reply) {
    try {
      const resp = await ctr.access.getAccessLog(data._user.profileId, data.profileId, data.fromDate, data.toDate, data.fromRecord, data.totalRecord)
      reply.cwSendSuccess({ data: resp, message: 'reply.access.log.success' })
    } catch (e) {
      reply.cwSendFail({ data: e, message: 'reply.access.log.error' })
    }
  }
}

module.exports = accessActions
