const { ctr } = require('@cowellness/cw-micro-service')()

class BioActions {
  async getbio (data, reply) {
    try {
      const bios = await ctr.bio.find(data.profileId, data._user.profileId)
      reply.cwSendSuccess({
        data: bios,
        message: 'reply.bio.get.success'
      })
    } catch (e) {
      reply.cwSendFail({
        message: 'reply.bio.get.error',
        data: e
      })
    }
  }

  async createbio (data, reply) {
    try {
      const bios = await ctr.bio.createBio(data.profileId, data.height, data.weight, data.muscle, data.fat, data.tissue, data.water, data.bone, data.measuredAt, data._user.profileId)
      reply.cwSendSuccess({
        data: bios,
        message: 'reply.bio.create.success'
      })
    } catch (e) {
      reply.cwSendFail({
        message: 'reply.bio.create.error',
        data: e
      })
    }
  }

  async updatebio (data, reply) {
    try {
      const bios = await ctr.bio.updateBio(data.profileId, data.id, data.height, data.weight, data.muscle, data.fat, data.tissue, data.water, data.bone, data.measuredAt, data._user.profileId)
      reply.cwSendSuccess({
        data: bios,
        message: 'reply.bio.create.success'
      })
    } catch (e) {
      reply.cwSendFail({
        message: 'reply.bio.create.error',
        data: e
      })
    }
  }

  async deletebio (data, reply) {
    try {
      const bios = await ctr.bio.deleteBio(data.profileId, data.id, data._user.profileId)
      reply.cwSendSuccess({
        data: bios,
        message: 'reply.bio.create.success'
      })
    } catch (e) {
      reply.cwSendFail({
        message: 'reply.bio.create.error',
        data: e
      })
    }
  }
}

module.exports = BioActions
