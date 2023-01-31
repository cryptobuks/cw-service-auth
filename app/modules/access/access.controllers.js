const { db, ctr } = require('@cowellness/cw-micro-service')()
const { nonBusiness, GYM } = require('../profile/profile.enum')
/**
 * @class AccessController
 * @classdesc Controller Access
 */
class AccessController {
  constructor () {
    this.access = db.auth.model('Access')
    this.relation = db.auth.model('Relation')
  }

  /**
   * get access info
   * @param {*} invitedBy
   * @param {*} invitedTo
   * @param {*} action
   * @param {*} assetId
   * @param {*} IP
   * @returns access
   */
  async getAccess (invitedBy, invitedTo, action, assetId, IP) {
    const fields = '_id typeCode'
    const [invtBy, invtTo] = await Promise.all([ctr.company.findByIdDynamicFields(invitedBy, fields), ctr.company.findByIdDynamicFields(invitedTo, fields)])
    if (!invtBy) throw new Error('Information not available for invitedBy')
    if (!invtTo) throw new Error('Information not available for invitedTo')

    if ((nonBusiness.includes(invtBy.typeCode) && nonBusiness.includes(invtTo.typeCode)) || (GYM.includes(invtBy.typeCode) && GYM.includes(invtTo.typeCode)) || (invtBy.typeCode === 'CO' && GYM.includes(invtTo.typeCode)) || (GYM.includes(invtBy.typeCode) && invtTo.typeCode === 'CO')) {
      const relation = await this.relation.findOne({ leftProfileId: invitedBy, rightProfileId: invitedTo }).exec()
      if (!relation) {
        await this.relation.create({ leftProfileId: invitedBy, rightProfileId: invitedTo, status: 'active' })
        await this.addAccessInfo(invitedBy, invitedTo, action, assetId, IP)
        return { status: 'active', isNew: true }
      } else if (relation.status === 'active') {
        return { status: 'active', isNew: false }
      } else if (relation.status === 'temporary') {
        relation.status = 'active'
        await relation.save()
        await this.addAccessInfo(invitedBy, invitedTo, action, assetId, IP)
        return { status: 'active', isNew: true }
      }
    } else if ((['IN', 'TU'].includes(invtBy.typeCode) && GYM.includes(invtTo.typeCode)) || (GYM.includes(invtBy.typeCode) && ['IN', 'TU'].includes(invtTo.typeCode))) {
      const leftProfileId = GYM.includes(invtBy.typeCode) ? invitedBy : invitedTo
      const rightProfileId = ['IN', 'TU'].includes(invtBy.typeCode) ? invitedBy : invitedTo
      const relation = await this.relation.findOne({ leftProfileId, rightProfileId }).exec()
      if (!relation) {
        await this.relation.create({ leftProfileId, rightProfileId, status: 'temporary' })
        await this.addAccessInfo(invitedBy, invitedTo, action, assetId, IP)
        return { status: 'temporary', isNew: true }
      } else if (relation.status === 'active') {
        return { status: 'active', isNew: false }
      } else if (relation.status === 'temporary') {
        await this.addAccessInfo(invitedBy, invitedTo, action, assetId, IP)
        return { status: 'temporary', isNew: false }
      }
    }
  }

  /**
   * add access info
   * @param {*} invitedBy
   * @param {*} invitedTo
   * @param {*} action
   * @param {*} assertId
   * @param {*} IP
   * @returns access
   */
  async addAccessInfo (invitedBy, invitedTo, action, assertId, IP) {
    return await this.access.create({
      ownerId: invitedBy,
      profileId: invitedTo,
      assertId,
      IP
    })
  }

  /**
   * get relation status
   * @param {*} invitedBy
   * @param {*} invitedTo
   * @returns relation
   */
  async getRelationStatus (invitedBy, invitedTo) {
    return await this.relation.findOne({ $or: [{ leftProfileId: invitedBy, rightProfileId: invitedTo }, { leftProfileId: invitedTo, rightProfileId: invitedBy }] }, 'status')
  }

  /**
   * Will return access log based on date range
   * @param {ObjectId} profileId
   * @param {ObjectId} gymId
   * @param {string} frmDate
   * @param {string} toDate
   * @returns
   */
  async getAccessLog (userId, profileId, frmDate, toDate, fromRecord, totalRow) {
    const frmDt = new Date(frmDate.substring(0, 4), parseInt(frmDate.substring(4, 6)) - 1, frmDate.substring(6, 8))
    const toDt = new Date(toDate.substring(0, 4), parseInt(toDate.substring(4, 6)) - 1, toDate.substring(6, 8), 23, 59, 59)
    if (userId !== profileId) {
      const user = await ctr.company.findByIdDynamicFields(userId, '_id typeCode')
      if (!user || !GYM.includes(user.typeCode)) throw new Error('Login in profile not a valid GYM')
      const [logs, count] = await Promise.all([this.access.find({ profileId: profileId, ownerId: userId, createdAt: { $gte: frmDt, $lt: toDt } }, 'ip _id ownerId profileId createdAt', { skip: fromRecord, limit: totalRow }).populate('ownerId', '_id displayName company.name company.brand typeCode avatar').populate('profileId', '_id displayName typeCode').sort({ createdAt: 1 }).lean().exec(), this.access.countDocuments({ profileId: profileId, ownerId: userId, createdAt: { $gte: frmDt, $lt: toDt } }).exec()])
      return { logs, count }
    } else {
      const [logs, count] = await Promise.all([this.access.find({ profileId: userId, createdAt: { $gte: frmDt, $lt: toDt } }, 'ip _id ownerId profileId createdAt', { skip: fromRecord, limit: totalRow }).populate('ownerId', '_id displayName company.name company.brand typeCode avatar').sort({ createdAt: 1 }).populate('profileId', '_id displayName typeCode').lean().exec(), this.access.countDocuments({ profileId: userId, createdAt: { $gte: frmDt, $lt: toDt } }).exec()])
      return { logs, count }
    }
  }
}

module.exports = AccessController
