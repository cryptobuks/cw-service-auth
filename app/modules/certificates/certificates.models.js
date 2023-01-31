const { db } = require('@cowellness/cw-micro-service')()
const { medical, identity, certificateType } = require('./certificates.enum')

const Schema = db.auth.Schema

const newSchema = new Schema(
  {
    type: {
      type: String,
      required: true,
      enum: certificateType
    },
    name: {
      type: String,
      require: true
    },
    subtype: {
      type: String,
      enum: medical.concat(identity)
    },
    sports: {
      type: [Schema.ObjectId]
    },
    expiry: {
      type: Number
    },
    file: {
      filename: {
        required: true,
        type: String
      },
      id: {
        required: true,
        type: String
      }
    },
    profileId: {
      type: Schema.ObjectId,
      ref: 'Profile',
      required: true
    },
    owners: [{
      isApproved: {
        type: Boolean,
        default: false
      },
      ownerId: {
        type: Schema.ObjectId,
        ref: 'Profile',
        required: true
      },
      createdby: {
        type: Schema.ObjectId,
        ref: 'Profile'
      }
    }]
  },
  { timestamps: true }
)

module.exports = db.auth.model('certificates', newSchema)
