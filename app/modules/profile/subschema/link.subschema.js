const { db } = require('@cowellness/cw-micro-service')()

const Schema = db.auth.Schema

const newSchema = new Schema(
  {
    type: {
      type: String,
      default: 'url' // facebook, linkedin, twitter, ...
    },
    link: {
      type: String
    }

  }
  ,
  { timestamps: true }
)

module.exports = newSchema
