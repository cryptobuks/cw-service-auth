const { db, rabbitmq, ctr, token, email, _ } = require('@cowellness/cw-micro-service')()
const config = require('config')
const sharp = require('sharp')
const { GYM, superUser, parentAllowed, GYMUNIT, nonBusiness } = require('../profile/profile.enum')
const EmailValidator = require('email-deep-validator')
const emailValidator = new EmailValidator({ verifyMailbox: false })
const welcomeUrl = '/auth/auto-login?token='
/**
 * @class CompanyController
 * @classdesc Controller Company
 */
class CompanyController {
  constructor () {
    this.company = db.auth.model('Profile')
    this.profileHistory = db.auth.model('profileHistory')
    this.cwModules = db.auth.model('CwModules')
    this.relation = db.auth.model('Relation')
  }

  /**
   * get a company profile
   * @param {*} id profile id
   * @returns profile
   */
  findById (id) {
    return this.company.findById(id, 'company person settings avatar typeCode displayName parentId').exec()
  }

  /**
   * get profile by id
   * @param {*} id
   * @returns profile
   */
  async findProfileById (id) {
    const user = await this.company.findById(id, 'company person settings avatar typeCode status ids shortDescription interests displayName password').lean().exec()
    if (user) {
      if (user.password && user.password.length) {
        user.hasPassword = true
      } else {
        user.hasPassword = false
      }
      user.password = undefined
    }
    return user
  }

  /**
   * get profile by id with fields
   * @param {*} id
   * @param {*} fields
   * @returns profile
   */
  async findByIdDynamicFields (id, fields) {
    const profile = await this.company.findById(id, fields).lean().exec()
    if (profile) {
      if (profile.password && profile.password.length) {
        profile.hasPassword = true
      } else {
        profile.hasPassword = false
      }
      profile.password = undefined
    }
    return profile
  }

  /**
   * get profile by ids with fields
   * @param {*} ids profile ids
   * @param {*} fields
   * @returns profiles
   */
  async findByIdsDynamicFields (ids, fields) {
    let profiles = await this.company.find({ _id: { $in: ids } }, fields).lean().exec()
    if (profiles && profiles.length) {
      profiles = profiles.map((profile) => {
        if (profile.password && profile.password.length) {
          profile.hasPassword = true
        } else {
          profile.hasPassword = false
        }
        profile.password = undefined
        return profile
      })
    }
    return profiles
  }

  /**
   * find a company by id
   * @param {*} id
   * @returns company profile
   */
  async findCompanyById (id) {
    const company = await this.company.findById(id, 'company settings avatar typeCode status ids shortDescription displayName').lean().exec()
    if (company.typeCode === 'IN' || company.typeCode === 'TU') {
      throw new Error('Not a company profile')
    }
    return company
  }

  /**
   * find a user by id
   * @param {*} id
   * @returns user profile
   */
  async findUserById (id) {
    const user = await this.company.findById(id, 'person settings avatar typeCode status interests ids shortDescription displayName password').lean().exec()
    if (!user || (user.typeCode !== 'IN' && user.typeCode !== 'TU')) {
      throw new Error('Not a user profile')
    }

    if (user) {
      if (user.password && user.password.length) {
        user.hasPassword = true
      } else {
        user.hasPassword = false
      }
      user.password = undefined
    }
    const leftRelation = await ctr.relation.findLeftRelation(id, 'leftProfileId')
    if (leftRelation && leftRelation.length) {
      user.tutors = await this.company.find({ _id: { $in: leftRelation.map((r) => { return r.leftProfileId.toString() }) }, typeCode: 'TU' }, '_id avatar typeCode person settings').lean().exec()
    }
    return user
  }

  /**
   * get valid countries
   * @returns countries
   */
  async validCountries () {
    const resp = await rabbitmq.sendAndRead('/settings/countries/get', {})
    return resp.data
  }

  /**
   * uploads a user profile
   * @param {*} file
   * @param {*} userId
   * @param {*} hostName
   * @param {*} parentUserId
   */
  uploadUserProfile (file, userId, hostName, parentUserId) {
    return this.profileUpload(file, userId, hostName)
  }

  /**
   * upload profile using file service
   * @param {*} file
   * @param {*} userId
   * @param {*} hostName
   */
  async profileUpload (file, userId, hostName) {
    const bufferData = await sharp(Buffer.from(file.base64, 'base64'))
      .resize(200)
      .jpeg({ quality: 80 })
      .toBuffer()
    const resp = await Promise.all([this.findById(userId), rabbitmq.sendAndRead('/files/post', {
      filename: file.filename,
      isPublic: true,
      binData: bufferData.toString('base64')
    })])
    rabbitmq.send('/files/optimize', {
      _id: resp[1].data._id
    })
    const user = resp[0]
    const uploadFile = resp[1].data
    if (user) {
      if (user.avatar.id) {
        await rabbitmq.sendAndRead('/files/delete', { _id: user.avatar.id.toString() })
      }
      user.avatar.id = uploadFile._id
      user.avatar.filename = uploadFile.filename
      await user.save()
      return user
    }
  }

  /**
   * find profile by phone
   * @param {*} prefixNumber
   * @param {*} phoneNo
   * @param {*} countryCode
   * @returns profile
   */
  async findByMobileNo (prefixNumber, phoneNo, countryCode) {
    let data = await this.company.findOne({ 'person.mobilePhones': { $elemMatch: { countryCode: countryCode, prefixNumber: prefixNumber, phoneNumber: phoneNo } } }, '_id person settings typeCode ids interests')
    if (!data) data = await this.company.findOne({ 'company.mobilePhones': { $elemMatch: { countryCode: countryCode, prefixNumber: prefixNumber, phoneNumber: phoneNo } } }, '_id person settings typeCode ids interests')
    return data
  }

  /**
   * find profile by email
   * @param {*} email
   * @returns profile
   */
  async findByEmailIdWithoutPassword (email) {
    let data = await this.company.findOne({ 'person.emails': { $elemMatch: { email: email } } }, '_id person settings typeCode ids interests ')
    if (!data) data = await this.company.findOne({ 'company.emails': { $elemMatch: { email: email } } }, '_id person settings typeCode ids interests ')
    return data
  }

  /**
   * search company by string
   * @param {*} txt query
   * @returns companies
   */
  searchCompany (txt) {
    return new Promise((resolve, reject) => {
      const filterQuery = []
      const filterLogic = txt.split(' ')
      filterLogic.forEach((e) => {
        if (e.trim().length > 0) {
          filterQuery.push({ wildcard: { 'company.name': '*' + e.trim() + '*' } })
        }
      })
      this.company.search({ bool: { must: filterQuery, must_not: [], should: [] } }, { hydrate: true }, function (err, results) {
        if (err) {
          reject(err)
        } else {
          const companyList = []
          results.hits.hits.forEach(function (result) {
            if (!result) return
            const data = { ids: [], _id: result._id, company: { name: result.company.name, typeCode: result.typeCode } }
            if (result.ids && result.ids.length) {
              result.ids.forEach((e) => {
                if (e.key === 'vat' || e.key === 'fiscal') {
                  data.ids.push(e)
                }
              })
            }
            companyList.push(data)
          })
          resolve(companyList)
        }
      })
    })
  }

  /**
   * search profile by query
   * @param {*} text query
   * @returns profiles
   */
  searchByEmailMobilePin (text) {
    return new Promise((resolve, reject) => {
      // this.company.search({ bool: { must: [], must_not: [], should: [{ wildcard: { 'person.emails.email': '*' + text + '*' } }, { wildcard: { 'person.firstname': '*' + text + '*' } }, { wildcard: { 'person.lastname': '*' + text + '*' } }, { match : { 'ids.key': 'pin' } }, { wildcard: { 'person.mobilePhones.phoneNumber': '*' + text + '*' } }] } }, { hydrate: true, hydrateOptions: { select: 'person.firstname person.lastname person.emails person.mobilePhones ids' } }, function (err, results) {
      this.company.search({ query_string: { query: '*' + text + '*', fields: ['person.emails.email', 'person.firstname', 'person.lastname', 'person.mobilePhones.phoneNumber', 'ids.value'] } }, { hydrate: true, hydrateOptions: { select: '_id person.firstname person.lastname person.emails person.mobilePhones ids displayName' } }, function (err, results) {
        if (err) {
          reject(err)
        } else {
          resolve(results.hits.hits)
        }
      })
    })
  }

  /**
   * search profile by mobile,email,pin,address
   */
  searchByEmailMobilePinAddress (text) {
    return new Promise((resolve, reject) => {
      // this.company.search({ bool: { must: [], must_not: [], should: [{ wildcard: { 'person.emails.email': '*' + text + '*' } }, { wildcard: { 'person.firstname': '*' + text + '*' } }, { wildcard: { 'person.lastname': '*' + text + '*' } }, { match : { 'ids.key': 'pin' } }, { wildcard: { 'person.mobilePhones.phoneNumber': '*' + text + '*' } }] } }, { hydrate: true, hydrateOptions: { select: 'person.firstname person.lastname person.emails person.mobilePhones ids' } }, function (err, results) {
      this.company.search({ query_string: { query: '*' + text + '*', fields: ['company.emails.email', 'person.emails.email', 'company.name', 'company.brand', 'company.addresses', 'person.addresses', 'company.phones', 'person.firstname', 'person.lastname', 'person.mobilePhones.phoneNumber', 'ids.value'] } }, { hydrate: true, hydrateOptions: { select: '_id person.firstname person.lastname person.emails person.mobilePhones ids displayName company.name company.brand' } }, function (err, results) {
        if (err) {
          reject(err)
        } else {
          resolve(results.hits.hits)
        }
      })
    })
  }

  /**
   * get user by ids prop
   * @param {*} id value
   * @param {*} countryCode
   * @param {*} key
   * @returns company profile
   */
  getUserByIdKey (id, countryCode, key) {
    return this.company.findOne({ 'ids.key': key, 'ids.value': id, 'ids.countryCode': countryCode }, '_id ids person company settings typeCode avatar status interests').exec()
  }

  /**
   * get company by vatId
   * @param {*} id value
   * @param {*} countryCode
   * @returns profile
   */
  getCompanyByVatId (id, countryCode) {
    return this.getUserByIdKey(id, countryCode, 'vat')
  }

  /**
   * get company by fiscal
   * @param {*} id value
   * @param {*} countryCode
   * @returns profile
   */
  getCompanyByFiscalId (id, countryCode) {
    return this.getUserByIdKey(id, countryCode, 'fiscal')
  }

