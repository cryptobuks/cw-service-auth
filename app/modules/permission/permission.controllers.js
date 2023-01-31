const { db, _, ctr } = require('@cowellness/cw-micro-service')()
const { GYM, nonBusiness } = require('../profile/profile.enum')
const path = require('path')
const yaml = require('js-yaml')
const config = require('config')
const fs = require('fs')

function trueSwitch (obj, src) {
  if (!obj && src) return src
  if (obj && !src) return obj
  if (typeof obj === 'boolean') return obj || src
  return _.mergeWith(obj, src, trueSwitch)
}

/**
 * @class RolesController
 * @classdesc Controller Roles
 */
class PermissionController {
  constructor () {
    this.Permission = db.auth.model('Permission')
    this.PermissionOverride = db.auth.model('PermissionOverride')
    this.company = db.auth.model('Profile')
  }

  /**
   * find one and update permission
   * @param {*} name
   * @param {*} rules
   */
  async addOrUpdate (name, rules) {
    await this.Permission.findOneAndUpdate({ name }, { name, rules }, { upsert: true, new: true, setDefaultsOnInsert: true })
  }

  /**
   * get permission by name
   * @param {*} name
   * @returns permission
   */
  getByKey (name) {
    return this.Permission.findOne({ name }).lean().exec()
  }

  /**
   * get permissions by multiple names
   * @param {*} names
   * @returns permissions
   */
  async getByKeys (names) {
    if (!Array.isArray(names)) names = [names]
    const permissions = []
    for (const name of names) {
      const permission = await this.getByKey(name)
      if (permission) {
        permissions.push(permission.rules)
      }
    }
    if (permissions.length) {
      let finalDoc = {}
      for (const perm of permissions) {
        finalDoc = _.mergeWith(finalDoc, perm, trueSwitch)
      }
      return finalDoc
    } else {
      return undefined
    }
  }

  /**
   * get permission by names, default to profileId based permissions
   * @param {*} names
   * @param {*} profileId
   * @returns permissions
   */
  async getByKeysWithOverride (names, profileId) {
    const [permission, permissionOverride] = await Promise.all([this.getByKeys(names), this.PermissionOverride.findOne({ profileId }, 'rules').lean().exec()])
    if (!permission) throw new Error('No permission available for ' + names.toString())
    if (!permissionOverride) return permission
    return _.mergeWith(permission, permissionOverride.rules)
  }

  /**
   * get override permissions by profile id
   * @param {*} profileId
   * @returns permissions
   */
  getOverideForProfile (profileId) {
    return this.PermissionOverride.findOne({ profileId }).lean().exec()
  }

  // async setOverideForProfile (ownerId, profileId, rules, updatedBy) {
  //   const [gym, profile] = await Promise.all([this.company.findOne({ _id: ownerId, typeCode: { $in: GYM } }, '_id').lean().exec(), this.company.findOne({ _id: profileId, typeCode: { $in: nonBusiness } }, '_id').lean().exec()])
  //   if (!gym) throw new Error('Not a valid gym or gym not available')
  //   if (!profile) throw new Error('Not a valid profile')
  //   return await this.PermissionOverride.findOneAndUpdate({ ownerId, profileId }, { ownerId, profileId, rules, updatedBy }, { upsert: true, new: true, setDefaultsOnInsert: true })
  // }

  /**
   * Set override permission by user
   * @param {ObjectId} ownerId  Gym id of the business
   * @param {ObjectId} profileId profile id of the user
   * @param {Object} rules which needs to be overridden
   * @param {ObjectId} updatedBy user profile id who is setting this up
   * @returns
   */
  async setOverride (ownerId, profileId, rules, updatedBy) {
    const [gym, profile, directors] = await Promise.all([this.company.findOne({ _id: ownerId, typeCode: { $in: GYM } }, '_id').lean().exec(), this.company.findOne({ _id: profileId, typeCode: { $in: nonBusiness } }, '_id').lean().exec(), ctr.relation.isGymDirector(ownerId, updatedBy)])
    if (!gym) throw new Error('Not a valid gym or gym not available')
    if (!profile) throw new Error('Not a valid profile')
    if (!directors) throw new Error('Only director can set overrides')
    return await this.PermissionOverride.findOneAndUpdate({ ownerId, profileId }, { ownerId, profileId, rules, updatedBy }, { upsert: true, new: true, setDefaultsOnInsert: true })
  }

  /**
   * Get user specific overrides
   * @param {ObjectId} ownerId Gymid of the business
   * @param {ObjectId} profileId profile id of the user
   * @returns
   */
  async getOverride (ownerId, profileId) {
    return await this.PermissionOverride.findOne({ ownerId, profileId }).lean().exec()
  }

  /**
   * returns all the default permission specific to role
   * @returns
   */
  async getDefaultRolePermission () {
    const folderPath = path.join(config.basepath, 'rules', 'roles')
    const files = fs.readdirSync(folderPath)
    const doc = []
    for (const file of files) {
      const groupJson = yaml.load(fs.readFileSync(path.join(config.basepath, 'rules', 'roles', file), 'utf8'))
      doc.push({ role: file.replace(/.yaml/ig, ''), rules: groupJson })
    }
    return doc
  }
}

module.exports = PermissionController
