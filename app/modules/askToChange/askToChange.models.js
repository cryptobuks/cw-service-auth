const { db } = require('@cowellness/cw-micro-service')()

const Schema = db.auth.Schema

const newSchema = new Schema(
  {
    ownerId: {
      type: String
    },
    profileId: {
      type: String
    },
    data: {
      type: Object
    },
    expiryDate: {
      type: Date,
      default: () => Date.now() + 30 * 24 * 60 * 60 * 1000
    }
  },
  { timestamps: true }
)

module.exports = db.auth.model('Asktochange', newSchema)
