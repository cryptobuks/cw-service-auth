const { db, ctr, rabbitmq } = require('@cowellness/cw-micro-service')()
const { superUser, GYM } = require('../profile/profile.enum')
const { allowedRole } = require('./contracts.enum')
const CMapper = require('./contracts.mapper')

/**
 * @class ContractsController
 * @classdesc Controller Contracts
 */
class ContractsController {
  constructor () {
    this.documents = db.auth.model('document')
    this.signed = db.auth.model('documentsigned')
    this.company = db.auth.model('Profile')
    this.relation = db.auth.model('Relation')
    this.roleMap = { TR: 'TR', RE: 'RE', OP: 'OP', SA: 'SA', DI: 'DI', PER: 'PER', TT: 'TT', CL: 'CL', PT: 'PT', CT: 'CT' }
    this.reverseRoleMap = { TR: 'TR', RE: 'RE', OP: 'OP', SP: 'SA', DI: 'DI', PER: 'PER', TT: 'TT', CL: 'CL', PT: 'PT', CT: 'CT' }
  }

  /**
   * Get document by ID
   * @param {string} id unque id
   * @returns object
   */
  findById (id) {
    return this.documents.findById(id).populate('ownerId', 'company setting displayName').lean().exec()
  }

  /**
   * Get all the document based on ownerId and type
   * @param {string} ownerId unque id
   * @param {string} type document type
   * @param {string} role user role
   * @returns Array
   */
  getDocumentByType (ownerId, type, role) {
    if (type === 'role' && role) {
      return this.documents.find({ type, ownerId, role }).lean().exec()
    } else {
      return this.documents.find({ type, ownerId }).lean().exec()
    }
  }

  /**
   * Get list of the profile which have signed the document
   * @param {string} documentId unque id
   * @returns Array
   */
  getProfileWhoSignedDocument (documentId, status = true) {
    return this.signed.find({ documentId, isAccepted: status }).populate('profileId', '_id avatar person.firstname person.lastname').populate('ownerId', '_id displayName typeCode company.brand company.name avatar').lean().exec()
  }

  /**
   * Get list of the signed document based on ownerId and userId.
   * @param {string} ownerId unque id
   * @param {string} userId unque id
   * @returns Array
   */
  getDocumentSignedByProfile (ownerId, userId) {
    // return this.signed.find({ ownerId: ownerId, profileId: userId }).lean().exec()
    return this.signed.find({ profileId: userId }).lean().exec()
  }

  /**
   * copy role documents
   * @param {*} document
   * @param {*} source
   * @param {*} ro
   * @param {*} displayName
   * @param {*} ownerId
   * @param {*} rawdata
   */
  copyRoleDocument (document, source, ro, displayName, ownerId, rawdata) {
    document.source = source
    document.area = ro
    document.displayName = displayName
    document.ownerId = ownerId
    rawdata.push(document)
  }

  /**
   * copy hq data
   * @param {*} doc
   * @param {*} source
   * @param {*} hqDetail
   * @param {*} rawdata
   */
  copyHqData (doc, source, hqDetail, rawdata) {
    const document = { ...doc }
    document.source = source
    document.ownerId = hqDetail._id.toString()
    document.displayName = hqDetail.displayName
    document.country = hqDetail.company.country
    rawdata.push(document)
  }

  /**
   * map docs
   * @param {*} doc
   * @param {*} docType
   * @param {*} source
   * @param {*} signedDoc
   * @param {*} noGym
   * @param {*} rawdata
   */
  docMapper (doc, docType, source, signedDoc, noGym, rawdata) {
    let addDoc = true
    if (doc.preApproval) {
      if (signedDoc && signedDoc.findIndex((sign) => { return sign.documentId.toString() === doc._id.toString() && sign.ownerId._id.toString() === noGym && sign.type === docType && sign.isAccepted }) > -1) addDoc = false
    } else {
      if (signedDoc && signedDoc.findIndex((sign) => { return sign.type === docType && sign.ownerId._id.toString() === noGym && sign.isAccepted }) > -1) addDoc = false
    }
    if (addDoc) {
      const document = { ...doc }
      document.source = source
      document.ownerId = noGym
      rawdata.push(document)
    }
  }

