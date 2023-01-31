const { db } = require('@cowellness/cw-micro-service')()
const { GYM, nonBusiness } = require('../profile/profile.enum')

/**
 * @class PayrollController
 * @classdesc Controller Payroll
 */
class PayrollController {
  constructor () {
    this.Payroll = db.auth.model('payroll')
    this.profile = db.auth.model('Profile')
  }

  /**
   * find payroll by ownerId and profileId
   * @param {*} ownerId
   * @param {*} profileId
   * @returns payroll
   */
  async getPayrollDetail (ownerId, profileId) {
    return await this.Payroll.findOne({ ownerId, profileId }).lean().exec()
  }

  /**
   * add new payroll data
   * @param {*} ownerId
   * @param {*} profileId
   * @param {*} name
   * @param {*} role
   * @param {*} period
   * @param {*} variable
   * @param {*} value
   * @param {*} id
   * @returns payroll
   */
  async addPayroll (ownerId, profileId, name, role, period, variable, value, id) {
    const [business, profile] = await Promise.all([this.profile.findOne({ _id: ownerId, typeCode: { $in: GYM } }, '_id').lean().exec(), this.profile.findOne({ _id: profileId, typeCode: { $in: nonBusiness } }, '_id').lean().exec()])
    if (!business) throw new Error('Business Id information not valid or details are not available')
    if (!profile) throw new Error('Profile Id information not valid or details are not available')
    const payroll = await this.Payroll.findOne({ ownerId, profileId }).exec()
    if (!payroll) {
      const newPayroll = {
        ownerId,
        profileId,
        payrolls: [
          {
            name,
            role,
            period,
            variable,
            value
          }
        ]
      }
      return this.Payroll.create(newPayroll)
    } else {
      if (!payroll.payrolls) payroll.payrolls = []
      const position = (id ? payroll.payrolls.findIndex((pa) => { return pa._id.toString() === id }) : -1)
      if (position > -1) {
        payroll.payrolls[position].value = value
        payroll.payrolls[position].role = role
        payroll.payrolls[position].period = period
        payroll.payrolls[position].variable = variable
      } else {
        payroll.payrolls.push({ name, role, period, variable, value })
      }

      return await payroll.save()
    }
  }

  /**
   * bulk create or update payrolls
   * @param {*} ownerId
   * @param {*} profileId
   * @param {*} payrolls
   * @returns payroll
   */
  async bulkaddUpdatePayrolls (ownerId, profileId, payrolls) {
    if (!payrolls || !payrolls.length) return null
    const payroll = await this.Payroll.findOne({ ownerId, profileId }).exec()
    if (!payroll) {
      const newPayroll = {
        ownerId,
        profileId,
        payrolls: payrolls.map((pay) => { delete pay.id; return pay })
      }
      return this.Payroll.create(newPayroll)
    } else {
      if (!payroll.payrolls) payroll.payrolls = []
      for (const pay of payrolls) {
        const position = (pay.id ? payroll.payrolls.findIndex((pa) => { return pa._id.toString() === pay.id }) : -1)
        if (pay.id && position > -1) {
          payroll.payrolls[position].value = pay.value
          payroll.payrolls[position].role = pay.role
          payroll.payrolls[position].period = pay.period
          payroll.payrolls[position].variable = pay.variable
        } else {
          payroll.payrolls.push({ name: pay.name, role: pay.role, period: pay.period, variable: pay.variable, value: pay.value })
        }
      }

      return await payroll.save()
    }
  }

  /**
   * remove payroll
   * @param {*} ownerId
   * @param {*} profileId
   * @param {*} id payroll id
   * @returns payroll
   */
  async removePayroll (ownerId, profileId, id) {
    const [business, profile] = await Promise.all([this.profile.findOne({ _id: ownerId, typeCode: { $in: GYM } }, '_id').lean().exec(), this.profile.findOne({ _id: profileId, typeCode: { $in: nonBusiness } }, '_id').lean().exec()])
    if (!business) throw new Error('Business Id information not valid or details are not available')
    if (!profile) throw new Error('Profile Id information not valid or details are not available')
    const payroll = await this.Payroll.findOne({ ownerId, profileId }).exec()
    if (!payroll) throw new Error('Details not available')
    if (payroll.payrolls.findIndex((pa) => { return pa._id.toString() === id }) > -1) {
      payroll.payrolls = payroll.payrolls.filter((pa) => { return pa._id.toString() !== id })
      return await payroll.save()
    } else {
      throw new Error('Payroll details not found')
    }
  }

