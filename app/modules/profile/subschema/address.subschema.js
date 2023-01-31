const { db } = require('@cowellness/cw-micro-service')()

const Schema = db.auth.Schema

const newSchema = new Schema(
  {
    type: {
      type: String,
      required: true
    },
    addressComponents: {
      type: Schema.Types.Mixed
    },
    fulladdress: {
      type: String,
      required: true
    },
    zipcode: {
      type: String
    },
    location: {
      lat: {
        type: Number
      },
      lng: {
        type: Number
      }
    }
  }
  ,
  { timestamps: true }
)

// newSchema.index({ gps: '2dsphere' })

module.exports = newSchema