  /**
   * Returns documents of cowellness
   * @param {ObjectId} gymId
   */
  async getCowellnessDefaultPrivacyNTerms (gymId, displayName) {
    let isPrivacyAvailable = false
    let isTermsAvailable = false
    let privacyDoc
    let termDoc
    const defaultCw = await this.userCowellnessRelation(gymId)
    displayName = defaultCw.displayName
    let contracts = await this.documents.find({ status: 'active', type: { $in: ['privacy', 'term'] }, ownerId: defaultCw._id.toString() }).lean().exec()
    if (contracts.length) {
      const privacyIndex = contracts.findIndex((doc) => { return doc.type === 'privacy' })
      if (privacyIndex > -1) {
        privacyDoc = contracts[privacyIndex]
        privacyDoc.source = 'contract'
        isPrivacyAvailable = true
      }
      const termIndex = contracts.findIndex((doc) => { return doc.type === 'term' })
      if (termIndex > -1) {
        termDoc = contracts[termIndex]
        termDoc.source = 'contract'
        isTermsAvailable = true
      }
    }
    if ((!isPrivacyAvailable || !isTermsAvailable) && defaultCw.typeCode === 'CU' && defaultCw.parentId) {
      contracts = await this.documents.find({ status: 'active', type: { $in: ['privacy', 'term'] }, ownerId: defaultCw.parentId.toString() }).lean().exec()
      if (contracts.length) {
        const privacyIndex = contracts.findIndex((doc) => { return doc.type === 'privacy' })
        if (!isPrivacyAvailable) {
          if (privacyIndex > -1) {
            privacyDoc = contracts[privacyIndex]
            privacyDoc.source = 'contract'
            isPrivacyAvailable = true
          }
        }
        if (!isTermsAvailable) {
          const termIndex = contracts.findIndex((doc) => { return doc.type === 'term' })
          if (termIndex > -1) {
            termDoc = contracts[termIndex]
            termDoc.source = 'contract'
            isTermsAvailable = true
          }
        }
      }
    }
    if ((!isPrivacyAvailable || !isTermsAvailable) && defaultCw.typeCode !== 'CH') {
      const hqCowellness = await this.company.findOne({ typeCode: 'CH' }, '_id').lean().exec()
      contracts = await this.documents.find({ status: 'active', type: { $in: ['privacy', 'term'] }, ownerId: hqCowellness._id.toString() }).lean().exec()
      if (contracts.length) {
        const privacyIndex = contracts.findIndex((doc) => { return doc.type === 'privacy' })
        if (!isPrivacyAvailable) {
          if (privacyIndex > -1) {
            privacyDoc = contracts[privacyIndex]
            privacyDoc.source = 'contract'
            isPrivacyAvailable = true
          }
        }
        if (!isTermsAvailable) {
          const termIndex = contracts.findIndex((doc) => { return doc.type === 'term' })
          if (termIndex > -1) {
            termDoc = contracts[termIndex]
            termDoc.source = 'contract'
            isTermsAvailable = true
          }
        }
      }
    }

    if ((!isPrivacyAvailable || !isTermsAvailable)) {
      contracts = await rabbitmq.sendAndRead('/settings/countries/activeDocuments', { countryCode: defaultCw.company.country })
      if (contracts.length) {
        const privacyIndex = contracts.findIndex((doc) => { return doc.type === 'privacy' && doc.area === 'cw' })
        if (!isPrivacyAvailable) {
          if (privacyIndex > -1) {
            privacyDoc = contracts[privacyIndex]
            privacyDoc.source = 'setting'
            isPrivacyAvailable = true
          }
        }
        if (!isTermsAvailable) {
          const termIndex = contracts.findIndex((doc) => { return doc.type === 'term' && doc.area === 'cw' })
          if (termIndex > -1) {
            termDoc = contracts[termIndex]
            termDoc.source = 'setting'
            isTermsAvailable = true
          }
        }
      }
    }

    const docs = []
    // if (privacyDoc) {
    //   docs.push({ source: privacyDoc.source, _id: privacyDoc._id.toString(), ownerDisplayName: displayName, content: privacyDoc.content, ownerId: defaultCw._id.toString(), forGym: gymId, type: privacyDoc.type, role: privacyDoc.area, earlierRejected: false, isAccepted: false, preApproval: privacyDoc.preApproval || false, intro: privacyDoc.intro })
    // }

    if (termDoc) {
      docs.push({ source: termDoc.source, _id: termDoc._id.toString(), ownerDisplayName: displayName, content: termDoc.content, ownerId: defaultCw._id.toString(), forGym: gymId, type: termDoc.type, role: termDoc.area, earlierRejected: false, isAccepted: false, preApproval: termDoc.preApproval || false, intro: termDoc.intro })
    }

    return docs
  }

  /**
   * get user and CW relation
   * @param {*} userId
   * @returns relation
   */
  async userCowellnessRelation (userId) {
    const userGyms = await this.relation.find({ rightProfileId: userId }).populate('leftProfileId', '_id typeCode company.country displayName').lean().exec()
    const cwGyms = userGyms.filter((uGym) => {
      return superUser.includes(uGym.leftProfileId.typeCode)
    }).map((gym) => gym.leftProfileId)
    if (cwGyms && cwGyms.length) {
      let gymPosition = -1
      gymPosition = cwGyms.findIndex((userGym) => { return userGym.typeCode === 'CU' })
      if (gymPosition === -1) gymPosition = cwGyms.findIndex((userGym) => { return userGym.typeCode === 'CW' })
      if (gymPosition === -1) gymPosition = cwGyms.findIndex((userGym) => { return userGym.typeCode === 'CH' })
      if (gymPosition > -1) return cwGyms[gymPosition]
    }
    return null
  }

