const { db } = require('@cowellness/cw-micro-service')()

const Schema = db.auth.Schema

const newSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['cv', 'mc', 'mcc', 'ic'],
      required: true
      // cv = Curriculim Vitae   mc =  medical certificate,  mcc = medial certificate competitive,  ic = identical card
    },
    description: {
      type: String
    },
    file: {
      type: String, // see service background howto save info of file
      required: true
    },
    sports: {
      type: Schema.ObjectId,
      ref: 'sportInterest'
      // required only if type = mcc
    },
    expireAt: {
      type: Date,
      default: null
    }

  }
  ,
  { timestamps: true }
)

module.exports = newSchema
