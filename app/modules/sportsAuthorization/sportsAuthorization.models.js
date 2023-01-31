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
    sports: {
      course: [{ type: Schema.Types.ObjectId }],
      private: [{ type: Schema.Types.ObjectId }]
    }
  },
  { timestamps: true }
)

newSchema.index({ ownerId: 1, profileId: 1 }, { unique: true })

module.exports = db.auth.model('sportsAuthorization', newSchema)
