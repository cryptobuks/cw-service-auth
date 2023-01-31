test('two plus two is four', () => {
  expect(2 + 2).toBe(4)
})

// const config = require('config')
// const cw = require('@cowellness/cw-micro-service')(config)
// let authToken

// beforeAll(async () => {
//   //await cw.mongodb.profile.model('Profile').deleteMany()
//   let userName = 'tester@gmail.com'
//   let password = 'YWRtaW5AMTIz'
//   await cw.autoStart()
//   await cw.mongodb.profile.model('Profile').remove({})
//   let resp = await  cw.fastify.inject({ method: 'POST', url: '/api/auth/profile/signup', body: { person : { firstname : 'testing', lastname : 'tester', emails : [{ email : userName }], gender : 'male', birth : {date : 20200325}}, settings : {language : 'en'}, password : password } })
//   const responseData = resp.json()
//   authToken = responseData.auth.cwtoken
//   })

// describe('Test auth/company services', () => {
//   it('should load controller', async () => {
//     expect(cw.ctr.profile).toBeDefined()
//     expect(authToken).toBeDefined()
//   })
//   it('should validate vat id', async () => {
//     const res = await cw.fastify.inject({ method: 'GET', url: '/api/auth/company/validate/vat/abc' })
//     const responseData = res.json()
//     expect(res.statusCode).toEqual(200)
//     expect(responseData.message).toBe('vat id does not exist')
//   })
//   it('should validate fiscal id', async () => {
//     const res = await cw.fastify.inject({ method: 'GET', url: '/api/auth/company/validate/fiscal/abc' })
//     const responseData = res.json()
//     expect(res.statusCode).toEqual(200)
//     expect(responseData.message).toBe('fiscal id does not exist')
//   })
//   it('should validate company search', async () => {
//     const res = await cw.fastify.inject({ method: 'GET', url: '/api/auth/company/search/ab' })
//     const responseData = res.json()
//     expect(res.statusCode).toEqual(200)
//     expect(responseData.message).toBe('text should be more than 3 character')
//   })
// })
