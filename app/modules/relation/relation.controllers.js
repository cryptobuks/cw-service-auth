const { db, ctr, rabbitmq, _, dayjs, log } = require('@cowellness/cw-micro-service')()
const roleRulesConstants = require('../profile/constants/roleRules.constants')
const { GYM, superUser, nonBusiness } = require('../profile/profile.enum')

/**
 * @class RelationController
 * @classdesc Controller Relation
 */
class RelationController {
  constructor () {
    this.relation = db.auth.model('Relation')
    this.profile = db.auth.model('Profile')
    this.cwmodules = db.auth.model('CwModules')
    this.assigned = db.auth.model('assigned')
  }

  /**
   * get a relation by filter
   * @param {*} filter
   * @returns relation
   */
  find (filter) {
    return this.relation.find(filter)
  }

  /**
   * find relations by profile id
   * @param {*} id profile id
   * @returns relations
   */
  async findRelation (id) {
    const data = []
    const userIds = []
    const excludedFields = ['-password', '-qrCode', '-managedCountries', '-createdAt', '-updatedAt', '-ids']
    const relation = await this.relation.find({ $or: [{ leftProfileId: id }, { rightProfileId: id }] }).exec()
    relation.forEach((e) => {
      userIds.push(e.leftProfileId.toString() !== id ? e.leftProfileId.toString() : e.rightProfileId.toString())
    })

    const profiles = await this.profile.find({ _id: { $in: userIds } }, excludedFields).exec()

    relation.forEach((e) => {
      const userId = e.leftProfileId.toString() !== id ? e.leftProfileId.toString() : e.rightProfileId.toString()
      const user = profiles.filter((item) => {
        return item._id.toString() === userId
      })[0]
      data.push({
        _id: e._id.toString(),
        status: e.status,
        isInteresting: e.isInteresting,
        settings: e.settings,
        createdAt: e.createdAt,
        profile: user
      })
    })
    return data
  }

  /**
   * find relation left profile id
   * @param {*} id right profile id
   * @param {*} fields including fields
   * @returns relations
   */
  findLeftRelation (id, fields) {
    return this.relation.find({ rightProfileId: id }, fields).lean().exec()
  }

  // TODO - check timezone of gym
  managedProfileList (userId, startAt, endAt) {
    const statusFilter = [{ status: 'temporary' }, { status: 'active' }]
    return this.relation.find({ leftProfileId: userId, $on: statusFilter, roles: { $element: { startAt: { $gte: startAt }, endAt: { $lt: endAt } }, $on: statusFilter } }, 'rightProfileId._id rightProfileId.typeCode rightProfileId.avatar rightProfileId.company.name rightProfileId.company.brand rightProfileId.person.firstname rightProfileId.person.lastname rightProfileId.roles').populate('rightProfileId').exec()
  }

  /**
   * get a gym director relation
   * @param {*} gymId gym id
   * @returns relations
   */
  async getGymDirector (gymId) {
    const roles = await this.relation.find({ leftProfileId: gymId, 'roles.role': 'DI' }).populate('rightProfileId', '-password').lean().exec()
    // if (roles && roles.length > 0) {
    //   roles = roles.filter((e) => {
    //     if (e.roles && e.roles.length > 0) {
    //       const ind = e.roles.findIndex((r) => {
    //         return r.role === 'DI'
    //       })
    //       return (ind > -1)
    //     }
    //     return false
    //   })
    // }
    return roles
  }

  /**
   * checks if a profile is a director of provided gym id
   * @param {*} gymId
   * @param {*} profileId
   * @returns relation
   */
  async isGymDirector (gymId, profileId) {
    const roles = await this.relation.findOne({ leftProfileId: gymId, rightProfileId: profileId, 'roles.role': 'DI', status: { $in: ['temporary', 'active'] } }).populate('rightProfileId', '-password').lean().exec()
    return roles
  }

  /**
   * creates a relation between user and gym
   * @param {*} userId
   * @param {*} gymId
   * @param {*} invoiceId
   * @param {*} notes
   * @param {*} cwSalesman
   * @param {*} istemporary
   * @param {*} paymentTermId
   * @param {*} source
   * @param {*} friendId
   * @param {*} advType
   * @returns relation
   */
  async createUserAndGymRelation (userId, gymId, invoiceId, notes, cwSalesman, status, paymentTermId = undefined, source = undefined, friendId = undefined, advType = undefined) {
    const previousRelation = await this.relation.findOne({
      $or: [{
        leftProfileId: gymId,
        rightProfileId: userId
      }, {
        leftProfileId: userId,
        rightProfileId: gymId
      }]
    }, '_id').lean().exec()
    if (friendId) {
      const friend = this.profiles.findOne({
        _id: friendId,
        typeCode: {
          $in: ['IN', 'TU']
        }
      }, '_id').lean().exec()
      if (!friend) throw new Error('Friend Id is not valid')
    }
    if (previousRelation) throw new Error('Relationship already available')
    if (gymId === userId) throw new Error('User and Tutor id both cant be same')
    const newRelation = await this.relation.create({
      leftProfileId: gymId,
      rightProfileId: userId,
      status,
      leftProfileSettings: {
        notes: notes,
        vatRateForInvoiceId: invoiceId,
        referentProfileId: cwSalesman,
        paymentTermId,
        acquisitionChannel: {
          source,
          advType,
          friendId
        }
      }
    })
    return newRelation
  }

  /**
   * return active or temperory relation tutor for which profile is associated
   * @param {ObjectId} userId
   * @returns
   */
  async getUserTutor (userId) {
    let users = await this.relation.find({ rightProfileId: userId, status: { $in: ['temporary', 'active'] } }, '_id roles').populate('leftProfileId', '_id typeCode displayName ids person.firstname person.lastname person.birth person.gender person.addresses person.emails person.mobilePhones person.phones').lean().exec()
    users = users.filter((us) => {
      if (!us.roles || !us.roles.length) return false
      return us.roles.filter((ro) => { return ro.role === 'TT' && ['temporary', 'active'].includes(ro.status) && nonBusiness.includes(us.leftProfileId.typeCode) }).length > 0
    })
    return users.map((us) => { return us.leftProfileId })
  }

