const { ctr } = require('@cowellness/cw-micro-service')()

class cwmodulesActions {
  async getCwModulesByGYMId (data, reply) {
    const gymModules = await ctr.cwmodules.getByGYMId(data.gymId)
    reply.cwSendSuccess({
      message: 'reply.cwmodules.list.success',
      data: gymModules
    })
  }

  async getCwModulesById (data, reply) {
    const gymModule = await ctr.cwmodules.getById(data._id)
    reply.cwSendSuccess({
      message: 'reply.cwmodules.detail.success',
      data: gymModule
    })
  }

  async createCWModuleByGymId (data, reply) {
    try {
      const gymModule = await ctr.cwmodules.createByGymId(data.gymId, data.modules, data._user.profileId)
      reply.cwSendSuccess({
        message: 'reply.cwmodules.create.success',
        data: gymModule
      })
    } catch (e) {
      reply.cwSendFail({ data: e.message, message: 'reply.cwmodules.create.error' })
    }
  }

  async updateCWModuleByGymId (data, reply) {
    try {
      const gymModule = await ctr.cwmodules.updateById(data._id, data.modules, data._user.profileId)
      reply.cwSendSuccess({
        message: 'reply.cwmodules.update.success',
        data: gymModule
      })
    } catch (e) {
      reply.cwSendFail({ data: e.message, message: 'reply.cwmodules.update.error' })
    }
  }
}

module.exports = cwmodulesActions
