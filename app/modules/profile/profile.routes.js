const { ctr, redisJson, token, log } = require('@cowellness/cw-micro-service')()
const routeSchema = require('./profile.schema')
const config = require('config')
const { gender, status } = require('./profile.enum')
const EmailValidator = require('email-deep-validator')
const emailValidator = new EmailValidator({ verifyMailbox: false })
const tokenRules = {
  domain: '*',
  path: '/',
  secure: config.options.isSecure,
  httpOnly: true,
  sameSite: config.options.sameSite,
  expires: new Date()
}

async function validateEmail (emailId) {
  const { wellFormed, validDomain } = await emailValidator.verify(emailId)
  if (!wellFormed || !validDomain) {
    return false
  } else {
    return true
  }
}

async function generateTokenNSend (reply, user, hostname, impersonatorId) {
  const cwtoken = await reply.jwtSign({
    _id: user._id.toString()
  }, { expiresIn: config.options.duration })
  // tokenRules.domain = '.' + hostname
  if (tokenRules.domain) delete tokenRules.domain
  user.password = undefined
  const currentDate = new Date()
  const permission = await ctr.permission.getByKeysWithOverride(user.typeCode, user._id.toString())
  tokenRules.expires = new Date(currentDate.setDate(currentDate.getDate() + config.options.cookieExpire))
  await redisJson.set(cwtoken, { _id: user._id.toString(), type: 'profile', fName: user.person.firstname, lName: user.person.lastname, profileId: user._id.toString(), managerId: undefined, isBusiness: user.isBusiness, typeCode: user.typeCode, permission, impersonatorId }, { expire: config.options.durationInSec })
  return reply.setCookie('cwtoken', cwtoken, tokenRules).code(200).cwsendSuccess({ data: user, auth: { cwtoken: cwtoken, duration: config.options.duration }, permission })
}