  /**
   * get company by pin
   * @param {*} id value
   * @param {*} countryCode
   * @returns profile
   */
  getUserByPin (id, countryCode) {
    return this.getUserByIdKey(id, countryCode, 'pin')
  }

  /**
   * get company by tin
   * @param {*} id value
   * @param {*} countryCode
   * @returns profile
   */
  async getUserByTin (id, countryCode) {
    return await this.getUserByIdKey(id, countryCode, 'tin')
  }

  /**
   * search vat
   * @param {*} id vat value
   * @param {*} countryCode
   * @returns profile
   */
  async searchVat (id, countryCode) {
    const regexp = new RegExp('^' + id)
    return this.company.find({ ids: { $elemMatch: { key: 'vat', value: regexp } } }, '_id ids person company settings typeCode avatar status')
  }

  /**
   * copy bank data from parent
   * @param {*} parentId
   * @param {*} childId
   * @param {*} selectedIds
   */
  async copyBankFromParent (parentId, childId, selectedIds) {
    const [parent, child] = await Promise.all([this.company.findById(parentId, 'company.banks').lean().exec(), this.company.findById(childId, 'company.banks').exec()])
    if (parent && child && parent.company && parent.company.banks && parent.company.banks.length) {
      child.company.banks = parent.company.banks.map((bank) => {
        bank.referenceId = bank._id.toString()
        bank.isActive = (selectedIds && selectedIds.length ? selectedIds.includes(bank._id.toString()) : true)
        delete bank._id
        return bank
      })
      await child.save()
    }
  }

  /**
   * add bank details to child
   * @param {*} userId
   * @param {*} newBank
   * @returns boolean
   */
  async addBankdetailsToChild (userId, newBank) {
    const childGym = await this.company.find({ parentId: userId, typeCode: { $in: GYMUNIT } }).exec()
    if (childGym && childGym.length) {
      for (const child of childGym) {
        if (!child.company.banks) child.company.banks = []
        child.company.banks.push({
          name: newBank.name,
          countryCode: newBank.countryCode,
          iban: newBank.iban,
          account: newBank.account,
          bic: newBank.bic,
          owner: newBank.owner,
          isActive: newBank.isActive,
          routingNumber: newBank.routingNumber,
          referenceId: newBank._id.toString()
        })
        await child.save()
      }
    }
    return true
  }

  /**
   * add bank details
   * @param {*} bankDetail
   * @param {*} userId
   * @returns bank details
   */
  async addBankDetails (bankDetail, userId) {
    const user = await this.findById(userId)
    if (GYMUNIT.includes(user.typeCode)) throw new Error('Bank details can not be added /deleted / updated for typeCode GU & CU')
    if (user) {
      const bank = []
      bank.push({
        name: bankDetail.name,
        countryCode: bankDetail.countryCode,
        iban: bankDetail.iban,
        account: bankDetail.account,
        bic: bankDetail.bic,
        owner: bankDetail.owner,
        isActive: bankDetail.isActive,
        routingNumber: bankDetail.routingNumber
      })
      if (['IN', 'TU'].includes(user.typeCode)) {
        if (!user.person.banks) user.person.banks = []
        user.person.banks = user.person.banks.concat(bank)
      } else {
        if (!user.company.banks) user.company.banks = []
        user.company.banks = user.company.banks.concat(bank)
      }
      const updatedUser = await user.save()
      const newBank = ['IN', 'TU'].includes(user.typeCode) ? updatedUser.person.banks[updatedUser.person.banks.length - 1] : updatedUser.company.banks[updatedUser.company.banks.length - 1]
      if (['IN', 'TU'].includes(user.typeCode) === false) await this.addBankdetailsToChild(userId, newBank)
      return newBank
    }
    return null
  }

  /**
   * update bank details to child
   * @param {*} userId
   * @param {*} updatedBank
   * @returns boolean
   */
  async updateBankdetailsToChild (userId, updatedBank) {
    const childGym = await this.company.find({ parentId: userId, typeCode: { $in: GYMUNIT } }).exec()
    if (childGym && childGym.length) {
      for (const child of childGym) {
        if (child.company.banks && child.company.banks) {
          const bankPosition = child.company.banks.findIndex((bank) => { return bank.referenceId.toString() === updatedBank._id.toString() })
          if (bankPosition > -1) {
            child.company.banks[bankPosition].name = updatedBank.name
            child.company.banks[bankPosition].countryCode = updatedBank.countryCode
            child.company.banks[bankPosition].iban = updatedBank.iban
            child.company.banks[bankPosition].account = updatedBank.account
            child.company.banks[bankPosition].bic = updatedBank.bic
            child.company.banks[bankPosition].owner = updatedBank.owner
            child.company.banks[bankPosition].routingNumber = updatedBank.routingNumber
            await child.save()
          }
        }
      }
    }
    return true
  }

  /**
   * update bank details
   * @param {*} bankDetail
   * @param {*} bankId
   * @param {*} userId
   * @returns bank
   */
  async updateBankDetails (bankDetail, bankId, userId) {
    const user = await this.findById(userId)
    let isBankAvailable = false
    let selectedBank
    if (user) {
      const refObject = (['IN', 'TU'].includes(user.typeCode)) ? user.person : user.company
      if (refObject.banks && refObject.banks.length) {
        refObject.banks.forEach((e) => {
          if (e._id.toString() === bankId) {
            isBankAvailable = true
            if (!GYMUNIT.includes(user.typeCode)) {
              e.name = bankDetail.name
              e.countryCode = bankDetail.countryCode
              e.iban = bankDetail.iban
              e.account = bankDetail.account
              e.bic = bankDetail.bic
              e.owner = bankDetail.owner
              e.routingNumber = bankDetail.routingNumber
            }
            e.isActive = bankDetail.isActive
            selectedBank = e
          }
        })
      }
      if (isBankAvailable) {
        await user.save()
        if (['IN', 'TU'].includes(user.typeCode) === false) await this.updateBankdetailsToChild(userId, selectedBank)
        return selectedBank
      } else {
        throw new Error('Bank details not found')
      }
    }
  }

  /**
   * remove bank details from child profile
   * @param {*} userId
   * @param {*} bankId
   * @returns boolean
   */
  async removeBankdetailsFromChild (userId, bankId) {
    const childGym = await this.company.find({ parentId: userId, typeCode: { $in: GYMUNIT } }).exec()
    if (childGym && childGym.length) {
      for (const child of childGym) {
        if (child.company.banks && child.company.banks) {
          child.company.banks = child.company.banks.filter((bank) => bank.referenceId.toString() !== bankId)
          await child.save()
        }
      }
    }
    return true
  }

  /**
   * delete bank details
   * @param {*} bankId
   * @param {*} userId
   * @returns bank
   */
  async deleteBankDetails (bankId, userId) {
    const user = await this.findById(userId)
    if (GYMUNIT.includes(user.typeCode)) throw new Error('Bank details can not be added /deleted / updated for typeCode GU & CU')
    const refObject = (['IN', 'TU'].includes(user.typeCode)) ? user.person : user.company
    if (user && refObject && refObject.banks) {
      refObject.banks = refObject.banks.filter((bank) => bank._id.toString() !== bankId)
    }
    const updatedUser = await user.save()
    if (['IN', 'TU'].includes(user.typeCode) === false) await this.removeBankdetailsFromChild(userId, bankId)
    return updatedUser.company.banks
  }

  /**
   * get banks
   * @param {*} userId
   * @returns banks
   */
  async getBanksByUserId (userId) {
    const user = await this.findById(userId)
    if (user && user.company) {
      return user.company.banks
    } else {
      return null
    }
  }

  /**
   * validate email
   * @param {*} emailId
   * @returns boolean
   */
  async validateEmail (emailId) {
    const { wellFormed, validDomain } = await emailValidator.verify(emailId)
    if (!wellFormed || !validDomain) {
      return false
    } else {
      return true
    }
  }

