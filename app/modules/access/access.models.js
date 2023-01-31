const { db } = require('@cowellness/cw-micro-service')()

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
    assetId: {
      type: Schema.ObjectId
    },
    IP: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
)

module.exports = db.auth.model('Access', newSchema)
