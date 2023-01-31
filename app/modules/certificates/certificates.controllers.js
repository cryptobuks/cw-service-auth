const { db, rabbitmq, ctr } = require('@cowellness/cw-micro-service')()
const { GYM } = require('../profile/profile.enum')

/**
 * @class CertificatesController
 * @classdesc Controller Certificates
 */
class CertificatesController {
  constructor () {
    this.certificates = db.auth.model('certificates')
    this.company = db.auth.model('Profile')
  }

  /**
   * get list of document belonging to gym and profile
   * @param {ObjectId} gymId - gym id for which certificates are required
   * @param {ObjectId} profileId - profile id of which certificates are required
   */
  async getCertificatesList (gymId, profileId, userId) {
    if (gymId) {
      const gym = await this.company.findById(gymId)
      if (!gym || !GYM.includes(gym.typeCode)) throw new Error('Not a valid gym')
    }

    if (profileId !== userId) {
      if (!gymId) throw new Error('ProfileId and UserId are different, GymId required to verify relationship')
      const director = await ctr.relation.gymBusinessUser(gymId)
      if (director.filter((dr) => { return dr.rightProfileId._id.toString() === userId }).length < 1) throw new Error('Only self or business user can view certificate')
    }
    let certificates

    if (gymId) {
      certificates = await this.certificates.find({ profileId: profileId, 'owners.ownerId': gymId }).populate('owners.ownerId', '_id displayName avatar ').lean().exec()
      certificates.forEach((cer) => {
        if (cer.owner && cer.owner.length) {
          cer.owner = cer.owner.filter((ow) => {
            return ow.ownerId._id.toString() === gymId || ow.isApproved
          })
        }
      })
    } else {
      certificates = await this.certificates.find({ profileId: profileId }).populate('owners.ownerId', '_id displayName avatar ').lean().exec()
    }

    return certificates
  }

  /**
   * create certificate
   * @param {string} type - type of the certificate, refer certificateType enum
   * @param {string} subtype - type of subtype, refer medical identity
   * @param {objectId[]} sports - sports types from setting
   * @param {number} expiry - date of expiry in YYYYMMDD
   * @param {string} file - base 64 string
   * @param {string} fileName - base 64 string
   * @param {objectId} profileId - object of profile IN / TU
   * @param {objectId} ownerId - object id of gym
   * @param {objectId} createdby - object Id of gym director
   */
  async create (type, name, subtype, sports, expiry, file, fileName, profileId, ownerId, createdby, userId) {
    let isApproved = false
    // if (!fileName || !fileName.length) throw new Error('File name should not be blank')
    // if (!file || !file.length) throw new Error('File information is missing')
    if (!profileId || !profileId.length) throw new Error('profile id is not valid')
    // if (!ownerId || !ownerId.length) throw new Error('owner id is not valid')

    if (ownerId) {
      const gym = await this.company.findById(ownerId)
      if (!gym || !GYM.includes(gym.typeCode)) throw new Error('Not a valid gym')
    }

    if (profileId !== userId) {
      if (!ownerId) throw new Error('ProfileId and UserId are different, GymId required to verify relationship')
      const director = await ctr.relation.getGymDirector(ownerId)
      if (director.filter((dr) => { return dr.rightProfileId._id.toString() === userId }).length < 1) throw new Error('Only self or gym director can create a certificate')
      isApproved = true
    }
    if (type === 'medical') {
      if (subtype === 'competitive' && (!sports || !sports.length)) {
        throw new Error('Sport list is required')
      }
      if (!expiry) throw new Error('Expiry is not defined')
    }
    let fileInfo
    if (fileName.length && file.length) {
      fileInfo = await rabbitmq.sendAndRead('/files/post', {
        filename: fileName,
        isPublic: true,
        binData: file
      })
    }

    const certificate = {
      name,
      type,
      subtype,
      sports,
      expiry,
      profileId,
      owners: []
    }

    if (fileInfo) {
      certificate.file = {}
      certificate.file.filename = fileInfo.data.filename
      certificate.file.id = fileInfo.data._id
    }

    if (ownerId) {
      certificate.owners.push({
        isApproved,
        ownerId,
        createdby
      })
    }

    return await this.certificates.create(certificate)
  }

  /**
   * approves certificates
   * @param {string} certificateId - id of certificate document
   * @param {objectId} ownerId - object id of gym
   * @param {objectId} createdby - object Id of gym director
   */
  async approve (certificateId, ownerId, createdBy, userId) {
    const gym = await this.company.findById(ownerId)
    if (!gym || !GYM.includes(gym.typeCode)) throw new Error('Not a valid gym')

    const director = await ctr.relation.getGymDirector(ownerId)
    if (director.filter((dr) => { return dr.rightProfileId._id.toString() === userId }).length < 1) throw new Error('Only gym director can approve a certificate')

    const certificate = await this.certificates.findById(certificateId)
    if (!certificate) throw new Error('Certificate details are not available')
    let isOwnerAvailable = false
    if (!certificate.owners) certificate.owners = []
    certificate.owners.forEach((ow) => {
      if (ow.ownerId.toString() === ownerId) {
        isOwnerAvailable = true
        ow.isApproved = true
        ow.createdBy = createdBy
      }
    })
    if (!isOwnerAvailable) {
      certificate.owners.push({ isApproved: true, createdBy, ownerId })
    }
    let savedCertificate = await certificate.save()
    savedCertificate = savedCertificate.toObject()
    savedCertificate.owners = savedCertificate.owners.filter((ow) => {
      return ow.ownerId.toString() === ownerId || ow.isApproved
    })
    return savedCertificate
  }