  /**
   * creates a profile
   * @param {*} data
   * @param {*} creatingUser
   * @param {*} hostName
   * @returns profile
   */
  async createProfile (data, creatingUser, hostName) {
    let emailValid = false
    let mobileValid = false
    let pinValid = false
    if (data.person.emails && data.person.emails.length > 0) {
      emailValid = true
    }
    if (data.person.mobilePhones && data.person.mobilePhones.length > 0) {
      mobileValid = true
    }
    if (data.ids && data.ids.length > 0 && data.ids.filter((e) => { return e.key === 'pin' }).length > 0) {
      pinValid = true
    }
    if (!emailValid && !mobileValid && !pinValid) {
      throw new Error('Email, mobilePhone, Pin no all cant be blank')
    }

    if (data.person.emails) {
      data.person.emails.forEach((e) => {
        e.email = e.email.toLowerCase()
      })
      if (data.person.emails.filter(async (e) => {
        return await this.validateEmail(e.mail)
      }).length < data.person.emails.length) {
        throw new Error('All email id should be valid')
      }
    }

    const searchList = []
    if (data.person.emails && data.person.emails.length) {
      data.person.emails.forEach((e) => {
        searchList.push(this.company.findOne({ 'person.emails.email': e.email }, '_id').lean().exec())
        searchList.push(this.company.findOne({ 'company.emails.email': e.email }, '_id').lean().exec())
      })
    }
    if (data.person.mobilePhones && data.person.mobilePhones.length) {
      data.person.mobilePhones.forEach((e) => {
        searchList.push(this.company.findOne({ 'person.mobilePhones.countryCode': e.countryCode, 'person.mobilePhones.prefixNumber': e.prefixNumber, 'person.mobilePhones.phoneNumber': e.phoneNumber }, '_id').lean().exec())
        searchList.push(this.company.findOne({ 'company.mobilePhones.countryCode': e.countryCode, 'company.mobilePhones.prefixNumber': e.prefixNumber, 'company.mobilePhones.phoneNumber': e.phoneNumber }, '_id').lean().exec())
      })
    }
    if (data.ids && data.ids.length) {
      data.ids.forEach((e) => {
        searchList.push(this.company.findOne({ ids: { $elemMatch: { key: e.key, value: e.value, countryCode: e.countryCode } } }, '_id').lean().exec())
      })
    }
    const errorValidationList = await Promise.all(searchList)
    errorValidationList.forEach((e) => {
      if (e) {
        throw new Error('Email / mobile / pin / tin number already registered')
      }
    })
    if (data.person.phones && data.person.phones.length) {
      data.person.phones.forEach((e) => {
        if (!e.countryCode || e.countryCode.length < 1 || !e.prefixNumber || e.prefixNumber.length < 1 || !e.phoneNumber || e.phoneNumber.length < 1) {
          throw new Error('Country code, prefixNumber & phoneNumber all 3 field are required in phones')
        }
      })
    }

    const userProfile = {
      typeCode: data.typeCode,
      shortDescription: data.shortDescription,
      person: {
        firstname: data.person.firstname,
        lastname: data.person.lastname,
        gender: data.person.gender,
        onlineLinks: data.person.onlineLinks ? data.person.onlineLinks : [],
        banks: data.person.banks ? data.person.banks : []
      },
      interests: data.interests,
      createdByProfileId: creatingUser
    }
    if (data.settings && data.settings.language) {
      userProfile.settings = { language: data.settings.language }
    }
    if (data.person.birth) {
      userProfile.person.birth = {}
      if (data.person.birth.date) userProfile.person.birth.date = data.person.birth.date
      if (data.person.birth.country) userProfile.person.birth.country = data.person.birth.country
      if (data.person.birth.city) userProfile.person.birth.city = data.person.birth.city
    }
    if (data.person.emails && data.person.emails.length) {
      userProfile.person.emails = []
      data.person.emails.forEach((e) => {
        userProfile.person.emails.push({
          email: e.email
        })
      })
    }
    if (data.ids && data.ids.length) {
      if (!userProfile.ids) userProfile.ids = []
      data.ids.forEach((e) => {
        userProfile.ids.push({ key: e.key, value: e.value, countryCode: e.countryCode })
      })
    }
    if (data.person.mobilePhones && data.person.mobilePhones.length) {
      if (!userProfile.person.mobilePhones) userProfile.person.mobilePhones = []
      data.person.mobilePhones.forEach((e) => {
        userProfile.person.mobilePhones.push({
          countryCode: e.countryCode,
          prefixNumber: e.prefixNumber,
          phoneNumber: e.phoneNumber
        })
      })
    }
    if (data.person.phones && data.person.phones.length) {
      if (!userProfile.person.phones) userProfile.person.phones = []
      data.person.phones.forEach((e) => {
        userProfile.person.phones.push({
          countryCode: e.countryCode,
          prefixNumber: e.prefixNumber,
          phoneNumber: e.phoneNumber
        })
      })
    }
    if (data.person.addresses && data.person.addresses.length > 0) {
      if (!userProfile.person.addresses) userProfile.person.addresses = []
      data.person.addresses.forEach((e) => {
        userProfile.person.addresses.push({
          type: e.type,
          addressComponents: e.addressComponents,
          fulladdress: e.fulladdress,
          location: e.location,
          zipcode: e.zipcode
        })
      })
    }

    let gymName = ''
    const hqDetail = await this.company.findOne({ typeCode: 'CH' }, '_id displayName company.country').lean().exec()
    if (!hqDetail) throw new Error('CH information not available')
    gymName = hqDetail.displayName
    let newUser = await this.company.create(userProfile)

    if (data.tutors && data.tutors.length) {
      await Promise.all(data.tutors.map((t) => {
        return ctr.relation.addTutor(newUser._id.toString(), t, true)
      }))
    }
    const relationStatus = data.status === 'draft' ? 'draft' : 'temporary'
    let gymCountry
    if (creatingUser && creatingUser.length && hqDetail._id.toString() !== creatingUser) {
      await ctr.relation.createUserAndGymRelation(newUser._id.toString(), hqDetail._id.toString(), undefined, undefined, undefined, relationStatus)
      const otherBusiness = await this.company.findById(creatingUser, '_id typeCode displayName company.country').lean().exec()
      gymName = otherBusiness.displayName
      gymCountry = otherBusiness.company.country
      if (otherBusiness && GYM.includes(otherBusiness.typeCode)) {
        await ctr.relation.createUserAndGymRelation(newUser._id.toString(), otherBusiness._id.toString(), data.vatRateId, data.notes, data.cwSalesman, relationStatus, data.paymentTermId, data.acquisitionChannel?.source, data.acquisitionChannel?.friendId, data.acquisitionChannel?.advType)
        if (data.suggestedInterest && data.suggestedInterest.length) {
          await this.sendInterestSuggestion(data.suggestedInterest.toString(), creatingUser, newUser._id.toString())
        }
      }
    } else {
      gymCountry = hqDetail.company.country
      await ctr.relation.createUserAndGymRelation(newUser._id.toString(), hqDetail._id.toString(), data.vatRateId, data.notes, data.cwSalesman, relationStatus, data.paymentTermId, data.acquisitionChannel?.source, data.acquisitionChannel?.friendId, data.acquisitionChannel?.advType)
    }

    if (data.password) userProfile.password = ctr.profile.encryptPassword(newUser._id.toString(), data.password)
    newUser.qrCode = newUser._id.toString() + Math.random(10)
    newUser = await newUser.save()

    // add documents to documentSigned
    await ctr.contracts.createEmptySignedDocument(creatingUser, newUser._id.toString(), gymCountry)

    if (['IN', 'TU'].includes(newUser.typeCode) && newUser.person && newUser.person.emails && newUser.person.emails.length) {
      const t = await token.save({ person: newUser.person, id: newUser._id.toString(), autoLogin: true }, config.options.welcomeEmail)
      const data = { name: newUser.displayName || newUser.person.firstname || newUser.person.lastname, gymName: gymName, url: 'https://' + hostName + welcomeUrl + t.data }
      await email.sendEmail([newUser.person.emails[0].email], undefined, 'welcome-email.first-step', newUser.settings.language, data)
    }
    if (data.avatar) newUser = await this.profileUpload(data.avatar, newUser._id.toString(), hostName)
    if (data.tutors && data.tutors.length) {
      newUser = newUser.toObject()
      newUser.tutors = await this.profile.find({ _id: { $in: data.tutors } }, '_id avatar typeCode person settings').lean().exec()
    }

    return newUser
  }

  /**
   * get parent cowellness profile
   * @param {*} gymId
   * @returns profile
   */
  async getParentCowellness (gymId) {
    const gymDetail = await this.company.findById(gymId, '_id typeCode company.country displayName parentId settings').populate('parentId', '_id typeCode parentId settings').lean().exec()
    if (gymDetail && superUser.includes(gymDetail.typeCode)) {
      return gymDetail
    } else if (gymDetail.parentId && superUser.includes(gymDetail.parentId.typeCode)) {
      return gymDetail.parentId
    } else if (gymDetail?.parentId?.parentId) {
      return await this.getParentCowellness(gymDetail.parentId.parentId)
    } else if (gymDetail.company.country) {
      return await ctr.profile.getCowellnessByCountry(gymDetail.company.country)
    } else {
      return null
    }
  }

  /**
   * send interest suggestions
   * @param {*} suggestion
   * @param {*} gymId
   * @param {*} profileId
   * @returns boolean
   */
  async sendInterestSuggestion (suggestion, gymId, profileId) {
    const gym = await this.getParentCowellness(gymId)
    if (gym) {
      const profile = await this.company.findById(profileId, '_id displayName person.firstname person.lastname').lean().exec()
      const action = {
        showTo: [
          'to'
        ],
        label: 'profile.view_profile',
        frontend: {
          function: 'viewProfile',
          params: {
            profileId: profileId,
            gymId
          }
        }
      }
      const template = await rabbitmq.sendAndRead('/settings/messages/get', { key: 'm1.interest.suggestion', language: gym.settings?.language || 'en', type: 'chat', data: { interest: suggestion, displayName: profile.displayName } })
      await rabbitmq.sendAndRead('/chat/message/create', { frontId: 'auth-' + Date.now(), fromProfileId: gymId.toString(), fromManagerProfileId: gymId.toString(), toProfileId: gym._id.toString(), content: { text: template.data, type: 'action', actions: [action] } })
      return true
    }
    return false
  }