  /**
   * return active or temperory relation profiles for which Tutor is associated
   * @param {ObjectId} userId
   * @returns
   */
  async getTutorUsers (userId) {
    let users = await this.relation.find({ leftProfileId: userId, status: { $in: ['temporary', 'active'] } }, '_id roles').populate('rightProfileId', '_id displayName typeCode ids person.firstname person.lastname person.birth person.gender person.addresses person.emails person.mobilePhones person.phones').lean().exec()
    users = users.filter((us) => {
      if (!us.roles || !us.roles.length) return false
      return us.roles.filter((ro) => { return ro.role === 'TT' && ['temporary'].includes(ro.status) }).length > 0
    })
    return users.map((us) => { return us.rightProfileId })
  }

  /**
   * return active or temperory relation profiles for which Referent is associated
   * @param {ObjectId} userId
   * @returns
   */
  async getReferentUsers (userId) {
    let users = await this.relation.find({ rightProfileId: userId, status: { $in: ['temporary', 'active'] } }, '_id roles').populate('leftProfileId', '_id displayName ids typeCode company.name company.brand company.addresses company.emails company.phones').lean().exec()
    users = users.filter((us) => {
      if (!us.roles || !us.roles.length) return false
      return us.roles.filter((ro) => { return ro.role === 'RE' && ['temporary'].includes(ro.status) }).length > 0
    })
    return users.map((us) => { return us.rightProfileId })
  }

  /**
   * adds a tutor relation with user
   * @param {*} userId
   * @param {*} tutorId
   * @param {*} istemporary
   * @returns relation
   */
  async addTutor (userId, tutorId, istemporary = false) {
    const previousRelation = await this.relation.findOne({ leftProfileId: tutorId, rightProfileId: userId }, '_id roles').exec()
    const validation = await Promise.all([this.profile.findById(userId, 'typeCode').lean().exec(), this.profile.findById(tutorId, 'person typeCode settings').lean().exec()])
    if (!validation[0] || validation[0].typeCode !== 'IN') throw new Error('User profile is not in IN or information is not available')
    if (!validation[1] || ['IN', 'TU'].includes(validation[1].typeCode) === false) throw new Error('User profile is not in TU or information is not available')
    if (userId === tutorId) throw new Error('User and Tutor id both cant be same')
    // if (previousRelation) throw new Error('Relationship already available')
    let newRelation
    if (!previousRelation) {
      newRelation = await this.relation.create({ leftProfileId: tutorId, rightProfileId: userId, status: (istemporary ? 'temporary' : 'active'), roles: [{ status: (istemporary ? 'temporary' : 'active'), role: 'TT' }], settings: undefined })
    } else {
      previousRelation.status = (istemporary ? 'temporary' : 'active')
      if (previousRelation.roles && previousRelation.roles.length) {
        const index = previousRelation.roles.findIndex((rol) => {
          return rol.role === 'TT'
        })
        if (index > -1) {
          if (!previousRelation.roles[index].logs) previousRelation.roles[index].logs = []
          previousRelation.roles[index].logs.push({ status: previousRelation.roles[index].status.toString(), role: 'TT' })
          previousRelation.roles[index].status = (istemporary ? 'temporary' : 'active')
        } else {
          previousRelation.roles.push({ status: (istemporary ? 'temporary' : 'active'), role: 'TT' })
        }
      } else {
        previousRelation.roles = []
        previousRelation.roles.push({ status: (istemporary ? 'temporary' : 'active'), role: 'TT' })
      }
      newRelation = await previousRelation.save()
    }

    // add documents to documentSigned
    await ctr.contracts.createEmptySignedDocument([], userId)

    const template = await rabbitmq.sendAndRead('/settings/messages/get', { key: 'm1.tutor.confirmation-message', language: validation[1].settings.language, type: 'chat', data: validation[1] })
    if (!template) {
      throw new Error('Relation sucessfull, but chat template missing')
    }
    await rabbitmq.sendAndRead('/chat/message/create', { frontId: 'auth-' + Date.now(), fromProfileId: userId, fromManagerProfileId: userId, toProfileId: tutorId, content: { text: template.data, type: 'action' } })
    return newRelation
  }

  /**
   * Remove a tutor relation from user
   * @param {*} userId
   * @param {*} tutorId
   * @returns boolean
   */
  async removeTutor (userId, tutorId) {
    let saveRequired = false
    const previousRelation = await this.relation.findOne({ leftProfileId: tutorId, rightProfileId: userId }, '_id roles').exec()
    if (!previousRelation) throw new Error('Relationship does not exist')
    if (previousRelation.status !== 'suspended') {
      previousRelation.status = 'suspended'
      saveRequired = true
    }
    if (previousRelation.roles && previousRelation.roles.length) {
      previousRelation.roles.forEach((r) => {
        if (r.role === 'TT' && r.status !== 'suspended') {
          if (!r.logs) r.logs = []
          r.logs.push({ status: r.status.toString(), role: 'TT' })
          r.status = 'suspended'
          saveRequired = true
        }
      })
    }
    if (saveRequired) previousRelation.save()
    await ctr.contracts.createEmptySignedDocument([], userId)
    return true
  }

  /**
   * updates a user and gym relation
   * @param {*} gymId
   * @param {*} userId
   * @param {*} invoiceId
   * @param {*} notes
   * @param {*} cwSalesman
   * @returns
   */
  async updateUserAndGymRelation (gymId, userId, invoiceId, notes, cwSalesman) {
    const previousRelation = await this.relation.findOne({
      $or: [{
        leftProfileId: userId,
        rightProfileId: gymId
      }, {
        leftProfileId: gymId,
        rightProfileId: userId
      }]
    }).exec()
    if (!previousRelation) throw new Error('Relationship is not available')
    const settingKey = previousRelation.leftProfileId.toString() === userId ? 'leftProfileSettings' : 'rightProfileSettings'
    _.set(previousRelation, `${settingKey}.notes`, notes)
    _.set(previousRelation, `${settingKey}.vatRateForInvoiceId`, invoiceId)
    _.set(previousRelation, `${settingKey}.referentProfileId`, cwSalesman)
    await previousRelation.save()
    return previousRelation
  }

