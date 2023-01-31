const { ctr } = require('@cowellness/cw-micro-service')()

class permissionActions {
  async setOveride (data, reply) {
    try {
      const payroll = await ctr.permission.setOverride(data.ownerId, data.profileId, data.rules, data._user.id)
      reply.cwSendSuccess({
        data: payroll,
        message: 'reply.permission.override.set.success'
      })
    } catch (e) {
      reply.cwSendFail({
        message: 'reply.permission.override.set.error',
        data: e
      })
    }
  }

  async getOveride (data, reply) {
    try {
      const payroll = await ctr.permission.getOverride(data.ownerId, data.profileId)
      reply.cwSendSuccess({
        data: payroll,
        message: 'reply.permission.override.get.success'
      })
    } catch (e) {
      reply.cwSendFail({
        message: 'reply.permission.override.get.error',
        data: e
      })
    }
  }

  async getDefaultRolePermission (data, reply) {
    try {
      const permission = await ctr.permission.getDefaultRolePermission()
      reply.cwSendSuccess({
        data: permission,
        message: 'reply.permission.default.success'
      })
    } catch (e) {
      reply.cwSendFail({
        message: 'reply.permission.default.error',
        data: e
      })
    }
  }
}

module.exports = permissionActions