  /**
   * update profile
   * @param {*} data
   * @param {*} id
   * @param {*} updatingUser
   * @param {*} hostName
   * @returns profile
   */
  async updateProfile (data, id, updatingUser, hostName) {
    let emailValid = false
    let mobileValid = false
    let pinValid = false
    if (data.person.emails && data.person.emails.length > 0) {
      emailValid = true
    }
    if (data.person.mobilePhones && data.person.mobilePhones.length > 0) {
      mobileValid = true
    }
    if (data.ids && data.ids.length > 0 && data.ids.filter((e) => { return e.key === 'pin' }).length > 0) {
      pinValid = true
    }
    if (!emailValid && !mobileValid && !pinValid) {
      throw new Error('Email, mobilePhone, Pin no all cant be blank')
    }
    if (data.person.emails) {
      data.person.emails.forEach((e) => {
        e.email = e.email.toLowerCase()
      })
      if (data.person.emails.filter(async (e) => {
        return await this.validateEmail(e.mail)
      }).length < data.person.emails.length) {
        throw new Error('All email id should be valid')
      }
    }
    const excludeQuery = { _id: { $ne: id } }

    const searchList = []
    if (data.person.emails && data.person.emails.length) {
      data.person.emails.forEach((e) => {
        searchList.push(this.company.findOne({ excludeQuery, 'person.emails.email': e.email }, '_id').lean().exec())
        searchList.push(this.company.findOne({ excludeQuery, 'company.emails.email': e.email }, '_id').lean().exec())
      })
    }
    if (data.person.mobilePhones && data.person.mobilePhones.length) {
      data.person.mobilePhones.forEach((e) => {
        searchList.push(this.company.findOne({ excludeQuery, 'person.mobilePhones.countryCode': e.countryCode, 'person.mobilePhones.prefixNumber': e.prefixNumber, 'person.mobilePhones.phoneNumber': e.phoneNumber }, '_id').lean().exec())
        searchList.push(this.company.findOne({ excludeQuery, 'company.mobilePhones.countryCode': e.countryCode, 'company.mobilePhones.prefixNumber': e.prefixNumber, 'company.mobilePhones.phoneNumber': e.phoneNumber }, '_id').lean().exec())
      })
    }
    if (data.ids && data.ids.length) {
      data.ids.forEach((e) => {
        searchList.push(this.company.findOne({ excludeQuery, ids: { $elemMatch: { key: e.key, value: e.value, countryCode: e.countryCode } } }, '_id').lean().exec())
      })
    }

    const errorValidationList = await Promise.all(searchList)
    errorValidationList.forEach((e) => {
      if (e) {
        throw new Error('Email / mobile / pin / tin number already registered')
      }
    })
    if (data.person.phones && data.person.phones.length) {
      data.person.phones.forEach((e) => {
        if (!e.countryCode || e.countryCode.length < 1 || !e.prefixNumber || e.prefixNumber.length < 1 || !e.phoneNumber || e.phoneNumber.length < 1) {
          throw new Error('Country code, prefixNumber & phoneNumber all 3 field are required in phones')
        }
      })
    }

    const userProfile = await this.company.findById(id)
    userProfile.typeCode = data.typeCode
    if (!userProfile.person) userProfile.person = {}

    userProfile.person.firstname = data.person.firstname
    userProfile.person.lastname = data.person.lastname
    userProfile.person.gender = data.person.gender
    userProfile.person.onlineLinks = data.person.onlineLinks ? data.person.onlineLinks : []
    userProfile.interests = data.interests
    userProfile.shortDescription = data.shortDescription
    if (data.password) userProfile.password = ctr.profile.encryptPassword(id, data.password)

    if (data.person.birth) {
      if (!userProfile.person.birth) userProfile.person.birth = {}
      if (data.person.birth.date) userProfile.person.birth.date = data.person.birth.date
      if (data.person.birth.country) userProfile.person.birth.country = data.person.birth.country
      if (data.person.birth.city) userProfile.person.birth.city = data.person.birth.city
    }

    if (data.person.emails && data.person.emails.length) {
      userProfile.person.emails = userProfile.person.emails.filter(item => {
        return data.person.emails.find(e => e.email === item.email)
      })
      data.person.emails.forEach((e) => {
        const exists = userProfile.person.emails.find(item => item.email === e.email)

        if (!exists) {
          userProfile.person.emails.push({
            email: e.email
          })
        }
      })
    }
    if (data.ids && data.ids.length) {
      // remove the ones that doesnt exist in data.ids
      userProfile.ids = userProfile.ids.filter(id => {
        return data.ids.find(e => e.key === id.key && e.value === id.value && e.countryCode === id.countryCode)
      })

      // add ids that are new and doesnt exist in userProfile.ids
      data.ids.forEach(id => {
        const exists = userProfile.ids.find(e => e.key === id.key && e.value === id.value && e.countryCode === id.countryCode)

        if (!exists) {
          userProfile.ids.push({ key: id.key, value: id.value, countryCode: id.countryCode })
        }
      })
    }
    if (data.person.mobilePhones && data.person.mobilePhones.length) {
      userProfile.person.mobilePhones = userProfile.person.mobilePhones.filter(item => {
        return data.person.mobilePhones.find(e => e.countryCode === item.countryCode && e.prefixNumber === item.prefixNumber && e.phoneNumber === item.phoneNumber)
      })
      data.person.mobilePhones.forEach((e) => {
        const exists = userProfile.person.mobilePhones.find(item => e.countryCode === item.countryCode && e.prefixNumber === item.prefixNumber && e.phoneNumber === item.phoneNumber)

        if (!exists) {
          userProfile.person.mobilePhones.push({
            countryCode: e.countryCode,
            prefixNumber: e.prefixNumber,
            phoneNumber: e.phoneNumber
          })
        }
      })
    }
    if (data.person.phones && data.person.phones.length) {
      userProfile.person.phones = userProfile.person.phones.filter(item => {
        return data.person.phones.find(e => e.countryCode === item.countryCode && e.prefixNumber === item.prefixNumber && e.phoneNumber === item.phoneNumber)
      })
      data.person.phones.forEach((e) => {
        const exists = userProfile.person.phones.find(item => e.countryCode === item.countryCode && e.prefixNumber === item.prefixNumber && e.phoneNumber === item.phoneNumber)

        if (!exists) {
          userProfile.person.phones.push({
            countryCode: e.countryCode,
            prefixNumber: e.prefixNumber,
            phoneNumber: e.phoneNumber
          })
        }
      })
    }
    if (data.person.addresses) {
      userProfile.person.addresses = userProfile.person.addresses.filter(item => {
        return data.person.addresses.find(e =>
          e.type === item.type &&
          _.isEqual(e.addressComponents, item.addressComponents) &&
          _.isEqual(e.location, item.location) &&
          e.zipcode === item.zipcode &&
          e.fulladdress === item.fulladdress)
      })
      data.person.addresses.forEach((e) => {
        const exists = userProfile.person.addresses.find(item =>
          e.type === item.type &&
          _.isEqual(e.addressComponents, item.addressComponents) &&
          _.isEqual(e.location, item.location) &&
          e.zipcode === item.zipcode &&
          e.fulladdress === item.fulladdress)

        if (!exists) {
          userProfile.person.addresses.push({
            type: e.type,
            addressComponents: e.addressComponents,
            fulladdress: e.fulladdress,
            location: e.location,
            zipcode: e.zipcode
          })
        }
      })
    }

    let updatedUser = await userProfile.save()

    if (updatedUser._id.toString() !== updatingUser) {
      const updtUser = await this.company.findById(updatingUser, 'typeCode').lean().exec()
      if (updtUser && GYM.includes(updtUser.typeCode)) {
        await ctr.relation.updateProfilewithGymRelation(updatedUser._id.toString(), data.vatRateId, data.notes, data.cwSalesman, updatingUser, data.paymentTermId, data.acquisitionChannel?.source, data.acquisitionChannel?.friendId, data.acquisitionChannel?.advType)
        if (data.suggestedInterest && data.suggestedInterest.length) {
          await this.sendInterestSuggestion(data.suggestedInterest.toString(), updtUser._id.toString(), updatedUser._id.toString())
        }
      }
    }
    if (data.avatar) updatedUser = await this.profileUpload(data.avatar, updatedUser._id.toString(), hostName)
    return await this.findUserById(updatedUser._id.toString())
  }

  /**
   * check if chat alias exists
   * @param {*} text
   * @returns profile
   */
  async inChatAliasIsUnique (text) {
    text = text.toLowerCase()
    const data = await this.company.findOne({ 'company.mailInChat.alias': text }, '_id').lean().exec()
    return data
  }

  /**
   * get gym by id
   * @param {*} id
   * @returns
   */
  async getGymById (id) {
    const gymDetails = await Promise.all([this.company.findById(id).lean().exec(), this.relation.find({ leftProfileId: id, 'roles.role': 'DI' }).populate('rightProfileId', 'person settings typeCode status avatar displayName').lean().exec(), this.cwModules.find({ profileId: id }).lean().exec(), ctr.relation.getGymAddtionalDetails(id), this.getGymsByParentId(id)])
    if (gymDetails[0]) {
      let parent = {}
      if (gymDetails[0].parentId) {
        parent = await this.company.findById(gymDetails[0].parentId, '_id company settings avatar typeCode status managedCountries ids shortDescription displayName parentId').lean().exec()
      }
      gymDetails[0].groups = { child: gymDetails[4], parent }
      gymDetails[0].relations = gymDetails[1]
      if (gymDetails[2] && gymDetails[2].length) {
        gymDetails[0].cwModules = []
        gymDetails[2].forEach((cw) => {
          gymDetails[0].cwModules.push(cw.modules)
        })
      }
      if (gymDetails[3] && gymDetails[3].settings) {
        gymDetails[0].notes = gymDetails[3].settings.notes
        gymDetails[0].vatRateId = gymDetails[3].settings.vatRateForInvoiceId
        gymDetails[0].acquisitionChannel = gymDetails[3].settings.acquisitionChannel
      }
    }
    return gymDetails[0]
  }

  /**
   * get gym list by id
   * @param {*} id
   * @returns gyms
   */
  async getGymListBy (id) {
    const gymList = await ctr.relation.getGymList(id)
    return gymList
  }

