const { db } = require('@cowellness/cw-micro-service')()
const { status } = require('../profile/profile.enum')

const Schema = db.auth.Schema

const newSchema = new Schema(
  {
    profileId: {
      type: Schema.ObjectId,
      ref: 'Profile',
      required: true
    },
    userId: {
      type: Schema.ObjectId,
      ref: 'Profile',
      required: true
    },
    status: {
      type: String,
      enum: status,
      required: true
    }
  },
  { timestamps: true }
)

module.exports = db.auth.model('profileHistory', newSchema)