  /**
   * update relation data between profile and gym
   * @param {*} profileId
   * @param {*} invoiceId
   * @param {*} notes
   * @param {*} cwSalesman
   * @param {*} creatingGym
   * @param {*} paymentTermId
   * @param {*} source
   * @param {*} friendId
   * @param {*} advType
   * @returns relation
   */
  async updateProfilewithGymRelation (profileId, invoiceId, notes, cwSalesman, creatingGym, paymentTermId = undefined, source = undefined, friendId = undefined, advType = undefined) {
    const previousRelation = await this.relation.findOne({
      $or: [{
        rightProfileId: profileId,
        leftProfileId: creatingGym
      }, {
        leftProfileId: profileId,
        rightProfileId: creatingGym
      }]
    }).exec()
    if (!previousRelation) throw new Error('Relationship is not available')
    const settingKey = previousRelation.leftProfileId.toString() === creatingGym ? 'leftProfileSettings' : 'rightProfileSettings'
    _.set(previousRelation, `${settingKey}.notes`, notes)
    _.set(previousRelation, `${settingKey}.vatRateForInvoiceId`, invoiceId)
    _.set(previousRelation, `${settingKey}.referentProfileId`, cwSalesman)
    _.set(previousRelation, `${settingKey}.paymentTermId`, paymentTermId)
    _.set(previousRelation, `${settingKey}.acquisitionChannel.source`, source)
    _.set(previousRelation, `${settingKey}.acquisitionChannel.advType`, advType)
    _.set(previousRelation, `${settingKey}.acquisitionChannel.friendId`, friendId)
    await previousRelation.save()
    return previousRelation
  }

  /**
   * convert string to date
   * @param {*} str
   * @returns Date
   */
  parseToDate (str) {
    str = str.toString()
    const y = str.substring(0, 4)
    const m = str.substring(4, 6) - 1
    const d = str.substring(6, 8)
    return new Date(y, m, d)
  }

  /**
   * adds a role to user with gym
   * @param {*} gymId
   * @param {*} userId
   * @param {*} role
   * @param {*} startAt
   * @param {*} endAt
   * @param {*} status
   * @returns relation
   */
  async createGymAndRoleRelation (gymId, userId, role, startAt, endAt, status) {
    if (userId === gymId) throw new Error('User and gymId cant be same')
    const previousRelation = await this.relation.findOne({ leftProfileId: gymId, rightProfileId: userId }).exec()
    if (startAt) startAt = this.parseToDate(startAt)
    if (endAt) endAt = this.parseToDate(endAt)
    if (previousRelation && previousRelation.roles && previousRelation.roles.length) {
      if (previousRelation.roles.filter((e) => { return e.role === role && e.status !== 'suspended' }).length > 0) {
        throw new Error('Relationship already available')
      }
    }

    const validationCheck = await Promise.all([this.profile.findById(gymId).lean().exec(), this.profile.findById(userId).lean().exec()])
    if (!validationCheck[0] || !validationCheck[1]) {
      throw new Error('Unable to find reference for gymId or userId')
    }
    if (validationCheck[0].typeCode !== 'CO' && !GYM.includes(validationCheck[0].typeCode)) throw new Error('Type code is invalid for GymId')
    if (validationCheck[1].typeCode !== 'IN') throw new Error('Type code is invalid for userId')
    gymId = validationCheck[0]._id
    userId = validationCheck[1]._id
    const user = validationCheck[1]
    user.password = undefined
    let newRelation

    if (previousRelation) {
      if (!previousRelation.roles) previousRelation.roles = []
      let isPresent = false
      previousRelation.roles.forEach((r) => {
        if (r.role === role) {
          const previous = r.toObject()
          isPresent = true
          r.startAt = startAt
          r.endAt = endAt
          r.status = status
          if (!r.logs) r.logs = []
          r.logs.push({ status: previous.status, changedAt: Date.now(), startAt: previous.startAt, endAt: previous.endAt })
        }
      })
      if (!isPresent) previousRelation.roles.push({ role: role, startAt: startAt, endAt: endAt })
      newRelation = await previousRelation.save()
    } else {
      newRelation = await this.relation.create({ leftProfileId: gymId, rightProfileId: userId, status: status, roles: { role: role, startAt: startAt, endAt: endAt } })
    }

    // add documents to documentSigned
    await ctr.contracts.createEmptySignedDocument([gymId], userId, validationCheck[0].company.country)
    if (role) {
      // const roleName = roleRulesConstants.find(r => r.code === role).name
      await this.sendRoleNotification(gymId, userId, role, user.settings.language)
    }
    const template = await rabbitmq.sendAndRead('/settings/messages/get', { key: 'm1.login.welcome-message', language: user.settings.language, type: 'chat', data: user })
    if (!template) {
      throw new Error('Relation sucessfull, but chat template missing')
    }
    await rabbitmq.sendAndRead('/chat/message/create', { frontId: 'auth-' + Date.now(), fromProfileId: gymId.toString(), fromManagerProfileId: gymId.toString(), toProfileId: userId.toString(), content: { text: template.data, type: 'text' } })
    return newRelation
  }

  /**
   * add multiple roles to a relation
   * @param {*} gymId
   * @param {*} userId
   * @param {Object} roles
   * @returns relation
   */
  async bulkAddUpdateRoles (gymId, userId, roles) {
    if (!roles || !roles.length) return null
    if (userId === gymId) throw new Error('User and gymId cant be same')
    const previousRelation = await this.relation.findOne({ leftProfileId: gymId, rightProfileId: userId }).exec()
    const [gym, user] = await Promise.all([this.profile.findById(gymId).lean().exec(), this.profile.findById(userId, '-password').lean().exec()])
    if (!gym || !user) {
      throw new Error('Unable to find reference for gymId or userId')
    }
    if (gym.typeCode !== 'CO' && !GYM.includes(gym.typeCode)) throw new Error('Type code is invalid for GymId')
    if (user.typeCode !== 'IN') throw new Error('Type code is invalid for userId')
    let newRelation
    let newRoles = []
    if (previousRelation) {
      if (!previousRelation.roles) previousRelation.roles = []
      for (const role of roles) {
        if (role.startAt) role.startAt = this.parseToDate(role.startAt)
        if (role.endAt) role.endAt = this.parseToDate(role.endAt)
        let isPresent = false
        previousRelation.roles.forEach((r) => {
          if (r.role === role.role) {
            const previous = r.toObject()
            isPresent = true
            r.startAt = role.startAt
            r.endAt = role.endAt
            r.status = role.status
            if (!r.logs) r.logs = []
            r.logs.push({ status: previous.status, changedAt: Date.now(), startAt: previous.startAt, endAt: previous.endAt })
          }
        })
        if (!isPresent) { newRoles.push(role.role); previousRelation.roles.push({ role: role.role, startAt: role.startAt, endAt: role.endAt }) }
      }
      newRelation = await previousRelation.save()
    } else {
      newRoles = roles.map((role) => { return role.role })
      newRelation = await this.relation.create({ leftProfileId: gymId, rightProfileId: userId, roles })
    }
    if (newRoles.length) {
      const template = await rabbitmq.sendAndRead('/settings/messages/get', { key: 'm1.login.welcome-message', language: user.settings.language, type: 'chat', data: user })
      if (!template) {
        throw new Error('Relation sucessfull, but chat template missing')
      }
      await rabbitmq.sendAndRead('/chat/message/create', { frontId: 'auth-' + Date.now(), fromProfileId: gymId.toString(), fromManagerProfileId: gymId.toString(), toProfileId: userId.toString(), content: { text: template.data, type: 'text' } })
      for (const role of newRoles) {
        await this.sendRoleNotification(gymId, userId, role, user.settings.language)
      }
    }
    return newRelation
  }

