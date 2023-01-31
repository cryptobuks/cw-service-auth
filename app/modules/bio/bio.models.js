const { db } = require('@cowellness/cw-micro-service')()

const Schema = db.auth.Schema

const newSchema = new Schema(
  {
    profileId: {
      type: Schema.ObjectId,
      ref: 'Profile',
      required: true
    },
    body: {
      height: {
        type: Number
      },
      weight: {
        type: Number
      },
      mass: {
        muscle: {
          type: Number
        },
        fat: {
          type: Number
        },
        tissue: {
          type: Number
        },
        bone: {
          type: Number
        }
      },
      water: {
        type: Number
      }
    },
    bmi: {
      type: Number
    },
    bmr: {
      type: Number
    },
    measuredAt: {
      type: Date
    }
  },
  { timestamps: true }
)

module.exports = db.auth.model('bio', newSchema)
