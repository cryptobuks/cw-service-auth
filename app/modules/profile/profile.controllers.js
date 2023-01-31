const { db, token, sms, email, shortlink, redisJson, ctr, rabbitmq, _, log, envPrefix, es, redis, dayjs } = require('@cowellness/cw-micro-service')()
const { Parser } = require('json2csv')
const csvtojson = require('csvtojson')
const config = require('config')
const profileFilterConstants = require('./constants/profileFilter.constants')
const resetURL = '/reset-password?token='
const md5 = require('md5')
const { customAlphabet } = require('nanoid')
const digitNanoid = customAlphabet('1234567890', 6)
const { nonBusiness, nonCowellnes, GYM, superUser, typeCode: allTypeCodes } = require('./profile.enum')
/**
 * @class ProfileController
 * @classdesc Controller Profile
 */
class ProfileController {
  constructor () {
    this.profile = db.auth.model('Profile')
    this.relation = db.auth.model('Relation')
  }

  /**
   * Find all profiles
   * @param {*} filter
   * @returns profiles
   */
  find (filter) {
    return this.profile.find(filter)
  }

  /**
   * Find by id with tutors inclusive
   * @param {*} id
   * @returns profile
   */
  async findById (id) {
    const user = await this.profile.findById(id, 'avatar person managedCountries company displayName settings typeCode status password pwa ids').lean().exec()
    if (user) {
      if (user.password && user.password.length) {
        user.hasPassword = true
      } else {
        user.hasPassword = false
      }
      if (['CW', 'CU'].includes(user.typeCode) === false) {
        delete user.managedCountries
      }
      user.password = undefined
      user.isBusiness = !nonBusiness.includes(user.typeCode)
      if (!user.isBusiness && user.typeCode === 'IN') {
        const leftRelation = await ctr.relation.findLeftRelation(id, 'leftProfileId')
        if (leftRelation && leftRelation.length) {
          user.tutors = await this.profile.find({ _id: { $in: leftRelation.map((r) => { return r.leftProfileId.toString() }) }, typeCode: 'TU' }, '_id avatar typeCode person settings').lean().exec()
        }
      }
    }
    return user
  }

  /**
   * Will return managerId override on setting if managerId is passed
   * @param {ObjectId} profileId
   * @param {ObjectId} managerId
   */
  async detailWithManagerOveride (profileId, managerId) {
    let manager, profile
    if (managerId) {
      [manager, profile] = await Promise.all([this.profile.findById(managerId, 'settings').lean().exec(), this.findById(profileId)])
      profile.settings.language = manager.settings.language || profile.settings.language
      profile.settings.dateFormat = manager.settings.dateFormat || profile.settings.dateFormat
      profile.settings.numberFormat = manager.settings.numberFormat || profile.settings.numberFormat
      profile.settings.lengthFormat = manager.settings.lengthFormat || profile.settings.lengthFormat
      profile.settings.weightFormat = manager.settings.weightFormat || profile.settings.weightFormat
      profile.settings.temperatureFormat = manager.settings.temperatureFormat || profile.settings.temperatureFormat
      profile.settings.distanceFormat = manager.settings.distanceFormat || profile.settings.distanceFormat
      profile.settings.timeZone = manager.settings.timeZone || profile.settings.timeZone
      profile.roles = await ctr.relation.getGymNUserRole(profileId, managerId)
      profile.loginUser = managerId
    } else {
      profile = await this.findById(profileId)
      profile.loginUser = profileId
    }
    return profile
  }

  /**
   * Checks if email exists
   * @param {*} emailId
   * @returns profile
   */
  emailExist (emailId) {
    return this.profile.search({ bool: { should: [{ bool: { must: [{ match_phrase_prefix: { 'person.emails.email': emailId } }] } }, { bool: { must: [{ match_phrase_prefix: { 'company.emails.email': emailId } }] } }] } })
  }

  /**
   * Checks if mobile number exists
   * @param {*} countryCode uk, it, pk
   * @param {*} prefixNumber +1
   * @param {*} phoneNumber 123456789
   * @returns profile
   */
  mobileNoExist (countryCode, prefixNumber, phoneNumber) {
    return this.profile.search({ bool: { should: [{ bool: { must: [{ match: { 'person.mobilePhones.countryCode': countryCode } }, { match: { 'person.mobilePhones.phoneNumber': phoneNumber } }, { match: { 'person.mobilePhones.prefixNumber': prefixNumber } }] } }, { bool: { must: [{ match: { 'company.mobilePhones.countryCode': countryCode } }, { match: { 'company.mobilePhones.phoneNumber': phoneNumber } }, { match: { 'company.mobilePhones.prefixNumber': prefixNumber } }] } }] } })
  }

  /**
   * validates the ids sent
   * @param {*} id
   * @param {*} countryCode
   * @param {*} key
   * @returns company profile
   */
  validateIds (id, countryCode, key) {
    return this.company.search({ bool: { must: [{ match: { 'ids.value': id, 'ids.key': key, 'ids.countryCode': countryCode } }] } })
  }

  /**
   * gets the QR code detils for a profile
   * @param {*} id profile id
   * @returns profile
   */
  getQrCodeDetails (id) {
    return this.profile.findById(id, '_id qrCode displayName typeCode status').lean().exec()
  }

  /**
   * returns the user information by id
   * @param {*} id profile id
   * @returns profile
   */
  async getUserInfoById (id) {
    const profile = await this.profile.findById(id).lean().exec()
    if (profile.password && profile.password.length) {
      profile.hasPassword = true
    } else {
      profile.hasPassword = false
    }
    delete profile.password
    return profile
  }

  /**
   * returns a user profile using a QR code
   * @param {*} qrCode
   * @returns profile
   */
  getUserByQrCode (qrCode) {
    const profile = this.profile.findOne({ qrCode: qrCode }, '_id displayName typeCode status company.name person.firstname person.lastname password').lean().exec()

    if (profile.password && profile.password.length) {
      profile.hasPassword = true
    } else {
      profile.hasPassword = false
    }
    delete profile.password
    return profile
  }

  /**
   * gets the list of backgrounds public and private
   * @param {*} hostName
   * @param {*} profileId
   * @returns backgrounds
   */
  async getBackgroundList (hostName, profileId) {
    const resp = await rabbitmq.sendAndRead('/settings/background/public/list', { hostname: hostName, profileId })
    return resp.data
  }

