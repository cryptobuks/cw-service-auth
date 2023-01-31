const { ctr } = require('@cowellness/cw-micro-service')()

class ContractActions {
  async findById (data, reply) {
    try {
      const document = await ctr.contracts.findById(data.id)
      reply.cwSendSuccess({
        data: document,
        message: 'reply.document.get.success'
      })
    } catch (e) {
      reply.cwSendFail({
        message: 'reply.document.get.error',
        data: e
      })
    }
  }

  async getDocumentByType (data, reply) {
    try {
      const documents = await ctr.contracts.getDocumentByType(data.ownerId, data.type, data.role)
      reply.cwSendSuccess({
        data: documents,
        message: 'reply.document.type.success'
      })
    } catch (e) {
      reply.cwSendFail({
        message: 'reply.document.type.error',
        data: e
      })
    }
  }

  async createDocument (data, reply) {
    try {
      const documents = await ctr.contracts.createDocument(data.ownerId, data.type, data.role, data.content, data.referenceDoc, data.isDefaultDocument, data.activatedAt, data.expiredAt, data._user.profileId, data._user.id, data.preApproval)
      reply.cwSendSuccess({
        data: documents,
        message: 'reply.document.type.success'
      })
    } catch (e) {
      reply.cwSendFail({
        message: 'reply.document.type.error',
        data: e
      })
    }
  }

  async updateDocument (data, reply) {
    try {
      const documents = await ctr.contracts.updateDocument(data.ownerId, data.id, data.content, data.referenceDoc, data.isDefaultDocument, data.activatedAt, data.expiredAt, data._user.profileId, data._user.id, data.preApproval)
      reply.cwSendSuccess({
        data: documents,
        message: 'reply.document.type.success'
      })
    } catch (e) {
      reply.cwSendFail({
        message: 'reply.document.type.error',
        data: e
      })
    }
  }

  async getProfileWhoSignedDocument (data, reply) {
    try {
      const users = await ctr.contracts.getProfileWhoSignedDocument(data.documentId, true)
      reply.cwSendSuccess({
        data: users,
        message: 'reply.document.users.success'
      })
    } catch (e) {
      reply.cwSendFail({
        message: 'reply.document.users.error',
        data: e
      })
    }
  }

  async getProfileWhoNotSignedDocument (data, reply) {
    try {
      const users = await ctr.contracts.getProfileWhoSignedDocument(data.documentId, false)
      reply.cwSendSuccess({
        data: users,
        message: 'reply.document.users.success'
      })
    } catch (e) {
      reply.cwSendFail({
        message: 'reply.document.users.error',
        data: e
      })
    }
  }

  async getProfileUnsignedDocuments (data, reply) {
    try {
      const documents = await ctr.contracts.getProfileUnsignedDocuments(data.ownerIds, data.profileId || data._user.id)
      reply.cwSendSuccess({
        data: documents,
        message: 'reply.document.unsigned.success'
      })
    } catch (e) {
      reply.cwSendFail({
        message: 'reply.document.unsigned.error',
        data: e
      })
    }
  }

  async getDocumentSignedByProfile (data, reply) {
    try {
      const documents = await ctr.contracts.getDocumentSignedByProfile(data.ownerId, data.profileId)
      reply.cwSendSuccess({
        data: documents,
        message: 'reply.document.users.success'
      })
    } catch (e) {
      reply.cwSendFail({
        message: 'reply.document.users.error',
        data: e
      })
    }
  }

  async addSignedDocument (data, reply) {
    try {
      const documents = await ctr.contracts.addSignedDocument(data.ownerId, data.profileId, data.documentId, data.onBehalf, data.source, data.isMandatory, data.isAccepted, data.deviceId, data._request.headers['x-forwarded-for'] || 'IP NOT FOUND', data.sign)
      reply.cwSendSuccess({
        data: documents,
        message: 'reply.document.add.success'
      })
    } catch (e) {
      reply.cwSendFail({
        message: 'reply.document.add.error',
        data: e
      })
    }
  }

  async updateSignedDocument (data, reply) {
    try {
      const documents = await ctr.contracts.updateSignedDocument(data.ownerId, data.id, data.profileId, data.documentId, data.isMandatory, data.isAccepted, data.deviceId, data._request.headers['x-forwarded-for'] || 'IP NOT FOUND', data.sign)
      reply.cwSendSuccess({
        data: documents,
        message: 'reply.document.update.success'
      })
    } catch (e) {
      reply.cwSendFail({
        message: 'reply.document.update.error',
        data: e
      })
    }
  }

  async getContractBySourceId (data, reply) {
    try {
      const documents = await ctr.contracts.getContractBySourceId(data.id, data.source)
      reply.cwSendSuccess({
        data: documents,
        message: 'reply.document.add.success'
      })
    } catch (e) {
      reply.cwSendFail({
        message: 'reply.document.add.error',
        data: e
      })
    }
  }

  async removeDocument (data, reply) {
    try {
      const documents = await ctr.contracts.removeDocument(data.id, data._user.profileId)
      reply.cwSendSuccess({
        data: documents,
        message: 'reply.document.remove.success'
      })
    } catch (e) {
      reply.cwSendFail({
        message: 'reply.document.remove.error',
        data: e
      })
    }
  }

  async getCowellnessTermByCountry (data, reply) {
    try {
      const documents = await ctr.contracts.getDefaultCowellnessTermByCountry(data.countryCode)
      reply.cwSendSuccess({
        data: documents,
        message: 'reply.document.term.success'
      })
    } catch (e) {
      reply.cwSendFail({
        message: 'reply.document.term.error',
        data: e
      })
    }
  }
}

module.exports = ContractActions