  /**
   * sends a notification on role addition
   * @param {*} gymId
   * @param {*} userId
   * @param {*} role
   * @param {*} language
   */
  async sendRoleNotification (gymId, userId, role, language) {
    const roleName = roleRulesConstants.find(r => r.code === role).name
    const { data: acceptRoleMessage } = await rabbitmq.sendAndRead('/settings/messages/get', {
      key: 'm1.relation.role-acceptance',
      language,
      type: 'chat',
      data: {
        role: roleName
      }
    })
    await rabbitmq.sendAndRead('/chat/message/action/create', {
      frontId: `auth-${Date.now()}`,
      fromProfileId: gymId,
      toProfileId: userId,
      content: {
        type: 'action',
        text: acceptRoleMessage,
        actions: [
          {
            label: 'global.accept',
            showTo: ['to'],
            frontend: {
              function: 'acceptRole',
              params: {
                role
              }
            },
            backend: {}
          },
          {
            label: 'global.decline',
            showTo: ['to'],
            frontend: {},
            backend: {}
          }
        ]
      }
    })
  }

  /**
   * remove relaions by profile id
   * @param {*} id profile id
   */
  async removeGymRelationById (id) {
    await this.relation.deleteMany({ $or: [{ leftProfileId: id }, { rightProfileId: id }] }).exec()
  }

  /**
   * suspend multiple roles
   * @param {*} gymId
   * @param {*} userId
   * @param {*} roles [id]
   * @returns boolean
   */
  async bulkDeleteRoles (gymId, userId, roles) {
    if (!roles || !roles.length) return null
    const previousRelation = await this.relation.findOne({ leftProfileId: gymId, rightProfileId: userId }).exec()
    if (previousRelation && previousRelation.roles && previousRelation.roles.length) {
      previousRelation.roles.forEach((e) => {
        if (roles.includes(e.role)) {
          const previous = e.toObject()
          e.status = 'suspended'
          if (!e.logs) e.logs = []
          e.logs.push({ status: previous.status, changedAt: Date.now(), startAt: previous.startAt, endAt: previous.endAt })
        }
      })
      await previousRelation.save()
    }
    return true
  }

  /**
   * Suspend a role in a relation
   * @param {*} gymId
   * @param {*} userId
   * @param {*} role
   * @returns boolean
   */
  async removeGymAndRoleRelation (gymId, userId, role) {
    const previousRelation = await this.relation.findOne({ leftProfileId: gymId, rightProfileId: userId }).exec()
    if (previousRelation && previousRelation.roles && previousRelation.roles.length) {
      if (previousRelation.roles.filter((e) => { return e.role === role }).length > 0) {
        previousRelation.roles.forEach((e) => {
          if (e.role === role) {
            const previous = e.toObject()
            e.status = 'suspended'
            if (!e.logs) e.logs = []
            e.logs.push({ status: previous.status, changedAt: Date.now(), startAt: previous.startAt, endAt: previous.endAt })
          }
        })
        // if (previousRelation.roles.length === 0) {
        //   await this.relation.deleteOne({ leftProfileId: gymId, rightProfileId: userId })
        // } else {
        await previousRelation.save()
        // }
      }
    }
    return true
  }

  /**
   * update a role in a relation
   * @param {*} gymId
   * @param {*} userId
   * @param {*} role
   * @param {*} startAt
   * @param {*} endAt
   * @param {*} status
   * @returns boolean
   */
  async updateGymAndRoleRelation (gymId, userId, role, startAt, endAt, status) {
    const previousRelation = await this.relation.findOne({ leftProfileId: gymId, rightProfileId: userId }).exec()
    if (startAt) startAt = this.parseToDate(startAt)
    if (endAt) endAt = this.parseToDate(endAt)
    if (!previousRelation) throw new Error('Relationship doesnt exist')
    previousRelation.status = status
    previousRelation.roles.filter((e) => {
      if (e.role === role) {
        e.startAt = startAt
        e.endAt = endAt
      }
      return e
    })
    await previousRelation.save()
    await ctr.contracts.createEmptySignedDocument(gymId, userId)
    return true
  }

  /**
   * get roles in a relation
   * @param {*} gymId
   * @param {*} userId
   * @returns roles
   */
  async getGymNUserRole (gymId, userId) {
    const relationShip = await this.relation.find({ leftProfileId: gymId, rightProfileId: userId }, 'roles').lean().exec()
    const role = []
    if (relationShip && relationShip.length) {
      const todayDate = new Date()
      const lessOneDay = new Date()
      lessOneDay.setDate(lessOneDay.getDate() - 1)
      const plusOneDay = new Date()
      plusOneDay.setDate(plusOneDay.getDate() + 1)
      relationShip.forEach((re) => {
        if (re.roles) {
          re.roles.forEach((r) => {
            const startDate = r.startAt ? new Date(r.startAt) : lessOneDay
            const endDate = r.endAt ? new Date(r.endAt) : plusOneDay
            if ((r.status === 'active' || r.status === 'temporary') && (startDate.getTime() < todayDate.getTime() && endDate.getTime() > todayDate.getTime())) {
              role.push(r.role)
            }
          })
        }
      })
    }
    return role
  }