  /**
   * get a single background image by id
   * @param {*} id
   * @param {*} hostName
   * @returns background
   */
  async getBackgroundImageById (id, hostName) {
    const resp = await rabbitmq.sendAndRead('/settings/background/urlById', { id: id, hostname: hostName })
    return resp.data
  }

  /**
   * set background to a profile id
   * @param {*} id profile id
   * @param {*} backgroundId
   * @returns boolean
   */
  async setbackground (id, backgroundId) {
    const profile = await this.profile.findById(id, 'settings typeCode').exec()

    if (profile) {
      if (!profile.settings) profile.settings = {}
      if (GYM.includes(profile.typeCode)) {
        const oldBackgroundId = _.get(profile, 'settings.background.id')
        if (oldBackgroundId && oldBackgroundId.toString() !== backgroundId.toString()) {
          this.sendBackgroundChangeUpdate(profile._id, _.get(profile, 'settings.background.id'))
        }
      }
      profile.settings.background = { id: backgroundId }
      await profile.save()
      return true
    } else {
      throw new Error('Profile not found')
    }
  }

  /**
   * sends a background change event to all profiles
   * @param {*} userId
   * @param {*} oldBackgroundId
   * @returns
   */
  async sendBackgroundChangeUpdate (userId, oldBackgroundId) {
    return rabbitmq.send('/cron/append', {
      name: `auth:change-background:${userId}`,
      type: 'schedule',
      update: false,
      date: { hour: 9 },
      commands: [{
        type: 'rabbitmq',
        queue: '/auth/profile/checkBackgroundChange',
        msg: {
          profileId: userId,
          oldBackgroundId
        }
      }]
    })
  }

  /**
   * check if a background has changed and create a chat message
   * @param {*} profileId
   * @param {*} oldBackgroundId
   * @returns
   */
  async checkBackgroundChange (profileId, oldBackgroundId) {
    const profile = await this.profile.findById(profileId, 'settings').exec()
    const backgroundId = _.get(profile, 'settings.background.id')

    if (backgroundId.toString() === oldBackgroundId.toString()) {
      return
    }
    const { data: messageText } = await rabbitmq.sendAndRead('/settings/messages/get', {
      key: 'm1.settings.background.change',
      type: 'chat'
    })
    const backgroundData = await this.getBackgroundImageById(backgroundId.toString())
    const imageId = _.get(backgroundData, 'files.landscape._id')
    const filename = _.get(backgroundData, 'files.landscape.filename')
    const relations = await ctr.relation.findRelation(profileId)

    relations.forEach(relation => {
      const relationBackgroundId = _.get(relation, 'profile.settings.background.id')

      if (!relationBackgroundId || relationBackgroundId.toString() !== backgroundId.toString()) {
        rabbitmq.sendAndRead('/chat/message/action/create', {
          frontId: `auth-${Date.now()}`,
          fromProfileId: profileId,
          toProfileId: relation.profile._id.toString(),
          content: {
            type: 'action',
            text: messageText,
            imageId,
            filename,
            actions: [
              {
                label: 'global.yes',
                showTo: ['to'],
                frontend: {},
                backend: {
                  function: 'setAppBackground',
                  params: {
                    backgroundId: backgroundId
                  }
                }
              },
              {
                label: 'global.no',
                showTo: ['to'],
                frontend: {},
                backend: {}
              }
            ]
          }
        })
      }
    })
  }

  /**
   * set a setting value by key
   * @param {*} id profile id
   * @param {*} key setting property name
   * @param {*} value
   * @returns boolean
   */
  async setSettingValue (id, key, value) {
    const profile = await this.profile.findById(id, 'settings').exec()
    if (profile) {
      if (!profile.settings) profile.settings = {}
      profile.settings[key] = value
      await profile.save()
      return true
    } else {
      throw new Error('Profile not found')
    }
  }

  /**
   * sets a notification enabled/disabled
   * @param {*} id profile id
   * @param {Boolean} sms
   * @param {Boolean} email
   * @returns Boolean
   */
  async setNotificationValue (id, sms, email) {
    const profile = await this.profile.findById(id, 'settings').exec()
    if (profile) {
      if (!profile.settings) profile.settings = {}
      if (!profile.settings.notification) profile.settings.notification = {}
      profile.settings.notification.sms = sms
      profile.settings.notification.email = email
      await profile.save()
      return true
    } else {
      throw new Error('Profile not found')
    }
  }

  /**
   * login a user by username and password
   * @param {*} userName
   * @param {*} password
   * @param {*} language
   * @returns profile
   */
  async login (userName, password, language) {
    if (userName.includes('@')) {
      return await this.findByEmailIdPassword(userName, password, language)
    } else if (userName.startsWith('+')) {
      return await this.findByMobileNoPassword(userName, password, language)
    } else {
      return await this.multipleUserNameLogin(userName, password, language)
    }
  }

  /**
   * get a user by username
   * @param {*} userName
   * @returns profile
   */
  async getUser (userName) {
    if (userName.includes('@')) {
      return await this.findByEmailIdWithoutPassword(userName)
    } else if (userName.startsWith('+')) {
      return await this.findByMobileNoWithoutPassword(userName)
    } else {
      return await this.multipleUserNameLoginWithoutPassword(userName)
    }
  }

  /**
   * find by different properties used for login and attempt login
   * @param {*} userName
   * @param {*} password
   * @param {*} language
   * @returns profile
   */
  async multipleUserNameLogin (userName, password, language) {
    return this.multipleUserNameLoginWithoutPassword(userName).then(async (resp) => {
      if (resp && resp.password === this.encryptPassword(resp._id.toString(), password)) {
        if (resp.settings && !resp.settings.language) {
          resp.settings.language = language
          await resp.save()
        }
        resp.password = undefined
        resp.isBusiness = !nonBusiness.includes(resp.typeCode)
        return resp
      } else {
        return undefined
      }
    })
  }

  /**
   * search profile by different properties used for login
   * @param {*} userName
   * @returns profile
   */
  multipleUserNameLoginWithoutPassword (userName) {
    return this.profile.findOne({ $or: [{ ids: { $elemMatch: { $or: [{ value: userName, key: 'pin' }, { value: userName, key: 'vat' }, { value: userName, key: 'fiscal' }] } } }, { 'person.mobilePhones': { $elemMatch: { phoneNumber: userName } } }] }, '_id displayName person settings typeCode password')
  }

