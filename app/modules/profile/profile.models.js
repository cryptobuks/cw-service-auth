const { db, ctr, _ } = require('@cowellness/cw-micro-service')()
// const config = require('config')
// const util = require('util')
const { gender, status, typeCode, italianCompanyType, taxRegime } = require('./profile.enum')
// const mongoosastic = require('mongoosastic')

const addressSchema = require('./subschema/address.subschema')
const emailSchema = require('./subschema/email.subschema')
const pecSchema = require('./subschema/pec.subschema')
const phoneSchema = require('./subschema/phone.subschema')
const mobilePhoneSchema = require('./subschema/mobilePhone.subschema')
const idSchema = require('./subschema/id.subschema')
const device = require('./subschema/device.subschema')
const linkSchema = require('./subschema/link.subschema')
const bankSchema = require('./subschema/bank.subschema')
const documentSchema = require('./subschema/document.subschema')

const esMapper = require('../common/es-link')()

const Schema = db.auth.Schema

const newSchema = new Schema(
  {
    status: {
      type: String,
      required: true,
      default: 'temporary',
      enum: status,
      es_indexed: true,
      index: true
    },
    typeCode: {
      type: String,
      enum: typeCode,
      required: true,
      es_indexed: true,
      index: true
    },
    createdByProfileId: {
      type: Schema.ObjectId,
      ref: 'Profile'
    },
    parentId: {
      type: Schema.ObjectId,
      ref: 'Profile'
      // required only if CU o GU
    },
    managedCountries: [ // only for CW, CU
      {
        countryCode: {
          type: String
        }
      }
    ],
    ids: [
      idSchema //  distinguere tra person e company 'pin', 'tin',     -    'vat', 'fiscal'
    ],
    qrCode: { // auto generated  _id + random(10)
      type: String,
      es_indexed: true
    },
    password: {
      type: String,
      es_indexed: false
    },
    shortDescription: {
      type: String,
      default: '',
      maxlength: 160,
      es_indexed: false,
      trim: true
    },
    avatar: {
      filename: {
        es_indexed: true,
        type: String
      },
      id: {
        es_indexed: true,
        type: String
      }
    },
    displayName: {
      type: String,
      es_indexed: true
    },
    company: {
      name: {
        type: String,
        es_indexed: true
      },
      brand: {
        type: String,
        es_indexed: false
      },
      sdi: { // unique code
        type: String,
        es_indexed: false
      },
      balanceSheet: {
        startDate: {
          type: Number
        }
      },
      credits: [{
        _id: false,
        credit: {
          type: Number
        },
        startDt: {
          type: Number
        },
        endDt: {
          type: Number
        }
      }],
      addresses: [
        addressSchema
      ],
      emails: [
        emailSchema
      ],
      pecs: [
        pecSchema // legal email
      ],
      phones: [
        phoneSchema
      ],
      mobilePhones: [
        mobilePhoneSchema
      ],
      onlineLinks: [
        linkSchema
      ],
      banks: [
        bankSchema
      ],
      devices: [
        device
      ],
      mailInChat: {
        alias: {
          type: String,
          es_indexed: true
        }
      },
      chatPluginSettings: {
        type: Schema.Types.Mixed
      },
      country: {
        type: String,
        es_indexed: true
      },
      countryFields: {
        it: {
          companyType: {
            type: String,
            enum: italianCompanyType
          },
          codiceAteco: [{
            type: String
          }],
          taxRegime: {
            type: String,
            enum: taxRegime
          },
          rea: [{
            type: String
          }]
        }
      }
    },
    person: {
      firstname: {
        type: String,
        es_indexed: true
      },
      lastname: {
        type: String,
        es_indexed: true
      },
      birth: {
        date: {
          type: String, // YYYYMMDD
          match: [/\d{8}/, 'is not valid date of birth'],
          minLength: 8,
          maxLength: 8
        },
        country: {
          type: String
        },
        city: {
          type: String
        }
      },
      gender: {
        type: String,
        enum: gender
      },
      addresses: [
        addressSchema
      ],
      emails: [
        emailSchema
      ],
      pecs: [
        pecSchema
      ],
      phones: [
        phoneSchema
      ],
      mobilePhones: [
        mobilePhoneSchema
      ],
      onlineLinks: [
        linkSchema
      ],
      documents: [
        documentSchema
      ],
      banks: [
        bankSchema
      ]
    },
    settings: {
      background: {
        id: {
          es_indexed: false,
          type: Schema.ObjectId
        } // ?!?!?
      },
      notification: {
        email: {
          type: Boolean,
          default: false
        },
        sms: {
          type: Boolean,
          default: false
        }
      },
      language: {
        es_indexed: false,
        type: String
      },
      dateFormat: {
        es_indexed: false,
        type: String,
        default: 'DD/MM/YYYY'
      },
      numberFormat: {
        es_indexed: false,
        type: String,
        default: '' // ????
      },
      lengthFormat: {
        es_indexed: false,
        type: String,
        default: '' // ????
      },
      weightFormat: {
        es_indexed: false,
        type: String,
        default: '' // ????
      },
      temperatureFormat: {
        es_indexed: false,
        type: String,
        default: '' // ????
      },
      distanceFormat: {
        es_indexed: false,
        type: String,
        default: '' // ????
      },
      timeZone: {
        es_indexed: false,
        type: String,
        default: '' // ????
      },
      calendar: {
        token: {
          es_indexed: true,
          type: String
        }
      }
    },

    interests: [ // sport interest
      {
        type: Schema.Types.ObjectId
      }
    ],
    pwa: {
      es_indexed: false,
      installed: {
        type: Boolean,
        default: false
      },
      refuseCount: {
        type: Number,
        default: 0
      }
    }
  },
  { timestamps: true }
)

