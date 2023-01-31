const { db } = require('@cowellness/cw-micro-service')()

const Schema = db.auth.Schema

const newSchema = new Schema(
  {

    pec: {
      type: String,
      required: true,
      index: true,
      es_indexed: false
    },

    isDeliverable: {
      type: Boolean,
      required: true,
      default: true,
      es_indexed: false
    }

  }
  ,
  { timestamps: true }
)

module.exports = newSchema