  /**
   * Get list of the unsigned document based on ownerIds and userId.
   * @param {string} ownerIds unque id
   * @param {string} userId unque id
   * @returns Array
   */
  async getProfileUnsignedDocuments (ownerIds, userId, countryCode = undefined) {
    const rawdata = []
    const defaultCountry = 'it'
    const newDirectorGym = []
    if (!countryCode) countryCode = defaultCountry
    let totured = []
    let referentCompany = []
    if (!ownerIds) ownerIds = []

    const hqDetail = await ctr.profile.getCowellnessByCountry(countryCode) // this.company.findOne({ typeCode: 'CH' }, '_id displayName company.country').lean().exec()
    if (userId) {
      const userGym = await this.userCowellnessRelation(userId)
      if (userGym && userGym.company && userGym.company.country) {
        countryCode = userGym.company.country
      }
    }
    if (!hqDetail) throw new Error('Cowellness information not available')
    if (!ownerIds.length) {
      const gyms = await this.relation.find({ rightProfileId: userId, status: { $in: ['temporary', 'active'] }, leftProfileId: { $ne: hqDetail._id.toString() } }, 'leftProfileId').lean().exec()
      if (gyms.length) {
        ownerIds = await this.company.find({ _id: { $in: gyms.map((gy) => { return gy.leftProfileId.toString() }) }, typeCode: { $in: GYM } }, '_id').lean().exec()
        ownerIds = ownerIds.map((own) => { return own._id.toString() })
      }
    }
    if (!ownerIds.includes(hqDetail._id.toString())) ownerIds.push(hqDetail._id.toString())

    let isHqPrivacy = false
    let isHqTerms = false
    let isAgreed
    const userRole = []
    const [hqSettingDocQ, hqContractDoc, signedDoc, masterRelation] = await Promise.all([rabbitmq.sendAndRead('/settings/countries/activeDocuments', { countryCode: countryCode }), this.documents.find({ status: 'active', ownerId: hqDetail._id.toString() }, '_id type ownerId role content preApproval updatedAt').populate('ownerId', '_id displayName').lean().exec(), this.signed.find({ profileId: userId }, '_id ownerId documentId role isAccepted type').lean().exec(), ctr.relation.verifyUserRelation(hqDetail._id.toString(), userId)])
    let hqSettingDoc = hqSettingDocQ.data
    if (hqSettingDoc.errors) {
      const hqDocQ = await rabbitmq.sendAndRead('/settings/countries/activeDocuments', { countryCode: defaultCountry })
      hqSettingDoc = hqDocQ.data
    }
    if (masterRelation && masterRelation.status) isAgreed = masterRelation.status

    const hqPrivacyIndex = hqSettingDoc.findIndex((cont) => { return cont.type === 'privacy' && cont.area === 'cw' })
    const hqConPrivacyIndex = hqContractDoc.findIndex((cont) => { return cont.type === 'privacy' })
    if ((hqPrivacyIndex > -1 && hqSettingDoc[hqPrivacyIndex].preApproval) || (hqConPrivacyIndex > -1 && hqContractDoc[hqConPrivacyIndex].preApproval)) {
      let doc
      let source
      if (hqConPrivacyIndex > -1 && hqContractDoc[hqConPrivacyIndex].preApproval) { doc = hqContractDoc[hqConPrivacyIndex]; source = 'contract' } else if (hqPrivacyIndex > -1 && hqSettingDoc[hqPrivacyIndex].preApproval) {
        if (hqConPrivacyIndex === -1) {
          doc = hqSettingDoc[hqPrivacyIndex]
          source = 'setting'
        } else {
          if (hqContractDoc[hqConPrivacyIndex].updatedAt.getTime() > (new Date(hqSettingDoc[hqPrivacyIndex].updatedAt)).getTime()) {
            doc = hqContractDoc[hqConPrivacyIndex]
            source = 'contract'
          } else {
            doc = hqSettingDoc[hqPrivacyIndex]
            source = 'setting'
          }
        }
      }
      if (signedDoc.length && signedDoc.findIndex((sign) => { return sign.documentId.toString() === doc._id.toString() && sign.ownerId._id.toString() === hqDetail._id.toString() && sign.type === 'privacy' && sign.isAccepted }) > -1) {
        isHqPrivacy = true
      } else {
        this.copyHqData(doc, source, hqDetail, rawdata)
        isHqPrivacy = true
      }
    } else {
      if (signedDoc.length && signedDoc.findIndex((sign) => { return sign.ownerId._id.toString() === hqDetail._id.toString() && sign.type === 'privacy' && sign.isAccepted }) > -1) isHqPrivacy = true
    }

    const hqTermsIndex = hqSettingDoc.findIndex((cont) => { return cont.type === 'term' && cont.area === 'cw' })
    const hqConTermsIndex = hqContractDoc.findIndex((cont) => { return cont.type === 'term' })
    if (((hqTermsIndex > -1 && hqSettingDoc[hqTermsIndex].preApproval) || (hqConTermsIndex > -1 && hqContractDoc[hqConTermsIndex].preApproval))) {
      let doc
      let source
      if (hqConTermsIndex > -1 && hqContractDoc[hqConTermsIndex].preApproval) { doc = hqContractDoc[hqConTermsIndex]; source = 'contract' } else if (hqTermsIndex > -1 && hqSettingDoc[hqTermsIndex].preApproval) {
        if (hqConTermsIndex === -1) {
          doc = hqSettingDoc[hqTermsIndex]
          source = 'setting'
        } else {
          if (hqContractDoc[hqConTermsIndex].updatedAt.getTime() > (new Date(hqSettingDoc[hqTermsIndex].updatedAt)).getTime()) {
            doc = hqContractDoc[hqConTermsIndex]
            source = 'contract'
          } else {
            doc = hqSettingDoc[hqTermsIndex]
            source = 'setting'
          }
        }
      }
      if (signedDoc.length && signedDoc.findIndex((sign) => { return sign.documentId.toString() === doc._id.toString() && sign.ownerId._id.toString() === hqDetail._id.toString() && sign.type === 'term' && sign.isAccepted }) > -1) {
        isHqTerms = true
      } else {
        this.copyHqData(doc, source, hqDetail, rawdata)
        isHqTerms = true
      }
    } else {
      if (signedDoc.length && signedDoc.findIndex((sign) => { return sign.ownerId._id.toString() === hqDetail._id.toString() && sign.type === 'term' && sign.isAccepted }) > -1) isHqTerms = true
    }

    if (hqContractDoc && hqContractDoc.length && (!isHqPrivacy || !isHqTerms)) {
      if (!isHqPrivacy && hqConPrivacyIndex > -1) {
        this.copyHqData(hqContractDoc[hqConPrivacyIndex], 'contract', hqDetail, rawdata)
        isHqPrivacy = true
      }
      if (!isHqTerms && hqConTermsIndex > -1) {
        this.copyHqData(hqContractDoc[hqConTermsIndex], 'contract', hqDetail, rawdata)
        isHqTerms = true
      }
    }
    if ((!isHqPrivacy || !isHqTerms) && hqDetail.typeCode === 'CU' && hqDetail.parentId) {
      if (signedDoc.length && signedDoc.findIndex((sign) => { return sign.ownerId._id.toString() === hqDetail.parentId.toString().toString() && sign.type === 'privacy' && sign.isAccepted }) > -1) isHqPrivacy = true
      if (signedDoc.length && signedDoc.findIndex((sign) => { return sign.ownerId._id.toString() === hqDetail.parentId.toString().toString() && sign.type === 'term' && sign.isAccepted }) > -1) isHqTerms = true
      if (!isHqPrivacy || !isHqTerms) {
        const [parentDetail, parentContract] = await Promise.all([this.company.findById(hqDetail.parentId.toString()).exec(), this.documents.find({ status: 'active', ownerId: hqDetail.parentId.toString() }, '_id type ownerId role content preApproval').populate('ownerId', '_id displayName').lean().exec()])
        const parentPrivacyIndex = parentContract.findIndex((cont) => { return cont.type === 'privacy' })
        const parentTermsIndex = parentContract.findIndex((cont) => { return cont.type === 'terms' })
        if (!isHqPrivacy && parentPrivacyIndex > -1) {
          this.copyHqData(parentContract[parentPrivacyIndex], 'contract', parentDetail, rawdata)
          isHqPrivacy = true
        }
        if (!isHqTerms && parentTermsIndex > -1) {
          this.copyHqData(parentContract[parentTermsIndex], 'contract', parentDetail, rawdata)
          isHqTerms = true
        }
      }
    }
    if (hqSettingDoc && hqSettingDoc.length && (!isHqPrivacy || !isHqTerms)) {
      if (!isHqPrivacy && hqPrivacyIndex > -1) {
        this.copyHqData(hqSettingDoc[hqPrivacyIndex], 'setting', hqDetail, rawdata)
      }
      if (!isHqTerms && hqTermsIndex > -1) {
        this.copyHqData(hqSettingDoc[hqTermsIndex], 'setting', hqDetail, rawdata)
      }
    }
    if (ownerIds.length) {
      const nonHqGym = ownerIds.filter((ow) => { return ow !== hqDetail._id.toString() })
      if (nonHqGym && nonHqGym.length) {
        const [gymContract, gyms] = await Promise.all([this.documents.find({ status: 'active', ownerId: { $in: nonHqGym }, type: { $in: ['privacy', 'term'] } }, '_id type ownerId content preApproval').populate('ownerId', '_id displayName company.country').lean().exec(), this.company.find({ _id: { $in: nonHqGym }, typeCode: { $nin: superUser } }, '_id typeCode parentId').lean().exec()])
        for (const nonHQGym of gyms) {
          const prvContract = gymContract.findIndex((ng) => { return ng.type === 'privacy' && ng.ownerId._id.toString() === nonHQGym._id.toString() })
          const hqPrivacyIndex = hqSettingDoc.findIndex((cont) => { return cont.type === 'privacy' && cont.area === 'gym' })
          if ((prvContract > -1 && gymContract[prvContract].preApproval) || (hqPrivacyIndex > -1 && hqSettingDoc[hqPrivacyIndex].preApproval)) {
            let doc
            let source
            if (prvContract > -1 && gymContract[prvContract].preApproval) { doc = gymContract[prvContract]; source = 'contract' }
            if (hqPrivacyIndex > -1 && hqSettingDoc[hqPrivacyIndex].preApproval) { doc = hqSettingDoc[hqPrivacyIndex]; source = 'setting' }
            this.docMapper(doc, 'privacy', source, signedDoc, nonHQGym._id.toString(), rawdata)
          } else if (prvContract > -1) {
            this.docMapper(gymContract[prvContract], 'privacy', 'contract', signedDoc, nonHQGym._id.toString(), rawdata)
          } else {
            let isParentSet = false
            if (['GU', 'CU'].includes(nonHQGym.typeCode) && nonHQGym.parentId) {
              const parentContract = await this.documents.find({ status: 'active', ownerId: nonHQGym.parentId.toString(), type: 'privacy' }, '_id type ownerId role content preApproval').populate('ownerId', '_id displayName').lean().exec()
              if (parentContract && parentContract.length) {
                this.docMapper(parentContract[0], 'privacy', 'contract', signedDoc, nonHQGym.parentId.toString(), rawdata)
                isParentSet = true
              }
            }
            if (!isParentSet && hqPrivacyIndex > -1) {
              this.docMapper(hqSettingDoc[hqPrivacyIndex], 'privacy', 'setting', signedDoc, nonHQGym._id.toString(), rawdata)
            }
          }

          const trmContract = gymContract.findIndex((ng) => { return ng.type === 'term' && ng.ownerId.toString() === nonHQGym._id.toString() })
          const hqTermsIndex = hqSettingDoc.findIndex((cont) => { return cont.type === 'term' && cont.area === 'gym' })
          if ((trmContract > -1 && gymContract[trmContract].preApproval) || (hqTermsIndex > -1 && hqSettingDoc[hqTermsIndex].preApproval)) {
            let doc
            let source
            if (trmContract > -1 && gymContract[trmContract].preApproval) doc = gymContract[trmContract]; source = 'contract'
            if (hqTermsIndex > -1 && hqSettingDoc[hqTermsIndex].preApproval) doc = hqSettingDoc[hqTermsIndex]; source = 'setting'
            this.docMapper(doc, 'term', source, signedDoc, nonHQGym._id.toString(), rawdata)
          } else if (trmContract > -1) {
            this.docMapper(gymContract[trmContract], 'term', 'contract', signedDoc, nonHQGym._id.toString(), rawdata)
          } else {
            let isParentSet = false
            if (['GU', 'CU'].includes(nonHQGym.typeCode) && nonHQGym.parentId) {
              const parentContract = await this.documents.find({ status: 'active', ownerId: nonHQGym.parentId.toString(), type: 'term' }, '_id type ownerId role content preApproval').populate('ownerId', '_id displayName').lean().exec()
              if (parentContract && parentContract.length) {
                this.docMapper(parentContract[0], 'term', 'contract', signedDoc, nonHQGym.parentId.toString(), rawdata)
                isParentSet = true
              }
            }
            if (!isParentSet && hqTermsIndex > -1) {
              this.docMapper(hqSettingDoc[hqTermsIndex], 'term', 'setting', signedDoc, nonHQGym._id.toString(), rawdata)
            }
          }
        }
      }
      for (let owner = 0; owner < ownerIds.length; owner++) {
        const [roles, gym] = await Promise.all([ctr.relation.getGymNUserRole(ownerIds[owner], userId), this.company.findById(ownerIds[owner], '_id typeCode displayName company.country').lean().exec()])
        if (roles && roles.length) {
          userRole.push({ ownerId: ownerIds[owner], roles: roles, gym: gym })
        }
      }
      if (userRole.length) {
        let isRoleAdded = false

        for (const u of userRole) {
          let isDirector = false
          for (const ro of u.roles) {
            if (['TT', 'RE'].includes(ro)) return
            if (!signedDoc.length || signedDoc.findIndex((sign) => { return sign.ownerId._id.toString() === u.ownerId.toString() && sign.type === 'role' && sign.role === ro && sign.isAccepted }) === -1) {
              let docIndex = hqContractDoc.findIndex((hq) => { return hq.type === 'role' && u.ownerId.toString() === hq.ownerId._id.toString() && hq.role === ro })
              let source = ''
              if (docIndex > -1) {
                source = 'contract'
              } else {
                docIndex = hqSettingDoc.findIndex((cont) => { return cont.type === 'role' && cont.area === this.roleMap[ro] })
                if (docIndex > -1) source = 'setting'
              }
              if (docIndex > -1) {
                const document = (source === 'contract' ? { ...hqContractDoc[docIndex] } : { ...hqSettingDoc[docIndex] })
                if (!isDirector && ro === 'DI' && ['GY', 'GH', 'SI'].includes(u.gym.typeCode)) {
                  const previousSignDi = await this.signed.findOne({ type: 'role', role: 'DI', ownerId: u.gym._id.toString(), isAccepted: true }, '_id').lean().exec()
                  if (!previousSignDi) {
                    newDirectorGym.push({ _id: u.gym._id.toString(), displayName: u.gym.displayName })
                    document.signMandatory = true
                  }
                  isDirector = true
                }
                this.copyRoleDocument(document, source, ro, u.gym.displayName, u.gym._id.toString(), rawdata)
                isRoleAdded = true
              }
            }
          }
        }

        const pendingTutorAccept = await ctr.relation.getTutorUsers(userId)
        if (pendingTutorAccept && pendingTutorAccept.length) {
          totured = pendingTutorAccept
          const docIndex = hqSettingDoc.findIndex((cont) => { return cont.type === 'role' && cont.area === this.roleMap.TT })
          if (docIndex > -1) {
            const document = { ...hqSettingDoc[docIndex] }
            this.copyRoleDocument(document, 'setting', 'TT', hqDetail.displayName, hqDetail._id.toString(), rawdata)
            isRoleAdded = true
          }
        }
        const pendingReferAccept = await ctr.relation.getReferentUsers(userId)
        if (pendingReferAccept && pendingReferAccept.length) {
          referentCompany = pendingReferAccept
          const docIndex = hqSettingDoc.findIndex((cont) => { return cont.type === 'role' && cont.area === this.roleMap.RE })
          if (docIndex > -1) {
            const document = { ...hqSettingDoc[docIndex] }
            this.copyRoleDocument(document, 'setting', 'RE', hqDetail.displayName, hqDetail._id.toString(), rawdata)
            isRoleAdded = true
          }
        }

        if (isRoleAdded) {
          const personateIndex = hqSettingDoc.findIndex((cont) => { return cont.type === 'role' && cont.area === 'PER' })
          if (personateIndex > -1) {
            const document = { ...hqSettingDoc[personateIndex] }
            document.source = 'setting'
            rawdata.push(document)
          }
        }
      }
    }
    if (rawdata.length) {
      const filterDistinct = (value, index, self) => { return self.indexOf(value) === index }
      const roles = []
      const types = []
      const data = rawdata.map((rw) => {
        types.push(rw.type)
        if (rw.source === 'contract' && rw.type === 'role') {
          roles.push(rw.role)
        } else if (rw.source === 'setting' && rw.type === 'role') {
          if (rw.area === 'PER') { types.push(rw.area) } else { roles.push(rw.area) }
        } else {
          rw.area = undefined
        }
        return { source: rw.source, _id: rw._id, ownerDisplayName: rw.displayName, content: rw.content, ownerId: rw.ownerId, type: rw.type, role: rw.area, earlierRejected: false, isAccepted: false, preApproval: rw.preApproval || false, intro: rw.intro, signMandatory: rw.signMandatory || false }
      })
      let cwDefaults = []
      const gymDetails = await this.company.find({ _id: { $in: data.map((da) => { return da.ownerId }) } }, ' _id company.brand company.name company.addresses company.emails company.mobilePhones company.phones settings avatar typeCode status ids shortDescription displayName parentId').lean().exec()
      if (gymDetails && gymDetails.length) {
        for (const gym of gymDetails) {
          if (newDirectorGym.findIndex((gy) => { return gy._id === gym._id.toString() }) > -1) {
            const [cwModules, cwDefault] = await Promise.all([ctr.cwmodules.getByGYMId(gym._id.toString()), this.getCowellnessDefaultPrivacyNTerms(gym._id.toString(), gym.displayName)])
            gym.cwModules = cwModules.map((cw) => { return cw.modules })
            for (const doc of cwDefault) {
              if (gymDetails.findIndex((g) => { return g._id.toString() === doc.ownerId.toString() }) === -1) {
                const newGym = await this.company.findById(doc.ownerId, '_id company.brand company.name company.addresses company.emails company.mobilePhones company.phones settings avatar typeCode status ids shortDescription displayName parentId').lean().exec()
                gymDetails.push(newGym)
              }
            }
            cwDefaults = cwDefaults.concat(cwDefault)
          }
          gym.directors = await this.relation.find({ leftProfileId: gym._id.toString(), roles: { $elemMatch: { role: 'DI', status: 'active' } } }).populate('rightProfileId', '_id, person.firstname person.lastname person.addresses person.birth ids person.emails person.mobilePhones person.phones typeCode displayName').lean().exec()
          gym.directors = gym.directors.map((dir) => { return dir.rightProfileId })
        }
      }

      return {
        documents: data,
        types: types.filter(filterDistinct),
        roles: roles.filter(filterDistinct),
        cwDefaults,
        isAgreed,
        dependentData: {
          tutored: totured,
          referent: referentCompany,
          gyms: gymDetails
        }
      }
    } else {
      return {
        types: [],
        documents: [],
        cwDefaults: [],
        roles: [],
        isAgreed,
        dependentData: {
          tutored: [],
          referent: [],
          gyms: []
        }
      }
    }
  }

