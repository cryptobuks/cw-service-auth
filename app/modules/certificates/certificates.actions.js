const { ctr } = require('@cowellness/cw-micro-service')()

class certificateActions {
  async getCertificatesList (data, reply) {
    try {
      const list = await ctr.certificates.getCertificatesList(data.gymId, data.profileId, data._user.id)
      reply.cwSendSuccess({
        data: list,
        message: 'reply.certificate.list.success'
      })
    } catch (e) {
      reply.cwSendFail({
        message: 'reply.certificate.list.error',
        data: e
      })
    }
  }

  async create (data, reply) {
    try {
      const certificate = await ctr.certificates.create(data.type, data.name, data.subtype, data.sports, data.expiry, data.file, data.fileName, data.profileId, data.ownerId, data.createdby, data._user.id)
      reply.cwSendSuccess({
        data: certificate,
        message: 'reply.certificate.create.success'
      })
    } catch (e) {
      reply.cwSendFail({
        message: 'reply.certificate.create.error',
        data: e
      })
    }
  }

  async approve (data, reply) {
    try {
      const certificate = await ctr.certificates.approve(data.id, data.ownerId, data._user.profileId, data._user.id)
      reply.cwSendSuccess({
        data: certificate,
        message: 'reply.certificate.approve.success'
      })
    } catch (e) {
      reply.cwSendFail({
        message: 'reply.certificate.approve.error',
        data: e
      })
    }
  }

  async disapprove (data, reply) {
    try {
      const certificate = await ctr.certificates.disapprove(data.id, data.ownerId, data._user.profileId, data._user.id)
      reply.cwSendSuccess({
        data: certificate,
        message: 'reply.certificate.disapprove.success'
      })
    } catch (e) {
      reply.cwSendFail({
        message: 'reply.certificate.disapprove.error',
        data: e
      })
    }
  }

  async update (data, reply) {
    try {
      const certificate = await ctr.certificates.update(data.id, data.name, data.sports, data.expiry, data.file, data.fileName, data.ownerId, data.createdby, data._user.id)
      reply.cwSendSuccess({
        data: certificate,
        message: 'reply.certificate.update.success'
      })
    } catch (e) {
      reply.cwSendFail({
        message: 'reply.certificate.update.error',
        data: e
      })
    }
  }

  async deleteCertificate (data, reply) {
    try {
      const certificate = await ctr.certificates.delete(data.id, data.ownerId, data._user.id)
      reply.cwSendSuccess({
        data: certificate,
        message: 'reply.certificate.delete.success'
      })
    } catch (e) {
      reply.cwSendFail({
        message: 'reply.certificate.delete.error',
        data: e
      })
    }
  }
}

module.exports = certificateActions