  /**
   * get user relations with gyms
   * @param {*} userId
   * @returns relations
   */
  async gymUserGymRelations (userId) {
    return await this.relation.find({ rightProfileId: userId, roles: { $elemMatch: { role: { $in: ['DI', 'OP', 'SP', 'PT', 'CT', 'SA', 'CL'] } } } }, 'roles.role roles.startAt roles.status roles.endAt roles.logs').populate('leftProfileId', '_id avatar ids typeCode settings displayName company.brand company.name').lean().exec()
  }

  /**
   * get gym relations with businesses
   * @param {*} gymId
   * @returns relations
   */
  async gymBusinessUser (gymId) {
    return await this.relation.find({ leftProfileId: gymId, roles: { $elemMatch: { role: { $in: ['DI', 'OP', 'SP', 'PT', 'CT', 'SA', 'CL'] } } } }, 'roles.role roles.startAt roles.status roles.endAt roles.logs').populate('rightProfileId', '_id avatar ids typeCode settings displayName person.firstname person.lastname person.mobilePhones person.emails').lean().exec()
  }

  /**
   * get relation
   * @param {*} leftProfile id
   * @param {*} rightProfile id
   * @returns relation
   */
  async relationDetail (leftProfile, rightProfile) {
    return await this.relation.findOne({ leftProfileId: leftProfile, rightProfileId: rightProfile }, 'status roles.role roles.startAt roles.status roles.endAt roles.logs').lean().exec()
  }

  /**
   * get all unassigned users
   * @param {*} gymId
   * @returns profiles
   */
  async unassignedGymUser (gymId) {
    let relations
    let assigned = []
    const assignedLst = await this.assigned.find({ ownerId: gymId }, 'relatedProfiles').lean().exec()
    assignedLst.forEach((a) => {
      if (a.relatedProfiles) {
        assigned = assigned.concat(a.relatedProfiles.map((re) => { return re.profileId }))
      }
    })
    if (assigned.length) {
      relations = await this.relation.find({ leftProfileId: gymId, rightProfileId: { $nin: assigned } }, 'rightProfileId').lean().exec()
    } else {
      relations = await this.relation.find({ leftProfileId: gymId }, 'rightProfileId').lean().exec()
    }
    relations = relations.map((r) => { return r.rightProfileId })
    if (!relations.length) return []
    return await this.profile.find({ typeCode: { $in: ['IN', 'TU'] }, _id: { $in: relations } }, '_id avatar typeCode settings displayName person.firstname person.lastname').lean().exec()
  }

  /**
   * get assigned users
   * @param {*} gymId
   * @param {*} profileIds
   * @returns assigned data
   */
  async getAssignedUser (gymId, profileIds) {
    return await this.assigned.find({ ownerId: gymId, profileId: { $in: profileIds } }, 'relatedProfiles profileId').populate('relatedProfiles.profileId', '_id person settings typeCode status avatar displayName').lean().exec()
  }

  /**
   * assign a profile
   * @param {*} gymId
   * @param {*} toProfile
   * @param {*} profileId
   * @param {*} role
   * @param {*} createdBy
   * @returns assigned data
   */
  async assignProfile (gymId, toProfile, profileId, role, createdBy) {
    if (toProfile === profileId) {
      throw new Error('toProfile and ProfileId both can not be same')
    }
    const assignedProfile = await this.assigned.findOne({ ownerId: gymId, profileId: toProfile }).exec()
    const [verify, profile] = await Promise.all([this.relation.find({ leftProfileId: gymId, rightProfileId: toProfile, roles: { $elemMatch: { role: { $in: ['PT', 'CT', 'SA'] } } } }, 'roles').lean().exec(), this.profile.findById(profileId, 'typeCode').exec()])
    if (!verify || !verify.length) {
      throw new Error('Assiging profile does not belong to SA / TR')
    }
    if (!profile || !['IN', 'TU'].includes(profile.typeCode)) {
      throw new Error('Profile should be in IN / TU typeCode')
    }
    if (assignedProfile) {
      if (assignedProfile.relatedProfiles && assignedProfile.relatedProfiles.length && assignedProfile.relatedProfiles.findIndex((re) => { return re.profileId === profileId && re.role === role }) > -1) {
        throw new Error('Relationship already present')
      } else {
        if (!assignedProfile.relatedProfiles) assignedProfile.relatedProfiles = []
        assignedProfile.relatedProfiles.push({ profileId: profileId, role, createdBy: createdBy })
        return await assignedProfile.save()
      }
    } else {
      return await this.assigned.create({
        ownerId: gymId,
        profileId: toProfile,
        relatedProfiles: [{ profileId: profileId, role, createdBy: createdBy }]
      })
    }
  }

  /**
   * unassign a profile with gym
   * @param {*} gymId
   * @param {*} toProfile
   * @param {*} profileId
   * @param {*} role
   * @param {*} createdBy
   * @returns assigned profile
   */
  async unassignProfile (gymId, toProfile, profileId, role, createdBy) {
    const assignedProfile = await this.assigned.findOne({ ownerId: gymId, profileId: toProfile }).exec()
    if (assignedProfile) {
      if (assignedProfile.relatedProfiles && assignedProfile.relatedProfiles.length && assignedProfile.relatedProfiles.findIndex((re) => { return re.profileId.toString() === profileId }) > -1) {
        assignedProfile.relatedProfiles = assignedProfile.relatedProfiles.filter((rel) => { return rel.profileId.toString() !== profileId && rel.role === role })
        return await assignedProfile.save()
      } else {
        throw new Error('Relationship does not exist')
      }
    } else {
      throw new Error('Relationship does not exist')
    }
  }

  /**
   * get a gym relations
   * @param {*} id
   * @returns relations
   */
  async getGymRelationById (id) {
    const relationShip = await this.relation.find({ leftProfileId: id }).populate('rightProfileId', 'person settings typeCode status avatar displayName').lean().exec()
    return relationShip
  }

  /**
   * get relation details
   * @param {*} id
   * @returns relation
   */
  async getGymAddtionalDetails (id) {
    const details = await this.relation.findOne({ rightProfileId: id }).lean().exec()
    return details
  }

