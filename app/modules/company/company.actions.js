const { ctr } = require('@cowellness/cw-micro-service')()
const aliasEmail = '@sportmail.net'

async function validationIds (id, countryCode, key, reply) {
  try {
    const items = await ctr.profile.validateIds(id, countryCode, key)
    if (items && items.hits && items.hits.hits && items.hits.hits.length) {
      reply.cwSendSuccess({ data: false, message: 'reply.' + key + '.exist' })
    } else {
      reply.cwSendSuccess({ data: true, message: 'reply.' + key + '.notExist' })
    }
  } catch {
    reply.cwSendSuccess({ data: true, message: 'reply.' + key + '.notExist' })
  }
}

class CompanyActions {
  async detail (data, reply) {
    const userDetail = await ctr.profile.findById(data._user.profileId)
    reply.cwSendSuccess({
      message: 'reply.data.fetch',
      data: userDetail
    })
  }

  async vatValidation (data, reply) {
    return await validationIds(data.id, data.countryCode, 'vat', reply)
  }

  async fiscalValidation (data, reply) {
    return await validationIds(data.id, data.countryCode, 'fiscal', reply)
  }

  async vatSearch (data, reply) {
    try {
      const item = await ctr.company.searchVat(data.id, data.countryCode)
      reply.cwSendSuccess({ data: item, message: 'reply.vat.search.successfull' })
    } catch (e) {
      reply.cwSendSuccess({ data: e.message, message: 'reply.vat.search.error' })
    }
  }

  async vatGetDetail (data, reply) {
    try {
      const item = await ctr.company.getCompanyByVatId(data.id, data.countryCode)
      reply.cwSendSuccess({ data: item, message: 'reply.vat.detail.success' })
    } catch (e) {
      reply.cwSendSuccess({ data: e.message, message: 'reply.vat.detail.error' })
    }
  }

  async fiscalGetDetail (data, reply) {
    try {
      const item = await ctr.company.getCompanyByFiscalId(data.id, data.countryCode)
      reply.cwSendSuccess({ data: item, message: 'reply.fiscal.detail.success' })
    } catch (e) {
      reply.cwSendSuccess({ data: e.message, message: 'reply.fiscal.detail.error' })
    }
  }

  async userGetDetailByEmail (data, reply) {
    try {
      const item = await ctr.company.findByEmailIdWithoutPassword(data.id)
      reply.cwSendSuccess({ data: item, message: 'reply.user.detail.success' })
    } catch (e) {
      reply.cwSendSuccess({ data: e.message, message: 'reply.user.detail.error' })
    }
  }

  async userGetDetailByMobile (data, reply) {
    try {
      const item = await ctr.company.findByMobileNo(data.prefix, data.phoneNo, data.countryCode)
      reply.cwSendSuccess({ data: item, message: 'reply.user.detail.success' })
    } catch (e) {
      reply.cwSendSuccess({ data: e.message, message: 'reply.user.detail.error' })
    }
  }

  async userGetDetailByPin (data, reply) {
    try {
      const item = await ctr.company.getUserByPin(data.id, data.countryCode)
      if (item) item.password = undefined
      reply.cwSendSuccess({ data: item, message: 'reply.user.detail.success' })
    } catch (e) {
      reply.cwSendSuccess({ data: e.message, message: 'reply.user.detail.error' })
    }
  }

  async userGetDetailByTin (data, reply) {
    try {
      const item = await ctr.company.getUserByTin(data.id, data.countryCode)
      if (item) item.password = undefined
      reply.cwSendSuccess({ data: item, message: 'reply.user.detail.success' })
    } catch (e) {
      reply.cwSendSuccess({ data: e.message, message: 'reply.user.detail.error' })
    }
  }

  async searchCompanyByName (data, reply) {
    if (data.company.length < 3) {
      reply.cwSendFail({
        data: [],
        message: 'reply.company.search.invalidLength'
      })
      return
    }
    try {
      const list = await ctr.company.searchCompany(data.company)
      reply.cwSendSuccess({
        data: list,
        message: 'reply.company.search.success'
      })
    } catch (e) {
      console.log(e)
      reply.cwSendFail({
        data: [],
        message: 'reply.company.search.error'
      })
    }
  }

  async manageCountries (data, reply) {
    const countries = await ctr.company.validCountries()
    reply.cwSendSuccess({
      data: countries,
      message: 'reply.country.list.success'
    })
  }

