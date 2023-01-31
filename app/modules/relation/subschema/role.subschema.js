const { db } = require('@cowellness/cw-micro-service')()
const { roles } = require('../../profile/profile.enum')

const Schema = db.auth.Schema

const newSchema = new Schema(
  {
    status: {
      type: String,
      required: true,
      default: 'temporary',
      enum: ['temporary', 'active', 'suspended'],
      index: true
    },
    role: {
      type: String, // TU,DI,....
      enum: roles,
      required: true
    },
    startAt: {
      type: Date,
      required: false
    },
    endAt: {
      type: Date,
      required: false
    },
    // for each change of status, I register it
    logs: [{
      status: String,
      changedAt: Date,
      startAt: Date,
      endAt: Date
    }]

  }
  ,
  { timestamps: true }
)

module.exports = newSchema
