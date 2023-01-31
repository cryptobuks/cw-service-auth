const { db } = require('@cowellness/cw-micro-service')()
const { deviceStatus } = require('../../device/device.enum')

const Schema = db.auth.Schema

const devices = new Schema({
  name: { type: String },
  status: { type: String, enum: deviceStatus },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true })

module.exports = devices