  async getCompanyDetail (data, reply) {
    try {
      const company = await ctr.company.findCompanyById(data.companyId)
      reply.cwSendSuccess({
        data: company,
        message: 'reply.company.detail.success'
      })
    } catch {
      reply.cwSendFail({
        data: undefined,
        message: 'reply.company.detail.error'
      })
    }
  }

  async getUserDetail (data, reply) {
    try {
      const company = await ctr.company.findUserById(data.userId)
      reply.cwSendSuccess({
        data: company,
        message: 'reply.user.detail.success'
      })
    } catch (e) {
      reply.cwSendFail({
        data: e.message,
        message: 'reply.user.detail.error'
      })
    }
  }

  async getProfileDetail (data, reply) {
    try {
      const company = await ctr.company.findProfileById(data.id)
      reply.cwSendSuccess({
        data: company,
        message: 'reply.profile.detail.success'
      })
    } catch (e) {
      reply.cwSendFail({
        data: e.message,
        message: 'reply.profile.detail.error'
      })
    }
  }

  async getBank (data, reply) {
    const banks = await ctr.company.getBanksByUserId(data._user.profileId)
    reply.cwSendSuccess({
      data: banks,
      message: 'reply.bank.detail.success'
    })
  }

  async uploadUserFile (data, reply) {
    const file = await ctr.company.uploadUserProfile(data, data.id, data._request.headers.host, data._user.profileId)
    reply.cwSendSuccess({
      data: file,
      message: 'reply.user.uploadFile.success'
    })
  }

  async uploadFile (data, reply) {
    const file = await ctr.company.profileUpload(data, data._user.profileId, data._request.headers.host)
    reply.cwSendSuccess({
      data: file,
      message: 'reply.user.uploadFile.success'
    })
  }

  async bankEdit (data, reply) {
    try {
      const bankDetail = await ctr.company.updateBankDetails(data.details, data.details.id, data.forId)
      reply.cwSendSuccess({
        data: bankDetail,
        message: 'reply.bank.edit.success'
      })
    } catch (e) {
      reply.cwSendFail({
        message: 'reply.bank.edit.error',
        data: e
      })
    }
  }

  async bankDelete (data, reply) {
    try {
      const bankDetail = await ctr.company.deleteBankDetails(data.id, data.forId)
      reply.cwSendSuccess({
        data: bankDetail,
        message: 'reply.bank.delete.success'
      })
    } catch (e) {
      reply.cwSendFail({
        message: 'reply.bank.delete.error',
        data: e
      })
    }
  }

  async bankAdd (data, reply) {
    try {
      const bankDetail = await ctr.company.addBankDetails(data.details, data.forId)
      reply.cwSendSuccess({
        data: bankDetail,
        message: 'reply.bank.add.success'
      })
    } catch (e) {
      reply.cwSendFail({
        message: 'reply.bank.add.error',
        data: e
      })
    }
  }

  async createProfile (data, reply) {
    try {
      if (data.password) delete data.password
      const createdProfile = await ctr.company.createProfile(data, data._user.profileId, data._request.headers.host, false)
      reply.cwSendSuccess({
        data: createdProfile,
        message: 'reply.profile.create.success'
      })
    } catch (e) {
      reply.cwSendFail({
        message: 'reply.profile.create.error',
        data: e
      })
    }
  }

  async updateProfile (data, reply) {
    try {
      if (data.password) delete data.password
      const updatedProfile = await ctr.company.updateProfile(data, data._id, data._user.profileId, data._request.headers.host)
      reply.cwSendSuccess({
        data: updatedProfile,
        message: 'reply.profile.update.success'
      })
    } catch (e) {
      reply.cwSendFail({
        message: 'reply.profile.update.error',
        data: e
      })
    }
  }

  async createGym (data, reply) {
    try {
      const createdGYM = await ctr.company.createGym(data, data._user.profileId, data._request.headers.host)
      reply.cwSendSuccess({
        data: createdGYM,
        message: 'reply.gym.create.success'
      })
    } catch (e) {
      reply.cwSendFail({
        message: 'reply.gym.create.error',
        data: e
      })
    }
  }

  async createCompany (data, reply) {
    try {
      const createdGYM = await ctr.company.createCompany(data, data._user.profileId, data._request.headers.host)
      reply.cwSendSuccess({
        data: createdGYM,
        message: 'reply.create.company.success'
      })
    } catch (e) {
      reply.cwSendFail({
        message: 'reply.create.company.error',
        data: e
      })
    }
  }