  /**
   *
   * @param {ObjectId} id Contract Id
   * @param {String} source Source of the document (contract / setting)
   */
  async getContractBySourceId (id, source) {
    switch (source) {
      case 'setting':
      {
        const settingContract = await rabbitmq.sendAndRead('/settings/contract/byId/', { documentId: id })
        return settingContract.data
      }
      case 'contract': {
        const contract = await this.documents.findById(id).lean().exec()
        return contract
      }
    }
  }

  /**
   * Add document signed information by user.
   * @param {string} ownerId unque id
   * @param {string} profileId unque id
   * @param {string} documentId unque id
   * @param {string} isMandatory boolean
   * @param {string} isAccepted boolean
   * @param {string} deviceId unque id
   * @param {string} IP
   * @param {string} sign base64
   * @returns object
   */
  async addSignedDocument (ownerId, profileId, documentId, onBehalf, source, isMandatory, isAccepted, deviceId, IP, sign) {
    const docQuery = (source === 'contract' ? this.documents.findById(documentId, 'ownerId type status activatedAt expiredAt content isDefaultDocument referenceDoc role').lean().exec() : rabbitmq.sendAndRead('/settings/contract/byId/', { documentId }))
    const validationData = await Promise.all([ctr.company.findProfileById(ownerId), ctr.company.findProfileById(profileId), docQuery])
    const ownerProfile = validationData[0]
    const userProfile = validationData[1]
    const document = source === 'contract' ? validationData[2] : validationData[2].data
    if (!ownerProfile || !GYM.includes(ownerProfile.typeCode)) throw new Error('Not a valid owner Id')
    if (!userProfile || GYM.includes(userProfile.typeCode)) throw new Error('Not a valid profile Id')
    if (!document) throw new Error('Not a valid document id')
    if (source === 'contract' && document.ownerId.toString() !== ownerId) throw new Error('ownerId and document ownerId doesnt match')

    if (deviceId && deviceId.length) {
      if (ownerProfile.company && ownerProfile.company.devices && ownerProfile.company.devices.length) {
        if (ownerProfile.company.devices.filter((d) => { return d._id.toString() === deviceId }).length < 1) throw new Error('Device information not available')
      } else {
        throw new Error('Device information not available')
      }
    }

    if (source === 'setting' && document.area && (document.area === 'TT' || document.area === 'RE') && (!onBehalf || !onBehalf.length)) throw new Error('onbehalf cannot be empty')
    let content = ''

    if (document && !document.isDefaultDocument && document.referenceDoc) {
      const parentdoc = await this.documents.findById(document.referenceDoc, 'ownerId type status activatedAt expiredAt content isDefaultDocument referenceDoc').lean().exec()
      const fatherOwner = await ctr.company.findProfileById(parentdoc.ownerId)
      fatherOwner.directors = await ctr.relation.getGymDirector(fatherOwner._id.toString())
      const contentMapping = new CMapper(fatherOwner, userProfile)
      content = contentMapping.compile(parentdoc.content + document.content)
    } else {
      ownerProfile.directors = await ctr.relation.getGymDirector(ownerProfile._id.toString())
      const contentMapping = new CMapper(ownerProfile, userProfile)
      content = contentMapping.compile(document.content)
    }

    // if (source === 'setting' && document.area && document.area === 'personating') {
    //   await this.signed.deleteOne({ profileId, documentId, role : 'PER' }).exec()
    // }

    const previousSigned = await this.signed.findOne({ ownerId, profileId, documentId, source }).exec()
    let freshSignedDoc

    if (previousSigned) {
      previousSigned.onBehalf = onBehalf
      previousSigned.content = content
      previousSigned.type = document.type
      previousSigned.role = (source === 'contract' ? document.role : this.reverseRoleMap[document.area])
      previousSigned.isMandatory = isMandatory
      previousSigned.isAccepted = isAccepted
      previousSigned.deviceId = deviceId
      previousSigned.source = source
      previousSigned.IP = IP
      previousSigned.sign = sign
      previousSigned.signedAt = Date.now()
      freshSignedDoc = await previousSigned.save()
    } else {
      const signedDoc = {
        ownerId,
        profileId,
        documentId,
        onBehalf,
        content,
        type: document.type,
        role: (source === 'contract' ? document.role : this.reverseRoleMap[document.area]),
        isMandatory,
        isAccepted,
        deviceId,
        source,
        IP,
        sign,
        signedAt: Date.now()
      }
      freshSignedDoc = await this.signed.create(signedDoc)
    }

    let relation
    if (isAccepted && source === 'setting' && document.area && (document.area === 'TT' || document.area === 'RE')) {
      relation = await this.relation.findOne({ leftProfileId: profileId, rightProfileId: onBehalf }).exec()
    } else if (isAccepted) {
      relation = await this.relation.findOne({ leftProfileId: ownerId, rightProfileId: profileId }).exec()
    }
    if (relation) {
      if (relation.status === 'temporary') relation.status = 'active'
      if (relation.roles && relation.roles.length) {
        relation.roles.forEach((ro, rIndex) => {
          if (ro.role === freshSignedDoc.role && ro.status !== 'suspended') {
            relation.roles[rIndex].status = 'active'
          }
        })
      }
      await relation.save()
    }

    return freshSignedDoc
  }

