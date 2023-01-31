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
    rules: {
      type: Schema.Types.Mixed,
      required: true
    },
    updatedBy: {
      type: Schema.ObjectId,
      ref: 'Profile',
      required: true
    }
  },
  { timestamps: true }
)

module.exports = db.auth.model('PermissionOverride', newSchema)