  async updateGym (data, reply) {
    try {
      const createdGYM = await ctr.company.updateGym(data, data._id, data._user.profileId, data._request.headers.host)
      reply.cwSendSuccess({
        data: createdGYM,
        message: 'reply.gym.update.success'
      })
    } catch (e) {
      reply.cwSendFail({
        message: 'reply.gym.upate.error',
        data: e.message
      })
    }
  }

  async updateCompany (data, reply) {
    try {
      const createdGYM = await ctr.company.updateCompany(data, data._id, data._user.profileId, data._request.headers.host)
      reply.cwSendSuccess({
        data: createdGYM,
        message: 'reply.update.company.success'
      })
    } catch (e) {
      reply.cwSendFail({
        message: 'reply.update.company.error',
        data: e.message
      })
    }
  }

  async getGymById (data, reply) {
    try {
      const item = await ctr.company.getGymById(data._id)
      if (item) item.password = undefined
      reply.cwSendSuccess({ data: item, message: 'reply.gym.detail.success' })
    } catch (e) {
      reply.cwSendFail({ data: e.message, message: 'reply.gym.detail.error' })
    }
  }

  async getGymList (data, reply) {
    try {
      const item = await ctr.company.getGymListBy(data._user.profileId)
      if (item) item.password = undefined
      reply.cwSendSuccess({ data: item, message: 'reply.gym.list.success' })
    } catch (e) {
      reply.cwSendFail({ data: e.message, message: 'reply.gym.list.error' })
    }
  }

  async validInChatAlias (data, reply) {
    const valid = await ctr.company.validateEmail(data.text + aliasEmail)
    if (!valid) {
      reply.cwSendFail({
        data: false,
        message: 'reply.inchat.email.fail'
      })
    } else {
      const isExist = await ctr.company.inChatAliasIsUnique(data.text + aliasEmail)
      reply.cwSendSuccess({
        data: !isExist,
        message: 'reply.inchat.email.success'
      })
    }
  }

  async searchUser (data, reply) {
    const users = await ctr.company.searchByEmailMobilePin(data.text)
    reply.cwSendSuccess({
      data: users || [],
      message: 'reply.user.search.success'
    })
  }

  async searchProfile (data, reply) {
    const users = await ctr.company.searchByEmailMobilePinAddress(data.text)
    reply.cwSendSuccess({
      data: users || [],
      message: 'reply.user.search.success'
    })
  }

  async changeCompanyStatus (data, reply) {
    try {
      const status = await ctr.company.changeCompanyStatus(data.id, data.status, data._user.profileId)
      reply.cwSendSuccess({ data: status, message: 'reply.company.status.success' })
    } catch (e) {
      reply.cwSendFail({ data: e.message, message: 'reply.company.status.error' })
    }
  }

  async deleteGymById (data, reply) {
    try {
      const status = await ctr.company.deleteGym(data._id)
      reply.cwSendSuccess({ data: status, message: 'reply.company.delete.success' })
    } catch (e) {
      reply.cwSendFail({ data: e.message, message: 'reply.company.delete.error' })
    }
  }

  async reactivateGym (data, reply) {
    try {
      const status = await ctr.company.reactivateGym(data._id, data._user.profileId)
      reply.cwSendSuccess({ data: status, message: 'reply.company.reactivate.success' })
    } catch (e) {
      reply.cwSendFail({ data: e.message, message: 'reply.company.reactivate.error' })
    }
  }

  async sendToDevice (data, reply) {
    try {
      const status = await ctr.company.sendToDevice(data.deviceId, data.gymId, data.action, data.data, data._user)
      reply.cwSendSuccess({ data: status, message: 'reply.sendTo.device.success' })
    } catch (e) {
      reply.cwSendFail({ data: e.message, message: 'reply.sendTo.device.error' })
    }
  }

  async gymBusinessUsers (data, reply, auth) {
    try {
      const isDirector = await auth.isDirector()
      const assigned = await ctr.company.gymBusinessUsers(data.gymId, data._user.profileId, isDirector)
      reply.cwSendSuccess({ data: assigned, message: 'reply.gym.businessUser.success' })
    } catch (e) {
      reply.cwSendFail({ data: e.message, message: 'reply.gym.businessUser.error' })
    }
  }

