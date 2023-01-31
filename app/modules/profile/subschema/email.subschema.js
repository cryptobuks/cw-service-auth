const { db } = require('@cowellness/cw-micro-service')()

const Schema = db.auth.Schema

const newSchema = new Schema(
  {
    _id: false,
    email: {
      type: String,
      required: true,
      index: true,
      es_indexed: true
    },
    verification: {
      type: String,
      required: true,
      default: 'tocheck',
      enum: ['tocheck', 'checked'],
      es_indexed: true
    },
    isDeliverable: {
      type: Boolean,
      required: true,
      default: true,
      es_indexed: true
    },
    isForNotifications: {
      type: Boolean,
      required: true,
      default: true
    }

  }
  ,
  { timestamps: true }
)

module.exports = newSchema
