const { db } = require('@cowellness/cw-micro-service')()
const { periods, variables, targets, allowedRoles } = require('./payroll.enum')

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
    payrolls: [{
      name: {
        type: String,
        required: true
      },
      role: {
        type: String,
        enum: allowedRoles
      },
      period: {
        type: String,
        enum: periods
      },
      variable: {
        type: String,
        enum: variables
      },
      value: {
        type: Number
      }
    }],
    awards: [{
      target: {
        type: String,
        enum: targets
      },
      quantity: {
        type: Number
      },
      end: {
        type: Number
      },
      value: {
        type: Number
      }
    }]
  },
  { timestamps: true }
)

newSchema.index({ ownerId: 1, profileId: 1 }, { unique: true })

module.exports = db.auth.model('payroll', newSchema)
