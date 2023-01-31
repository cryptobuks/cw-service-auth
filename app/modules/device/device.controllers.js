const { db, ctr, rabbitmq } = require('@cowellness/cw-micro-service')()
const { allowedDeviceRole } = require('./device.enum')
const { GYM, superUser } = require('../profile/profile.enum')
/**
 * @class DeviceController
 * @classdesc Controller Device
 */
class DeviceController {
  constructor () {
    this.company = db.auth.model('Profile')
    this.deviceLog = db.auth.model('devicelog')
  }

  /**
   * add device to company
   * @param {*} detail
   * @param {*} userId
   * @param {*} id
   * @returns device
   */
  async addDevices (detail, userId, id) {
    let userRole = await ctr.relation.getGymNUserRole(detail.gymId, userId)
    const user = await this.company.findById(userId, 'typeCode').lean().exec()

    if ((userRole && userRole.length) || superUser.includes(user.typeCode) || detail.gymId === userId) {
      if (!superUser.includes(user.typeCode)) {
        let isValid = false
        allowedDeviceRole.forEach((role) => {
          if (!isValid) {
            isValid = userRole.includes(role)
          }
        })
        if (!isValid && detail.gymId === userId) {
          userRole = await ctr.relation.getGymNUserRole(detail.gymId, id)
          allowedDeviceRole.forEach((role) => {
            if (!isValid) {
              isValid = userRole.includes(role)
            }
          })
        }
        if (!isValid) throw new Error('User does not enought permission')
      }
      const gym = await this.company.findById(detail.gymId, 'company').exec()
      if (!gym || !gym.company) throw new Error('Not a valid GYM')
      if (!gym.company.devices) gym.company.devices = []
      gym.company.devices.push({
        name: detail.name,
        status: detail.status || 'toBeActivated'
      })
      await gym.save()
      return gym.company.devices[gym.company.devices.length - 1]
    } else {
      throw new Error('Role not available')
    }
  }

  /**
   * update device
   * @param {*} detail
   * @param {*} deviceId
   * @param {*} userId
   * @param {*} id
   * @returns device
   */
  async editDevices (detail, deviceId, userId, id) {
    let userRole = await ctr.relation.getGymNUserRole(detail.gymId, userId)
    const user = await this.company.findById(userId, 'typeCode').lean().exec()

    if ((userRole && userRole.length) || superUser.includes(user.typeCode) || detail.gymId === userId) {
      if (!superUser.includes(user.typeCode)) {
        let isValid = false
        allowedDeviceRole.forEach((role) => {
          if (!isValid) {
            isValid = userRole.includes(role)
          }
        })
        if (!isValid && detail.gymId === userId) {
          userRole = await ctr.relation.getGymNUserRole(detail.gymId, id)
          allowedDeviceRole.forEach((role) => {
            if (!isValid) {
              isValid = userRole.includes(role)
            }
          })
        }
        if (!isValid) throw new Error('User does not enought permission')
      }

      const gym = await this.company.findById(detail.gymId, 'company').exec()
      if (!gym || !gym.company) throw new Error('Not a valid GYM')
      if (!gym.company.devices) throw new Error('Device not found')
      let device = {}
      gym.company.devices.forEach((d) => {
        if (d._id.toString() === deviceId) {
          device = d
          d.name = detail.name
          d.status = detail.status || 'toBeActivated'
        }
      })
      if (!device) throw new Error('Device not found')
      await gym.save()
      return device
    } else {
      throw new Error('Role not available')
    }
  }