  /**
   * find a profile by email and password
   * @param {*} email
   * @param {*} password
   * @param {*} language
   * @returns profile
   */
  async findByEmailIdPassword (email, password, language) {
    email = email?.toLowerCase()
    return this.findByEmailIdWithoutPassword(email).then(async (resp) => {
      if (resp && resp.password === this.encryptPassword(resp._id.toString(), password)) {
        if (resp.settings && !resp.settings.language) {
          resp.settings.language = language
          await resp.save()
        }
        resp.password = undefined
        resp.isBusiness = !nonBusiness.includes(resp.typeCode)
        return resp
      } else {
        return undefined
      }
    })
  }

  /**
   * find a profile by email
   * @param {*} email
   * @returns profile
   */
  findByEmailIdWithoutPassword (email) {
    email = email?.toLowerCase()
    return this.profile.findOne({ 'person.emails': { $elemMatch: { email: email } } }, '_id displayName person settings password typeCode')
  }

  /**
   * find a profile by mobile
   * @param {*} phoneNo
   * @param {*} password
   * @param {*} language
   * @returns profile
   */
  async findByMobileNoPassword (phoneNo, password, language) {
    return this.findByMobileNoWithoutPassword(phoneNo).then(async (resp) => {
      if (resp && resp.password === this.encryptPassword(resp._id.toString(), password)) {
        if (resp.settings && !resp.settings.language) {
          resp.settings.language = language
          await resp.save()
        }
        resp.password = undefined
        resp.isBusiness = !nonBusiness.includes(resp.typeCode)
        return resp
      } else {
        return undefined
      }
    })
  }

  /**
   * find a profile by mobile phone
   * @param {*} phoneNo
   * @returns profile
   */
  findByMobileNoWithoutPassword (phoneNo) {
    return this.profile.findOne({ 'person.mobilePhones': { $elemMatch: { prefixNumber: phoneNo.substring(0, 3), phoneNumber: phoneNo.substring(3) } } }, '_id displayName person settings typeCode password ')
  }

  /**
   * find a profile by mobile phone
   * @param {*} prefixNumber
   * @param {*} phoneNo
   * @param {*} countryCode
   * @returns profile
   */
  findByMobileNo (prefixNumber, phoneNo, countryCode) {
    return this.profile.findOne({ 'person.mobilePhones': { $elemMatch: { countryCode: countryCode, prefixNumber: prefixNumber, phoneNumber: phoneNo } } }, '_id displayName person settings password typeCode')
  }

  /**
   * set a new password to user
   * @param {*} user
   * @param {*} detail
   * @param {*} hostName
   */
  async saveUpdatePassword (user, detail, hostName) {
    user = await this.profile.findById(user._id.toString()).exec()
    user.password = this.encryptPassword(user._id.toString(), detail.password)
    await user.save()
    await token.remove(detail.cwtoken)
    await this.alertUser(user, detail, hostName)
  }

  /**
   * Notify user by chat, sms, email on pw update
   * @param {*} user
   * @param {*} detail
   * @param {*} hostName
   * @returns
   */
  async alertUser (user, detail, hostName) {
    if (user.person.emails && user.person.emails.length) {
      const t = await token.save({ person: user.person, id: user._id.toString() }, config.options.passwordUpateTokenInSec)
      const data = { name: user.person.firstname || user.person.lastname || detail.username, url: 'https://' + hostName + resetURL + t.data }
      await email.sendEmail([user.person.emails[0].email], undefined, 'password-update.first-step', user.settings.language, data)
    } else if (user.person.mobilePhones && user.person.mobilePhones.length) {
      // TODO :: Credit verification with GYM
      const t = await token.save({ person: user.person, id: user._id.toString() }, config.options.passwordUpateTokenInSec)
      const sLink = await shortlink.create('https://' + hostName + resetURL + t.data, config.options.passwordUpateTokenInSec)
      if (sLink.data.result === 'ok') {
        const phoneNo = user.person.mobilePhones[0].prefixNumber + user.person.mobilePhones[0].phoneNumber
        await sms.sendWithTemplate('forgot-password-update', user.settings.language, [phoneNo], { name: user.person.firstname || user.person.lastname || phoneNo, url: sLink.data.shortURL })
      }
    }
    const template = await rabbitmq.sendAndRead('/settings/messages/get', {
      key: 'password-update.first-step',
      language: user.settings.language,
      type: 'chat',
      data: {}
    })

    await rabbitmq.sendAndRead('/chat/message/system', {
      toProfileId: user._id.toString(),
      content: {
        text: template.data,
        type: 'text'
      }
    })
    return true
  }

  /**
   * reset pw by sms
   * @param {*} user
   * @param {*} detail
   * @returns {Object} {userId}
   */
  async mobileReset (user, detail) {
    const code = digitNanoid()
    log.info(`userId: ${user._id.toString()}, code: ${code}`)
    this.setAuthPin(user._id.toString(), code)
    const sendMessage = await sms.sendWithTemplate('forgot-password-sms', user.settings.language, [detail.prefixNumber + detail.phoneNumber], {
      name: user.displayName,
      code
    })
    if (sendMessage && sendMessage.length) {
      if (!sendMessage[0].status) {
        throw new Error('Unable to send SMS')
      }
    }
    return {
      userId: user._id
    }
  }

  /**
   * reset pw by email
   * @param {*} user
   * @param {*} detail
   * @returns {Object} {userId}
   */
  async emailReset (user, detail) {
    const code = digitNanoid()
    log.info(`userId: ${user._id.toString()}, code: ${code}`)
    this.setAuthPin(user._id.toString(), code)
    const data = { name: user.displayName, code }
    await email.sendEmail([detail.username], undefined, 'password-reset.first-step', user.settings.language, data)
    return {
      userId: user._id
    }
  }

