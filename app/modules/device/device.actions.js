const { ctr } = require('@cowellness/cw-micro-service')()

class DeviceActions {
  async deviceAdd (data, reply) {
    try {
      const deviceDetail = await ctr.device.addDevices(data, data._user.profileId, data._user.id)
      reply.cwSendSuccess({
        data: deviceDetail,
        message: 'reply.device.add.success'
      })
    } catch (e) {
      reply.cwSendFail({
        message: 'reply.device.add.error',
        data: e
      })
    }
  }

  async deviceEdit (data, reply) {
    try {
      const deviceDetail = await ctr.device.editDevices(data, data._id, data._user.profileId, data._user.id)
      reply.cwSendSuccess({
        data: deviceDetail,
        message: 'reply.device.edit.success'
      })
    } catch (e) {
      reply.cwSendFail({
        message: 'reply.device.edit.error',
        data: e
      })
    }
  }

  async deviceDelete (data, reply) {
    try {
      const status = await ctr.device.deleteDevices(data, data._user.profileId, data._user.id)
      reply.cwSendSuccess({
        data: status,
        message: 'reply.device.delete.success'
      })
    } catch (e) {
      reply.cwSendFail({
        message: 'reply.device.delete.error',
        data: e
      })
    }
  }

  async deviceReset (data, reply) {
    try {
      const status = await ctr.device.resetDevices(data, data._user.profileId, data._user.id)
      reply.cwSendSuccess({
        data: status,
        message: 'reply.device.reset.success'
      })
    } catch (e) {
      reply.cwSendFail({
        message: 'reply.device.reset.error',
        data: e
      })
    }
  }

  async getDeviceByGymId (data, reply) {
    const devices = await ctr.device.getDeviceByGymIdandStatus(data.gymId)
    reply.cwSendSuccess({
      data: devices,
      message: 'reply.device.list.success'
    })
  }

  async emailSearch (data, reply) {
    try {
      const user = await ctr.device.getProfileByEmailId(data.emailId)
      reply.cwSendSuccess({
        data: user,
        message: 'reply.search.email.success'
      })
    } catch (e) {
      reply.cwSendFail({
        message: 'reply.device.reset.error',
        data: e
      })
    }
  }

  async phoneSearch (data, reply) {
    try {
      const user = await ctr.device.findByMobileNo(data.prefix, data.phoneNo, data.countryCode)
      reply.cwSendSuccess({
        data: user,
        message: 'reply.search.phone.success'
      })
    } catch (e) {
      reply.cwSendFail({
        message: 'reply.device.phone.error',
        data: e
      })
    }
  }