  /**
   * delete device from gym
   * @param {*} detail
   * @param {*} userId
   * @param {*} id
   * @returns device
   */
  async deleteDevices (detail, userId, id) {
    let userRole = await ctr.relation.getGymNUserRole(detail.gymId, userId)
    const user = await this.company.findById(userId, 'typeCode').lean().exec()

    if ((userRole && userRole.length) || superUser.includes(user.typeCode) || detail.gymId === userId) {
      if (!superUser.includes(user.typeCode)) {
        let isValid = false
        allowedDeviceRole.forEach((role) => {
          if (!isValid) {
            isValid = userRole.includes(role)
          }
        })
        if (!isValid && detail.gymId === userId) {
          userRole = await ctr.relation.getGymNUserRole(detail.gymId, id)
          allowedDeviceRole.forEach((role) => {
            if (!isValid) {
              isValid = userRole.includes(role)
            }
          })
        }
        if (!isValid) throw new Error('User does not enought permission')
      }

      const gym = await this.company.findById(detail.gymId, 'company').exec()
      if (!gym || !gym.company) throw new Error('Not a valid GYM')
      if (!gym.company.devices) throw new Error('Device not found')
      let device = {}
      gym.company.devices.forEach((d) => {
        if (d._id.toString() === detail._id) {
          device = d
          d.status = 'Disconnected'
          d.isDeleted = true
        }
      })
      if (!device) throw new Error('Device not found')
      await gym.save()
      return device
    } else {
      throw new Error('Role not available')
    }
  }

  /**
   * reset device
   * @param {*} detail
   * @param {*} userId
   * @param {*} id
   * @returns device
   */
  async resetDevices (detail, userId, id) {
    let userRole = await ctr.relation.getGymNUserRole(detail.gymId, userId)
    const user = await this.company.findById(userId, 'typeCode').lean().exec()

    if ((userRole && userRole.length) || superUser.includes(user.typeCode) || detail.gymId === userId) {
      if (!superUser.includes(user.typeCode)) {
        let isValid = false
        allowedDeviceRole.forEach((role) => {
          if (!isValid) {
            isValid = userRole.includes(role)
          }
        })
        if (!isValid && detail.gymId === userId) {
          userRole = await ctr.relation.getGymNUserRole(detail.gymId, id)
          allowedDeviceRole.forEach((role) => {
            if (!isValid) {
              isValid = userRole.includes(role)
            }
          })
        }
        if (!isValid) throw new Error('User does not enought permission')
      }

      const gym = await this.company.findById(detail.gymId, 'company').exec()
      if (!gym || !gym.company) throw new Error('Not a valid GYM')
      if (!gym.company.devices) throw new Error('Device not found')
      let device = {}
      gym.company.devices.forEach((d) => {
        if (d._id.toString() === detail._id && !d.isDeleted) {
          device = d
          d.status = 'toBeActivated'
        }
      })
      if (!device) throw new Error('Device not found or is marked for deletion')
      await gym.save()
      return device
    } else {
      throw new Error('Role not available')
    }
  }

  /**
   * set device connected
   * @param {*} gymId
   * @param {*} deviceId
   * @returns profile
   */
  async deviceLogin (gymId, deviceId) {
    const gym = await this.company.findById(gymId, '_id company settings typeCode').exec()
    if (gym) {
      let gymDevice
      if (gym.company && gym.company.devices && gym.company.devices.length) {
        gym.company.devices.forEach((d) => {
          if (d.status === 'toBeActivated' && d._id.toString() === deviceId && !d.isDeleted) {
            gymDevice = d
            d.status = 'Connected'
          }
        })
        if (gymDevice) {
          await gym.save()
          const { _id, company, settings, typeCode } = gym
          company.devices = [gymDevice]
          return { _id, company, settings, typeCode }
        } else {
          throw new Error('Device information not found or not in toBeActivated status')
        }
      } else {
        throw new Error('Not a valid GYM and Device information')
      }
    } else {
      throw new Error('Invalid Gym')
    }
  }

  /**
   * get devices by gym id
   * @param {*} gymId
   * @returns devices
   */
  getDevicesByGymId (gymId) {
    return this.company.findById(gymId, 'company.devices').lean().exec()
  }

