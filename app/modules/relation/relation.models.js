const { db, ctr } = require('@cowellness/cw-micro-service')()
const roleSchema = require('./subschema/role.subschema')
const esMapper = require('../common/es-link')()

const { channelSource, channelAdv } = require('../profile/profile.enum')

const Schema = db.auth.Schema

const newSchema = new Schema(
  {
    status: {
      type: String,
      required: true,
      default: 'temporary',
      enum: ['draft', 'temporary', 'active', 'suspended'],
      index: true
    },
    leftProfileId: {
      type: Schema.ObjectId,
      ref: 'Profile'
    },
    rightProfileId: {
      type: Schema.ObjectId,
      ref: 'Profile'
    },
    roles: [roleSchema],
    leftProfileSettings: {
      vatRateForInvoiceId: {
        type: Schema.ObjectId
      },
      referentProfileId: { // CRUD only for CW
        type: Schema.ObjectId,
        ref: 'Profile'
      },
      acquisitionChannel: {
        source: {
          type: String,
          enum: channelSource
        },
        advType: {
          type: String,
          enum: channelAdv
        },
        friendId: {
          type: Schema.ObjectId,
          ref: 'Profile'
        }
      },
      notes: {
        type: String
      },
      paymentTermId: {
        type: Schema.ObjectId
      }
    },
    rightProfileSettings: {
      vatRateForInvoiceId: {
        type: Schema.ObjectId
      },
      referentProfileId: { // CRUD only for CW
        type: Schema.ObjectId,
        ref: 'Profile'
      },
      acquisitionChannel: {
        source: {
          type: String,
          enum: channelSource
        },
        advType: {
          type: String,
          enum: channelAdv
        },
        friendId: {
          type: Schema.ObjectId,
          ref: 'Profile'
        }
      },
      notes: {
        type: String
      },
      paymentTermId: {
        type: Schema.ObjectId
      }
    },
    blockedBy: {
      type: Schema.ObjectId,
      ref: 'Profile'
    },
    blockedAt: {
      type: Date
    },
    isInteresting: {
      type: Boolean,
      default: true
    }
    // documentsAccepted:[
    //   {
    //     //..
    //   }
    // ]

  },
  { timestamps: true }
)
newSchema.index({ leftProfileId: 1, rightProfileId: 1 }, { unique: true })
newSchema.pre('save', function (next) {
  this.wasNew = this.isNew
  next()
})
newSchema.post('save', async (doc) => {
  await esMapper.transport(newSchema, doc, 'relations')
  ctr.relation.sendRelationToBroadcast(doc)
  ctr.relation.sendWelcomeMessage(doc)
})
newSchema.post('findOneAndUpdate', (doc) => { ctr.relation.sendRelationToBroadcast(doc) })
newSchema.post('insertMany', (docs) => {
  docs.forEach((doc) => ctr.relation.sendRelationToBroadcast(doc))
})

module.exports = db.auth.model('Relation', newSchema)
