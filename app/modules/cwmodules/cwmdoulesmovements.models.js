const { db } = require('@cowellness/cw-micro-service')()

const Schema = db.auth.Schema

const newSchema = new Schema(
  {
    profileId: {
      type: Schema.ObjectId,
      ref: 'Profile'
    },
    modules: {
      type: Schema.Types.Mixed,
      required: true
    },
    basicPrice: {
      type: Number
    },
    discount: {
      type: Number
    },
    price: {
      type: Number
    },
    unit: {
      type: Number
    },
    credit: {
      type: Number
    },
    referenceAt: {
      type: Date
    }
  },
  { timestamps: true }
)

module.exports = db.auth.model('CwModulesMovements', newSchema)
