const { ctr, _ } = require('@cowellness/cw-micro-service')()

async function validationIds (id, key, reply) {
  try {
    const items = await ctr.profile.validateIds(id, key)
    if (items && items.hits && items.hits.hits && items.hits.hits.length) {
      return reply.cwSendSuccess({ data: false, message: 'reply.' + key + '.exist' })
    } else {
      return reply.cwSendSuccess({ data: true, message: 'reply.' + key + '.notExist' })
    }
  } catch {
    return reply.cwSendSuccess({ data: true, message: 'reply.' + key + '.notExist' })
  }
}

class ProfileActions {
  async detail (data, reply) {
    const userDetail = await ctr.profile.detailWithManagerOveride(data._user.profileId, data._user.managerId)
    userDetail.permission = data._user.permission
    reply.cwSendSuccess({
      message: 'reply.data.fetch',
      data: userDetail
    })
  }

  async refCWProfile (data, reply) {
    const refCWProfileRelation = await ctr.profile.getRefCowellnessProfile(data._user.profileId)

    if (!_.get(refCWProfileRelation, 'profile')) {
      return reply.cwSendSuccess({
        message: 'reply.data.fetch',
        data: null
      })
    }
    reply.cwSendSuccess({
      message: 'reply.data.fetch',
      data: {
        _id: refCWProfileRelation?.profile?._id,
        chatId: 'R-' + refCWProfileRelation?._id
      }
    })
  }

  async pinValidation (data, reply) {
    return await validationIds(data.id, 'pin', reply)
  }

  async tinValidation (data, reply) {
    return await validationIds(data.id, 'tin', reply)
  }

  async getQrCodeForProfile (data, reply) {
    try {
      const user = await ctr.profile.getQrCodeDetails(data.profileId || data._user.id)
      user.type = 'profile'
      reply.cwSendSuccess({
        data: user,
        message: 'reply.qrcode.success'
      })
    } catch (e) {
      reply.cwSendFail({
        message: 'reply.qrcode.error',
        data: e
      })
    }
  }

  async getUserInfoById (data, reply) {
    try {
      const user = await ctr.profile.getUserInfoById(data.id)
      user.type = 'profile'
      reply.cwSendSuccess({
        data: user,
        message: 'reply.userInfo.success'
      })
    } catch (e) {
      reply.cwSendFail({
        message: 'reply.userInfo.error',
        data: e
      })
    }
  }