module.exports = async function (fastify, opts, done) {
  routeSchema.logout.preValidation = [fastify.cwauth]
  routeSchema.detail.preValidation = [fastify.cwauth]
  routeSchema.pinValidation.preValidation = [fastify.cwauth]
  routeSchema.tinValidation.preValidation = [fastify.cwauth]
  routeSchema.currentProfile.preValidation = [fastify.cwauth]
  routeSchema.exportCSV.preValidation = [fastify.cwauth]
  routeSchema.importCSV.preValidation = [fastify.cwauth]

  async function validationIds (id, countryCode, key, reply) {
    try {
      const items = await ctr.profile.validateIds(id, countryCode, key)
      if (items && items.hits && items.hits.hits && items.hits.hits.length) {
        reply.cwsendSuccess({ data: false, message: key + ' id exist' })
      } else {
        reply.cwsendSuccess({ data: true, message: key + ' id does not exist' })
      }
    } catch {
      reply.cwsendSuccess({ data: true, message: key + ' id does not exist' })
    }
  }

  fastify.get('/validate/email/:emailId', routeSchema.emailValidation, async function (request, reply) {
    const validEmail = await validateEmail(request.params.emailId)

    if (!validEmail) return reply.cwsendFail({ message: 'Invalid Email Id', _message: 'Invalid Email Id' })
    try {
      const user = await ctr.profile.emailExist(request.params.emailId.toLowerCase())
      if (user && user.hits && user.hits.hits && user.hits.hits.length) {
        reply.cwsendSuccess({ data: false, message: 'email id exist' })
      } else {
        reply.cwsendSuccess({ message: 'email id does not exist', data: true })
      }
    } catch {
      reply.cwsendSuccess({ message: 'email id does not exist', data: true })
    }
  })

  fastify.get('/validate/email/:emailId/:profileId', routeSchema.emailValidationAndRelation, async function (request, reply) {
    const validEmail = await validateEmail(request.params.emailId)
    const profileId = request.params.profileId
    if (!validEmail) return reply.cwsendFail({ message: 'Invalid Email Id', _message: 'Invalid Email Id' })
    const data = {
      exists: false,
      relation: false
    }
    try {
      const user = await ctr.profile.emailExist(request.params.emailId.toLowerCase())
      const emailExists = user && user.hits && user.hits.hits && user.hits.hits.length

      if (emailExists) {
        data.exists = true
        if (profileId) {
          const profile = user.hits.hits[0]
          const relation = await ctr.relation.verifyUserRelation(profile._id, profileId)

          if (relation) {
            data.relation = true
          }
        }
      }
      reply.cwsendSuccess({ data })
    } catch {
      reply.cwsendSuccess({ data })
    }
  })

  fastify.get('/validate/pin/:countryCode/:id', routeSchema.pinValidation, async function (request, reply) {
    await validationIds(request.params.id, request.params.countryCode, 'pin', reply)
  })

  fastify.get('/validate/tin/:countryCode/:id', routeSchema.tinValidation, async function (request, reply) {
    await validationIds(request.params.id, request.params.countryCode, 'tin', reply)
  })

  fastify.post('/validate/mobile', routeSchema.mobileValidation, async function (request, reply) {
    const body = request.body
    try {
      const user = await ctr.profile.mobileNoExist(body.countryCode, body.prefixNumber, body.phoneNumber)
      if (user && user.hits && user.hits.hits && user.hits.hits.length) {
        reply.cwsendSuccess({ data: false, message: 'Mobile no exist' })
      } else {
        reply.cwsendSuccess({ message: 'Mobile no does not exist', data: true })
      }
    } catch (e) {
      console.log(e)
      reply.cwsendSuccess({ message: 'Mobile no does not exist', data: true })
    }
  })

  fastify.post('/validate/mobile/:profileId', routeSchema.mobileValidationAndRelation, async function (request, reply) {
    const body = request.body
    const profileId = request.params.profileId
    const data = {
      exists: false,
      relation: false
    }

    try {
      const user = await ctr.profile.mobileNoExist(body.countryCode, body.prefixNumber, body.phoneNumber)
      const mobileExists = user && user.hits && user.hits.hits && user.hits.hits.length

      if (mobileExists) {
        data.exists = true
        if (profileId) {
          const profile = user.hits.hits[0]
          const relation = await ctr.relation.verifyUserRelation(profile._id, profileId)

          if (relation) {
            data.relation = true
          }
        }
      }
      reply.cwsendSuccess({ data })
    } catch {
      reply.cwsendSuccess({ data })
    }
  })

  fastify.get('/list/gender', routeSchema.genderList, async function (request, reply) {
    return reply.cwsendSuccess({ data: gender })
  })

  fastify.get('/list/status', routeSchema.statusList, async function (request, reply) {
    return reply.cwsendSuccess({ data: status })
  })

  fastify.get('/detail', routeSchema.detail, async function (request, reply) {
    const userDetail = await ctr.profile.findById(request.cwauth.profileId)
    return reply.cwsendSuccess({ data: userDetail })
  })

  fastify.get('/currentProfile', routeSchema.currentProfile, async function (request, reply) {
    const userDetail = await ctr.profile.findById(request.cwauth.profileId)
    let managerDetail
    if (request.cwauth.managerId) {
      managerDetail = await ctr.profile.findById(request.cwauth.managerId)
    }
    return reply.cwsendSuccess({ data: { profile: userDetail, manager: managerDetail } })
  })

  fastify.post('/auto-login/token', routeSchema.tokenLogin, async function (request, reply) {
    const body = request.body
    try {
      const t = await token.getById(body.cwtoken)
      if (t && t.data && t.data.data && t.data.data.autoLogin) {
        const user = await ctr.profile.findById(t.data.data.id)
        if (user) {
          await generateTokenNSend(reply, user, request.hostname, t.data.data.impersonator)
        } else {
          return reply.cwsendFail({
            message: 'Not a valid user from token',
            _message: 'Not a valid user from token'
          })
        }
      } else {
        return reply.cwsendFail({
          message: 'Invalid token and user info',
          _message: 'Invalid token and user info'
        })
      }
    } catch (e) {
      log.error(e)
      return reply.cwsendFail({
        message: 'Invalid token and user info',
        _message: e.message
      })
    }
  })

  fastify.post('/password-reset/verify', routeSchema.passwordResetVerify, async function (request, reply) {
    const userId = request.body.userId
    const code = request.body.code
    const authCode = await ctr.profile.getAuthPin(userId)

    if (authCode === code) {
      const t = await token.save({ id: userId }, config.options.resetDurationInSec)
      return reply.cwsendSuccess({
        data: {
          token: t.data
        }
      })
    }
    return reply.cwsendFail({
      message: 'Invalid code and user id',
      _message: 'Invalid code and user id'
    })
  })

  fastify.post('/password-reset/update', routeSchema.passwordUpdate, async function (request, reply) {
    const body = request.body
    try {
      const t = await token.getById(body.cwtoken)
      if (t && t.data) {
        const user = await ctr.profile.findById(t.data.data.id)
        if (user) {
          await ctr.profile.saveUpdatePassword(user, body, request.hostname)
          await generateTokenNSend(reply, user, request.hostname)
        }
      } else {
        return reply.cwsendFail({
          message: 'Invalid token and user info',
          _message: 'Invalid token and user info'
        })
      }
    } catch (e) {
      log.error(e)
      return reply.cwsendFail({
        message: 'Invalid token and user info',
        _message: e.message
      })
    }
  })

  fastify.post('/password-reset/email', routeSchema.passwordResetEmail, async function (request, reply) {
    const body = request.body
    try {
      if (!validateEmail(body.username)) {
        return reply.cwsendFail({
          message: 'No Email Id available',
          _message: 'No Email Id available'
        })
      }
      const user = await ctr.profile.findByEmailIdWithoutPassword(body.username)
      if (user) {
        if (user.person.emails.length < 1) {
          return reply.cwsendFail({
            message: 'No Email Id available',
            _message: 'No Email Id available'
          })
        } else {
          return reply.cwsendSuccess({
            data: await ctr.profile.emailReset(user, body, request.hostname)
          })
        }
      } else {
        return reply.cwsendFail({
          message: 'user not found',
          _message: 'user not found'
        })
      }
    } catch (e) {
      log.error(e)
      return reply.cwsendFail({
        message: 'server error',
        _message: e.message
      })
    }
  })

  fastify.post('/password-reset/pin', routeSchema.passwordResetPin, async function (request, reply) {
    const body = request.body
    try {
      const resp = await ctr.profile.resetPasswordWithPin(body.pin, request.hostname)
      return reply.cwsendSuccess({
        data: resp
      })
    } catch (e) {
      return reply.cwsendFail({
        message: 'pin not found',
        _message: e.message
      })
    }
  })
  fastify.post('/password-reset/mobileNo', routeSchema.passwordResetMobile, async function (request, reply) {
    const body = request.body
    try {
      const user = await ctr.profile.findByMobileNo(body.prefixNumber, body.phoneNumber, body.countryCode)
      if (user) {
        const resp = await ctr.profile.mobileReset(user, body, request.hostname)
        reply.cwsendSuccess({
          message: 'SMS send sucessfully',
          data: resp
        })
      } else {
        return reply.cwsendFail({
          message: 'user not found',
          _message: 'user not found'
        })
      }
    } catch (e) {
      log.error(e)
      return reply.cwsendFail({
        message: 'server error',
        _message: e.message
      })
    }
  })

  fastify.post('/login', routeSchema.userLogin, async function (request, reply) {
    const body = request.body
    try {
      const resp = await ctr.profile.login(body.userName.toLowerCase(), body.password, body.language)
      if (resp) {
        await generateTokenNSend(reply, resp, request.hostname)
      } else {
        return reply.cwsendFail({
          message: 'Invalid user name or password',
          _message: 'Invalid user name or password'
        })
      }
    } catch (e) {
      return reply.cwsendFail({
        message: 'Server Error',
        _message: e.message
      })
    }
  })

  fastify.post('/logout', routeSchema.logout, async function (request, reply) {
    await redisJson.del(request.tokenKey)
    reply.clearCookie('cwtoken', { path: '/' }).code(200).cwsendSuccess({ data: true })
  })

  fastify.post('/signup', routeSchema.register, async function (request, reply) {
    const body = request.body
    let emailValid = false
    let mobileValid = false
    if (body.person.emails && body.person.emails.length > 0) {
      emailValid = true
    }
    if (body.person.mobilePhones && body.person.mobilePhones.length > 0) {
      mobileValid = true
    }
    if (!emailValid && !mobileValid) {
      return reply.cwsendFail({
        message: 'Email and mobilePhone no both cant be blank',
        _message: 'Email and mobilePhone no both cant be blank'
      })
    }
    try {
      body.typeCode = 'IN'
      if (body.person.emails) {
        body.person.emails.forEach((e) => {
          e.email = String(e.email).toLowerCase()
        })
        if (body.person.emails.filter(async (e) => {
          return await validateEmail(e.mail)
        }).length < body.person.emails.length) {
          return reply.cwsendFail({
            message: 'All email id should be valid',
            _message: 'All email id should be valid'
          })
        }
      }
      const newUser = await ctr.profile.create(body, request.hostname)
      if (body.documents && body.documents.length) await ctr.profile.createRelationAndAcceptDocument(newUser._id.toString(), body.documents, body.invitedBy, body.countryCode, request.headers['x-forwarded-for'] || 'IP NOT FOUND')
      await generateTokenNSend(reply, newUser, request.hostname)
    } catch (e) {
      return reply.cwsendFail({
        message: e.message,
        _message: e.message
      })
    }
  })

  fastify.get('/export', routeSchema.exportCSV, async function (request, reply) {
    const csv = await ctr.profile.exportProfiles(request.cwauth.profileId)

    return reply.cwsendSuccess({
      data: {
        content: csv
      }
    })
  })

  fastify.post('/import', routeSchema.importCSV, async function (request, reply) {
    const content = request.body.content
    const report = await ctr.profile.importProfiles(request.cwauth.profileId, content)

    return reply.cwsendSuccess({
      data: {
        report
      }
    })
  })

  fastify.post('/token', routeSchema.token, async function (request, reply) {
    const cwtoken = request.body.cwtoken
    const tokenData = await redisJson.get(cwtoken)
    if (tokenRules.domain) delete tokenRules.domain
    const currentDate = new Date()
    tokenRules.expires = new Date(currentDate.setDate(currentDate.getDate() + config.options.cookieExpire))

    if (tokenData) {
      await redisJson.set(cwtoken, tokenData, { expire: config.options.durationInSec })
      return reply.setCookie('cwtoken', cwtoken, tokenRules)
        .code(200)
        .cwsendSuccess({
          auth: {
            cwtoken: cwtoken,
            duration: config.options.duration
          }
        })
    }
    return reply.cwsendFail({
      message: 'Invalid token',
      _message: 'Invalid token'
    })
  })

  fastify.post('/emancipation-age', routeSchema.emancipationAge, async function (request, reply) {
    const countryCode = request.body.countryCode
    const invitedBy = request.body.invitedBy
    const emancipationAge = await ctr.profile.getEmancipationAge(countryCode, invitedBy)

    return reply.cwsendSuccess({
      data: {
        emancipationAge
      }
    })
  })

  fastify.post('/signDocuments', routeSchema.emancipationAge, async function (request, reply) {
    const countryCode = request.body.countryCode
    const invitedBy = request.body.invitedBy
    const documents = await ctr.profile.getDocumentToSignIn(countryCode, invitedBy)

    return reply.cwsendSuccess({
      data: documents
    })
  })
  done()
}
