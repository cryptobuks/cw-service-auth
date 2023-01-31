const { db } = require('@cowellness/cw-micro-service')()
const { GYM, nonBusiness } = require('../profile/profile.enum')

/**
 * @class SportsauthorizationController
 * @classdesc Controller Sportsauthorization
 */
class SportsauthorizationController {
  constructor () {
    this.sportsAuth = db.auth.model('sportsAuthorization')
    this.profile = db.auth.model('Profile')
  }

  /**
   * Add Sport course information for a profile
   * @param {ObjectId} ownerId Business owner Id
   * @param {ObjectId} profileId profile of Individual
   * @returns
   */
  async getSportAuthorization (ownerId, profileId) {
    return await this.sportsAuth.findOne({ ownerId, profileId }).lean().exec()
  }

  /**
   * Add Sport course information for a profile
   * @param {ObjectId} ownerId Business owner Id
   * @param {ObjectId} profileId profile of Individual
   * @param {ObjectId} interestId interest id of the individual
   * @returns
   */
  async addCourse (ownerId, profileId, interestIds) {
    const [business, profile] = await Promise.all([this.profile.findOne({ _id: ownerId, typeCode: { $in: GYM } }, '_id').lean().exec(), this.profile.findOne({ _id: profileId, typeCode: { $in: nonBusiness } }, '_id').lean().exec()])
    if (!business) throw new Error('Business Id information not valid or details are not available')
    if (!profile) throw new Error('Profile Id information not valid or details are not available')
    const sportsAuth = await this.sportsAuth.findOne({ ownerId, profileId }).exec()
    if (!sportsAuth) {
      if (!interestIds || !interestIds.length) throw new Error('Atleast one interest is needed for new record')
      const newSportAuth = {
        ownerId,
        profileId,
        sports: {
          course: interestIds
        }
      }
      return await this.sportsAuth.create(newSportAuth)
    } else {
      if (!sportsAuth.sports) sportsAuth.sports = {}
      sportsAuth.sports.course = interestIds
      return await sportsAuth.save()
    }
  }

  /**
   * Add Sport private information for a profile
   * @param {ObjectId} ownerId Business owner Id
   * @param {ObjectId} profileId profile of Individual
   * @param {ObjectId} interestId interest id of the individual
   * @returns
   */
  async addPrivate (ownerId, profileId, interestIds) {
    const [business, profile] = await Promise.all([this.profile.findOne({ _id: ownerId, typeCode: { $in: GYM } }, '_id').lean().exec(), this.profile.findOne({ _id: profileId, typeCode: { $in: nonBusiness } }, '_id').lean().exec()])
    if (!business) throw new Error('Business Id information not valid or details are not available')
    if (!profile) throw new Error('Profile Id information not valid or details are not available')
    const sportsAuth = await this.sportsAuth.findOne({ ownerId, profileId }).exec()
    if (!sportsAuth) {
      if (!interestIds || !interestIds.length) throw new Error('Atleast one interest is needed for new record')
      const newSportAuth = {
        ownerId,
        profileId,
        sports: {
          private: interestIds
        }
      }
      return await this.sportsAuth.create(newSportAuth)
    } else {
      if (!sportsAuth.sports) sportsAuth.sports = {}
      sportsAuth.sports.private = interestIds
      return await sportsAuth.save()
    }
  }
}

module.exports = SportsauthorizationController
