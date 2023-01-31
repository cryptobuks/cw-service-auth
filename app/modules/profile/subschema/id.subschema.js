const { db } = require('@cowellness/cw-micro-service')()

const Schema = db.auth.Schema

const newSchema = new Schema(
  {
    _id: false,
    countryCode: {
      type: String,
      required: true,
      es_indexed: true
    },
    key: { // person 'pin', 'tin'    //company  'vat', 'fiscal'
      type: String,
      required: true,
      enum: ['pin', 'tin', 'vat', 'fiscal'], // in italy tin=pin=codice fiscale
      es_indexed: true
    },
    value: {
      type: String,
      required: true,
      es_indexed: true
    }
  }
  ,
  { timestamps: true }
)

module.exports = newSchema
