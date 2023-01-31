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
    relatedProfiles: [{
      _id: false,
      profileId: {
        type: Schema.ObjectId,
        ref: 'Profile',
        required: true
      },
      role: {
        type: String,
        required: true,
        enum: ['PT', 'CT', 'SA']
      },
      createdAt: {
        type: Date,
        default: Date.now
      },
      createdBy: {
        type: Schema.ObjectId,
        ref: 'Profile',
        required: true
      }
    }]
  },
  { timestamps: true }
)

newSchema.index({ ownerId: 1, leftProfileId: 1, rightProfileId: 1 }, { unique: true })

module.exports = db.auth.model('assigned', newSchema)