  /**
   * create a gym
   * @param {*} data
   * @param {*} creatingUser
   * @param {*} hostName
   * @returns gym
   */
  async createGym (data, creatingUser, hostName) {
    const user = await this.company.findById(creatingUser, 'typeCode company.country').lean().exec()
    let parentDoc
    if (superUser.includes(user.typeCode) === false) {
      throw new Error('GYM creation not allowed for current user, Only allowed for profile with typeCode : CH, CW & CU')
    }

    if (data.status !== 'draft' & data.ids && data.ids.length < 1) {
      throw new Error('Vat & fiscal both cant be blank')
    }

    if (parentAllowed.includes(data.typeCode) === false && (data.status !== 'draft' || data.company.pec)) {
      const validLegalEmail = await this.validateEmail(data.company.pec)
      if (!validLegalEmail) throw new Error('Legal email is not valid')
    }

    if (GYMUNIT.includes(data.typeCode) && data.company.banks && data.company.banks.length) {
      data.company.banks.forEach((bank) => {
        if (bank.isActive && (!bank.id || bank.id.length === 0)) throw new Error('Parent profile bank id cant be null if it is active')
      })
    }
    if (data.status !== 'draft') {
      if (!data.company.roles) throw new Error('Company directors is required')
      if (!data.company.roles.length) throw new Error('Director / Managed role cant be empty')

      if (parentAllowed.includes(data.typeCode) === false) {
        if ((!data.ids || data.ids.length < 1)) throw new Error('Ids are required')
        if (!data.company.addresses) throw new Error('Company address is required')
        if (!data.company.pec) throw new Error('Company legalEmail is required')
        if (!superUser.includes(data.typeCode) && !data.company.cwModules) throw new Error('cwModules is required')
        if (!superUser.includes(data.typeCode) && !data.company.cwModules.length) throw new Error('cwModules cant be empty')
        if (!data.company.name || !data.company.name.length) throw new Error('Name is requried')
      }
    }

    if (data.parentId && data.parentId.length) {
      const parentGym = await this.company.findById(data.parentId, '_id typeCode company ids ').exec()
      if (!parentGym || ['IN', 'TU', 'CO'].includes(parentGym.typeCode)) throw new Error('Not a valid parentId')
      if (GYMUNIT.includes(data.typeCode)) {
        parentDoc = parentGym
      }
    }

    const searchList = []
    if (data.company.emails && data.company.emails.length) {
      data.company.emails.forEach((e) => {
        searchList.push(this.company.findOne({ 'person.emails.email': e.email }, '_id').lean().exec())
        searchList.push(this.company.findOne({ 'company.emails.email': e.email }, '_id').lean().exec())
      })
    }
    if (data.company.mobilePhones && data.company.mobilePhones.length) {
      data.company.mobilePhones.forEach((e) => {
        searchList.push(this.company.findOne({ 'person.mobilePhones.countryCode': e.countryCode, 'person.mobilePhones.prefixNumber': e.prefixNumber, 'person.mobilePhones.phoneNumber': e.phoneNumber }, '_id').lean().exec())
        searchList.push(this.company.findOne({ 'company.mobilePhones.countryCode': e.countryCode, 'company.mobilePhones.prefixNumber': e.prefixNumber, 'company.mobilePhones.phoneNumber': e.phoneNumber }, '_id').lean().exec())
      })
    }

    if (data.ids && data.ids.length) {
      data.ids.forEach((e) => {
        searchList.push(this.company.findOne({ ids: { $elemMatch: { key: e.key, value: e.value, countryCode: e.countryCode } } }, '_id').lean().exec())
      })
    }

    const errorValidationList = await Promise.all(searchList)
    errorValidationList.forEach((e) => {
      if (e) {
        throw new Error('Email / mobile / vat / fiscal number already registered')
      }
    })

    const GymSchema = db.auth.model('Profile')
    const companyProfile = {
      typeCode: data.typeCode,
      shortDescription: data.shortDescription,
      status: data.status,
      parentId: data.parentId,
      company: {
        name: data.company.name,
        pecs: data.company.pec ? [{ pec: data.company.pec }] : [],
        brand: data.company.brand,
        sdi: data.company.sdi,
        onlineLinks: data.company.onlineLinks ? data.company.onlineLinks : [],
        balanceSheet: {
          startDate: data.company.balanceSheet ? data.company.balanceSheet.startDate : undefined
        },
        banks: undefined,
        mailInChat: {
          alias: (data.company.mailInChat && data.company.mailInChat.alias) ? data.company.mailInChat.alias : null
        },
        countryFields: {}
      },
      settings: {
        language: data.settings.language
      },
      createdByProfileId: creatingUser
    }
    if (!GYMUNIT.includes(data.typeCode) && data.company.banks && data.company.banks.length) companyProfile.company.banks = data.company.banks.map((bank) => { delete bank.id; return bank })
    if (data.company.countryFields && data.company.countryFields.it) {
      companyProfile.company.countryFields.it = data.company.countryFields.it
    }
    if (data.company.emails && data.company.emails.length) {
      companyProfile.company.emails = []
      data.company.emails.forEach((e) => {
        companyProfile.company.emails.push({
          email: e.email
        })
      })
    }

    if (data.company.credits && data.company.credits.length) {
      if (!companyProfile.company.credits) companyProfile.company.credits = []
      data.company.credits.forEach((cred) => {
        companyProfile.company.credits.push({ credit: cred.credit, startDt: cred.startDt, endDt: cred.endDt })
      })
    }

    if (['CW', 'CU'].includes(data.typeCode) && data.managedCountries && data.managedCountries.length) {
      companyProfile.managedCountries = data.managedCountries
    }

    if (data.ids && data.ids.length) {
      if (!companyProfile.ids) companyProfile.ids = []
      data.ids.forEach((e) => {
        companyProfile.ids.push({ key: e.key, value: e.value, countryCode: e.countryCode })
      })
    }
    if (data.company.mobilePhones && data.company.mobilePhones.length) {
      if (!companyProfile.company.mobilePhones) companyProfile.company.mobilePhones = []
      data.company.mobilePhones.forEach((e) => {
        companyProfile.company.mobilePhones.push({
          countryCode: e.countryCode,
          prefixNumber: e.prefixNumber,
          phoneNumber: e.phoneNumber
        })
      })
    }
    if (data.company.landlines && data.company.landlines.length) {
      if (!companyProfile.company.phones) companyProfile.company.phones = []
      data.company.landlines.forEach((e) => {
        companyProfile.company.phones.push({
          countryCode: e.countryCode,
          prefixNumber: e.prefixNumber,
          phoneNumber: e.phoneNumber
        })
      })
    }
    if (data.company.addresses && data.company.addresses.length) {
      if (!companyProfile.company.addresses) companyProfile.company.addresses = []
      data.company.addresses.forEach((e) => {
        companyProfile.company.addresses.push({
          type: e.type,
          addressComponents: e.addressComponents,
          fulladdress: e.fulladdress,
          location: e.location,
          zipcode: e.zipcode
        })
      })
    }

    const saveParam = { validateBeforeSave: true }

    const hqDetail = await ctr.profile.getCowellnessByCountry(user.company.country) // await this.company.findOne({ typeCode: 'CH' }, '_id').lean().exec()
    if (!hqDetail) throw new Error('Cowellness information not available')

    if (companyProfile.status === 'draft') saveParam.validateBeforeSave = false
    const gymModel = new GymSchema(companyProfile)
    let newGYM = await gymModel.save(saveParam)
    newGYM.qrCode = newGYM._id.toString() + Math.random(10)

    newGYM = await newGYM.save()
    if (GYMUNIT.includes(data.typeCode) && parentDoc) {
      newGYM.company.name = parentDoc.company.name
      newGYM.company.addresses = parentDoc.company.addresses
      newGYM.ids = parentDoc.ids
      newGYM.company.sdi = parentDoc.company.sdi
      newGYM.company.pecs = parentDoc.company.pecs
      newGYM.company.balanceSheet = parentDoc.company.balanceSheet
      newGYM = await newGYM.save()
      await ctr.cwmodules.copyCwModules(newGYM._id.toString(), parentDoc._id.toString())
      const selectedBank = []
      if (data.company.banks && data.company.banks.length) data.company.banks.forEach((bank) => { if (bank.isActive) selectedBank.push(bank.id.toString()) })
      await this.copyBankFromParent(parentDoc._id.toString(), newGYM._id.toString(), selectedBank)
    } else if (data.typeCode === 'GY' && parentDoc && parentDoc.typeCode === 'GY') {
      parentDoc.typeCode = 'GH'
      await parentDoc.save()
    }

    if (data.avatar) newGYM = await this.profileUpload(data.avatar, newGYM._id.toString(), hostName)

    const relationStatus = companyProfile.status === 'draft' ? 'draft' : 'temporary'
    if (hqDetail._id.toString() !== creatingUser) {
      await ctr.relation.createUserAndGymRelation(newGYM._id.toString(), hqDetail._id.toString(), undefined, undefined, undefined, relationStatus)
    }
    if (parentDoc && parentDoc._id.toString() !== hqDetail._id.toString() && parentDoc._id.toString() !== creatingUser) {
      await ctr.relation.createUserAndGymRelation(parentDoc._id.toString(), creatingUser, data.company.vatRateId, data.notes, data.cwSalesman, relationStatus)
    }
    await ctr.relation.createUserAndGymRelation(newGYM._id.toString(), creatingUser, data.company.vatRateId, data.notes, data.cwSalesman, relationStatus)

    if (data.company.roles && data.company.roles.length) {
      for (const e of data.company.roles) {
        await ctr.relation.createGymAndRoleRelation(newGYM._id.toString(), e.id, e.role, e.startAt, e.endAt)
      }
    }

    if (data.company.cwModules && data.company.cwModules.length) {
      for (const item of data.company.cwModules) {
        await ctr.cwmodules.createByGymId(newGYM._id.toString(), item, creatingUser)
      }
    }
    if (!superUser.includes(newGYM.typeCode)) {
      await ctr.contracts.setDefaultContrats(user.company.country, newGYM._id.toString(), hqDetail)
    }
    return await this.getGymById(newGYM._id.toString())
  }

  /**
   * create a company
   * @param {*} data
   * @param {*} creatingUser
   * @param {*} hostName
   * @returns profile
   */
  async createCompany (data, creatingUser, hostName) {
    if (data.status !== 'draft' & data.ids && data.ids.length < 1) {
      throw new Error('Vat & fiscal both cant be blank')
    }

    if (data.company.pec) {
      const validLegalEmail = await this.validateEmail(data.company.pec)
      if (!validLegalEmail) throw new Error('Legal email is not valid')
    }

    if (GYMUNIT.includes(data.typeCode) && data.company.banks && data.company.banks.length) {
      data.company.banks.forEach((bank) => {
        if (bank.isActive && (!bank.id || bank.id.length === 0)) throw new Error('Parent profile bank id cant be null if it is active')
      })
    }

    // if (!data.company.roles) throw new Error('Company directors is required')
    // if (!data.company.roles.length) throw new Error('Director / Managed role cant be empty')

    if (parentAllowed.includes(data.typeCode) === false) {
      if ((!data.ids || data.ids.length < 1)) throw new Error('Ids are required')
      if (!data.company.addresses) throw new Error('Company address is required')
      if (!data.company.pec) throw new Error('Company legalEmail is required')
    }

    const searchList = []
    if (data.company.emails && data.company.emails.length) {
      data.company.emails.forEach((e) => {
        searchList.push(this.company.findOne({ 'person.emails.email': e.email }, '_id').lean().exec())
        searchList.push(this.company.findOne({ 'company.emails.email': e.email }, '_id').lean().exec())
      })
    }
    if (data.company.mobilePhones && data.company.mobilePhones.length) {
      data.company.mobilePhones.forEach((e) => {
        searchList.push(this.company.findOne({ 'person.mobilePhones.countryCode': e.countryCode, 'person.mobilePhones.prefixNumber': e.prefixNumber, 'person.mobilePhones.phoneNumber': e.phoneNumber }, '_id').lean().exec())
        searchList.push(this.company.findOne({ 'company.mobilePhones.countryCode': e.countryCode, 'company.mobilePhones.prefixNumber': e.prefixNumber, 'company.mobilePhones.phoneNumber': e.phoneNumber }, '_id').lean().exec())
      })
    }

    if (data.ids && data.ids.length) {
      data.ids.forEach((e) => {
        searchList.push(this.company.findOne({ ids: { $elemMatch: { key: e.key, value: e.value, countryCode: e.countryCode } } }, '_id').lean().exec())
      })
    }

    const errorValidationList = await Promise.all(searchList)
    errorValidationList.forEach((e) => {
      if (e) {
        throw new Error('Email / mobile / vat / fiscal number already registered')
      }
    })

    const GymSchema = db.auth.model('Profile')
    const companyProfile = {
      typeCode: data.typeCode,
      shortDescription: data.shortDescription,
      status: data.status,
      company: {
        name: data.company.name,
        pecs: data.company.pec ? [{ pec: data.company.pec }] : [],
        brand: data.company.brand,
        sdi: data.company.sdi,
        onlineLinks: data.company.onlineLinks ? data.company.onlineLinks : [],
        banks: undefined,
        countryFields: {}
      },
      settings: {
        language: data.settings.language
      },
      createdByProfileId: creatingUser
    }

    if (!GYMUNIT.includes(data.typeCode) && data.company.banks && data.company.banks.length) companyProfile.company.banks = data.company.banks.map((bank) => { delete bank.id; return bank })
    if (data.company.countryFields && data.company.countryFields.it) {
      companyProfile.company.countryFields.it = data.company.countryFields.it
    }
    if (data.company.emails && data.company.emails.length) {
      companyProfile.company.emails = []
      data.company.emails.forEach((e) => {
        companyProfile.company.emails.push({
          email: e.email
        })
      })
    }

    if (data.ids && data.ids.length) {
      if (!companyProfile.ids) companyProfile.ids = []
      data.ids.forEach((e) => {
        companyProfile.ids.push({ key: e.key, value: e.value, countryCode: e.countryCode })
      })
    }
    if (data.company.mobilePhones && data.company.mobilePhones.length) {
      if (!companyProfile.company.mobilePhones) companyProfile.company.mobilePhones = []
      data.company.mobilePhones.forEach((e) => {
        companyProfile.company.mobilePhones.push({
          countryCode: e.countryCode,
          prefixNumber: e.prefixNumber,
          phoneNumber: e.phoneNumber
        })
      })
    }
    if (data.company.landlines && data.company.landlines.length) {
      if (!companyProfile.company.phones) companyProfile.company.phones = []
      data.company.landlines.forEach((e) => {
        companyProfile.company.phones.push({
          countryCode: e.countryCode,
          prefixNumber: e.prefixNumber,
          phoneNumber: e.phoneNumber
        })
      })
    }
    if (data.company.addresses && data.company.addresses.length) {
      if (!companyProfile.company.addresses) companyProfile.company.addresses = []
      data.company.addresses.forEach((e) => {
        companyProfile.company.addresses.push({
          type: e.type,
          addressComponents: e.addressComponents,
          fulladdress: e.fulladdress,
          location: e.location,
          zipcode: e.zipcode
        })
      })
    }

    const saveParam = { validateBeforeSave: true }

    const hqDetail = await this.company.findOne({ typeCode: 'CH' }, '_id').lean().exec()
    if (!hqDetail) throw new Error('CH information not available')

    if (companyProfile.status === 'draft') saveParam.validateBeforeSave = false
    const gymModel = new GymSchema(companyProfile)
    let newGYM = await gymModel.save(saveParam)
    newGYM.qrCode = newGYM._id.toString() + Math.random(10)

    newGYM = await newGYM.save()

    if (data.avatar) newGYM = await this.profileUpload(data.avatar, newGYM._id.toString(), hostName)
    const relationStatus = data.status === 'draft' ? 'draft' : 'temporary'
    if (creatingUser && creatingUser.length && hqDetail._id.toString() !== creatingUser) {
      await ctr.relation.createUserAndGymRelation(newGYM._id.toString(), hqDetail._id.toString(), undefined, undefined, undefined, relationStatus)
      const otherBusiness = await this.company.findById(creatingUser, '_id typeCode displayName').lean().exec()
      if (otherBusiness && GYM.includes(otherBusiness.typeCode)) {
        await ctr.relation.createUserAndGymRelation(newGYM._id.toString(), otherBusiness._id.toString(), data.vatRateId, data.notes, data.cwSalesman, relationStatus, data.paymentTermId)
      }
    } else {
      await ctr.relation.createUserAndGymRelation(newGYM._id.toString(), hqDetail._id.toString(), data.vatRateId, data.notes, data.cwSalesman, relationStatus, data.paymentTermId)
    }

    if (data.company.roles && data.company.roles.length) {
      for (const e of data.company.roles) {
        await ctr.relation.createGymAndRoleRelation(newGYM._id.toString(), e.id, e.role, e.startAt, e.endAt)
      }
    }

    return await this.getGymById(newGYM._id.toString())
  }