  /**
   * get devices by gym id
   * @param {*} gymId
   * @returns devices
   */
  async getDeviceByGymIdandStatus (gymId) {
    let devices = []
    const gym = await this.company.findById(gymId, 'company.devices').lean().exec()
    if (gym && gym.company && gym.company.devices && gym.company.devices.length) {
      gym.company.devices = gym.company.devices.filter((dev) => {
        return !dev.isDeleted
      })
      devices = gym.company.devices
      const connectedDevices = devices.filter((dev) => { return dev.status === 'Connected' }).map((dev) => { return dev._id.toString() })
      const deviceStatus = await this.getDeviceStatus(connectedDevices)
      if (deviceStatus && deviceStatus.length) {
        for (const dev of devices) {
          const idPostion = deviceStatus.findIndex((status) => { return status.deviceId === dev._id.toString() })
          if (idPostion > -1) {
            dev['ws-status'] = deviceStatus[idPostion].status
          }
        }
      }
    }
    return devices
  }

  /**
   * get company profile by email
   * @param {*} email
   * @returns profile
   */
  async getProfileByEmailId (email) {
    let data = await this.company.findOne({ 'person.emails': { $elemMatch: { email: email } } }, '_id person.firstname person.lastname person.gender typeCode').lean().exec()
    if (!data) {
      data = await this.company.findOne({ 'company.emails': { $elemMatch: { email: email } } }, '_id').lean().exec()
      if (data) throw new Error('Email Id doesnt belong to IN / TU')
    }
    return data
  }

  /**
   * send a bookshift request
   * @param {*} data
   * @param {*} gymId
   * @param {*} deviceId
   * @returns bookshift data
   */
  async bookShift (data, gymId, deviceId) {
    const gym = await this.company.findById(gymId, '_id typeCode company.devices').lean().exec()
    if (!gym) {
      throw new Error('Gym information not available')
    }
    const user = await this.company.findById(data.userId, '_id typeCode').lean().exec()
    if (!user) {
      throw new Error('User information not available')
    }
    if (!GYM.includes(gym.typeCode)) throw new Error('Not a valid GYM')
    if (GYM.includes(user.typeCode)) throw new Error('Not a valid User')

    if (gym.company && gym.company.devices && gym.company.devices.length) {
      const device = gym.company.devices.filter((dev) => {
        if (!dev.isDeleted && dev.status === 'Connected' && dev._id.toString() === deviceId) return true
        return false
      })
      if (!device.length) throw new Error('Device information not availiable for GYM')
    } else {
      throw new Error('Device information not availiable for GYM')
    }
    const bookShiftDetails = await rabbitmq.sendAndRead('/chat/message/gym-device/book', { frontId: 'auth-' + Date.now(), profileId: data.userId, gymId: gymId.toString(), deviceId: deviceId })
    return bookShiftDetails.data
  }

  /**
   * cancel a bookshift
   * @param {*} data
   * @param {*} gymId
   * @param {*} deviceId
   * @returns cancel data
   */
  async cancelShift (data, gymId, deviceId) {
    const gym = await this.company.findById(gymId, '_id typeCode company.devices').lean().exec()
    if (!gym) {
      throw new Error('Gym information not available')
    }
    const user = await this.company.findById(data.userId, '_id typeCode').lean().exec()
    if (!user) {
      throw new Error('User information not available')
    }
    if (!GYM.includes(gym.typeCode)) throw new Error('Not a valid GYM')
    if (GYM.includes(user.typeCode)) throw new Error('Not a valid User')

    if (gym.company && gym.company.devices && gym.company.devices.length) {
      const device = gym.company.devices.filter((dev) => {
        if (!dev.isDeleted && dev.status === 'Connected' && dev._id.toString() === deviceId) return true
        return false
      })
      if (!device.length) throw new Error('Device information not availiable for GYM')
    } else {
      throw new Error('Device information not availiable for GYM')
    }

    const cancelShiftDetails = await rabbitmq.sendAndRead('/chat/message/gym-device/unbook', { frontId: 'auth-' + Date.now(), profileId: data.userId, gymId: gymId.toString(), deviceId: deviceId })
    const response = cancelShiftDetails.data
    if (!response) {
      throw new Error('Booking does not exist')
    }
    return response
  }