  /**
   * create a user relation with doc owner and accept owner documents
   * @param {*} userId
   * @param {*} docs
   * @param {*} invitedBy
   * @param {*} countryCode
   * @param {*} ip
   * @returns
   */
  async createRelationAndAcceptDocument (userId, docs, invitedBy, countryCode, ip) {
    const profileIds = []
    if (docs.length) {
      docs.forEach((doc) => {
        profileIds.push(doc.ownerId)
      })
    }
    if (invitedBy) profileIds.push(invitedBy)
    const profiles = await this.profile.find({ _id: { $in: profileIds }, typeCode: { $ne: 'CH' } }, '_id typeCode').lean().exec()
    if (profiles && profiles.length) {
      for (const profile of profiles) {
        if (GYM.includes(profile.typeCode)) {
          await this.relation.create({ leftProfileId: profile._id.toString(), rightProfileId: userId, status: 'temporary' })
        } else {
          await this.relation.create({ leftProfileId: profile._id.toString(), rightProfileId: userId, status: 'active' })
        }
      }
    }
    return await ctr.contracts.acceptAndActivateRelation(userId, null, null, docs, [], ip)
  }

  /**
   * create a profile
   * @param {*} obj profile data
   * @param {*} hostName
   * @returns profile
   */
  create (obj, hostName) {
    const p = new Promise((resolve, reject) => {
      const searchList = []
      if (obj.person.emails && obj.person.emails.length) {
        obj.person.emails.forEach((e) => {
          e.email = e.email.toLowerCase()
          searchList.push(this.profile.findOne({ 'person.emails.email': e.email }).exec())
        })
      }
      if (obj.person.mobilePhones && obj.person.mobilePhones.length) {
        obj.person.mobilePhones.forEach((e) => {
          searchList.push(this.profile.findOne({ 'person.mobilePhones.countryCode': e.countryCode, 'person.mobilePhones.prefixNumber': e.prefixNumber, 'person.mobilePhones.phoneNumber': e.phoneNumber }).exec())
        })
      }
      Promise.all(searchList).then(async (res) => {
        const errorList = []
        res.forEach((e) => {
          if (e) {
            errorList.push(e)
          }
        })
        if (errorList.length) {
          reject(new Error('Email or mobile number already registered'))
          return
        }

        const userProfile = {
          status: 'active',
          typeCode: obj.typeCode,
          person: {
            firstname: obj.person.firstname,
            lastname: obj.person.lastname,
            gender: obj.person.gender,
            birth: { date: obj.person.birth.date }
          },
          settings: {
            language: obj.settings.language
          },
          password: obj.password
        }
        if (obj.person.emails && obj.person.emails.length) {
          userProfile.person.emails = []
          obj.person.emails.forEach((e) => {
            userProfile.person.emails.push({
              email: e.email
            })
          })
        }
        if (obj.person.mobilePhones && obj.person.mobilePhones.length) {
          userProfile.person.mobilePhones = []
          obj.person.mobilePhones.forEach((e) => {
            userProfile.person.mobilePhones.push({
              countryCode: e.countryCode,
              prefixNumber: e.prefixNumber,
              phoneNumber: e.phoneNumber
            })
          })
        }

        const hqDetail = await this.getCowellnessByCountry(obj.countryCode) // this.profile.findOne({ typeCode: 'CH' }, '_id').lean().exec()
        if (!hqDetail) throw new Error('Cowellness default gym not found')

        this.profile.create(userProfile).then(async (user) => {
          if (user) {
            await ctr.relation.createUserAndGymRelation(user._id.toString(), hqDetail._id.toString(), undefined, undefined, undefined)
            user.qrCode = user._id.toString() + Math.random(10)
            user.password = this.encryptPassword(user._id.toString(), obj.password)
            user.save(async (err, qrUser) => {
              if (err) {
                reject(err)
              } else {
                qrUser.password = undefined
                if (['IN', 'TU'].includes(qrUser.typeCode) && qrUser.person && qrUser.person.emails && qrUser.person.emails.length && hostName) {
                  const t = await token.save({ person: qrUser.person, id: qrUser._id.toString(), autoLogin: true }, config.options.welcomeEmail)
                  const data = { name: qrUser.displayName || qrUser.person.firstname || qrUser.person.lastname, gymName: undefined, url: 'https://' + hostName + '/auth/autologin?token=' + t.data }
                  await email.sendEmail([qrUser.person.emails[0].email], undefined, 'welcome-email.first-step', qrUser.settings.language, data)
                  resolve(qrUser)
                } else {
                  resolve(qrUser)
                }
              }
            })
          }
        })
      })
    })
    return p
  }

  /**
   * update a user profile
   * @param {*} obj profile data
   * @param {*} id user id
   * @returns profile
   */
  update (obj, id) {
    return this.profile.findOneAndUpdate({ _id: id }, obj)
  }

  /**
   * switch user profile
   * @param {*} userId
   * @param {*} newProfileId
   * @param {*} tokenKey
   * @param {*} id
   * @returns
   */
  // TODO: Add additional on userId when relationship is setup correctly
  async switchProfile (userId, newProfileId, tokenKey, id) {
    const allowedList = await ctr.relation.getProfileList(id)
    const allowedProfile = allowedList.find(e => e._id.toString() === newProfileId)

    if (!allowedProfile) {
      throw new Error('Switch not allowed for this id')
    }
    const currentState = await redisJson.get(tokenKey)

    currentState.profileId = newProfileId
    currentState.managerId = ''
    if (newProfileId !== id) {
      currentState.managerId = id
      const [gym, relation] = await Promise.all([this.profile.findById(newProfileId, 'typeCode').lean().exec(), ctr.relation.getGymNUserRole(newProfileId, id)])
      if (gym && relation && relation.length) {
        const roleMap = []
        relation.forEach(re => roleMap.push(gym.typeCode + '-' + re))
        const permission = await ctr.permission.getByKeysWithOverride(roleMap, id)
        currentState.permission = permission
      } else {
        throw new Error('No Active role available')
      }
    } else {
      const user = await this.profile.findById(id, 'typeCode').lean().exec()
      const permission = await ctr.permission.getByKeysWithOverride(user.typeCode, id)
      currentState.permission = permission
    }

    await redisJson.del(tokenKey)
    await redisJson.set(tokenKey, currentState, { expire: config.options.durationInSec })
    return true
  }

  /**
   * Password generator based on ID and password (base  64)
   * @param {string} id unque id
   * @param {password} string base 64 text
   * @returns string
   */
  encryptPassword (id, password) {
    return md5(id.toString() + ':' + Buffer.from(password, 'base64'))
  }