  /**
   * update gym
   * @param {*} data
   * @param {*} id
   * @param {*} updatingUser
   * @param {*} hostName
   * @returns profile
   */
  async updateGym (data, id, updatingUser, hostName) {
    let isSuperUser = false
    let parentDoc
    const user = await this.company.findById(updatingUser, 'typeCode').lean().exec()
    if (superUser.includes(user.typeCode)) {
      isSuperUser = true
    }

    if (data.status !== 'draft' && data.ids && data.ids.length < 1 && ['GU', 'CU'].includes(data.typeCode) === false) {
      throw new Error('Vat & fiscal both cant be blank')
    }

    if (data.company.pec) {
      const validLegalEmail = await this.validateEmail(data.company.pec)
      if (!validLegalEmail) throw new Error('Legal email is not valid')
    }

    if (data.status !== 'draft' && parentAllowed.includes(data.typeCode) === false) {
      if (!data.company.addresses) throw new Error('Company address is required')
      if (!data.company.pec) throw new Error('Company legalEmail is required')
      if (isSuperUser && !data.company.cwModules) throw new Error('cwModules is required')
      // if (isSuperUser && !data.company.cwModules.length) throw new Error('cwModules cant be empty')
    }

    // if (parentAllowed.includes(data.typeCode)) {
    if (data.parentId && data.parentId.length) {
      const parentGym = await this.company.findById(data.parentId, '_id typeCode company ids').exec()
      if (!parentGym || ['IN', 'TU', 'CO'].includes(parentGym.typeCode)) throw new Error('Not a valid parentId')
      if (GYMUNIT.includes(data.typeCode)) {
        parentDoc = parentGym
      }
    }
    // } else {
    //   data.parentId = undefined
    // }

    const excludeQuery = { _id: { $ne: id } }

    const searchList = []
    if (data.company.emails && data.company.emails.length) {
      data.company.emails.forEach((e) => {
        searchList.push(this.company.findOne({ excludeQuery, 'person.emails.email': e.email }, '_id').lean().exec())
        searchList.push(this.company.findOne({ excludeQuery, 'company.emails.email': e.email }, '_id').lean().exec())
      })
    }
    if (data.company.mobilePhones && data.company.mobilePhones.length) {
      data.company.mobilePhones.forEach((e) => {
        searchList.push(this.company.findOne({ excludeQuery, 'person.mobilePhones.countryCode': e.countryCode, 'person.mobilePhones.prefixNumber': e.prefixNumber, 'person.mobilePhones.phoneNumber': e.phoneNumber }, '_id').lean().exec())
        searchList.push(this.company.findOne({ excludeQuery, 'company.mobilePhones.countryCode': e.countryCode, 'company.mobilePhones.prefixNumber': e.prefixNumber, 'company.mobilePhones.phoneNumber': e.phoneNumber }, '_id').lean().exec())
      })
    }

    if (data.ids && data.ids.length) {
      data.ids.forEach((e) => {
        searchList.push(this.company.findOne({ excludeQuery, ids: { $elemMatch: { key: e.key, value: e.value, countryCode: e.countryCode } } }, '_id').lean().exec())
      })
    }

    const errorValidationList = await Promise.all(searchList)
    errorValidationList.forEach((e) => {
      if (e) {
        throw new Error('Email / mobile / vat / fiscal number already registered with other user')
      }
    })

    const companyProfile = await this.company.findById(id)

    if (data.status !== 'draft') {
      const gymDirector = await ctr.relation.getGymDirector(id)
      if (!gymDirector || gymDirector.length < 1) {
        throw new Error('Company directors is required')
      }
      // if (!data.company.roles) throw new Error('Company directors is required')
      // if (!data.company.roles.length) throw new Error('Director / Managed role cant be empty')
    }
    const previousStatus = companyProfile.status.toString()
    if (!GYM.includes(companyProfile.typeCode)) throw new Error('Not a valid gym for update')
    // companyProfile.typeCode = data.typeCode
    // dont update status if active or suspended
    if (!['active', 'suspended'].includes(companyProfile.status)) {
      companyProfile.status = data.status
    }
    companyProfile.shortDescription = data.shortDescription
    companyProfile.parentId = data.parentId
    companyProfile.company.name = data.company.name
    companyProfile.company.pecs = data.company.pec ? [{ pec: data.company.pec }] : []
    companyProfile.company.brand = data.company.brand
    companyProfile.company.sdi = data.company.sdi
    companyProfile.company.additionalField = data.company.additionalField

    if (['CW', 'CU'].includes(companyProfile.typeCode) && data.managedCountries) {
      companyProfile.managedCountries = data.managedCountries
    }

    if (data.company.countryFields && data.company.countryFields.it) {
      if (!companyProfile.company.countryFields) companyProfile.company.countryFields = {}
      companyProfile.company.countryFields.it = data.company.countryFields.it
    }

    if (data.company.credits && data.company.credits.length) {
      companyProfile.company.credits = []
      data.company.credits.forEach((cred) => {
        companyProfile.company.credits.push({ credit: cred.credit, startDt: cred.startDt, endDt: cred.endDt })
      })
    }

    if (!companyProfile.settings) companyProfile.settings = {}
    companyProfile.settings.language = data.settings.language
    companyProfile.company.balanceSheet = {
      startDate: data.company.balanceSheet ? data.company.balanceSheet.startDate : undefined
    }
    // companyProfile.company.banks = data.company.banks
    companyProfile.company.mailInChat = {
      alias: (data.company.mailInChat && data.company.mailInChat.alias) ? data.company.mailInChat.alias : null
    }

    companyProfile.company.onlineLinks = data.company.onlineLinks ? data.company.onlineLinks : []

    if (data.company.chatPluginSettings) {
      companyProfile.company.chatPluginSettings = data.company.chatPluginSettings
    }

    if (data.company.emails) {
      companyProfile.company.emails = []
      data.company.emails.forEach((e) => {
        companyProfile.company.emails.push({
          email: e.email
        })
      })
    }
    if (data.ids && data.ids.length) {
      companyProfile.ids = []
      data.ids.forEach((e) => {
        companyProfile.ids.push({ key: e.key, value: e.value, countryCode: e.countryCode })
      })
    }
    if (data.company.mobilePhones) {
      companyProfile.company.mobilePhones = []
      data.company.mobilePhones.forEach((e) => {
        companyProfile.company.mobilePhones.push({
          countryCode: e.countryCode,
          prefixNumber: e.prefixNumber,
          phoneNumber: e.phoneNumber
        })
      })
    }
    if (data.company.landlines) {
      companyProfile.company.phones = []
      data.company.landlines.forEach((e) => {
        companyProfile.company.phones.push({
          countryCode: e.countryCode,
          prefixNumber: e.prefixNumber,
          phoneNumber: e.phoneNumber
        })
      })
    }
    if (data.company.addresses) {
      companyProfile.company.addresses = []
      data.company.addresses.forEach((e) => {
        companyProfile.company.addresses.push({
          type: e.type,
          addressComponents: e.addressComponents,
          fulladdress: e.fulladdress,
          location: e.location,
          zipcode: e.zipcode
        })
      })
    }

    const saveParam = { validateBeforeSave: true }
    if (companyProfile.status === 'draft') saveParam.validateBeforeSave = false

    let newGYM = await companyProfile.save(saveParam)
    if (GYMUNIT.includes(data.typeCode) && parentDoc) {
      newGYM.company.name = parentDoc.company.name
      newGYM.company.addresses = parentDoc.company.addresses
      newGYM.company.pecs = parentDoc.company.pecs
      newGYM.ids = parentDoc.ids
      newGYM.company.sdi = parentDoc.company.sdi
      newGYM.company.balanceSheet = parentDoc.company.balanceSheet
      newGYM = await newGYM.save()
      await ctr.cwmodules.deleteByGymId(parentDoc._id.toString())
      await ctr.cwmodules.copyCwModules(newGYM._id.toString(), parentDoc._id.toString())
    } else if (!GYMUNIT.includes(data.typeCode)) {
      const childGyms = await this.company.find({ parentId: newGYM._id, typeCode: { $in: GYMUNIT } }).exec()
      if (childGyms && childGyms.length) {
        for (const childGym of childGyms) {
          childGym.company.name = newGYM.company.name
          childGym.company.addresses = newGYM.company.addresses
          childGym.company.pecs = newGYM.company.pecs
          childGym.ids = newGYM.ids
          childGym.company.sdi = newGYM.company.sdi
          childGym.company.balanceSheet = newGYM.company.balanceSheet
          await childGym.save()
          await ctr.cwmodules.deleteByGymId(childGym._id.toString())
          await ctr.cwmodules.copyCwModules(newGYM._id.toString(), childGym._id.toString())
        }
      }
    }

    if (data.typeCode === 'GY' && parentDoc && parentDoc.typeCode === 'GY') {
      parentDoc.typeCode = 'GH'
      await parentDoc.save()
    }
    if (previousStatus !== companyProfile.status) {
      await this.gymStatusChange(newGYM._id.toString(), previousStatus, undefined, updatingUser)
    }
    if (data.avatar) newGYM = await this.profileUpload(data.avatar, newGYM._id.toString(), hostName)

    if (isSuperUser && data.company.cwModules && data.company.cwModules.length) {
      await ctr.cwmodules.deleteByGymId(newGYM._id.toString())
      for (const item of data.company.cwModules) {
        await ctr.cwmodules.createByGymId(newGYM._id.toString(), item, updatingUser)
      }
    }

    await ctr.relation.updateUserAndGymRelation(newGYM._id.toString(), updatingUser, data.company.vatRateId, data.notes, data.cwSalesman)
    return await this.getGymById(newGYM._id.toString())
  }

