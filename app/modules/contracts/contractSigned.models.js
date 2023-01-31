const { db } = require('@cowellness/cw-micro-service')()
const { documentType } = require('../contracts/contracts.enum')

const Schema = db.auth.Schema

const newSchema = new Schema(
  {
    ownerId: {
      type: Schema.ObjectId,
      ref: 'Profile',
      required: true
    },
    profileId: {
      type: Schema.ObjectId,
      ref: 'Profile',
      required: true
    },
    onBehalf: {
      type: Schema.ObjectId,
      ref: 'Profile'
    },
    type: {
      type: String,
      required: true,
      enum: documentType
    },
    role: {
      type: String,
      enum: ['DI', 'SA', 'PT', 'CT', 'SP', 'CL', 'OP', 'RE', 'PER', 'TT']
    },
    documentId: {
      type: Schema.ObjectId,
      required: true
    },
    source: {
      type: String,
      default: 'contract',
      enum: ['contract', 'setting', '']
    },
    content: {
      type: String
    },
    isMandatory: {
      type: Boolean
    },
    isAccepted: {
      type: Boolean,
      required: true
    },
    deviceId: {
      type: Schema.ObjectId
    },
    IP: {
      type: String
    },
    sign: {
      type: String
    },
    signedAt: {
      type: Date
    }
  },
  { timestamps: true }
)

module.exports = db.auth.model('documentsigned', newSchema)