  /**
   * send askInfo request from device
   * @param {*} data
   * @param {*} gymId
   * @param {*} deviceId
   * @returns askInfo data
   */
  async askInfo (data, gymId, deviceId) {
    const gym = await this.company.findById(gymId, '_id typeCode company.devices').lean().exec()
    if (!gym) {
      throw new Error('Gym information not available')
    }
    const user = await this.company.findById(data.userId, '_id typeCode').lean().exec()
    if (!user) {
      throw new Error('User information not available')
    }
    if (!GYM.includes(gym.typeCode)) throw new Error('Not a valid GYM')
    if (GYM.includes(user.typeCode)) throw new Error('Not a valid User')
    if (gym.company && gym.company.devices && gym.company.devices.length) {
      const device = gym.company.devices.filter((dev) => {
        if (!dev.isDeleted && dev.status === 'Connected' && dev._id.toString() === deviceId) return true
        return false
      })
      if (!device.length) throw new Error('Device information not availiable for GYM')
    } else {
      throw new Error('Device information not availiable for GYM')
    }
    const askDetail = await rabbitmq.sendAndRead('/chat/message/gym-device/ask', { frontId: 'auth-' + Date.now(), profileId: data.userId, gymId: gymId.toString(), deviceId: deviceId, text: data.question })
    return askDetail.data
  }

  /**
   * find company profile my mobile
   * @param {*} prefixNumber
   * @param {*} phoneNo
   * @param {*} countryCode
   * @returns profile
   */
  async findByMobileNo (prefixNumber, phoneNo, countryCode) {
    let data = await this.company.findOne({ 'person.mobilePhones': { $elemMatch: { countryCode: countryCode, prefixNumber: prefixNumber, phoneNumber: phoneNo } } }, '_id person.firstname person.lastname person.gender typeCode').lean().exec()
    if (!data) {
      data = await this.company.findOne({ 'company.mobilePhones': { $elemMatch: { countryCode: countryCode, prefixNumber: prefixNumber, phoneNumber: phoneNo } } }, '_id').lean().exec()
      if (data) throw new Error('Email Id doesnt belong to IN / TU')
    }
    return data
  }

  /**
   * get QR code for device
   * @param {*} gymId
   * @param {*} id device id
   * @returns profile
   */
  async getQrCodeforDevice (gymId, id) {
    const gym = await this.company.findById(gymId, '_id qrCode displayName typeCode status company.devices').lean().exec()
    if (gym && gym.company && gym.company.devices && gym.company.devices.length) {
      gym.company.devices = gym.company.devices.filter((d) => {
        return d._id.toString() === id && !d.isDeleted
      })
      if (!gym.company.devices.length) throw new Error('Device not available')
    }
    return gym
  }

  /**
   * check if user can scan device
   * @param {*} gymId
   * @param {*} profileId
   * @param {*} deviceId
   * @returns log
   */
  async deviceScanAccess (gymId, profileId, deviceId) {
    const relation = await ctr.relation.verifyUserRelation(gymId, profileId)
    if (!relation) throw new Error('Relationship between the profile does not exist')
    if (relation.status !== 'active') throw new Error('Relationship between profile is not activated')
    const gym = await this.getQrCodeforDevice(gymId, deviceId)
    if (gym && gym.company && gym.company.devices && gym.company.devices.length) {
      const deviceLog = {
        profileId: profileId,
        gymId: gymId,
        deviceId: deviceId
      }
      const log = await this.deviceLog.create(deviceLog)
      return log
    } else {
      throw new Error('Device not available')
    }
  }

