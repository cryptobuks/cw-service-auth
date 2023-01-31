const { ctr } = require('@cowellness/cw-micro-service')()

class payrollActions {
  async payrollDetails (data, reply) {
    try {
      const payroll = await ctr.payroll.getPayrollDetail(data.ownerId, data.profileId)
      reply.cwSendSuccess({
        data: payroll,
        message: 'reply.payroll.get.success'
      })
    } catch (e) {
      reply.cwSendFail({
        message: 'reply.payroll.get.error',
        data: e
      })
    }
  }

  async addUpdatePayroll (data, reply) {
    try {
      const payroll = await ctr.payroll.addPayroll(data.ownerId, data.profileId, data.name, data.role, data.period, data.variable, data.value, data.id)
      reply.cwSendSuccess({
        data: payroll,
        message: 'reply.payroll.add.success'
      })
    } catch (e) {
      reply.cwSendFail({
        message: 'reply.payroll.add.error',
        data: e
      })
    }
  }

  async removePayroll (data, reply) {
    try {
      const payroll = await ctr.payroll.removePayroll(data.ownerId, data.profileId, data.id)
      reply.cwSendSuccess({
        data: payroll,
        message: 'reply.payroll.remove.success'
      })
    } catch (e) {
      reply.cwSendFail({
        message: 'reply.payroll.remove.error',
        data: e
      })
    }
  }

  async addUpdateAward (data, reply) {
    try {
      const payroll = await ctr.payroll.addAward(data.ownerId, data.profileId, data.target, data.quantity, data.end, data.value, data.id)
      reply.cwSendSuccess({
        data: payroll,
        message: 'reply.award.add.success'
      })
    } catch (e) {
      reply.cwSendFail({
        message: 'reply.award.add.error',
        data: e
      })
    }
  }

  async removeAward (data, reply) {
    try {
      const payroll = await ctr.payroll.removeAward(data.ownerId, data.profileId, data.id)
      reply.cwSendSuccess({
        data: payroll,
        message: 'reply.award.remove.success'
      })
    } catch (e) {
      reply.cwSendFail({
        message: 'reply.award.remove.error',
        data: e
      })
    }
  }
}

module.exports = payrollActions