  /**
   * bulk remove payrolls
   * @param {*} ownerId
   * @param {*} profileId
   * @param {Array} ids payroll ids
   * @returns payroll
   */
  async bulkRemovePayrolls (ownerId, profileId, ids) {
    if (!ids || !ids.length) return null
    const payroll = await this.Payroll.findOne({ ownerId, profileId }).exec()
    if (!payroll) throw new Error('Details not available')
    payroll.payrolls = payroll.payrolls.filter((pa) => { return !ids.includes(pa._id.toString()) })
    return await payroll.save()
  }

  /**
   * add award to payroll
   * @param {*} ownerId
   * @param {*} profileId
   * @param {*} target
   * @param {*} quantity
   * @param {*} end
   * @param {*} value
   * @param {*} id payroll id
   * @returns payroll
   */
  async addAward (ownerId, profileId, target, quantity, end, value, id) {
    const [business, profile] = await Promise.all([this.profile.findOne({ _id: ownerId, typeCode: { $in: GYM } }, '_id').lean().exec(), this.profile.findOne({ _id: profileId, typeCode: { $in: nonBusiness } }, '_id').lean().exec()])
    if (!business) throw new Error('Business Id information not valid or details are not available')
    if (!profile) throw new Error('Profile Id information not valid or details are not available')

    const payroll = await this.Payroll.findOne({ ownerId, profileId }).exec()
    if (!payroll) {
      const newPayroll = {
        ownerId,
        profileId,
        awards: [
          {
            target,
            quantity,
            end,
            value
          }
        ]
      }
      return this.Payroll.create(newPayroll)
    } else {
      if (!payroll.awards) payroll.awards = []
      const position = (id ? payroll.awards.findIndex((pa) => { return pa._id.toString() === id }) : -1)
      if (position > -1) {
        payroll.awards[position].target = target
        payroll.awards[position].quantity = quantity
        payroll.awards[position].end = end
        payroll.awards[position].value = value
      } else {
        payroll.awards.push({
          target,
          quantity,
          end,
          value
        })
      }
      return await payroll.save()
    }
  }

  /**
   * add update bulk awards
   * @param {*} ownerId
   * @param {*} profileId
   * @param {Object} awards
   * @returns payroll
   */
  async bulkAddUpdateAwards (ownerId, profileId, awards) {
    if (!awards || !awards.length) return null
    const payroll = await this.Payroll.findOne({ ownerId, profileId }).exec()
    if (!payroll) {
      const newPayroll = {
        ownerId,
        profileId,
        awards: awards.map((award) => { delete award.id; return award })
      }
      return this.Payroll.create(newPayroll)
    } else {
      if (!payroll.awards) payroll.awards = []
      for (const award of awards) {
        const position = (award.id ? payroll.awards.findIndex((pa) => { return pa._id.toString() === award.id }) : -1)
        if (position > -1) {
          payroll.awards[position].target = award.target
          payroll.awards[position].quantity = award.quantity
          payroll.awards[position].end = award.end
          payroll.awards[position].value = award.value
        } else {
          payroll.awards.push({
            target: award.target,
            quantity: award.quantity,
            end: award.end,
            value: award.value
          })
        }
      }

      return await payroll.save()
    }
  }

  /**
   * delete award
   * @param {*} ownerId
   * @param {*} profileId
   * @param {*} id award id
   * @returns payroll
   */
  async removeAward (ownerId, profileId, id) {
    const [business, profile] = await Promise.all([this.profile.findOne({ _id: ownerId, typeCode: { $in: GYM } }, '_id').lean().exec(), this.profile.findOne({ _id: profileId, typeCode: { $in: nonBusiness } }, '_id').lean().exec()])
    if (!business) throw new Error('Business Id information not valid or details are not available')
    if (!profile) throw new Error('Profile Id information not valid or details are not available')
    const payroll = await this.Payroll.findOne({ ownerId, profileId }).exec()
    if (!payroll) throw new Error('Details not available')
    if (payroll.awards.findIndex((pa) => { return pa._id.toString() === id }) > -1) {
      payroll.awards = payroll.awards.filter((pa) => { return pa._id.toString() !== id })
      return await payroll.save()
    } else {
      throw new Error('Award details not found')
    }
  }

  /**
   * bulk delete awards
   * @param {*} ownerId
   * @param {*} profileId
   * @param {*} ids award ids
   * @returns payroll
   */
  async bulkRemoveAwards (ownerId, profileId, ids) {
    if (!ids || !ids.length) return null
    const payroll = await this.Payroll.findOne({ ownerId, profileId }).exec()
    if (!payroll) throw new Error('Details not available')
    payroll.awards = payroll.awards.filter((pa) => { return !ids.includes(pa._id.toString()) })
    return await payroll.save()
  }
}

module.exports = PayrollController