// if (config.elasticSearch.active) {
// newSchema.addESPlugin(mongoosastic, { hosts: [config.elasticSearch.server], index: 'Profile' })
// }

newSchema.pre('save', async function (next) {
  this.preSaveData = null
  if (!this.isNew) {
    const profile = db.auth.model('Profile')
    this.preSaveData = await profile.findById(this._id).exec()
  }
  this.wasNew = this.isNew
  if (!_.get(this.settings, 'calendar.token')) {
    _.set(this.settings, 'calendar.token', this._id + '-' + Date.now())
  }
  next()
})

const postSave = async function (doc) {
  const preSaveData = doc.preSaveData
  if (doc && doc._id) {
    const profile = db.auth.model('Profile')
    doc = await profile.findById(doc._id).exec()
  }

  ctr.profile.addChangeLog(preSaveData, doc)
  const displayName = (doc.displayName ? doc.displayName.toString() : undefined)
  let saveChanges = false
  const isPerson = ['IN', 'TU'].includes(doc.typeCode)
  if (isPerson) {
    doc.displayName = _.first([
      [doc.person.firstname, doc.person.lastname].filter(i => !!i).join(' '),
      doc.person.emails[0]?.email,
      [doc.person.mobilePhones[0]?.prefixNumber, doc.person.mobilePhones[0]?.phoneNumber].filter(i => !!i).join(),
      doc.ids?.find(i => i.key === 'pin')?.value
    ].filter(i => !!i))
    if (doc.displayName !== displayName) saveChanges = true
  } else {
    if (doc.company.brand || doc.company.name || doc.displayName) {
      doc.displayName = doc.company.brand || doc.company.name || doc.displayName
      if (doc.displayName !== displayName) saveChanges = true
    }
  }
  if (doc.company && doc.company.addresses && doc.company.addresses.length) {
    const preCountry = doc.company.country ? doc.company.country.toString() : undefined
    const legal = doc.company.addresses.findIndex((add) => { return add.type === 'legal' })
    if (legal > -1 && doc.company.addresses[legal].addressComponents) {
      doc.company.country = _.get(doc, `company.addresses[${legal}].addressComponents.country.short`)
    } else {
      doc.company.country = _.get(doc, 'company.addresses[0].addressComponents.country.short')
    }
    if (doc.company.country) {
      doc.company.country = _.toLower(doc.company.country)
    }
    if (preCountry !== doc.company.country) {
      saveChanges = true
    }
  }
  if (saveChanges) doc = await doc.save()
  return doc
}

newSchema.post('save', async (doc) => {
  doc = await postSave(doc)
  await esMapper.transport(newSchema, doc, 'profiles')
  ctr.profile.sendProfileToBroadcast(doc)
})
newSchema.post('findOneAndUpdate', (doc) => ctr.profile.sendProfileToBroadcast(doc))
newSchema.post('insertMany', (docs) => {
  docs.forEach((doc) => ctr.profile.sendProfileToBroadcast(doc))
})

const Profile = db.auth.model('Profile', newSchema)

Profile.search = async function (query, opts, callback) {
  return await esMapper.search('profiles', query, opts, callback, Profile)
}
// Profile._search = Profile.search
// Profile.search = util.promisify(Profile._search)

module.exports = Profile
