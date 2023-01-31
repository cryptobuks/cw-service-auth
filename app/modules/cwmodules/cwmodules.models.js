const { db } = require('@cowellness/cw-micro-service')()

const Schema = db.auth.Schema

const newSchema = new Schema(
  {
    profileId: {
      type: Schema.ObjectId,
      ref: 'Profile',
      required: true
    },
    modules: {
      area: {
        type: Schema.Types.Mixed,
        required: true
      },
      paidByGroup: {
        type: Boolean,
        default: false
      },
      isActive: {
        type: Boolean
      },
      activeChangedAt: {
        type: Date
      },
      contactsCount: {
        type: Number
      },
      discounts: [{
        _id: false,
        discount: {
          type: Number
        },
        startDt: {
          type: Number
        },
        endDt: {
          type: Number
        }
      }],
      priceHistory: []
    }

  },
  { timestamps: true }
)

module.exports = db.auth.model('CwModules', newSchema)