  /**
   * update document signed information by user.
   * @param {string} ownerId unque id
   * @param {string} profileId unque id
   * @param {string} id unque id
   * @param {string} documentId unque id
   * @param {string} isMandatory boolean
   * @param {string} isAccepted boolean
   * @param {string} deviceId unque id
   * @param {string} IP
   * @param {string} sign base64
   * @returns object
   */
  async updateSignedDocument (ownerId, id, profileId, documentId, onBehalf, isMandatory, isAccepted, deviceId, IP, sign) {
    const validationData = await Promise.all([ctr.company.findByIdDynamicFields(ownerId, 'typeCode company.devices'), ctr.company.findByIdDynamicFields(profileId, 'typeCode'), this.documents.findById(documentId, 'ownerId type status activatedAt expiredAt').lean().exec(), this.signed.findById(id).exec()])
    const ownerProfile = validationData[0]
    const userProfile = validationData[1]
    const document = validationData[2]
    const signedDocument = validationData[3]

    if (!ownerProfile || !GYM.includes(ownerProfile.typeCode)) throw new Error('Not a valid owner Id')
    if (!userProfile || GYM.includes(userProfile.typeCode)) throw new Error('Not a valid profile Id')
    if (!document) throw new Error('Not a valid document id')
    if (!signedDocument) throw new Error('Not a valid signed document id')
    if (signedDocument.isAccepted) throw new Error('Signed document is already accepted, Once document is accepted cant update')
    if (document.ownerId.toString() !== ownerId) throw new Error('ownerId and document ownerId doesnt match')
    if (ownerProfile.company && ownerProfile.company.devices && ownerProfile.company.devices.length) {
      if (ownerProfile.company.devices.filter((d) => { return d._id.toString() === deviceId }).length < 1) throw new Error('Device information not available')
    } else {
      throw new Error('Device information not available')
    }

    signedDocument.isMandatory = isMandatory
    signedDocument.isAccepted = isAccepted
    signedDocument.onBehalf = onBehalf
    signedDocument.deviceId = deviceId
    signedDocument.IP = IP
    signedDocument.sign = sign
    signedDocument.signedAt = Date.now()

    return await signedDocument.save()
  }