  /**
   * get a list of gyms
   * @param {*} id profile id
   * @returns relations
   */
  async getGymList (id) {
    let relationShip = []
    const user = await this.profile.findById(id, 'typeCode').lean().exec()
    if (user.typeCode === 'CH') {
      const gyms = await this.profile.find({ typeCode: { $in: GYM } }, 'company settings typeCode status avatar parentId').lean().exec()
      if (gyms && gyms.length) {
        relationShip = gyms.map((g) => {
          return { rightProfileId: g }
        })
      }
    } else if (['CW', 'CU'].includes(user.typeCode)) {
      const gyms = await this.profile.find({ typeCode: { $in: GYM }, createdByProfileId: id }, 'company settings typeCode status avatar parentId').lean().exec()
      if (gyms && gyms.length) {
        relationShip = gyms.map((g) => {
          return { rightProfileId: g }
        })
      }
    } else {
      relationShip = await this.relation.find({ leftProfileId: id }, 'rightProfileId').populate('rightProfileId', 'company settings typeCode status avatar parentId').lean().exec()
      if (relationShip && relationShip.length > 0) {
        relationShip = relationShip.filter((e) => {
          if (e && e.rightProfileId && GYM.includes(e.rightProfileId.typeCode)) return true
          return false
        })
      }
      let roleBasedRelation = await this.relation.find({ rightProfileId: id }, 'leftProfileId roles').populate('leftProfileId', 'company settings typeCode status avatar parentId').lean().exec()
      if (roleBasedRelation && roleBasedRelation.length > 0) {
        const todayDate = new Date()
        const lessOneDay = new Date()
        lessOneDay.setDate(lessOneDay.getDate() - 1)
        const plusOneDay = new Date()
        plusOneDay.setDate(plusOneDay.getDate() + 1)

        roleBasedRelation = roleBasedRelation.filter((e) => {
          if (e && e.leftProfileId && e.roles && e.roles.length && GYM.includes(e.leftProfileId.typeCode)) {
            const role = e.roles.filter((role) => {
              const startDate = role.startAt ? new Date(role.startAt) : lessOneDay
              const endDate = role.endAt ? new Date(role.endAt) : plusOneDay
              if ((role.status === 'active' || role.status === 'temporary') && (startDate.getTime() < todayDate.getTime() && endDate.getTime() > todayDate.getTime())) {
                return true
              }
              return false
            })
            if (role.length) return true
          }
          return false
        })
      }
      if (roleBasedRelation && roleBasedRelation.length) {
        roleBasedRelation.forEach((roleB) => {
          let isPresent = false
          relationShip.forEach((r) => {
            if (r.rightProfileId._id.toString() === roleB.leftProfileId._id.toString()) {
              isPresent = true
            }
          })
          if (!isPresent) {
            relationShip.push({ rightProfileId: roleB.leftProfileId })
          }
        })
      }
    }
    const gymList = relationShip.map((e) => {
      return e.rightProfileId._id
    })

    const cwmodules = await this.cwmodules.find({ profileId: { $in: gymList } }).lean().exec()
    if (cwmodules && cwmodules.length > 0) {
      relationShip.forEach((r) => {
        if (r.rightProfileId) {
          const cw = cwmodules.filter((cw) => {
            return cw.profileId.toString() === r.rightProfileId._id.toString()
          })
          if (cw && cw.length > 0) {
            r.rightProfileId.cwModules = []
            cw.forEach((m) => {
              r.rightProfileId.cwModules.push(m.modules)
            })
          }
        }
      })
    }
    return relationShip.map((e) => { return e.rightProfileId })
  }

  /**
   * create relation
   */
  async buildRelation (selfId, scanId) {
    const relation = await this.verifyUserRelation(selfId, scanId)
    let leftProfileId, rightProfileId
    if (relation) {
      throw new Error('Relationship is already available, please re-verify details')
    }
    const users = await Promise.all([this.profile.findById(selfId, '_id typeCode').lean().exec(), this.profile.findById(scanId, '_id typeCode').lean().exec()])
    if (!users[0] || !users[1]) throw new Error('Please verify userId')

    // keep business profile left
    if ((!GYM.includes(users[0].typeCode) && GYM.includes(users[1].typeCode)) || (users[0].typeCode === 'IN' && ['TU', 'CO'].includes(users[1].typeCode))) {
      leftProfileId = scanId
      rightProfileId = selfId
    } else {
      leftProfileId = selfId
      rightProfileId = scanId
    }
    if ((nonBusiness.includes(users[0].typeCode) && nonBusiness.includes(users[1].typeCode)) || (GYM.includes(users[0].typeCode) && GYM.includes(users[1].typeCode)) || (users[0].typeCode === 'CO' && GYM.includes(users[1].typeCode)) || (GYM.includes(users[0].typeCode) && users[1].typeCode === 'CO')) {
      const newRelation = await this.relation.create({ leftProfileId: leftProfileId, rightProfileId: rightProfileId, status: 'active' })
      return newRelation
    } else if ((['IN', 'TU'].includes(users[0].typeCode) && GYM.includes(users[1].typeCode)) || (GYM.includes(users[0].typeCode) && ['IN', 'TU'].includes(users[1].typeCode))) {
      const newRelation = await this.relation.create({ leftProfileId: leftProfileId, rightProfileId: rightProfileId, status: 'temporary' })
      return newRelation
    } else {
      throw new Error('Scenario with this typeCode combination not configured, Please add the same')
    }
  }

  /**
   * set relation as active
   * @param {*} selfId
   * @param {*} scanId
   * @returns relation
   */
  async activateRelation (selfId, scanId) {
    const relation = await this.verifyUserRelation(selfId, scanId)
    if (!relation) {
      throw new Error('Please re-verify relationship, it is not available in system')
    }
    // if (relation.status !== 'temporary') throw new Error('Status can only be activate from status temporary')
    const relationDetail = await this.relation.findById(relation._id)
    relationDetail.status = 'active'
    await relationDetail.save()
    relation.status = 'active'
    return relation
  }