  /**
   * get profile by filters provided
   * @param {*} param0 {roles, courses, interests, profiles}
   * @returns profile ids
   */
  async getProfileFiltered ({ roles = [], courses = [], interests = [], profiles = [] }) {
    // TODO: check active subscription and prospects flag
    const filter = []
    const profileIds = []
    if (roles?.length) {
      const roleFilter = {
        $or: []
      }
      const relationRoles = []
      roles.forEach(role => {
        const profileRoleParams = profileFilterConstants.profileTypes[role]
        const relationRoleParams = profileFilterConstants.relationRoles[role]
        if (profileRoleParams) {
          const roleConditions = {
            typeCode: {
              $in: profileRoleParams.typeCode
            }
          }
          roleFilter.$or.push(roleConditions)
        }
        if (relationRoleParams) {
          relationRoles.push(...relationRoleParams.role)
        }
      })
      if (roleFilter.$or.length) {
        filter.push(roleFilter)
      }
      const relations = await ctr.relation.find({
        'roles.role': relationRoles
      })
      profileIds.push(...relations.map(relation => relation.rightProfileId))
    }
    if (interests?.length) {
      filter.push({
        interests: {
          $in: interests
        }
      })
    }
    if (profiles?.length) {
      filter.push({
        _id: {
          $in: profiles
        }
      })
    }

    if (filter.length) {
      const list = await this.profile.find({
        $or: filter
      })
      profileIds.push(...list.map(profile => profile._id))
      return profileIds
    }
    return []
  }

  /**
   * create a temporary profile without validation
   * @param {*} data profile data
   * @returns profile
   */
  createTemporaryProfile (data) {
    const Profile = this.profile
    const profile = new Profile(data)

    return profile.save({
      validateBeforeSave: false
    })
  }

  /**
   * Password Reset with or withoutDOB
   *
   */
  async passwordReset (id, dob, password, hostName) {
    const user = await this.profile.findById(id).exec()
    if (!user) throw new Error('Not a valid user id')
    if (!nonBusiness.includes(user.typeCode)) throw new Error('not a valid user typeCode for password reset')
    if (user.password && user.person.birth.date !== dob?.toString()) throw new Error('User Date of birth does not match with the system')
    user.password = this.encryptPassword(user._id.toString(), password)
    await user.save()
    await this.alertUser(user, { userName: '' }, hostName)
  }

  /**
   * Publish in rabbitmq exchange new or updated profile
   *
   * exchange = exchange:auth:profile:update
   *
   * @param {Object} profile
   */
  async sendProfileToBroadcast (doc) {
    const profile = await this.profile.findById(doc._id).exec()
    if (profile) {
      if (profile.password && profile.password.length) {
        profile.hasPassword = true
      } else {
        profile.hasPassword = false
      }
      profile.password = undefined
    }
    rabbitmq.publish({ model: 'profile', data: { profile } })
  }

  /**
   * Exports all profiles to csv
   * DEV only
   */
  async exportProfiles (profileId) {
    const profiles = []
    const profile = await this.profile.findById(profileId).lean()

    profiles.push(profile)
    const relatedProfiles = await ctr.relation.find({
      $or: [
        {
          leftProfileId: profile._id
        },
        {
          rightProfileId: profile._id
        }
      ],
      status: 'active'
    }).populate('leftProfileId', '-password').populate('rightProfileId', '-password').lean()
    const profileData = relatedProfiles.map(relatedProfileData => {
      if (relatedProfileData.leftProfileId._id.toString() === profileId.toString()) {
        return relatedProfileData.rightProfileId
      }
      return relatedProfileData.leftProfileId
    })
    profiles.push(...profileData)

    const fields = [
      {
        label: 'Name',
        value: 'person.firstname'
      },
      {
        label: 'Surname',
        value: 'person.lastname'
      },
      {
        label: 'Emails',
        value: row => row.person.emails.map(e => e.email).join(',')
      },
      {
        label: 'Landlines',
        value: row => row.person.phones.map(e => e.prefixNumber + ' ' + e.phoneNumber).join(',')
      },
      {
        label: 'Mobile Phones',
        value: row => row.person.mobilePhones.map(e => e.prefixNumber + ' ' + e.phoneNumber).join(',')
      },
      {
        label: 'PIN',
        value: row => _.get(row.ids.find(id => id.key === 'pin'), 'value', null)
      },
      {
        label: 'Date of birth',
        value: 'person.birth.date'
      },
      {
        label: 'Sex',
        value: 'person.gender'
      },
      {
        label: 'Place of birth',
        value: 'person.birth.country'
      },
      {
        label: 'Addresses',
        value: row => row.person.addresses.map(addr => addr.fulladdress.replace(/,/g, ' ')).join(',')
      },
      {
        label: 'Company VAT',
        value: row => _.get(row.ids.find(id => id.key === 'vat'), 'value', null)
      },
      {
        label: 'Company Fiscal Code ID',
        value: row => _.get(row.ids.find(id => id.key === 'fiscal'), 'value', null)
      },
      {
        label: 'Company Name',
        value: 'company.name'
      },
      {
        label: 'Company Brand',
        value: 'company.brand'
      },
      {
        label: 'Company Short description',
        value: 'shortDescription'
      },
      {
        label: 'Company addresses',
        value: row => _.get(row.company, 'addresses', []).map(addr => addr.fulladdress.replace(/,/g, ' ')).join(',')
      },
      {
        label: 'Company IBAN',
        value: row => _.get(row.company, 'banks', []).map(bank => bank.iban).join(',')
      },
      {
        label: 'Company SWIFT',
        value: row => _.get(row.company, 'banks', []).map(bank => bank.bic).join(',')
      },
      {
        label: 'Company PEC',
        value: row => _.get(row.company, 'pecs', []).map(item => item.pec).join(',')
      }
    ]
    const options = { fields }
    const parser = new Parser(options)
    const csv = parser.parse(profiles)

    return csv
  }

  /** Gets background Image stats */
  async getBackgroundStats () {
    return await this.profile.aggregate([
      { $match: { 'settings.background.id': { $exists: true } } },
      { $unwind: '$settings.background.id' },
      { $group: { _id: '$settings.background.id', count: { $sum: 1 } } }
    ])
  }

  /**
   * Get sportinterest image stats
   */
  async getSportInterestStats () {
    return await this.profile.aggregate([
      { $match: { interests: { $exists: true, $not: { $size: 0 } } } },
      { $unwind: '$interests' },
      { $group: { _id: '$interests', count: { $sum: 1 } } }
    ])
  }