  async updateCompany (data, id, updatingUser, hostName) {
    const companyProfile = await this.company.findById(id).exec()
    if (!companyProfile) throw new Error('Gym information not available')
    if (!GYM.includes(companyProfile.typeCode)) throw new Error('Not a valid gym')
    const excludeQuery = { _id: { $ne: id } }
    const searchList = []
    if (data.company.emails && data.company.emails.length) {
      data.company.emails.forEach((e) => {
        searchList.push(this.company.findOne({ excludeQuery, 'person.emails.email': e.email }, '_id').lean().exec())
        searchList.push(this.company.findOne({ excludeQuery, 'company.emails.email': e.email }, '_id').lean().exec())
      })
    }
    if (data.company.mobilePhones && data.company.mobilePhones.length) {
      data.company.mobilePhones.forEach((e) => {
        searchList.push(this.company.findOne({ excludeQuery, 'person.mobilePhones.countryCode': e.countryCode, 'person.mobilePhones.prefixNumber': e.prefixNumber, 'person.mobilePhones.phoneNumber': e.phoneNumber }, '_id').lean().exec())
        searchList.push(this.company.findOne({ excludeQuery, 'company.mobilePhones.countryCode': e.countryCode, 'company.mobilePhones.prefixNumber': e.prefixNumber, 'company.mobilePhones.phoneNumber': e.phoneNumber }, '_id').lean().exec())
      })
    }

    if (data.ids && data.ids.length) {
      data.ids.forEach((e) => {
        searchList.push(this.company.findOne({ excludeQuery, ids: { $elemMatch: { key: e.key, value: e.value, countryCode: e.countryCode } } }, '_id').lean().exec())
      })
    }

    const errorValidationList = await Promise.all(searchList)
    errorValidationList.forEach((e) => {
      if (e) {
        throw new Error('Email / mobile / vat / fiscal number already registered with other user')
      }
    })

    if (data.company.emails) {
      companyProfile.company.emails = []
      data.company.emails.forEach((e) => {
        companyProfile.company.emails.push({
          email: e.email
        })
      })
    }
    if (data.ids && data.ids.length) {
      companyProfile.ids = []
      data.ids.forEach((e) => {
        companyProfile.ids.push({ key: e.key, value: e.value, countryCode: e.countryCode })
      })
    }
    if (data.company.mobilePhones) {
      companyProfile.company.mobilePhones = []
      data.company.mobilePhones.forEach((e) => {
        companyProfile.company.mobilePhones.push({
          countryCode: e.countryCode,
          prefixNumber: e.prefixNumber,
          phoneNumber: e.phoneNumber
        })
      })
    }
    if (data.company.landlines) {
      companyProfile.company.phones = []
      data.company.landlines.forEach((e) => {
        companyProfile.company.phones.push({
          countryCode: e.countryCode,
          prefixNumber: e.prefixNumber,
          phoneNumber: e.phoneNumber
        })
      })
    }
    if (data.company.addresses) {
      companyProfile.company.addresses = []
      data.company.addresses.forEach((e) => {
        companyProfile.company.addresses.push({
          type: e.type,
          addressComponents: e.addressComponents,
          fulladdress: e.fulladdress,
          location: e.location,
          zipcode: e.zipcode
        })
      })
    }
    companyProfile.shortDescription = data.shortDescription
    companyProfile.company.name = data.company.name
    companyProfile.company.pecs = data.company.pec ? [{ pec: data.company.pec }] : []
    companyProfile.company.brand = data.company.brand
    companyProfile.company.sdi = data.company.sdi
    companyProfile.company.onlineLinks = data.company.onlineLinks ? data.company.onlineLinks : []
    companyProfile.settings.language = data.settings.language
    let newGYM = await companyProfile.save()
    if (data.avatar) newGYM = await this.profileUpload(data.avatar, newGYM._id.toString(), hostName)

    if (newGYM._id.toString !== updatingUser) {
      const updtUser = this.company.findById(updatingUser, 'typeCode').lean().exec()
      if (updtUser && GYM.includes(updtUser.typeCode)) {
        await ctr.relation.updateProfilewithGymRelation(newGYM._id.toString(), data.company.vatRateId, data.notes, data.cwSalesman, updatingUser, data.paymentTermId)
      }
    }

    return await this.getGymById(newGYM._id.toString())
  }

  /**
   * change company status
   * @param {*} id
   * @param {*} status
   * @param {*} user
   * @returns boolean
   */
  async changeCompanyStatus (id, status, user) {
    const companyProfile = await this.company.findById(id)
    if (companyProfile.typeCode === 'IN') throw new Error('Individual status change not allowed, please check the ID')
    const previousStatus = companyProfile.status.toString()
    companyProfile.status = status
    await companyProfile.save()
    await this.gymStatusChange(id, previousStatus, status, user)
    return true
  }

  /**
   * get profile status change history
   * @param {*} id
   * @param {*} currentStatus
   * @param {*} newStatus
   * @param {*} userId
   * @returns history
   */
  async gymStatusChange (id, currentStatus, newStatus, userId) {
    const history = await this.profileHistory.create({ profileId: id, userId: userId, status: currentStatus })
    return history
  }

  /**
   * send data to device
   * @param {*} deviceId
   * @param {*} gymId
   * @param {*} action
   * @param {*} data
   * @param {*} user
   */
  async sendToDevice (deviceId, gymId, action, data, user) {
    const gymDevices = await ctr.device.getDevicesByGymId(gymId)
    if (gymDevices && gymDevices.company && gymDevices.company.devices && gymDevices.company.devices.length) {
      const device = gymDevices.company.devices.filter((gd) => { return gd._id.toString() === deviceId && gd.status === 'Connected' })
      if (device.length < 1) throw new Error('Gym device not available or device many not be in connected state')
      const msgObj = { module: 'device', service: 'auth', action: 'sendToDevice', payload: { action: action, gymId: gymId, deviceId: deviceId, data: data } }
      const resp = await rabbitmq.sendAndRead('/ws/send', { _user: user, toProfileId: deviceId, undefined, msgObj })
      return resp
    } else {
      throw new Error('Gym device not available')
    }
  }

  /**
   * delete a gym GY
   * @param {*} id
   * @returns
   */
  async deleteGym (id) {
    const companyProfile = await this.company.findById(id)
    if (!companyProfile) throw new Error('GYM not found by ID')
    if (companyProfile.typeCode !== 'GY') throw new Error('Not valid GYM instance, Please check the TypeCode')
    if (companyProfile.status !== 'draft') throw new Error('GYM can be only deleted in draft status')
    await ctr.relation.removeGymRelationById(id)
    await ctr.cwmodules.deleteByGymId(id)
    await this.company.deleteOne({ _id: id })
    return true
  }

  /**
   * activate a suspended gym
   * @param {*} id gym id
   * @param {*} userid
   * @returns status
   */
  async reactivateGym (id, userid) {
    const companyProfile = await this.company.findById(id)
    let newStatus = ''
    if (!companyProfile) throw new Error('GYM not found by ID')
    if (companyProfile.typeCode !== 'GY') throw new Error('Not valid GYM instance, Please check the TypeCode')
    if (companyProfile.status !== 'suspended') throw new Error('GYM can be only reactiveted if not in suspended status')
    const history = await this.profileHistory.find({ profileId: id }).sort({ createdAt: -1 }).limit(1).exec()
    if (history.length > 0) {
      const previousStatus = companyProfile.status.toString()
      newStatus = history[0].status
      companyProfile.status = history[0].status
      await companyProfile.save()
      await this.gymStatusChange(id, previousStatus, undefined, userid)
    } else {
      throw new Error('No history available for switching status')
    }
    return { status: newStatus }
  }