  /**
   * get list of profiles with relation
   * @param {*} id profile id
   * @returns profiles
   */
  async getProfileList (id) {
    const statusFilter = [{ status: 'temporary' }, { status: 'active' }]
    const roles = await this.relation.find({ rightProfileId: id }, 'roles leftProfileId rightProfileId').or(statusFilter).populate('leftProfileId', 'person company settings typeCode status avatar displayName').lean().exec()
    const userProfileList = []
    const todayDate = new Date()
    const lessOneDay = new Date()
    lessOneDay.setDate(lessOneDay.getDate() - 1)
    const plusOneDay = new Date()
    plusOneDay.setDate(plusOneDay.getDate() + 1)
    const userInfo = await ctr.profile.findById(id)
    userInfo.role = []
    userProfileList.push(userInfo)
    if (roles && roles.length) {
      roles.forEach((e) => {
        if (e.roles && e.roles.length) {
          const role = []
          e.roles.forEach((r) => {
            if (r.role === 'CL') return // CL should not be listed in profile and should not be allowed to switch profile
            const startDate = r.startAt ? new Date(r.startAt) : lessOneDay
            const endDate = r.endAt ? new Date(r.endAt) : plusOneDay
            if ((r.status === 'active' || r.status === 'temporary') && (startDate.getTime() < todayDate.getTime() && endDate.getTime() > todayDate.getTime())) {
              role.push({
                role: r.role,
                status: r.status
              })
            }
          })
          if (role.length > 0) {
            e.leftProfileId.role = role
            e.leftProfileId.isBusiness = !nonBusiness.includes(e.leftProfileId.typeCode)
            userProfileList.push(e.leftProfileId)
          }
        }
      })
    }
    return userProfileList
  }

  /**
   * get a relation
   * @param {*} selfId
   * @param {*} scanId
   * @returns relation
   */
  async verifyUserRelation (selfId, scanId) {
    const result = await this.relation.findOne({ $or: [{ leftProfileId: selfId, rightProfileId: scanId }, { leftProfileId: scanId, rightProfileId: selfId }] }, '_id status roles blockedBy blockedAt isInteresting').populate('rightProfileId', '_id status typecode company.name person.firstname person.lastname').populate('leftProfileId', '_id status typecode company.name person.firstname person.lastname').lean().exec()
    return result
  }

  /**
   * create a temporary relation skip validation
   * @param {*} data
   * @returns
   */
  async createTemporaryRelation (data) {
    const Relation = this.relation
    const existing = await Relation.findOne({
      leftProfileId: data.leftProfileId,
      rightProfileId: data.rightProfileId
    })

    if (existing) {
      return existing
    }
    const relation = new Relation(data)

    return relation.save({
      validateBeforeSave: false
    })
  }

  /**
   * Publish in rabbitmq exchange new or updated relation
   *
   * @param {Object} relation
   */
  async sendRelationToBroadcast ({ _id }) {
    const relation = await this.relation.findById(_id)
    rabbitmq.publish({ model: 'relation', data: { relation } })
  }

  /**
   * returns profile of non business users associated with profileid passed
   * @param {id} profileId
   */
  async getNonGYMRelation (profileId) {
    let relations = await this.relation.find({ rightProfileId: profileId }, 'leftProfileId roles').populate('leftProfileId', '_id status typeCode company.name person.firstname person.lastname settings avatar').lean().exec()
    relations = relations.filter((r) => {
      return !GYM.includes(r.leftProfileId.typeCode)
    })
    return relations.map((r) => {
      r.leftProfileId.roles = r.roles
      return r.leftProfileId
    })
  }

  /**
  * Block user via relation
  * @param {ObjectId} blockUser - user who needs to be blocked
  * @param {ObjectId} blockedBy - user who is blocking
  */
  async block (blockUser, blockedBy) {
    let relation = await this.relation.findOne({ $or: [{ leftProfileId: blockUser, rightProfileId: blockedBy }, { leftProfileId: blockedBy, rightProfileId: blockUser }] }).populate('leftProfileId', '_id typeCode').populate('rightProfileId', '_id typeCode').exec()
    if (!relation) throw new Error('relation ship not available between profile')
    if (relation.blockedBy) throw new Error('relationship already blocked')
    if (relation.status === 'temporary') throw new Error('Relationship status is temporary')
    if ((relation.leftProfileId._id.toString() === blockUser && superUser.includes(relation.leftProfileId.typeCode)) || (relation.rightProfileId._id.toString() === blockUser && superUser.includes(relation.rightProfileId.typeCode))) {
      throw new Error("Cowellness profiles can't be blocked")
    }
    relation = await this.relation.findById(relation._id.toString())
    relation.status = 'suspended'
    relation.blockedBy = blockedBy
    relation.blockedAt = new Date()
    await relation.save()
    return true
  }

  /**
  * unBlock user via relation
  * @param {ObjectId} unblockUser - user who needs to be unblocked
  * @param {ObjectId} unblockedBy - user who is unblocking
  */
  async unblock (unblockUser, unblockedBy) {
    let relation = await this.relation.findOne({ $or: [{ leftProfileId: unblockUser, rightProfileId: unblockedBy }, { leftProfileId: unblockedBy, rightProfileId: unblockUser }] }).populate('leftProfileId', '_id typeCode').populate('rightProfileId', '_id typeCode').exec()
    if (!relation) throw new Error('relation ship not available between profile')
    if (!relation.blockedBy) throw new Error('relationship not blocked earlier')
    if (relation.blockedBy.toString() !== unblockedBy) throw new Error('Only blocked user is allowed to unblock')
    relation = await this.relation.findById(relation._id.toString())
    relation.blockedBy = undefined
    relation.blockedAt = undefined
    relation.status = 'active'
    await relation.save()
    return true
  }

  /**
   * set isInteresting flag
   * @param {*} data {profileId, value}
   * @returns boolean
   */
  async setIsInteresting (data) {
    // TODO: permissions to allow only Director, Operator, Salesman to change
    const profileId = data._user.profileId
    const relationProfile = data.profileId
    const value = data.value
    let relation = await this.relation.findOne({
      $or: [{
        leftProfileId: profileId, rightProfileId: relationProfile
      }, {
        leftProfileId: relationProfile, rightProfileId: profileId
      }]
    }).populate('leftProfileId', '_id typeCode').populate('rightProfileId', '_id typeCode').exec()

    if (!relation) throw new Error('relation not available between profiles')
    const validTypeCodes = ['IN', 'TU']
    const userProfile = relation.leftProfileId._id === relationProfile ? relation.leftProfileId : relation.rightProfileId
    if (!validTypeCodes.includes(userProfile.typeCode)) {
      throw new Error('relation is not of type IN or TU')
    }
    relation = await this.relation.findById(relation._id.toString())
    relation.isInteresting = value
    await relation.save()
    return value
  }