  /**
 * Get country stats
 */
  async getCountriesStats () {
    const cowellness = await this.profile.find({
      typeCode: ['CH', 'CW', 'CU']
    }).lean()
    const profiles = await Promise.all(cowellness.map(profile => {
      return ctr.relation.findRelation(profile._id.toString())
        .then(relations => ({ profile, relations }))
    }))
    const stats = {}
    const defaultValues = {
      active: 0,
      temporary: 0,
      draft: 0,
      suspended: 0,
      total: 0
    }
    profiles.forEach(profileData => {
      const typeCode = {}

      profileData.relations.forEach(relation => {
        if ([...nonCowellnes, 'IN', 'TU'].includes(relation.profile.typeCode)) {
          const existingCount = _.get(typeCode, `${relation.profile.typeCode}.${relation.profile.status}`, 0)

          _.set(typeCode, `${relation.profile.typeCode}.${relation.profile.status}`, existingCount + 1)
          typeCode[relation.profile.typeCode] = {
            ...defaultValues,
            ...typeCode[relation.profile.typeCode]
          }
        }
      })
      stats[profileData.profile.company.country] = typeCode
    })
    return stats
  }

  /**
   * Get contact stats
   */
  async getContactStats () {
    const gymProfiles = await this.profile.find({
      typeCode: GYM
    }).lean()
    const profiles = await Promise.all(gymProfiles.map(profile => {
      return ctr.relation.findRelation(profile._id.toString())
        .then(relations => ({ profile, relations }))
    }))
    const result = []

    profiles.forEach(profileData => {
      const stats = {
        ownerId: profileData.profile._id,
        contacts: {
          active: {
            budget: _.random(5, 10),
            count: 0
          },
          cold: {
            budget: _.random(5, 10),
            count: 0
          },
          companies: {
            budget: _.random(5, 10),
            count: 0
          }
        }
      }

      profileData.relations.forEach(relation => {
        if (['IN', 'TU'].includes(relation.profile.typeCode)) {
          if (!relation.isInteresting) {
            stats.contacts.active.count += 1
          } else {
            stats.contacts.cold.count += 1
          }
        } else if (allTypeCodes.includes(relation.profile.typeCode)) {
          stats.contacts.companies.count += 1
        }
      })
      result.push(stats)
    })
    return result
  }

  /**
   * get acquisition profile stats
   */
  async getChatStats () {
    const gymProfiles = await this.profile.find({
      typeCode: GYM
    }).lean()
    const profiles = await Promise.all(gymProfiles.map(profile => {
      return ctr.relation.findRelation(profile._id.toString())
        .then(relations => ({ profile, relations }))
    }))
    const result = []

    profiles.forEach(profileData => {
      const relatedProfileIds = profileData.relations
        .filter(relation => ['IN', 'TU'].includes(relation.profile.typeCode))
        .map(relation => relation.profile._id)
      const statsData = Promise.all([
        this.esCountSentMessages(relatedProfileIds),
        this.esCountReceivedMessages(relatedProfileIds)
      ]).then(count => {
        const [sent, received] = count
        return {
          ownerId: profileData.profile._id,
          data: {
            sent,
            received,
            budget: _.random(5, 10)
          }
        }
      })
      result.push(statsData)
    })
    return Promise.all(result)
  }

  /**
   * count sent messages
   * @param {*} profileIds
   * @returns count
   */
  async esCountSentMessages (profileIds) {
    if (!profileIds.length) return 0
    const result = await es.count({
      index: envPrefix + 'global_messages',
      body: {
        query: {
          bool: {
            must: [{
              match: {
                fromProfileId: profileIds.join(' OR ')
              }
            }]
          }
        }
      }
    })
    return result.count
  }

  /**
   * count received messages
   * @param {*} profileIds
   * @returns count
   */
  async esCountReceivedMessages (profileIds) {
    if (!profileIds.length) return 0
    const result = await es.count({
      index: envPrefix + 'global_messages',
      body: {
        query: {
          bool: {
            must: [{
              match: {
                toProfileId: profileIds.join(' OR ')
              }
            }]
          }
        }
      }
    })
    return result.count
  }

  /**
   * gets acquisition related stats
   * @returns stats
   */
  async getAcquisitionStats () {
    const gymProfiles = await this.profile.find({
      typeCode: GYM
    }).lean()
    const profiles = await Promise.all(gymProfiles.map(profile => {
      return ctr.relation.findRelation(profile._id.toString())
        .then(relations => ({ profile, relations }))
    }))
    const result = []

    profiles.forEach(profileData => {
      const stats = {
        ownerId: profileData.profile._id,
        data: {
          active: {},
          cold: {}
        }
      }
      let hasData = false

      profileData.relations.forEach(relation => {
        let acquisitionChannel = _.get(relation, 'settings.acquisitionChannel')

        if (!acquisitionChannel) {
          return
        }
        if (['IN', 'TU'].includes(relation.profile.typeCode)) {
          if (acquisitionChannel.source) {
            switch (acquisitionChannel.source) {
              case 'mouth':
                acquisitionChannel = 'mouth'
                break
              case 'other':
                acquisitionChannel = 'other'
                break
              case 'adverts':
                acquisitionChannel = acquisitionChannel.advType
                break
              default:
                throw new Error('Type not defined in acquisitionChannel stats logic')
            }
          }
          if (!relation.isInteresting) {
            const count = _.get(stats, `data.active.${acquisitionChannel}`, 0)
            _.set(stats, `data.active.${acquisitionChannel}`, count + 1)
          } else {
            const count = _.get(stats, `data.cold.${acquisitionChannel}`, 0)
            _.set(stats, `data.cold.${acquisitionChannel}`, count + 1)
          }
          hasData = true
        }
      })
      stats.data.active = Object.keys(stats.data.active).map(key => ({ channel: key, count: stats.data.active[key] }))
      stats.data.cold = Object.keys(stats.data.cold).map(key => ({ channel: key, count: stats.data.cold[key] }))
      if (hasData) {
        result.push(stats)
      }
    })
    return result
  }

