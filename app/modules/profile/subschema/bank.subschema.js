const { db } = require('@cowellness/cw-micro-service')()

const Schema = db.auth.Schema

const newSchema = new Schema(
  {
    isActive: {
      type: Boolean,
      default: true
    },
    name: {
      type: String
    },
    countryCode: { // in base al country code cambiano i dati richiesti
      type: String
    },
    iban: {
      type: String
    },
    account: {
      type: String
    },
    bic: {
      type: String
    },
    owner: {
      type: String
    },
    routingNumber: {
      type: String
    },
    referenceId: {
      type: Schema.ObjectId
    }
  }
  ,
  { timestamps: true }
)

module.exports = newSchema
