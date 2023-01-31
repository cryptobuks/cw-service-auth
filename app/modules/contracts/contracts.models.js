const { db } = require('@cowellness/cw-micro-service')()
const { documentType, stages, allowedRole } = require('../contracts/contracts.enum')

const Schema = db.auth.Schema

const newSchema = new Schema(
  {
    ownerId: {
      type: Schema.ObjectId,
      ref: 'Profile',
      required: true
    },
    type: {
      type: String,
      required: true,
      enum: documentType
    },
    role: {
      type: String,
      enum: allowedRole
    },
    referenceDoc: {
      type: Schema.ObjectId
    },
    isDefaultDocument: {
      type: Boolean,
      default: false
    },
    preApproval: {
      type: Boolean,
      default: false
    },
    progressive: {
      type: Number,
      default: 1
    },
    content: {
      type: String,
      required: true
    },
    status: {
      type: String,
      default: 'draft',
      enum: stages
    },
    activatedAt: {
      type: Date
    },
    expiredAt: {
      type: Date
    }
  },
  { timestamps: true }
)

newSchema.index({ ownerId: 1, type: 1, progressive: 1, role: 1 }, { unique: true })

newSchema.pre('save', function (next) {
  const doc = this
  if (!this.activatedAt && !this.expiredAt) {
    this.status = 'draft'
  } else
  if (this.activatedAt && !this.expiredAt) {
    this.status = 'active'
  } else
  if (this.activatedAt && this.expiredAt) {
    this.status = 'expired'
  }
  if (this.isNew) {
    let query
    if (this.type === 'role') {
      query = { type: this.type, role: this.role, ownerId: this.ownerId.toString() }
    } else {
      query = { type: this.type, ownerId: this.ownerId.toString() }
    }
    this.constructor.find(query, 'progressive', function (err, docs) {
      if (!err && docs) {
        if (docs.length) {
          doc.progressive = docs[0].progressive + 1
        } else {
          doc.progressive = 1
        }
      }
      if (this.status === 'active' && this.activatedAt && !this.expiredAt) {
        query.expiredAt = null
        this.constructor.updateMany(query, { $set: { status: 'expired', expiredAt: new Date() } }, function (updateErr, docs) {
          next()
        })
      } else {
        next()
      }
    }).sort({ progressive: -1 })
  } else {
    next()
  }
})

module.exports = db.auth.model('document', newSchema)