  /**
   * Create document specific to business owner.
   * @param {string} ownerId unque id
   * @param {string} type
   * @param {string} content string
   * @param {date} activatedAt
   * @param {date} expiredAt
   * @param {string} userId boolean
   * @returns object
   */
  async createDocument (ownerId, type, role, content, referenceDoc, isDefaultDocument, activatedAt, expiredAt, userId, activeId, preApproval) {
    let userRole = await ctr.relation.getGymNUserRole(ownerId, userId)
    const user = await ctr.company.findByIdDynamicFields(userId, 'typeCode')
    const business = await ctr.company.findByIdDynamicFields(ownerId, 'typeCode')

    if (!business) throw new Error('Business detail not available')
    if (!GYM.includes(business.typeCode)) throw new Error('Not a valid business owner')
    if (type === 'role' && !role) throw new Error("When type === 'role', role can not be blank")
    if (referenceDoc && referenceDoc.length && !isDefaultDocument) {
      const referenceDocument = await this.documents.findById(referenceDoc, '_id activatedAt type expiredAt ownerId').populate('ownerId', '_id typeCode').lean().exec()
      if (!referenceDocument) throw new Error('Document you are referring is not found')
      if (!referenceDocument.activatedAt) throw new Error('Document you are referring is not active')
      if (referenceDocument.expiredAt) throw new Error('Document you are referring is already expired')
      if (type !== referenceDocument.type) throw new Error('Current document type and referring document type does not match')
      if (['CU', 'GU'].includes(business.typeCode) && !['CH', 'GH', 'CW', 'GY', 'SI'].includes(referenceDocument.ownerId.typeCode)) throw new Error('Wrong document selected, please verify the ownerid of the document')
    }
    if ((userRole && userRole.length) || superUser.includes(user.typeCode) || ownerId === userId) {
      if (!superUser.includes(user.typeCode)) {
        let isValid = false
        allowedRole.forEach((role) => {
          if (!isValid) {
            isValid = userRole.includes(role)
          }
        })
        if (!isValid && ownerId === userId) {
          userRole = await ctr.relation.getGymNUserRole(ownerId, activeId)
          allowedRole.forEach((role) => {
            if (!isValid) {
              isValid = userRole.includes(role)
            }
          })
        }
        if (!isValid) throw new Error('User does not enought permission')
      }
      const document = {
        ownerId,
        type,
        role,
        content,
        referenceDoc,
        isDefaultDocument,
        activatedAt,
        expiredAt,
        preApproval
      }
      const newDoc = await this.documents.create(document)
      if (newDoc.status === 'active') {
        await this.updateContractToSigned(newDoc._id.toString(), newDoc.type, newDoc.role)
      }
      return newDoc
    } else {
      throw new Error('Role not available')
    }
  }