  /**
   * get contact by sport interests
   * @returns stats
   */
  async getContactBySports () {
    const gymProfiles = await this.profile.find({
      typeCode: GYM
    }).lean()
    const profiles = await Promise.all(gymProfiles.map(profile => {
      return ctr.relation.findRelation(profile._id.toString())
        .then(relations => ({ profile, relations }))
    }))
    const result = []

    profiles.forEach(profileData => {
      const stats = {
        ownerId: profileData.profile._id,
        sports: {}
      }

      profileData.relations.forEach(relation => {
        if (['IN', 'TU'].includes(relation.profile.typeCode)) {
          if (!relation.isInteresting) {
            relation.profile.interests.forEach(interest => {
              const existingCount = _.get(stats, `sports.${interest}`, 0)
              _.set(stats, `sports.${interest}`, existingCount + 1)
            })
          }
        }
      })
      result.push(stats)
    })
    return result
  }

  /**
   * Import profiles
   */
  async importProfiles (profileId, csvData) {
    const report = []
    const profile = await this.profile.findById(profileId).lean()
    const rows = await csvtojson({
      headers: ['firstname', 'lastname', 'emails', 'phones', 'mobilePhones', 'pin', 'dob', 'gender', 'birthCountry', 'addresses', 'vat']
    }).fromString(csvData)

    for (const i in rows) {
      const row = rows[i]
      const or = []
      if (row.emails) {
        or.push({
          'person.emails.email': row.emails.split(',')
        })
      }
      if (row.phones) {
        or.push({
          'person.phones.phoneNumber': row.phones.split(',')
        })
      }
      if (row.mobilePhones) {
        or.push({
          'person.mobilePhones.phoneNumber': row.mobilePhones.split(',')
        })
      }
      if (row.pin) {
        or.push({
          'person.ids.key': row.pin
        })
      }
      if (!or.length) continue
      const found = await this.profile.findOne({
        $or: or
      })

      if (!found) {
        if (!row.vat) {
          try {
            const createdProfile = await this.create({
              person: {
                firstname: row.firstname,
                lastname: row.lastname,
                emails: _.get(row, 'emails', '').split(',').map(email => ({ email })),
                gender: row.gender,
                birth: {
                  date: row.dob
                },
                mobilePhones: _.get(row, 'mobilePhones', '').split(',').map(phone => {
                  const [prefixNumber, phoneNumber] = phone.split(' ')

                  return {
                    prefixNumber,
                    phoneNumber,
                    countryCode: 'it'
                  }
                }),
                phones: _.get(row, 'phones', '').split(',').map(phone => {
                  const [prefixNumber, phoneNumber] = phone.split(' ')

                  return {
                    prefixNumber,
                    phoneNumber,
                    countryCode: 'it'
                  }
                })
              },
              password: 'tmp_pw_' + Date.now(),
              settings: {
                language: profile.settings.language
              },
              typeCode: 'IN'
            })
            report.push(`creating profile ${row.firstname}, ${row.emails}`)
            const relatedProfiles = await ctr.relation.find({
              $or: [
                {
                  leftProfileId: profileId,
                  rightProfileId: createdProfile._id
                },
                {
                  rightProfileId: profileId,
                  leftProfileId: createdProfile._id
                }
              ]
            })
            if (!relatedProfiles.length) {
              await ctr.relation.createUserAndGymRelation(createdProfile._id.toString(), profileId.toString())
            }
          } catch (error) {
            log.error(error)
          }
        }
      } else {
        report.push(`already exists profile ${row.firstname}, ${row.emails}`)
        // send invite to join
      }
    }
    return report
  }

  /**
   * set pwa installed
   * @param {*} param0
   * @returns pwa
   */
  async setPwa ({ _user }) {
    const profile = await this.profile.findById(_user.profileId)

    _.set(profile, 'pwa.installed', true)
    await profile.save()
    return profile.pwa
  }

  /**
   * refuse to install pwa
   * @param {*} param0
   * @returns pwa
   */
  async refusePwa ({ _user }) {
    const profile = await this.profile.findById(_user.profileId)
    const refuseCount = _.get(profile, 'pwa.refuseCount', 0)

    if (refuseCount <= 5) {
      const template = await rabbitmq.sendAndRead('/settings/messages/get', {
        key: 'm1.pwa.install-suggest',
        language: profile.settings.language,
        type: 'chat',
        data: {}
      })

      await rabbitmq.sendAndRead('/chat/message/system', {
        toProfileId: _user.profileId,
        content: {
          text: template.data,
          type: 'text'
        }
      })
    }
    _.set(profile, 'pwa.refuseCount', refuseCount + 1)
    await profile.save()
    return profile.pwa
  }

  /**
   * get emancipation age by country code
   * @param {*} countryCode
   * @param {*} invitedBy
   * @returns emancipation age data
   */
  async getEmancipationAge (countryCode, invitedBy) {
    if (invitedBy) {
      const relations = await ctr.relation.findRelation(invitedBy)
      const businessProfile = relations.find(relation => relation.profile.typeCode.startsWith('C'))
      const companyCountry = _.get(businessProfile, 'profile.company.country')
      if (companyCountry) {
        countryCode = companyCountry
      }
      log.debug(`invitedBy (${invitedBy}) related company country (${companyCountry})`)
    }
    const { data } = await rabbitmq.sendAndRead('/settings/ageTarget/emancipation', {
      countryCode
    })
    if (!data) {
      const response = await rabbitmq.sendAndRead('/settings/ageTarget/emancipation', {
        countryCode: 'it'
      })
      return response.data
    }

    return data
  }

  /**
   * get reference CW profile
   * @param {*} profileId
   * @returns relation
   */
  async getRefCowellnessProfile (profileId) {
    const relations = await ctr.relation.findRelation(profileId)
    const businessAccounts = relations.filter(relation => relation.status === 'active' && superUser.includes(relation.profile.typeCode))

    return _.first(_.orderBy(businessAccounts, 'createdAt', 'desc'))
  }

