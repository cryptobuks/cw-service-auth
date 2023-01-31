const { ctr } = require('@cowellness/cw-micro-service')()
const routeSchema = require('./company.schema')

module.exports = async function (fastify, opts, done) {
  routeSchema.vatValidation.preValidation = [fastify.cwauth]
  routeSchema.fiscalValidation.preValidation = [fastify.cwauth]
  routeSchema.searchCompanyByName.preValidation = [fastify.cwauth]
  routeSchema.getCompanyDetail.preValidation = [fastify.cwauth]
  routeSchema.manageCountries.preValidation = [fastify.cwauth]
  routeSchema.uploadFile.preValidation = [fastify.cwauth]
  routeSchema.bankDelete.preValidation = [fastify.cwauth]
  routeSchema.bankEdit.preValidation = [fastify.cwauth]
  routeSchema.bankAdd.preValidation = [fastify.cwauth]
  routeSchema.getBank.preValidation = [fastify.cwauth]
  routeSchema.vatGetDetail.preValidation = [fastify.cwauth]
  routeSchema.fiscalGetDetail.preValidation = [fastify.cwauth]
  routeSchema.vatSearch.preValidation = [fastify.cwauth]
  routeSchema.userGetDetailByPin.preValidation = [fastify.cwauth]
  routeSchema.userGetDetailByEmail.preValidation = [fastify.cwauth]
  routeSchema.userGetDetailByMobile.preValidation = [fastify.cwauth]
  routeSchema.uploadUserFile.preValidation = [fastify.cwauth]

  async function validationIds (id, key, reply) {
    try {
      const items = await ctr.profile.validateIds(id, key)
      if (items && items.hits && items.hits.hits && items.hits.hits.length) {
        reply.cwsendSuccess({ data: false, message: key + ' id exist' })
      } else {
        reply.cwsendSuccess({ data: true, message: key + ' id does not exist' })
      }
    } catch {
      reply.cwsendSuccess({ data: true, message: key + ' id does not exist' })
    }
  }

  fastify.get('/validate/vat/:id', routeSchema.vatValidation, async function (request, reply) {
    await validationIds(request.params.id, 'vat', reply)
  })

  fastify.get('/validate/fiscal/:id', routeSchema.fiscalValidation, async function (request, reply) {
    await validationIds(request.params.id, 'fiscal', reply)
  })

  fastify.get('/search/vat/:id', routeSchema.vatSearch, async function (request, reply) {
    try {
      const item = await ctr.company.searchVat(request.params.id)
      reply.cwsendSuccess({ data: item })
    } catch (e) {
      reply.cwsendSuccess({ data: e, message: e.message })
    }
  })

  fastify.get('/getDetail/vat/:id', routeSchema.vatGetDetail, async function (request, reply) {
    try {
      const item = await ctr.company.getCompanyByVatId(request.params.id)
      reply.cwsendSuccess({ data: item })
    } catch (e) {
      reply.cwsendSuccess({ data: e, message: e.message })
    }
  })

  fastify.get('/getDetail/fiscal/:id', routeSchema.fiscalGetDetail, async function (request, reply) {
    try {
      const item = await ctr.company.getCompanyByFiscalId(request.params.id)
      reply.cwsendSuccess({ data: item })
    } catch (e) {
      reply.cwsendSuccess({ data: e, message: e.message })
    }
  })

  fastify.get('/getDetail/user/email/:id', routeSchema.userGetDetailByEmail, async function (request, reply) {
    try {
      const item = await ctr.company.findByEmailIdWithoutPassword(request.params.id)
      reply.cwsendSuccess({ data: item })
    } catch (e) {
      reply.cwsendSuccess({ data: e, message: e.message })
    }
  })

  fastify.get('/getDetail/user/phone/:countryCode/:prefix/:phoneNo', routeSchema.userGetDetailByMobile, async function (request, reply) {
    try {
      const item = await ctr.company.findByMobileNo(request.params.prefix, request.params.phoneNo, request.params.countryCode)
      reply.cwsendSuccess({ data: item })
    } catch (e) {
      reply.cwsendSuccess({ data: e, message: e.message })
    }
  })

  fastify.get('/getDetail/user/pin/:id', routeSchema.userGetDetailByPin, async function (request, reply) {
    try {
      const item = await ctr.company.getUserByPin(request.params.id)
      if (item) item.password = undefined
      reply.cwsendSuccess({ data: item })
    } catch (e) {
      reply.cwsendSuccess({ data: e, message: e.message })
    }
  })

  fastify.get('/search/:company', routeSchema.searchCompanyByName, async function (request, reply) {
    if (request.params.company.length < 3) {
      reply.cwsendFail({
        message: 'text should be more than 3 character'
      })
      return
    }
    try {
      const list = await ctr.company.searchCompany(request.params.company)
      reply.cwsendSuccess({
        data: list
      })
    } catch {
      reply.cwsendFail({
        data: []
      })
    }
  })

  fastify.get('/managed/countries', routeSchema.manageCountries, async function (request, reply) {
    const countries = await ctr.company.validCountries()
    reply.cwsendSuccess({
      data: countries
    })
  })

  fastify.get('/getDetail/:companyId', routeSchema.getCompanyDetail, async function (request, reply) {
    try {
      const company = await ctr.company.findById(request.params.companyId)
      reply.cwsendSuccess({
        data: company
      })
    } catch {
      reply.cwsendFail({
        data: undefined
      })
    }
  })

  fastify.post('/upload/profile/:id', routeSchema.uploadUserFile, async function (request, reply) {
    const body = request.body
    const user = request.cwauth
    const file = await ctr.company.uploadUserProfile(body, request.params.id, request.hostname, user._id)
    reply.cwsendSuccess({
      data: file
    })
  })

  fastify.post('/upload/profile', routeSchema.uploadFile, async function (request, reply) {
    const body = request.body
    const user = request.cwauth
    const file = await ctr.company.profileUpload(body, user._id, request.hostname)
    reply.cwsendSuccess({
      data: file
    })
  })

  fastify.get('/bank', routeSchema.getBank, async function (request, reply) {
    const user = request.cwauth
    const banks = await ctr.company.getBanksByUserId(user._id)
    reply.cwsendSuccess({
      data: banks
    })
  })

  fastify.put('/bank/:id', routeSchema.bankEdit, async function (request, reply) {
    const body = request.body
    const user = request.cwauth
    try {
      const bankDetail = await ctr.company.updateBankDetails(body, request.params.id, user._id)
      reply.cwsendSuccess({
        data: bankDetail
      })
    } catch (e) {
      reply.cwsendFail({
        message: 'Error while processing details',
        _message: e.message
      })
    }
  })

  fastify.delete('/bank/:id', routeSchema.bankDelete, async function (request, reply) {
    const user = request.cwauth
    try {
      const bankDetail = await ctr.company.deleteBankDetails(request.params.id, user._id)
      reply.cwsendSuccess({
        data: bankDetail
      })
    } catch (e) {
      reply.cwsendFail({
        message: 'Error while processing details',
        _message: e.message
      })
    }
  })

  fastify.post('/bank', routeSchema.bankAdd, async function (request, reply) {
    const body = request.body
    const user = request.cwauth
    try {
      const bankDetail = await ctr.company.addBankDetails(body, user._id)
      reply.cwsendSuccess({
        data: bankDetail
      })
    } catch (e) {
      reply.cwsendFail({
        message: 'Error while processing details',
        _message: e.message
      })
    }
  })
}