  /**
   * accept all the terms in documents and activate role.
   * @param {string} profileId unque id
   * @param {string} sign base64
   * @param {string} deviceId unque id
   * @param {Array} documents
   * @returns object
   */
  async acceptAndActivateRelation (profileId, sign, deviceId, documents, reAccepted, IP) {
    if (!documents || !documents.length) throw new Error('document list can not be empty')
    let business = []
    const signedDocuments = []

    for (const d of documents) {
      business.push(d.ownerId)
      const singedDoc = await this.addSignedDocument(d.ownerId, profileId, d.documentId, d.onBehalf, d.source, d.isMandatory, d.isAccepted, deviceId, IP, sign)
      signedDocuments.push(singedDoc)
    }
    business = business.filter((value, index, self) => { return self.indexOf(value) === index })
    const reAccept = await this.signed.updateMany({ _id: { $in: reAccepted } }, { $set: { isAccepted: true, IP: IP, deviceId: deviceId, sign: sign } }).exec()
    const pendingAccept = await this.getProfileUnsignedDocuments(business, profileId)
    if (pendingAccept.documents.length) {
      let businessIds = pendingAccept.documents.map((doc) => { return doc.ownerId })
      businessIds = businessIds.filter((value, index, self) => { return self.indexOf(value) === index })
      business = business.filter((bu) => {
        return !businessIds.includes(bu)
      })
    }
    if (pendingAccept.status === 'temporary') {
      const hqDetail = await this.company.findOne({ typeCode: 'CH' }, '_id').lean().exec()
      if (!hqDetail) throw new Error('CH information not available')
      await ctr.relation.activateRelation(hqDetail._id.toString(), profileId)
    }
    let activatedRelation
    if (business.length) {
      activatedRelation = await Promise.all(business.map((b) => {
        return ctr.relation.activateRelation(b, profileId)
      }))
    }

    return { signedDocuments, activatedRelation, reAccept }
  }

  /**
   * update document specific to business owner.
   * @param {string} ownerId unque id
   * @param {string} id unque id
   * @param {string} content string
   * @param {date} activatedAt
   * @param {date} expiredAt
   * @param {string} userId boolean
   * @returns object
   */
  async updateDocument (ownerId, id, content, referenceDoc, isDefaultDocument, activatedAt, expiredAt, userId, activeId, preApproval) {
    let userRole = await ctr.relation.getGymNUserRole(ownerId, userId)
    const user = await ctr.company.findByIdDynamicFields(userId, 'typeCode')
    const business = await ctr.company.findByIdDynamicFields(ownerId, 'typeCode')

    if (!business) throw new Error('Business detail not available')
    if (!GYM.includes(business.typeCode)) throw new Error('Not a valid business owner')
    if ((userRole && userRole.length) || superUser.includes(user.typeCode) || ownerId === userId) {
      if (!superUser.includes(user.typeCode)) {
        let isValid = false
        allowedRole.forEach((role) => {
          if (!isValid) {
            isValid = userRole.includes(role)
          }
        })
        if (!isValid && ownerId === userId) {
          userRole = await ctr.relation.getGymNUserRole(ownerId, activeId)
          allowedRole.forEach((role) => {
            if (!isValid) {
              isValid = userRole.includes(role)
            }
          })
        }
        if (!isValid) throw new Error('User does not enought permission')
      }
      const document = await this.documents.findById(id).exec()
      if (!document) throw new Error('Document details not avaliable')

      if (referenceDoc && referenceDoc.length && !isDefaultDocument) {
        const referenceDocument = await this.documents.findById(referenceDoc, '_id type activatedAt expiredAt ownerId').populate('ownerId', '_id typeCode').lean().exec()
        if (!referenceDocument) throw new Error('Document you are referring is not found')
        if (!referenceDocument.activatedAt) throw new Error('Document you are referring is not active')
        if (referenceDocument.expiredAt) throw new Error('Document you are referring is already expired')
        if (document.type !== referenceDocument.type) throw new Error('Current document type and referring document type does not match')
        if (['CU', 'GU'].includes(business.typeCode) && !['CH', 'GH', 'CW', 'GY', 'SI'].includes(referenceDocument.ownerId.typeCode)) throw new Error('Wrong document selected, please verify the ownerid of the document')
      }
      document.content = content
      document.referenceDoc = referenceDoc
      document.isDefaultDocument = isDefaultDocument
      document.preApproval = preApproval || false
      if (!document.activatedAt) document.activatedAt = activatedAt
      if (!document.expiredAt) document.expiredAt = expiredAt
      const updatedDoc = await document.save()
      if (updatedDoc.status === 'active') {
        await this.updateContractToSigned(updatedDoc._id.toString(), updatedDoc.type, updatedDoc.role)
      }
      return updatedDoc
    } else {
      throw new Error('Role not available')
    }
  }

