const { db, ctr, _, dayjs } = require('@cowellness/cw-micro-service')()

/**
 * @class BioController
 * @classdesc Controller Bio
 */
class BioController {
  constructor () {
    this.bio = db.auth.model('bio')
    this.profile = db.auth.model('Profile')
  }

  /**
   * get bio by profile id
   * @param {*} profileId
   * @param {*} userId
   * @returns bio
   */
  find (profileId, userId) {
    return this.bio.find({ profileId: profileId }).lean().exec()
  }

  /**
   * Get profile with limited field
   *
   * @param {Number} profileId
   * @returns {Object} profile
   */
  getProfile (profileId) {
    const profile = this.profile.findById(profileId, 'typeCode person.birth.date person.gender').lean().exec()
    return profile
  }

  /**
   * delete bio
   * @param {*} profileId
   * @param {*} id
   * @param {*} userId
   */
  async deleteBio (profileId, id, userId) {
    const profile = await this.getProfile(profileId)
    if (!profile) throw new Error('Not a valid profile Id')
    if (!['IN', 'TU'].includes(profile.typeCode)) throw new Error('Not a valid profile for bio')
    if (userId !== profileId) {
      const relation = await ctr.relation.verifyUserRelation(profileId, userId)
      if (!relation) throw new Error('profile id does not have any relationship with current user')
    }
    const bio = await this.bio.findById(id).exec()
    if (!bio) throw new Error('Bio details not found for Id')
    return this.bio.deleteOne({ _id: id }).exec()
  }

  /**
   * create a bio
   * @param {*} profileId
   * @param {*} height
   * @param {*} weight
   * @param {*} muscle
   * @param {*} fat
   * @param {*} tissue
   * @param {*} water
   * @param {*} bone
   * @param {*} measuredAt
   * @param {*} userId
   * @returns bio
   */
  async createBio (profileId, height, weight, muscle, fat, tissue, water, bone, measuredAt, userId) {
    const profile = await this.getProfile(profileId)
    if (!profile) throw new Error('Not a valid profile Id')
    if (!height && !weight) throw new Error('Height and weight both cant be empty')
    if (!['IN', 'TU'].includes(profile.typeCode)) throw new Error('Not a valid profile for bio')
    if (userId !== profileId) {
      const relation = await ctr.relation.verifyUserRelation(profileId, userId)
      if (!relation) throw new Error('profile id does not have any relationship with current user')
    }
    const bio = {
      profileId: profileId,
      body: {
        height: height ? height.toFixed(2) : undefined,
        weight: weight ? weight.toFixed(2) : undefined,
        mass: {
          muscle: muscle ? muscle.toFixed(2) : undefined,
          fat: fat ? fat.toFixed(2) : undefined,
          tissue: tissue ? tissue.toFixed(2) : undefined,
          bone: bone ? bone.toFixed(2) : undefined
        },
        water: water ? water.toFixed(2) : undefined
      },
      measuredAt: measuredAt
    }
    bio.bmi = this.calcBMI(height, weight)
    bio.bmr = this.calcBMR(height, weight, profile?.person?.gender, this.getAgeFromDateOfBirth(profile?.person?.birth?.date))

    return this.bio.create(bio)
  }

  /**
   * update a bio by id
   * @param {*} profileId
   * @param {*} id
   * @param {*} height
   * @param {*} weight
   * @param {*} muscle
   * @param {*} fat
   * @param {*} tissue
   * @param {*} water
   * @param {*} bone
   * @param {*} measuredAt
   * @param {*} userId
   * @returns bio
   */
  async updateBio (profileId, id, height, weight, muscle, fat, tissue, water, bone, measuredAt, userId) {
    const profile = await this.getProfile(profileId)
    if (!profile) throw new Error('Not a valid profile Id')
    if (!['IN', 'TU'].includes(profile.typeCode)) throw new Error('Not a valid profile for bio')
    if (userId !== profileId) {
      const relation = await ctr.relation.verifyUserRelation(profileId, userId)
      if (!relation) throw new Error('profile id does not have any relationship with current user')
    }
    const bio = await this.bio.findById(id).exec()
    if (!bio) throw new Error('Bio details not found for Id')
    bio.body.height = height ? height.toFixed(2) : undefined
    bio.body.weight = weight ? weight.toFixed(2) : undefined
    bio.body.mass.muscle = muscle ? muscle.toFixed(2) : undefined
    bio.body.mass.fat = fat ? fat.toFixed(2) : undefined
    bio.body.mass.tissue = tissue ? tissue.toFixed(2) : undefined
    bio.body.mass.bone = bone ? bone.toFixed(2) : undefined
    bio.body.water = water ? water.toFixed(2) : undefined
    bio.bmi = this.calcBMI(bio.body.height, bio.body.weight)
    bio.bmr = this.calcBMR(bio.body.height, bio.body.weight, profile?.person?.gender, this.getAgeFromDateOfBirth(profile?.person?.birth?.date))

    bio.measuredAt = measuredAt
    const savedBio = await bio.save()
    return savedBio
  }

  /**
   * calculate Age
   * @param {String}  dob date of birth YYYYMMDD
   * @returns {Number}
   */
  getAgeFromDateOfBirth (dob) {
    return dayjs().diff(dayjs(dob, 'YYYYMMDD'), 'year') || undefined
  }

  /**
   * Calculate the BMI
   * @param {Number} height (cm)
   * @param {Number} weight (kg)
   * @returns {Number} BMI
   */
  calcBMI (height, weight) {
    if (!height || !weight) {
      return null
    }
    return (weight / (height / 100 * height / 100)).toFixed(2)
  }

  /**
   * Calculate the Basal Metabolic Rate  BMR
   *
   * @param {Number} height  (cm)
   * @param {Number} weight  (kg)
   * @param {String} gender   ['male','female']
   * @param {Number} age
   *
   * @return {Number} BMR
   */
  calcBMR (height, weight, gender, age) {
    if (!_.isNumber(age) || !_.isNumber(height) || !_.isNumber(weight)) {
      return undefined
    }
    const BMR = (10 * weight) + (6.25 * height) - (5 * age) + (gender === 'female' ? -161 : 5)
    return BMR
  }
}

module.exports = BioController
