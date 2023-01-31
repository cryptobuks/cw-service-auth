const { db } = require('@cowellness/cw-micro-service')()

const Schema = db.auth.Schema

const newSchema = new Schema(
  {
    name: {
      type: String,
      unique: true,
      required: true
    },
    rules: {
      type: Schema.Types.Mixed,
      required: true
    }
  },
  { timestamps: true }
)

module.exports = db.auth.model('Permission', newSchema)
