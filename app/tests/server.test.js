const cw = require('@cowellness/cw-micro-service')(require('config'))

beforeAll(() => {
  return cw.startFastify()
})

afterAll(() => {
  return cw.stopFastify()
})

describe('Test app working - 404 and headers', () => {
  it('route not found', async () => {
    const res = await cw.fastify.inject({ method: 'GET', url: 'nosite' })
    expect(res.statusCode).toEqual(404)
    expect(res.headers['x-powered-by']).toEqual('co-welness.com')
    expect(res.headers['api-version']).not.toEqual(undefined)
  })
})