  /**
   * get documents to sign by countryCode
   * @param {*} countryCode
   * @param {*} invitedBy
   * @returns contracts
   */
  async getDocumentToSignIn (countryCode, invitedBy) {
    if (invitedBy) {
      const excludedFields = ['-password', '-qrCode', '-managedCountries', '-createdAt', '-updatedAt', '-interests']
      const profile = await this.profile.findOne({
        _id: invitedBy
      }, excludedFields).lean().exec()

      if (profile && nonBusiness.includes(profile.typeCode)) {
        const relations = await ctr.relation.findRelation(profile._id)
        const businessAccounts = relations.filter(relation => relation.status === 'active' && GYM.includes(relation.profile.typeCode))

        return ctr.contracts.getProfileUnsignedDocuments(businessAccounts.map(relation => relation.profile._id.toString()), null, countryCode)
      } else if (profile && GYM.includes(profile.typeCode)) {
        const gymId = profile._id
        const gymCreatedBy = profile.createdByProfileId
        const gyms = [gymId.toString()]

        if (gymCreatedBy) {
          gyms.push(gymCreatedBy.toString())
        }
        return ctr.contracts.getProfileUnsignedDocuments(gyms, null, countryCode)
      }
    }
    const businessProfile = await this.getCowellnessByCountry(countryCode)

    return ctr.contracts.getProfileUnsignedDocuments([businessProfile._id.toString()], null, countryCode)
  }

  /**
   * get CW profile by country
   * @param {*} code country code
   * @returns cw profile
   */
  async getCowellnessByCountry (code) {
    const excludedFields = ['-password', '-qrCode', '-managedCountries', '-createdAt', '-updatedAt', '-interests']
    let profiles = await this.profile.find({
      'company.country': code,
      typeCode: {
        $in: superUser
      }
    }, excludedFields).lean().exec()

    if (!profiles?.length) {
      profiles = await this.profile.find({
        'company.country': 'it',
        typeCode: {
          $in: superUser
        }
      }, excludedFields).lean().exec()
    }
    const cwProfile = profiles.find(profile => profile.typeCode === 'CW')

    if (cwProfile) {
      return cwProfile
    }
    const cuProfile = profiles.find(profile => profile.typeCode === 'CU')

    if (cuProfile) {
      return cuProfile
    }
    const chProfile = profiles.find(profile => profile.typeCode === 'CH')

    if (chProfile) {
      return chProfile
    }
    return null
  }

  /**
   * send an event to changelog service
   * @param {*} oldData
   * @param {*} newData
   * @returns
   */
  addChangeLog (oldData, newData) {
    if (!oldData) oldData = {}
    const profileId = newData._id
    const watchValues = [
      'person.firstname',
      'person.lastname',
      'person.emails',
      'person.mobilePhones',
      'person.phones',
      'person.gender',
      'ids',
      'person.birth.date',
      'person.birth.country',
      'person.birth.city',
      'person.addresses',
      'person.banks',
      'company.banks',
      'company.name'
    ]
    newData = _.pick(newData, watchValues)
    oldData = _.pick(oldData, watchValues)
    return rabbitmq.sendAndRead('/changelog/set', { profileId, service: 'auth', module: 'profile', oldData, newData })
  }

  /**
   * Send email if email id is present if not returns list of gym for reset
   * @param {string} id pin id
   * @param {string} hostName hostname of the server
   * @returns
   */
  async resetPasswordWithPin (id, hostName) {
    const regexId = new RegExp('^' + id + '$', 'i')
    const user = await this.profile.findOne({
      $or: [{
        'ids.key': 'vat',
        'ids.value': regexId,
        typeCode: {
          $in: ['IN', 'TU']
        }
      }, {
        'ids.key': 'pin',
        'ids.value': regexId,
        typeCode: {
          $in: ['IN', 'TU']
        }
      }, {
        'ids.key': 'fiscal',
        'ids.value': regexId,
        typeCode: {
          $in: ['IN', 'TU']
        }
      }]
    }, '_id ids person company settings typeCode avatar status').lean().exec()
    if (user) {
      let gyms = await this.relation.find({ rightProfileId: user._id.toString() }, '_id').populate('leftProfileId', '_id displayName typeCode company.brand').lean().exec()
      gyms = gyms.filter((gy) => { return GYM.includes(gy.leftProfileId.typeCode) }).map((gy) => gy.leftProfileId)
      if (user.person.emails && user.person.emails.length) {
        const resp = await this.emailReset(user, { username: user.person.emails[0].email }, hostName)
        return {
          isEmailSent: true,
          gyms: gyms,
          ...resp
        }
      } else {
        return {
          isEmailSent: false,
          gyms: gyms
        }
      }
    } else {
      throw new Error('Pin is not valid')
    }
  }

  /**
   * sets a validation pin code sent in email for chat plugin authentication
   */
  async setAuthPin (profileId, pin) {
    const expiry = 10 * 60 // 10 min
    await redis.set(`pin-${profileId}`, pin, 'EX', expiry)
    return pin
  }

  /**
   * get the pin code for chat plugin authentication
   */
  async getAuthPin (profileId) {
    return redis.get(`pin-${profileId}`)
  }

  /**
   * Generate token for impersonating user passed has profileId
   * @param {ObjectId} profileId
   * @param {ObjectId} currentUser
   */
  async impersonateProfile (profileId, currentProfile, userId) {
    const [activeUser, toProfile] = await Promise.all([this.profile.findById(currentProfile, '_id typeCode').lean().exec(), this.profile.findById(profileId, '_id typeCode').lean().exec()])
    // to be removed when permission is implemented
    if (!activeUser || !superUser.includes(activeUser.typeCode)) throw new Error('Impersonation is not allowed for current user')
    if (!toProfile) throw new Error('Profile id passed is not valid')
    const t = await token.save({ autoLogin: true, id: profileId, impersonator: userId }, config.options.impersonateTokenInSec)
    return { cwtoken: t.data }
  }

  /**
   * suspend all temporary profiles 30 days old
   */
  async suspendTemporary () {
    const profiles = await this.profile.find({
      status: 'temporary'
    }).lean()
    const profilesList = await Promise.all(profiles.map(profile => {
      return ctr.relation.findRelation(profile._id.toString())
        .then(relations => {
          let relationCreated = _.get(_.first(_.orderBy(relations, 'createdAt', 'desc')), 'createdAt')

          if (!relationCreated) {
            relationCreated = profile.createdAt
          }
          profile.relationCreatedAt = relationCreated
          return profile
        })
    }))
    const tempProfiles = profilesList.filter(profile => dayjs(profile.relationCreatedAt).add(30, 'day') < Date.now())
    const profilesToUpdate = await this.profile.find({
      _id: tempProfiles.map(profile => profile._id)
    })
    log.info(`Suspending ${tempProfiles.length} profiles`)
    profilesToUpdate.forEach(profile => {
      profile.status = 'suspended'
      profile.save()
    })
  }
}

module.exports = ProfileController