  /**
   * send a welcome message based on status and typecode
   * @param {*} relation
   */
  async sendWelcomeMessage (relation) {
    if (!relation.wasNew) {
      return null
    }
    const inviter = await this.profile.findById(relation.leftProfileId.toString(), 'typeCode settings')
    const invitee = await this.profile.findById(relation.rightProfileId.toString(), 'typeCode settings')
    if (relation.status === 'active') {
      if (['IN', 'TU', 'CO'].includes(inviter.typeCode) && ['IN', 'TU', 'CO'].includes(invitee.typeCode)) {
        this.sendChatMessageByTemplateId({
          templateId: 'chat.user-user-active.invite-welcome-message',
          inviter,
          invitee
        })
      } else if (['GY', 'GU', 'SI'].includes(inviter.typeCode) && ['GY', 'GU', 'SI'].includes(invitee.typeCode)) {
        this.sendChatMessageByTemplateId({
          templateId: 'chat.business-business-active.invite-welcome-message',
          inviter,
          invitee
        })
      } else if (['GY', 'GU', 'SI'].includes(inviter.typeCode) && ['CO'].includes(invitee.typeCode)) {
        this.sendChatMessageByTemplateId({
          templateId: 'chat.business-company-active.invite-welcome-message',
          inviter,
          invitee
        })
      } else if (['GH', 'GY', 'GU', 'SI'].includes(inviter.typeCode) && ['IN', 'TU'].includes(invitee.typeCode)) {
        this.sendChatMessageByTemplateId({
          templateId: 'chat.business-user-active.invite-welcome-message',
          inviter,
          invitee,
          data: {}
        })
      } else if (['CH', 'CW', 'CU'].includes(inviter.typeCode) && ['GH', 'GY', 'GU', 'SI'].includes(invitee.typeCode)) {
        this.sendChatMessageByTemplateId({
          templateId: 'chat.cw-business-active.invite-welcome-message',
          inviter,
          invitee
        })
      }
    } else if (relation.status === 'temporary') {
      if (['IN', 'TU', 'CO'].includes(inviter.typeCode) && ['IN', 'TU', 'CO'].includes(invitee.typeCode)) {
        this.sendChatMessageByTemplateId({
          templateId: 'chat.user-user-temporary.invite-welcome-message',
          inviter,
          invitee,
          actions: [
            {
              label: 'global.like',
              showTo: ['to'],
              frontend: {},
              backend: {}
            },
            {
              label: 'global.dislike',
              showTo: ['to'],
              frontend: {},
              backend: {}
            }
          ]
        })
      } else if (['GY', 'GU', 'SI'].includes(inviter.typeCode) && ['GY', 'GU', 'SI'].includes(invitee.typeCode)) {
        this.sendChatMessageByTemplateId({
          templateId: 'chat.business-business-temporary.invite-welcome-message',
          inviter,
          invitee,
          actions: [
            {
              label: 'global.like',
              showTo: ['to'],
              frontend: {},
              backend: {}
            },
            {
              label: 'global.dislike',
              showTo: ['to'],
              frontend: {},
              backend: {}
            }
          ]
        })
      } else if (['GY', 'GU', 'SI'].includes(inviter.typeCode) && ['CO'].includes(invitee.typeCode)) {
        this.sendChatMessageByTemplateId({
          templateId: 'chat.business-company-temporary.invite-welcome-message',
          inviter,
          invitee,
          actions: [
            {
              label: 'global.like',
              showTo: ['to'],
              frontend: {},
              backend: {}
            },
            {
              label: 'global.dislike',
              showTo: ['to'],
              frontend: {},
              backend: {}
            }
          ]
        })
      } else if (['GH', 'GY', 'GU', 'SI'].includes(inviter.typeCode) && ['IN', 'TU'].includes(invitee.typeCode)) {
        this.sendChatMessageByTemplateId({
          templateId: 'chat.business-user-temporary.invite-welcome-message',
          inviter,
          invitee,
          data: {},
          actions: [
            {
              label: 'global.like',
              showTo: ['to'],
              frontend: {},
              backend: {}
            },
            {
              label: 'global.dislike',
              showTo: ['to'],
              frontend: {},
              backend: {}
            }
          ]
        })
      } else if (['CH', 'CW', 'CU'].includes(inviter.typeCode) && ['GH', 'GY', 'GU', 'SI'].includes(invitee.typeCode)) {
        this.sendChatMessageByTemplateId({
          templateId: 'chat.cw-business-temporary.invite-welcome-message',
          inviter,
          invitee,
          actions: [
            {
              label: 'global.like',
              showTo: ['to'],
              frontend: {},
              backend: {}
            },
            {
              label: 'global.dislike',
              showTo: ['to'],
              frontend: {},
              backend: {}
            }
          ]
        })
      }
    }
  }

  /**
   * send a chat message by template id
   * @param {*} param0
   */
  async sendChatMessageByTemplateId ({ templateId, data, inviter, invitee, actions = [] }) {
    const { data: message } = await rabbitmq.sendAndRead('/settings/messages/get', {
      key: templateId,
      language: _.get(invitee, 'settings.language'),
      type: 'chat',
      data
    })
    await rabbitmq.sendAndRead('/chat/message/create', {
      frontId: 'auth-' + Date.now(),
      fromProfileId: inviter._id.toString(),
      fromManagerProfileId: inviter._id.toString(),
      toProfileId: invitee._id.toString(),
      content: {
        text: message,
        type: actions.length ? 'action' : 'text',
        actions
      }
    })
  }

  /**
   * suspend all temporary relations 30 days old
   */
  async suspendTemporary () {
    const relations = await this.relation.find({
      status: 'temporary',
      createdAt: {
        $lt: dayjs().subtract(30, 'day')
      }
    }).populate('leftProfileId').populate('rightProfileId')
    const tempRelations = relations.filter(relation => GYM.includes(relation.leftProfileId.typeCode) && ['IN', 'TU'].includes(relation.rightProfileId.typeCode))

    log.info(`Suspending ${tempRelations.length} relations`)

    tempRelations.forEach(relation => {
      if (GYM.includes(relation.leftProfileId.typeCode) && ['IN', 'TU'].includes(relation.rightProfileId.typeCode)) {
        relation.status = 'suspended'
        relation.save()
      }
    })
  }
}

module.exports = RelationController
