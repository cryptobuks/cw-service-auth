const { db } = require('@cowellness/cw-micro-service')()
const { GYM, superUser } = require('../profile/profile.enum')
/**
 * @class CwmodulesController
 * @classdesc Controller Cwmodules
 */
class CwmodulesController {
  constructor () {
    this.cwmodules = db.auth.model('CwModules')
    this.company = db.auth.model('Profile')
  }

  /**
   * get cwmodule by gymid
   * @param {*} gymId
   * @returns cwmodule
   */
  getByGYMId (gymId) {
    return this.cwmodules.find({ profileId: gymId })
  }

  /**
   * delete cwmodule by id
   * @param {*} id cw module id
   */
  deleteByGYMId (id) {
    return this.cwmodules.deleteOne({ _id: id })
  }

  /**
   * delete cwmodule by gymid
   * @param {*} id gym id
   */
  async deleteByGymId (id) {
    return await this.cwmodules.deleteMany({ profileId: id })
  }

  /**
   * get cwmodule by id
   * @param {*} id
   * @returns cwmodule
   */
  getById (id) {
    return this.cwmodules.findById(id)
  }

  /**
   * copy cwmodules to another gym
   * @param {*} fromGym
   * @param {*} toGym
   */
  async copyCwModules (fromGym, toGym) {
    const modules = await this.cwmodules.find({ profileId: fromGym }).lean().exec()
    if (modules && modules.length) {
      for (const module of modules) {
        const cwModule = {
          profileId: toGym,
          modules: {
            area: module.modules.area,
            isActive: module.modules.isActive,
            activeChangedAt: module.modules.activeChangedAt,
            paidByGroup: module.modules.paidByGroup,
            discounts: module.modules.discounts,
            contactsCount: module.modules.contactsCount
          }
        }
        await this.cwmodules.create(cwModule)
      }
    }
  }

  /**
   * create a cwmodule for gym
   * @param {*} gymId
   * @param {*} data
   * @param {*} loginUser
   * @returns cw module
   */
  async createByGymId (gymId, data, loginUser) {
    const user = await this.company.findById(loginUser, 'typeCode').lean().exec()
    if (superUser.includes(user.typeCode) === false) {
      throw new Error('Only cowellness is allowed to modify cwmodules')
    }
    const gym = await this.company.findById(gymId)
    if (!gym || !GYM.includes(gym.typeCode)) throw new Error('Not a valid GYM')
    // const previousDoc = await this.cwmodules.findOne({ profileId: gymId }, '_id').lean().exec()
    // if (previousDoc) throw new Error('Only one cwmodule is allowed, System does have have detail for this gym')

    const cwModule = {
      profileId: gymId,
      modules: {
        area: data.area,
        isActive: data.isActive,
        activeChangedAt: data.activeChangedAt,
        paidByGroup: data.paidByGroup,
        contactsCount: data.contactsCount
      }
    }
    if (data.discounts && data.discounts.length) {
      cwModule.modules.discounts = []
      data.discounts.forEach((disc) => {
        cwModule.modules.discounts.push({ discount: disc.discount, startDt: disc.startDt, endDt: disc.endDt })
      })
    }
    const newCwModules = await this.cwmodules.create(cwModule)
    return newCwModules
  }

  /**
   * update cw module by id
   * @param {*} id cwmodule id
   * @param {*} data
   * @param {*} loginUser
   * @returns cwmodule
   */
  async updateById (id, data, loginUser) {
    const user = await this.company.findById(loginUser, 'typeCode').lean().exec()
    if (superUser.includes(user.typeCode) === false) {
      throw new Error('Only cowellness is allowed to modify cwmodules')
    }
    const cwModule = await this.cwmodules.findById(id)
    if (!cwModule) throw new Error('Cw modules not found for id')
    cwModule.modules.area = data.area
    cwModule.modules.isActive = data.isActive
    cwModule.modules.activeChangedAt = data.activeChangedAt
    cwModule.modules.paidByGroup = data.paidByGroup
    cwModule.modules.contactsCount = data.contactsCount
    if (data.discounts && data.discounts.length) {
      cwModule.modules.discounts = []
      data.discounts.forEach((disc) => {
        cwModule.modules.discounts.push({ discount: disc.discount, startDt: disc.startDt, endDt: disc.endDt })
      })
    }
    await cwModule.save()
    return cwModule
  }

  /**
   * get gyms having country with cwmodule
   * @returns gyms
   */
  async getGymList () {
    const profiles = await this.company.find({
      typeCode: ['GH', 'GY', 'GU'],
      'company.country': {
        $exists: true
      }
    }, 'typeCode company.country').lean()
    const cwProfiles = profiles.map(profile => {
      return this.getByGYMId(profile._id).then(cwModules => {
        profile.cwModules = cwModules
        return profile
      })
    })

    return Promise.all(cwProfiles)
  }
}

module.exports = CwmodulesController
