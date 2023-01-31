const { ctr } = require('@cowellness/cw-micro-service')()

class RelationActions {
  async managedProfileList (data, reply) {
    try {
      const profileList = await ctr.relation.managedProfileList(data._user.profileId, data.startAt, data.endAt)
      reply.cwSendSuccess({
        message: 'reply.relation.list.success',
        data: profileList
      })
    } catch (e) {
      reply.cwSendFail({
        message: 'reply.relation.list.error',
        data: e
      })
    }
  }

  async addGymRole (data, reply) {
    try {
      const newDirector = await ctr.relation.createGymAndRoleRelation(data.gymId, data.userId, data.role, data.startAt, data.endAt, data.status)
      reply.cwSendSuccess({
        message: 'reply.director.create.success',
        data: newDirector
      })
    } catch (e) {
      reply.cwSendFail({
        message: 'reply.director.create.error',
        data: e
      })
    }
  }

  async addTutor (data, reply) {
    try {
      const tutor = await ctr.relation.addTutor(data.userId, data.tutorId, true)
      reply.cwSendSuccess({
        message: 'reply.tutor.create.success',
        data: tutor
      })
    } catch (e) {
      reply.cwSendFail({
        message: 'reply.tutor.create.error',
        data: e
      })
    }
  }

  async removeTutor (data, reply) {
    try {
      const tutor = await ctr.relation.removeTutor(data.userId, data.tutorId)
      reply.cwSendSuccess({
        message: 'reply.tutor.remove.success',
        data: tutor
      })
    } catch (e) {
      reply.cwSendFail({
        message: 'reply.tutor.remove.error',
        data: e
      })
    }
  }

  async updateGymRole (data, reply) {
    try {
      const newDirector = await ctr.relation.updateGymAndRoleRelation(data.gymId, data.userId, data.role, data.startAt, data.endAt, data.status)
      reply.cwSendSuccess({
        message: 'reply.director.update.success',
        data: newDirector
      })
    } catch (e) {
      reply.cwSendFail({
        message: 'reply.director.upate.error',
        data: e
      })
    }
  }

  async deleteGymRole (data, reply) {
    try {
      const newDirector = await ctr.relation.removeGymAndRoleRelation(data.gymId, data.userId, data.role)
      reply.cwSendSuccess({
        message: 'reply.director.delete.success',
        data: newDirector
      })
    } catch (e) {
      reply.cwSendFail({
        message: 'reply.director.delete.error',
        data: e
      })
    }
  }

  async getNonGymProfiles (data, reply) {
    try {
      const newDirector = await ctr.relation.getNonGYMRelation(data.profileId)
      reply.cwSendSuccess({
        message: 'reply.relations.nongym.success',
        data: newDirector
      })
    } catch (e) {
      reply.cwSendFail({
        message: 'reply.relations.nongym.error',
        data: e
      })
    }
  }

  async getGymUserRole (data, reply) {
    try {
      // if (data.gymId !== data._user.profileId && data.profileId !== data._user.profileId) throw new Error('Only gym or profile can view his role')
      const roles = await ctr.relation.getGymNUserRole(data.gymId, data.profileId)
      reply.cwSendSuccess({
        message: 'reply.gym.role.success',
        data: roles
      })
    } catch (e) {
      reply.cwSendFail({
        message: 'reply.gym.role.error',
        data: e
      })
    }
  }

  async getProfileList (data, reply) {
    const newDirector = await ctr.relation.getProfileList(data._user.id)
    reply.cwSendSuccess({
      message: 'reply.profile.mangedList.success',
      data: newDirector
    })
  }

  async verifyUserRelationShip (data, reply) {
    try {
      const relation = await ctr.relation.verifyUserRelation(data.leftProfileId, data.rightProfileId)
      reply.cwSendSuccess({
        message: 'reply.relation.status.success',
        data: relation
      })
    } catch (e) {
      reply.cwSendFail({
        message: 'reply.relation.status.error',
        data: e
      })
    }
  }

  async block (data, reply) {
    try {
      const relation = await ctr.relation.block(data.profileId, data._user.profileId)
      reply.cwSendSuccess({
        message: 'reply.relation.block.success',
        data: relation
      })
    } catch (e) {
      reply.cwSendFail({
        message: 'reply.relation.block.error',
        data: e
      })
    }
  }

  async unblock (data, reply) {
    try {
      const relation = await ctr.relation.unblock(data.profileId, data._user.profileId)
      reply.cwSendSuccess({
        message: 'reply.relation.unblock.success',
        data: relation
      })
    } catch (e) {
      reply.cwSendFail({
        message: 'reply.relation.unblock.error',
        data: e
      })
    }
  }

  async getUserTutor (data, reply) {
    try {
      const relation = await ctr.relation.getUserTutor(data.profileId)
      reply.cwSendSuccess({
        message: 'reply.user.tutor.success',
        data: relation
      })
    } catch (e) {
      reply.cwSendFail({
        message: 'reply.user.tutor.error',
        data: e
      })
    }
  }

  async getTutorUsers (data, reply) {
    try {
      const relation = await ctr.relation.getTutorUsers(data.profileId)
      reply.cwSendSuccess({
        message: 'reply.tutor.user.success',
        data: relation
      })
    } catch (e) {
      reply.cwSendFail({
        message: 'reply.tutor.user.error',
        data: e
      })
    }
  }

  async getReferentUsers (data, reply) {
    try {
      const relation = await ctr.relation.getReferentUsers(data.profileId)
      reply.cwSendSuccess({
        message: 'reply.referent.user.success',
        data: relation
      })
    } catch (e) {
      reply.cwSendFail({
        message: 'reply.referent.user.error',
        data: e
      })
    }
  }

  async gymUserGymRelations (data, reply) {
    try {
      const relation = await ctr.relation.gymUserGymRelations(data.profileId)
      reply.cwSendSuccess({
        message: 'reply.gyms.relation.success',
        data: relation
      })
    } catch (e) {
      reply.cwSendFail({
        message: 'reply.gyms.relation.error',
        data: e
      })
    }
  }

  async getRelationDetail (data, reply) {
    try {
      const relation = await ctr.relation.relationDetail(data.gymId, data.profileId)
      reply.cwSendSuccess({
        message: 'reply.gyms.relation.success',
        data: relation
      })
    } catch (e) {
      reply.cwSendFail({
        message: 'reply.gyms.relation.error',
        data: e
      })
    }
  }

  async setIsInteresting (data, reply) {
    try {
      const relation = await ctr.relation.setIsInteresting(data)

      reply.cwSendSuccess({
        message: 'reply.relation.update.success',
        data: relation
      })
    } catch (e) {
      console.log(e)
      reply.cwSendFail({
        message: 'reply.relation.update.error',
        data: e.message
      })
    }
  }
}

module.exports = RelationActions
