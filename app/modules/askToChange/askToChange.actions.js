const { ctr } = require('@cowellness/cw-micro-service')()

class AskToChangeActions {
  async createChange (data, reply) {
    try {
      const payroll = await ctr.askToChange.createChange(data)
      reply.cwSendSuccess({
        data: payroll,
        message: 'reply.askToChange.create.success'
      })
    } catch (e) {
      console.log(e)
      reply.cwSendFail({
        message: 'reply.askToChange.create.error',
        data: e.message
      })
    }
  }

  async getChange (data, reply) {
    try {
      const payroll = await ctr.askToChange.getChange(data)
      reply.cwSendSuccess({
        data: payroll,
        message: 'reply.askToChange.get.success'
      })
    } catch (e) {
      reply.cwSendFail({
        message: 'reply.askToChange.get.error',
        data: e.message
      })
    }
  }
}

module.exports = AskToChangeActions
