const { db } = require('@cowellness/cw-micro-service')()

const Schema = db.auth.Schema

const newSchema = new Schema(
  {
    _id: false,
    countryCode: { // it
      type: String,
      required: true,
      es_indexed: true
    },
    prefixNumber: { // +39
      type: String,
      required: true,
      es_indexed: true
    },
    phoneNumber: {
      type: String, // 329xxxxxxxx
      required: true,
      es_indexed: true
    }

  }
  ,
  { timestamps: true }
)

module.exports = newSchema