  /**
   * disapprove certificates
   * @param {string} certificateId - id of certificate document
   * @param {objectId} ownerId - object id of gym
   * @param {objectId} createdby - object Id of gym director
   */
  async disapprove (certificateId, ownerId, createdBy, userId) {
    const gym = await this.company.findById(ownerId)
    if (!gym || !GYM.includes(gym.typeCode)) throw new Error('Not a valid gym')

    const director = await ctr.relation.getGymDirector(ownerId)
    if (director.filter((dr) => { return dr.rightProfileId._id.toString() === userId }).length < 1) throw new Error('Only gym director can disapprove a certificate')

    const certificate = await this.certificates.findById(certificateId)

    if (!certificate) throw new Error('Certificate details are not available')
    let isOwnerAvailable = false
    if (!certificate.owners) certificate.owners = []
    certificate.owners.forEach((ow) => {
      if (ow.ownerId.toString() === ownerId) {
        isOwnerAvailable = true
        ow.isApproved = false
        ow.createdBy = createdBy
      }
    })
    if (!isOwnerAvailable) throw new Error('No approval found')
    let savedCertificate = await certificate.save()
    savedCertificate = savedCertificate.toObject()
    savedCertificate.owners = savedCertificate.owners.filter((ow) => {
      return ow.ownerId.toString() === ownerId || ow.isApproved
    })
    return savedCertificate
  }

  /**
   * update certificate if it is not approved already
   * @param {string} certificateId - id of certificate document
   * @param {objectId[]} sports - sports types from setting
   * @param {number} expiry - date of expiry in YYYYMMDD
   * @param {string} file - base 64 string
   * @param {string} fileName - base 64 string
   * @param {objectId} profileId - object of profile IN / TU
   * @param {objectId} ownerId - object id of gym
   * @param {objectId} createdby - object Id of gym director
   */
  async update (certificateId, name, sports, expiry, file, fileName, ownerId, createdby, userId) {
    const certificate = await this.certificates.findById(certificateId)
    let isApproved = false

    if (ownerId) {
      const gym = await this.company.findById(ownerId)
      if (!gym || !GYM.includes(gym.typeCode)) throw new Error('Not a valid gym')
    }

    if (certificate.profileId.toString() !== userId) {
      if (!ownerId) throw new Error('ProfileId and UserId are different, GymId required to verify relationship')
      const director = await ctr.relation.getGymDirector(ownerId)
      if (director.filter((dr) => { return dr.rightProfileId._id.toString() === userId }).length < 1) throw new Error('Only self or gym director can update a certificate')
      isApproved = true
    }

    if (!certificate) throw new Error('Certificate details are not available')
    if (certificate.owners && certificate.owners.length && certificate.owners.filter((ow) => { return ow.isApproved }).length > 0) throw new Error('Certificate is already approved')
    // if (!ownerId || !ownerId.length) throw new Error('owner id is not valid')
    if (certificate.type === 'medical') {
      if (certificate.subtype === 'competitive' && (!sports || !sports.length)) {
        throw new Error('Sport list is required')
      }
      if (!expiry) throw new Error('Expiry is not defined')
    }

    if (certificate.file.id && file && fileName) {
      await rabbitmq.sendAndRead('/files/delete', { _id: certificate.file.id.toString() })
      const fileInfo = await rabbitmq.sendAndRead('/files/post', {
        filename: fileName,
        isPublic: true,
        binData: file
      })
      certificate.file.id = fileInfo.data._id
      certificate.file.filename = fileInfo.data.filename
    }
    certificate.name = name
    certificate.sports = sports
    certificate.expiry = expiry
    let isOwnerAvailable = false
    if (ownerId) {
      if (!certificate.owners) certificate.owners = []
      certificate.owners.forEach((ow) => {
        if (ow.ownerId.toString() === ownerId) {
          ow.isApproved = isApproved
          ow.createdby = createdby
          isOwnerAvailable = true
        }
      })
      if (!isOwnerAvailable) certificate.owners.push({ isApproved: true, createdby, ownerId })
    }
    let savedCertificate = await certificate.save()
    savedCertificate = savedCertificate.toObject()
    savedCertificate.owners = savedCertificate.owners.filter((ow) => {
      return ow.ownerId.toString() === ownerId || ow.isApproved
    })
    return savedCertificate
  }

  /**
   * update certificate if it is not approved already
   * @param {string} certificateId - id of certificate document
   * @param {objectId} ownerId - object id of gym
   */
  async delete (certificateId, ownerId, userId) {
    if (ownerId) {
      const gym = await this.company.findById(ownerId)
      if (!gym || !GYM.includes(gym.typeCode)) throw new Error('Not a valid gym')
    }

    const certificate = await this.certificates.findById(certificateId)
    if (certificate.profileId.toString() !== userId) {
      if (!ownerId) throw new Error('ProfileId and UserId are different, GymId required to verify relationship')
      const director = await ctr.relation.getGymDirector(ownerId)
      if (director.filter((dr) => { return dr.rightProfileId._id.toString() === userId }).length < 1) throw new Error('Only self or gym director can delete a certificate')
    }
    if (!certificate) throw new Error('Certificate details are not available')

    if (ownerId) {
      if (certificate.owners && certificate.owners.length && certificate.owners.filter((ow) => { return ow.ownerId.toString() === ownerId && ow.isApproved === true }).length < 1) throw new Error('Certificate is already approved, please disapprove first')
      if (certificate.owners.length > 0) {
        certificate.owners = certificate.owners.filter((ow) => { return ow.ownerId.toString() !== ownerId })
      }
    }
    if (certificate.owners.length === 0) {
      await rabbitmq.sendAndRead('/files/delete', { _id: certificate.file.id.toString() })
      await this.certificates.findByIdAndDelete(certificateId)
    } else {
      await certificate.save()
    }
    return true
  }
}

module.exports = CertificatesController