  async getQrCodeForDevice (data, reply) {
    try {
      const user = await ctr.device.getQrCodeforDevice(data._user.gymId, data._user.id)
      user.type = 'device'
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

  async getUserByQrCode (data, reply) {
    try {
      const user = await ctr.profile.getUserByQrCode(data.qrCode)
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

  async verifyUserRelation (data, reply) {
    try {
      const user = await ctr.relation.verifyUserRelation(data._user.gymId, data.scanId)
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
      const user = await ctr.relation.buildRelation(data._user.gymId, data.scanId)
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

  async activateRelation (data, reply) {
    try {
      const user = await ctr.relation.activateRelation(data._user.gymId, data.scanId)
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

  async updateGym (data, reply) {
    try {
      const createdGYM = await ctr.company.updateGym(data, data._id, data._user.gymId, data._request.headers.host)
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

  async acceptAndActivateRelation (data, reply) {
    try {
      if (!data.deviceId || !data.deviceId.length) {
        reply.cwSendFail({
          message: 'reply.accept.activate.error',
          data: 'Device information missing'
        })
        return
      }
      // if (!data.sign || !data.sign.length) {
      //   reply.cwSendFail({
      //     message: 'reply.accept.activate.error',
      //     data: 'Sign information is required'
      //   })
      //   return
      // }
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

  async deviceScanAccess (data, reply) {
    try {
      const user = await ctr.device.deviceScanAccess(data._user.gymId, data.profileId, data._user.id)
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

  async addProfile (data, reply) {
    if (!data._user.gymId) {
      reply.cwSendFail({
        message: 'reply.add.profile.error',
        data: new Error('Registration can not be allowed without GYM information')
      })
      return
    }
    try {
      const user = await ctr.device.registerProfile(data, data._user.gymId)
      reply.cwSendSuccess({
        data: user,
        message: 'reply.add.profile.success'
      })
    } catch (e) {
      reply.cwSendFail({
        message: 'reply.add.profile.error',
        data: e
      })
    }
  }

  async registerProfile (data, reply) {
    if (!data._user.gymId) {
      reply.cwSendFail({
        message: 'reply.register.profile.error',
        data: new Error('Registration can not be allowed without GYM information')
      })
      return
    }
    try {
      const user = await ctr.company.createProfile(data, data._user.profileId, data._request.headers.host)
      reply.cwSendSuccess({
        data: user,
        message: 'reply.register.profile.success'
      })
    } catch (e) {
      reply.cwSendFail({
        message: 'reply.register.profile.error',
        data: e
      })
    }
  }

  async bookShift (data, reply) {
    if (!data._user.gymId) {
      reply.cwSendFail({
        message: 'reply.book.shift.error',
        data: new Error('Registration can not be allowed without GYM information')
      })
      return
    }
    try {
      const user = await ctr.device.bookShift(data, data._user.gymId, data._user.id)
      reply.cwSendSuccess({
        data: user,
        message: 'reply.book.shift.success'
      })
    } catch (e) {
      reply.cwSendFail({
        message: 'reply.book.shift.error',
        data: e
      })
    }
  }

  async cancelShift (data, reply) {
    if (!data._user.gymId) {
      reply.cwSendFail({
        message: 'reply.cancel.shift.error',
        data: new Error('Registration can not be allowed without GYM information')
      })
      return
    }
    try {
      const user = await ctr.device.cancelShift(data, data._user.gymId, data._user.id)
      reply.cwSendSuccess({
        data: user,
        message: 'reply.cancel.shift.success'
      })
    } catch (e) {
      reply.cwSendFail({
        message: 'reply.cancel.shift.error',
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

  async passwordReset (data, reply) {
    try {
      const updatedProfile = await ctr.profile.passwordReset(data.profileId, data.dob, data.password, data._request.headers.host)
      reply.cwSendSuccess({
        data: updatedProfile,
        message: 'reply.password.reset.success'
      })
    } catch (e) {
      reply.cwSendFail({
        message: 'reply.password.reset.error',
        data: e
      })
    }
  }

  async askInfo (data, reply) {
    if (!data._user.gymId) {
      reply.cwSendFail({
        message: 'reply.ask.info.error',
        data: new Error('Registration can not be allowed without GYM information')
      })
      return
    }
    try {
      const user = await ctr.device.askInfo(data, data._user.gymId, data._user.id)
      reply.cwSendSuccess({
        data: user,
        message: 'reply.ask.info.success'
      })
    } catch (e) {
      reply.cwSendFail({
        message: 'reply.ask.info.error',
        data: e
      })
    }
  }

  async createGym (data, reply) {
    try {
      const createdGYM = await ctr.company.createGym(data, data._user.gymId, data._request.headers.host)
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

  // async getDeviceStatus (data, reply) {
  //   try {
  //     const deviceStatus = await ctr.device.getDeviceStatus(data.deviceIds)
  //     reply.cwSendSuccess({
  //       data: deviceStatus,
  //       message: 'reply.device.status.success'
  //     })
  //   } catch (e) {
  //     reply.cwSendFail({
  //       message: 'reply.device.status.error',
  //       data: e
  //     })
  //   }
  // }
}

module.exports = DeviceActions