  async updateProfile (data, reply) {
    try {
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

  async verifyUserRelation (data, reply) {
    try {
      const user = await ctr.relation.verifyUserRelation(data._user.id, data.scanId)
      reply.cwSendSuccess({
        data: user,
        message: 'reply.verify.relation.success'
      })
    } catch (e) {
      reply.cwSendFail({
        message: 'reply.verify.relation.error',
        data: e
      })
    }
  }

  async createRelation (data, reply) {
    try {
      const user = await ctr.relation.buildRelation(data._user.id, data.scanId)
      reply.cwSendSuccess({
        data: user,
        message: 'reply.create.relation.success'
      })
    } catch (e) {
      reply.cwSendFail({
        message: 'reply.create.relation.error',
        data: e
      })
    }
  }

  async acceptAndActivateRelation (data, reply) {
    try {
      const createdGYM = await ctr.contracts.acceptAndActivateRelation(data.profileId, data.sign, data.deviceId, data.documents, data.reAccepted, data._request.headers['x-forwarded-for'] || 'IP NOT FOUND')
      reply.cwSendSuccess({
        data: createdGYM,
        message: 'reply.accept.activate.success'
      })
    } catch (e) {
      reply.cwSendFail({
        message: 'reply.accept.activate.error',
        data: e.message
      })
    }
  }

  async activateRelation (data, reply) {
    try {
      const user = await ctr.relation.activateRelation(data._user.id, data.scanId)
      reply.cwSendSuccess({
        data: user,
        message: 'reply.create.relation.success'
      })
    } catch (e) {
      reply.cwSendFail({
        message: 'reply.create.relation.error',
        data: e
      })
    }
  }

  async deviceScanAccess (data, reply) {
    try {
      const user = await ctr.device.deviceScanAccess(data.gymId, data._user.id, data.deviceId)
      reply.cwSendSuccess({
        data: user,
        message: 'reply.device.scan.success'
      })
    } catch (e) {
      reply.cwSendFail({
        message: 'reply.device.scan.error',
        data: e
      })
    }
  }

  async getBackgroundImageById (data, reply) {
    try {
      const background = await ctr.profile.getBackgroundImageById(data.id, data._request.headers.host)
      reply.cwSendSuccess({
        data: background,
        message: 'reply.background.byid.success'
      })
    } catch (e) {
      reply.cwSendFail({
        message: 'reply.background.byid.error',
        data: e
      })
    }
  }

  async getBackgroundList (data, reply) {
    try {
      const background = await ctr.profile.getBackgroundList(data._request.headers.host, data._user.profileId)
      reply.cwSendSuccess({
        data: background,
        message: 'reply.background.success'
      })
    } catch (e) {
      reply.cwSendFail({
        message: 'reply.background.error',
        data: e
      })
    }
  }

  async setbackground (data, reply) {
    try {
      const background = await ctr.profile.setbackground(data.profileId, data.backgroundId)
      reply.cwSendSuccess({
        data: background,
        message: 'reply.background.set.success'
      })
    } catch (e) {
      reply.cwSendFail({
        message: 'reply.background.set.error',
        data: e
      })
    }
  }

  async setLanguage (data, reply) {
    try {
      const background = await ctr.profile.setSettingValue(data._user.id, 'language', data.value)
      reply.cwSendSuccess({
        data: background,
        message: 'reply.language.set.success'
      })
    } catch (e) {
      reply.cwSendFail({
        message: 'reply.language.set.error',
        data: e
      })
    }
  }

  async setWeightFormat (data, reply) {
    try {
      const background = await ctr.profile.setSettingValue(data._user.id, 'weightFormat', data.value)
      reply.cwSendSuccess({
        data: background,
        message: 'reply.weight.set.success'
      })
    } catch (e) {
      reply.cwSendFail({
        message: 'reply.weight.set.error',
        data: e
      })
    }
  }

  async setDateFormat (data, reply) {
    try {
      const background = await ctr.profile.setSettingValue(data._user.id, 'dateFormat', data.value)
      reply.cwSendSuccess({
        data: background,
        message: 'reply.dateFormat.set.success'
      })
    } catch (e) {
      reply.cwSendFail({
        message: 'reply.dataFormat.set.error',
        data: e
      })
    }
  }

  async setNumberFormat (data, reply) {
    try {
      const background = await ctr.profile.setSettingValue(data._user.id, 'numberFormat', data.value)
      reply.cwSendSuccess({
        data: background,
        message: 'reply.numberFormat.set.success'
      })
    } catch (e) {
      reply.cwSendFail({
        message: 'reply.numberFormat.set.error',
        data: e
      })
    }
  }

  async setTemperatureFormat (data, reply) {
    try {
      const background = await ctr.profile.setSettingValue(data._user.id, 'temperatureFormat', data.value)
      reply.cwSendSuccess({
        data: background,
        message: 'reply.temperatureFormat.set.success'
      })
    } catch (e) {
      reply.cwSendFail({
        message: 'reply.temperatureFormat.set.error',
        data: e
      })
    }
  }

  async setDistanceFormat (data, reply) {
    try {
      const background = await ctr.profile.setSettingValue(data._user.id, 'distanceFormat', data.value)
      reply.cwSendSuccess({
        data: background,
        message: 'reply.distanceFormat.set.success'
      })
    } catch (e) {
      reply.cwSendFail({
        message: 'reply.distanceFormat.set.error',
        data: e
      })
    }
  }

  async setNotification (data, reply) {
    try {
      const background = await ctr.profile.setNotificationValue(data._user.id, data.sms, data.email)
      reply.cwSendSuccess({
        data: background,
        message: 'reply.distanceFormat.set.success'
      })
    } catch (e) {
      reply.cwSendFail({
        message: 'reply.distanceFormat.set.error',
        data: e
      })
    }
  }

  async activateRole (data, reply) {
    try {
      let cwToken
      const cookieList = data._request.headers.cookie.split(';')
      if (cookieList && cookieList.length > 0) {
        cookieList.forEach((c) => {
          c = c.trim()
          if (c.startsWith('cwtoken=')) {
            cwToken = c.replace('cwtoken=', '')
          }
        })
      }
      await ctr.profile.switchProfile(data._user.profileId, data.profileId, cwToken, data._user.id)
      reply.cwSendSuccess({
        message: 'reply.profile.switch.success',
        data: true
      })
    } catch (e) {
      reply.cwSendFail({ data: e, message: 'reply.profile.switch.error' })
    }
  }

  async impersonateProfile (data, reply) {
    try {
      const token = await ctr.profile.impersonateProfile(data.profileId, data._user.profileId, data._user.id)
      reply.cwSendSuccess({
        data: token,
        message: 'reply.impersonate.profile.success'
      })
    } catch (e) {
      reply.cwSendFail({
        message: 'reply.impersonate.profile.error',
        data: e
      })
    }
  }

  async setPwa (data, reply) {
    const pwa = await ctr.profile.setPwa(data)

    reply.cwSendSuccess({
      message: 'reply.profile.pwa.success',
      data: {
        pwa
      }
    })
  }

  async refusePwa (data, reply) {
    console.log('refusePwa')
    const pwa = await ctr.profile.refusePwa(data)

    reply.cwSendSuccess({
      message: 'reply.profile.pwa.success',
      data: {
        pwa
      }
    })
  }
}

module.exports = ProfileActions