  async gymUnassignedUser (data, reply, auth) {
    try {
      const isDirector = await auth.isDirector()
      const unassigned = await ctr.company.gymUnassignedUser(data.gymId, data._user.profileId, isDirector)
      reply.cwSendSuccess({ data: unassigned, message: 'reply.gym.unassigned.success' })
    } catch (e) {
      reply.cwSendFail({ data: e.message, message: 'reply.gym.unassigned.error' })
    }
  }

  async assignProfile (data, reply, auth) {
    try {
      const isDirector = await auth.isDirector()
      const assign = await ctr.company.assignProfile(data.gymId, data.toProfile, data.profileId, data._user.profileId, data._user.id, data.role, isDirector)
      reply.cwSendSuccess({ data: assign, message: 'reply.gym.assign.success' })
    } catch (e) {
      reply.cwSendFail({ data: e.message, message: 'reply.gym.assign.error' })
    }
  }

  async unassignProfile (data, reply, auth) {
    try {
      const isDirector = await auth.isDirector()
      const assign = await ctr.company.unassignProfile(data.gymId, data.toProfile, data.profileId, data._user.profileId, data._user.id, data.role, isDirector)
      reply.cwSendSuccess({ data: assign, message: 'reply.gym.assign.success' })
    } catch (e) {
      reply.cwSendFail({ data: e.message, message: 'reply.gym.assign.error' })
    }
  }

  async assignParentId (data, reply) {
    try {
      const assign = await ctr.company.assignParentId(data.parentGymId, data.gymIds)
      reply.cwSendSuccess({ data: assign, message: 'reply.gym.assignparent.success' })
    } catch (e) {
      reply.cwSendFail({ data: e.message, message: 'reply.gym.assignparent.error' })
    }
  }

  async getGymGroup (data, reply) {
    try {
      const gyms = await ctr.company.getGymsByParentId(data.parentId)
      reply.cwSendSuccess({ data: gyms, message: 'reply.gym.group.success' })
    } catch (e) {
      reply.cwSendFail({ data: e.message, message: 'reply.gym.group.error' })
    }
  }

  async removeGymParent (data, reply) {
    try {
      const resp = await ctr.company.removeParent(data.gymId, data._user.profileId)
      reply.cwSendSuccess({ data: resp, message: 'reply.remove.parent.success' })
    } catch (e) {
      reply.cwSendFail({ data: e.message, message: 'reply.remove.parent.error' })
    }
  }

  async bulkProfileChanges (data, reply) {
    try {
      const resp = await ctr.company.bulkUpdateRolePayrollAwardCoursePrivate(data.gymId, data.profileId, data?.roles?.addUpdates, data?.roles?.toDelete, data?.payrolls?.addUpdates, data?.payrolls?.toDelete, data?.awards?.addUpdates, data?.awards?.toDelete, data?.course, data?.private)
      reply.cwSendSuccess({ data: resp, message: 'reply.bulk.profile.success' })
    } catch (e) {
      reply.cwSendFail({ data: e.message, message: 'reply.bulk.profile.error' })
    }
  }

  async getProfileCalendar (data, reply) {
    try {
      const resp = await ctr.company.getProfileCalendar(data.gymId, data.profileId, data.startDate, data.endDate)
      reply.cwSendSuccess({ data: resp, message: 'reply.substitute.calendar.success' })
    } catch (e) {
      reply.cwSendFail({ data: e.message, message: 'reply.substitute.calendar.error' })
    }
  }

  async availableProfileForSubstitute (data, reply) {
    try {
      const users = await ctr.company.getAvailableProfileFromCalendar(data.text, data.gymId, data.startAt, data.endAt)
      reply.cwSendSuccess({
        data: users || [],
        message: 'reply.substitute.search.success'
      })
    } catch (e) {
      reply.cwSendFail({ data: e.message, message: 'reply.substitute.search.error' })
    }
  }

  async getChatPluginSettings (data, reply) {
    const settings = await ctr.company.getChatPluginSettings(data)

    try {
      reply.cwSendSuccess({
        data: {
          settings
        },
        message: 'reply.chatplugin.settings.success'
      })
    } catch (error) {
      reply.cwSendFail({ data: error.message, message: 'reply.chatplugin.settings.error' })
    }
  }

  async setChatPluginSettings (data, reply) {
    const settings = await ctr.company.setChatPluginSettings(data)

    try {
      reply.cwSendSuccess({
        data: {
          settings
        },
        message: 'reply.chatplugin.settings.success'
      })
    } catch (error) {
      reply.cwSendFail({ data: error.message, message: 'reply.chatplugin.settings.error' })
    }
  }
}

module.exports = CompanyActions