  /**
   * create a user profile
   * @param {*} data
   * @param {*} gymId
   * @returns profile
   */
  async registerProfile (data, gymId) {
    if (!data.emails && !data.mobilePhones) {
      throw new Error('Emails and mobileNo both cant be empty')
    }
    const searchList = []

    if (data.emails && data.emails.length) {
      data.emails.forEach((e) => {
        searchList.push(this.company.findOne({ 'person.emails.email': e.email }, '_id').lean().exec())
        searchList.push(this.company.findOne({ 'company.emails.email': e.email }, '_id').lean().exec())
      })
    }

    if (data.mobilePhones && data.mobilePhones.length) {
      data.mobilePhones.forEach((e) => {
        searchList.push(this.company.findOne({ 'person.mobilePhones.countryCode': e.countryCode, 'person.mobilePhones.prefixNumber': e.prefixNumber, 'person.mobilePhones.phoneNumber': e.phoneNumber }, '_id').lean().exec())
        searchList.push(this.company.findOne({ 'company.mobilePhones.countryCode': e.countryCode, 'company.mobilePhones.prefixNumber': e.prefixNumber, 'company.mobilePhones.phoneNumber': e.phoneNumber }, '_id').lean().exec())
      })
    }

    const errorValidationList = await Promise.all(searchList)
    errorValidationList.forEach((e) => {
      if (e) {
        throw new Error('Email / mobile number already registered')
      }
    })

    const userProfile = {
      typeCode: 'IN',
      person: {
        firstname: data.firstname,
        lastname: data.lastname
      },
      interests: data.interests,
      createdByProfileId: gymId
    }

    if (data.emails && data.emails.length) {
      userProfile.person.emails = []
      data.emails.forEach((e) => {
        userProfile.person.emails.push({
          email: e.email
        })
      })
    }

    if (data.mobilePhones && data.mobilePhones.length) {
      if (!userProfile.person.mobilePhones) userProfile.person.mobilePhones = []
      data.mobilePhones.forEach((e) => {
        userProfile.person.mobilePhones.push({
          countryCode: e.countryCode,
          prefixNumber: e.prefixNumber,
          phoneNumber: e.phoneNumber
        })
      })
    }

    const hqDetail = await this.company.findOne({ typeCode: 'CH' }, '_id').lean().exec()
    if (!hqDetail) throw new Error('CH information not available')
    let newUser = await this.company.create(userProfile)
    await ctr.relation.createUserAndGymRelation(newUser._id.toString(), hqDetail._id.toString(), undefined, undefined, undefined, 'temporary')

    if (gymId && gymId.length && hqDetail._id.toString() !== gymId) {
      const otherBusiness = await this.company.findById(gymId, '_id typeCode').lean().exec()
      if (otherBusiness && GYM.includes(otherBusiness.typeCode)) {
        await ctr.relation.createUserAndGymRelation(newUser._id.toString(), otherBusiness._id.toString(), undefined, undefined, undefined, 'temporary')
      }
    }

    newUser.qrCode = newUser._id.toString() + Math.random(10)
    newUser = await newUser.save()

    return newUser
  }

  /**
   * get a device status
   * @param {*} deviceIds
   * @returns device status
   */
  async getDeviceStatus (deviceIds) {
    if (!deviceIds || !deviceIds.length) return []
    const status = await rabbitmq.sendAndRead('/ws/status/get', { frontId: 'auth-' + Date.now(), profileIds: deviceIds })
    if (status && status.data && status.data.length) {
      status.data = status.data.filter((dev) => { return (!!dev.profileId) }).map((dev) => { return { deviceId: dev.profileId, status: dev.status ? 'online' : 'offline' } })
    }
    for (const device of deviceIds) {
      if (status.data.findIndex((dev) => { return dev.deviceId === device }) === -1) {
        status.data.push({ deviceId: device, status: 'offline' })
      }
    }
    return status.data
  }
}

module.exports = DeviceController