  /**
   * get business user
   * @param {*} gymId
   * @param {*} accessingProfile
   * @param {*} isDirector
   * @returns profiles
   */
  async gymBusinessUsers (gymId, accessingProfile, isDirector) {
    const profileUser = await this.company.findById(accessingProfile, 'typeCode').lean().exec()
    const assigableProfiles = []
    if (!superUser.includes(profileUser?.typeCode) && !isDirector) {
      throw new Error('Only GYM director can access this records')
    }
    let users = await ctr.relation.gymBusinessUser(gymId)
    users = users.map((m) => {
      const profile = m.rightProfileId
      profile.roles = m.roles
      profile.assigned = []
      if (m.roles && m.roles.length && m.roles.findIndex((r) => { return ['SA', 'PT', 'CT'].includes(r.role) }) > -1) {
        assigableProfiles.push(m.rightProfileId._id.toString())
      }
      return profile
    })
    if (!assigableProfiles.length) {
      return users
    } else {
      const assigned = await ctr.relation.getAssignedUser(gymId, assigableProfiles)
      if (assigned && assigned.length) {
        assigned.forEach((as) => {
          as.relatedProfiles.forEach((r) => {
            users.forEach((user) => {
              if (as.profileId._id.toString() === user._id.toString()) {
                user.assigned = as.relatedProfiles.map((rel) => { return rel.profileId })
              }
            })
          })
        })
      }
      return users
    }
  }

  /**
   * get unassigned gym user
   * @param {*} gymId
   * @param {*} accessingProfile
   * @param {*} isDirector
   * @returns gym user
   */
  async gymUnassignedUser (gymId, accessingProfile, isDirector) {
    const profileUser = await this.company.findById(accessingProfile, 'typeCode').lean().exec()

    if (!superUser.includes(profileUser.typeCode) && !isDirector) {
      throw new Error('Only GYM director can access this records')
    }
    return ctr.relation.unassignedGymUser(gymId)
  }

  /**
   * assign a profile
   * @param {*} gymId
   * @param {*} toProfile
   * @param {*} profileId
   * @param {*} accessingProfile
   * @param {*} user
   * @param {*} role
   * @param {*} isDirector
   * @returns assigned profile
   */
  async assignProfile (gymId, toProfile, profileId, accessingProfile, user, role, isDirector) {
    const profileUser = await this.company.findById(accessingProfile, 'typeCode').lean().exec()

    if (!superUser.includes(profileUser.typeCode) && !isDirector) {
      throw new Error('Only GYM director can access this records')
    }
    return ctr.relation.assignProfile(gymId, toProfile, profileId, role, user)
  }

  /**
   * unassign a profile
   * @param {*} gymId
   * @param {*} toProfile
   * @param {*} profileId
   * @param {*} accessingProfile
   * @param {*} user
   * @param {*} role
   * @param {*} isDirector
   * @returns unassigned profile
   */
  async unassignProfile (gymId, toProfile, profileId, accessingProfile, user, role, isDirector) {
    const profileUser = await this.company.findById(accessingProfile, 'typeCode').lean().exec()

    if (!superUser.includes(profileUser.typeCode) && !isDirector) {
      throw new Error('Only GYM director can access this records')
    }
    return ctr.relation.unassignProfile(gymId, toProfile, profileId, role, user)
  }

  /**
   * Assign parentId to gyms
   * @param {ObjectId} parentGymId parentId which will be assigned
   * @param {Array[ObjectId]} gymIds gymIds which needs to be assigned with parentId
   */
  async assignParentId (parentGymId, gymIds) {
    // const [parentGym, gyms] = await Promise.all([this.company.findById(parentGymId, 'typeCode').lean().exec(), this.company.find({ _id: { $in: gymIds } }).lean().exec()])
    const parentGym = await this.company.findById(parentGymId, 'typeCode').exec()
    if (!parentGym || ['IN', 'TU', 'CO', 'GU', 'CU'].includes(parentGym.typeCode)) throw new Error('Not a valid parentId')
    if (parentGym.typeCode === 'GY') {
      const gyms = await this.company.find({ _id: { $in: gymIds } }, 'typeCode').lean().exec()
      for (const gym of gyms) {
        if (gym.typeCode === 'GY') {
          parentGym.typeCode = 'GH'
          await parentGym.save()
          break
        }
      }
    }
    // if (!gyms.length || gyms.filter((gym) => { return parentAllowed.includes(gym.typeCode) === false }).length > 0) throw new Error('Gym ids passed are not valid')
    await this.company.updateMany({ _id: { $in: gymIds } }, { $set: { parentId: parentGymId } }).exec()
    return true
  }

  /**
   * Will return gyms for parentId passed
   * @param {ObjectId} parentId
   */
  getGymsByParentId (parentId) {
    return this.company.find({ parentId: parentId, typeCode: { $in: GYM } }, '_id company settings avatar typeCode status ids shortDescription displayName parentId').lean().exec()
  }

  /**
   * Remove parent of Gym
   * @param {ObjectId} gymId gymId who's parent needs to be removed
   * @param {ObjectId} userId user who is performing this action
   */
  async removeParent (gymId, userId) {
    const [gym, user] = await Promise.all([this.company.findById(gymId, '_id parentId typeCode').exec(), this.company.findById(userId, '_id typeCode').lean().exec()])
    if (!gym) throw new Error('Gym not found')
    if (!user) throw new Error('User not found')
    if (!GYM.includes(gym.typeCode)) throw new Error('Not a valid gym')
    if (!gym.parentId) throw new Error('Parent is already undefined')
    if (gym._id.toString() !== userId && gym.parentId.toString() !== userId && !superUser.includes(user.typeCode)) throw new Error('Does not have permission to remove parent')
    gym.parentId = undefined
    await gym.save()
    return true
  }

  /**
   * get profile calendar
   * @param {*} gymId
   * @param {*} profileId
   * @param {*} startDate
   * @param {*} endDate
   * @returns entrances
   */
  async getProfileCalendar (gymId, profileId, startDate, endDate) {
    const [gym, user] = await Promise.all([this.company.findById(gymId, '_id parentId typeCode').exec(), this.company.findById(profileId, '_id typeCode').lean().exec()])
    if (!gym || !GYM.includes(gym.typeCode)) throw new Error('Gym not found or Invalid typeCode')
    if (!user || !nonBusiness.includes(user.typeCode)) throw new Error('User not found or Invalid typeCode')
    if (!endDate) {
      const d = new Date()
      const year = d.getFullYear()
      const month = d.getMonth()
      const day = d.getDate()
      endDate = new Date(year + 10, month, day, 23, 59, 59)
    }
    const schedules = await rabbitmq.sendAndRead('/calendar/entrances', { ownerId: gymId, profileId, startDate, endDate })
    return schedules.data
  }

  /**
   * get available profile from calendar
   * @param {*} text
   * @param {*} gymId
   * @param {*} dateTime
   * @returns trainers
   */
  async getAvailableProfileFromCalendar (text, gymId, startAt, endAt) {
    let trainers = []
    let availability = []
    const profiles = await this.searchByEmailMobilePin(text)

    if (profiles && profiles.length) {
      trainers = await this.relation.find({ leftProfileId: gymId, rightProfileId: { $in: profiles.map((p) => p._id.toString()) }, status: { $in: ['temporary', 'active'] }, 'roles.role': 'CT' }, 'rightProfileId').populate('rightProfileId', '_id person.firstname person.lastname person.emails person.mobilePhones ids displayName').lean().exec()
      if (trainers && trainers.length) {
        const availables = await await rabbitmq.sendAndRead('/calendar/availability', { profileIds: trainers.map((tr) => tr.rightProfileId._id.toString()), startAt, endAt })
        availability = availables.data
      }
    }

    return trainers.map(item => {
      const trainer = item.rightProfileId
      trainer.available = !availability.includes(trainer._id.toString())
      return trainer
    })
  }

  /**
   * bulk add update delete roles, payroll, awards, course, private
   */
  async bulkUpdateRolePayrollAwardCoursePrivate (gymId, profileId, addUpdateRoles, deleteRoles, addUpdatePayrolls, deletePayrolls, addUpdateAwards, deleteAwards, addUpdateCourse, addUpdatePrivate) {
    const [business, profile] = await Promise.all([this.company.findOne({ _id: gymId, typeCode: { $in: GYM } }, '_id').lean().exec(), this.company.findOne({ _id: profileId, typeCode: { $in: nonBusiness } }, '_id').lean().exec()])
    if (!business) throw new Error('Business Id information not valid or details are not available')
    if (!profile) throw new Error('Profile Id information not valid or details are not available')

    // All delete
    let errorResp
    try {
      if (deletePayrolls && deletePayrolls.length) await ctr.payroll.bulkRemovePayrolls(gymId, profileId, deletePayrolls)
      if (deleteAwards && deleteAwards.length) await ctr.payroll.bulkRemoveAwards(gymId, profileId, deleteAwards)
      if (deleteRoles && deleteRoles.length) await ctr.relation.bulkDeleteRoles(gymId, profileId, deleteRoles)

      if (addUpdateRoles && addUpdateRoles.length) await ctr.relation.bulkAddUpdateRoles(gymId, profileId, addUpdateRoles)
      if (addUpdatePayrolls && addUpdatePayrolls.length) await ctr.payroll.bulkaddUpdatePayrolls(gymId, profileId, addUpdatePayrolls)
      if (addUpdateAwards && addUpdateAwards.length) await ctr.payroll.bulkAddUpdateAwards(gymId, profileId, addUpdateAwards)
      if (addUpdateCourse && addUpdateCourse.length) await ctr.sportsAuthorization.addCourse(gymId, profileId, addUpdateCourse)
      if (addUpdatePrivate && addUpdatePrivate.length) await ctr.sportsAuthorization.addPrivate(gymId, profileId, addUpdatePrivate)
    } catch (e) {
      errorResp = e
    }

    const [payrollNawards, roles, courseNprivate] = await Promise.all([ctr.payroll.getPayrollDetail(gymId, profileId), this.relation.findOne({ leftProfileId: gymId, rightProfileId: profileId }).lean().exec(), ctr.sportsAuthorization.getSportAuthorization(gymId, profileId)])
    return {
      payrollNawards,
      roles,
      courseNprivate,
      errorResp: errorResp
    }
  }

  async getChatPluginSettings ({ _user }) {
    const gym = await this.company.findOne({
      _id: _user.profileId,
      typeCode: {
        $nin: ['IN', 'TU']
      }
    })

    if (!gym) {
      throw new Error('Gym not found')
    }

    return _.get(gym, 'company.chatPluginSettings', null)
  }

  async setChatPluginSettings ({ _user, chatPluginSettings }) {
    const gym = await this.company.findOne({
      _id: _user.profileId,
      typeCode: {
        $nin: ['IN', 'TU']
      }
    })

    if (!gym) {
      throw new Error('Gym not found')
    }

    _.set(gym, 'company.chatPluginSettings', chatPluginSettings)
    await gym.save()
    return _.get(gym, 'company.chatPluginSettings', null)
  }
}

module.exports = CompanyController