  /**
   * Sets new default when new contract is made active in setting
   * @param {ObjectId} previousId previous document id
   * @param {ObjectId} currentId current document id
   * @param {string} type terms, privacy, role
   * @param {string} role cw|gym or  personating | tutor | trainer | operator | salesman | referent
   */
  async switchDefault (previousId, currentId, type, role, preApproval) {
    const contracts = await this.documents.find({ referenceDoc: previousId }).exec()
    if (contracts && contracts.length) {
      for (const contract of contracts) {
        contract.expiredAt = new Date()
        await contract.save()
        const document = {
          ownerId: contract.ownerId.toString(),
          type: contract.type,
          role: contract.role,
          content: contract.content,
          referenceDoc: currentId,
          preApproval: preApproval,
          isDefaultDocument: true,
          activatedAt: new Date()
        }
        const newDoc = await this.documents.create(document)
        if (newDoc.status === 'active') {
          await this.updateContractToSigned(newDoc._id.toString(), newDoc.type, newDoc.role)
        }
      }
    }
  }

  /**
   * get documents by gym
   * @param {*} gymId
   * @returns documents
   */
  async getGymDocuments (gymId) {
    return this.documents.find({
      ownerId: gymId,
      status: 'active',
      isDefaultDocument: true
    })
  }

  /**
   * remove document
   * @param {*} id document id
   * @param {*} userId
   * @returns boolean
   */
  async removeDocument (id, userId) {
    const [document, user, usedDocument] = await Promise.all([this.documents.findById(id).lean().exec(), this.company.findById(userId, '_id typeCode').lean().exec(), this.signed.findOne({ documentId: id }).lean().exec()])
    if (!document) throw new Error('Document information not available')
    if (!user) throw new Error('User information not available')
    if (document.status === 'active') throw new Error('Document can not be deleted when it is active')
    if (usedDocument) throw new Error('Document already signed by user')
    if (document.ownerId.toString() !== userId && !superUser.includes(user.typeCode)) throw new Error('Document owner or Super user can delete document')
    await this.documents.deleteOne({ _id: id }).exec()
    return true
  }

  /**
   * update contracts as signed
   * @param {*} newDocId
   * @param {*} type
   * @param {*} role
   */
  async updateContractToSigned (newDocId, type, role) {
    // if (role) {
    return await this.signed.updateMany({ isAccepted: false, source: 'contract', type, role }, { $set: { documentId: newDocId } }).exec()
    // } else {
    //   return await this.signed.updateMany({ isAccepted: false, source: 'contract', type }, { $set: { documentId: newDocId } }).exec()
    // }
  }

  /**
   * Will create default contract from cwdefault for non CH / CW / CU
   * @param {string} countryCode country code of the gym
   * @param {Object} defaultCW gym profile object, if not passed data will be fetched based on countrycode
   */
  async setDefaultContrats (countryCode, gymId, defaultCW) {
    if (!defaultCW) {
      defaultCW = await ctr.profile.getCowellnessByCountry(countryCode)
    }
    let documents = await rabbitmq.sendAndRead('/settings/countries/activeDocuments', { countryCode: defaultCW.company.country })
    documents = documents.data
    let privacy
    const privacyIndex = documents.findIndex((cont) => { return cont.type === 'privacy' && cont.area === 'gym' })
    if (privacyIndex > -1) privacy = documents[privacyIndex]
    let term
    const termIndex = documents.findIndex((cont) => { return cont.type === 'term' && cont.area === 'gym' })
    if (privacyIndex > -1) term = documents[termIndex]
    if (privacy) {
      await this.documents.create({
        ownerId: gymId,
        type: 'privacy',
        referenceDoc: privacy._id.toString(),
        isDefaultDocument: true,
        preApproval: privacy.preApproval,
        content: privacy.content,
        status: 'active',
        activatedAt: new Date()
      })
    }
    if (term) {
      await this.documents.create({
        ownerId: gymId,
        type: 'term',
        referenceDoc: term._id.toString(),
        isDefaultDocument: true,
        preApproval: term.preApproval,
        content: term.content,
        status: 'active',
        activatedAt: new Date()
      })
    }
    return true
  }

  /**
   * get default cowellness term document
   * @param {*} countryCode
   * @returns document
   */
  async getDefaultCowellnessTermByCountry (countryCode) {
    const resp = await ctr.profile.getDocumentToSignIn(countryCode)
    resp.documents = resp.documents.find((doc) => { return doc.type === 'term' })
    return resp
  }

  /**
   * create a signed document
   * @param {*} ownerId
   * @param {*} userId
   * @param {*} countryCode
   */
  async createEmptySignedDocument (ownerId, userId, countryCode) {
    await this.signed.deleteMany({
      profileId: userId.toString(),
      isAccepted: false
    }).exec()
    const toBeSigned = await this.getProfileUnsignedDocuments([ownerId], userId, countryCode)
    if (toBeSigned && toBeSigned.documents && toBeSigned.documents.length) {
      for (const doc of toBeSigned.documents) {
        if (doc.role !== 'PER') {
          let signedDoc = await this.signed.findOne({
            ownerId: doc.ownerId.toString(),
            profileId: userId.toString(),
            documentId: doc._id.toString(),
            source: doc.source
          }).exec()
          if (!signedDoc) {
            signedDoc = await this.signed.create({
              ownerId: doc.ownerId.toString(),
              profileId: userId.toString(),
              documentId: doc._id.toString(),
              source: doc.source,
              type: doc.type,
              role: doc.role,
              isAccepted: false
            })
          }
        }
      }
    }
  }
}

module.exports = ContractsController
