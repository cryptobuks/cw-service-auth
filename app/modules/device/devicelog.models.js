const { db } = require('@cowellness/cw-micro-service')()

const Schema = db.auth.Schema

const newSchema = new Schema(
  {
    profileId: {
      type: Schema.ObjectId,
      ref: 'Profile',
      required: true
    },
    gymId: {
      type: Schema.ObjectId,
      ref: 'Profile',
      required: true
    },
    deviceId: {
      type: Schema.ObjectId,
      required: true
    }
  },
  { timestamps: true }
)

module.exports = db.auth.model('devicelog', newSchema)
