const config = require('config')
const cw = require('@cowellness/cw-micro-service')(config)
const { gender, status } = require('./profile.enum')

beforeAll(async () => {
  // await cw.mongodb.profile.model('Profile').deleteMany()
  await cw.autoStart()
})

describe('Test auth/profile services', () => {
  it('should load controller', async () => {
    expect(cw.ctr.profile).toBeDefined()
  })
  it('should validate email id', async () => {
    const res = await cw.fastify.inject({ method: 'GET', url: '/api/auth/profile/validate/email/abc' })
    const responseData = res.json()
    expect(res.statusCode).toEqual(200)
    expect(responseData.message).toBe('Invalid Email Id')
  })
  it('should verify email id', async () => {
    const res = await cw.fastify.inject({ method: 'GET', url: '/api/auth/profile/validate/email/shettyashwin@outlook.com' })
    const responseData = res.json()
    expect(res.statusCode).toEqual(200)
    expect(responseData.data).toBe(true)
  })
  it('should validate mobile no', async () => {
    const res = await cw.fastify.inject({ method: 'POST', url: '/api/auth/profile/validate/mobile', body: {} })
    expect(res.statusCode).toEqual(400)
  })
  it('should validate mobile no', async () => {
    const res = await cw.fastify.inject({ method: 'POST', url: '/api/auth/profile/validate/mobile', body: { countryCode: '00', prefixNumber: '12', phoneNumber: '987654321' } })
    const responseData = res.json()
    expect(res.statusCode).toEqual(200)
    expect(responseData.data).toBe(true)
  })
  it('should verify email id', async () => {
    const res = await cw.fastify.inject({ method: 'GET', url: '/api/auth/profile/validate/email/shettyashwin@outlook.com' })
    const responseData = res.json()
    expect(res.statusCode).toEqual(200)
    expect(responseData.data).toBe(true)
  })
  it('should get list of status', async () => {
    const res = await cw.fastify.inject({ method: 'GET', url: '/api/auth/profile/list/status' })
    const responseData = res.json()
    expect(res.statusCode).toEqual(200)
    expect(responseData.data).toStrictEqual(status)
  })
  it('should get list of gender', async () => {
    const res = await cw.fastify.inject({ method: 'GET', url: '/api/auth/profile/list/gender' })
    const responseData = res.json()
    expect(res.statusCode).toEqual(200)
    expect(responseData.data).toStrictEqual(gender)
  })

  it('should validate sign up request', async () => {
    const res = await cw.fastify.inject({ method: 'POST', url: '/api/auth/profile/signup', body: {} })
    expect(res.statusCode).toEqual(400)
  })
})
