const path = require('path')
const basepath = path.join(__dirname, '..', 'app')

module.exports = {
  service: 'auth',
  fastify: { active: false, port: 3011, prefix: '/api/auth', auth: true, sessionSecret: 'cw-micro-service-fastify-session-secret' },
  rabbitmq: { active: true, server: 'localhost:15672', user: 'dev', password: 'dev123' },
  redis: { active: true, server: 'localhost', port: 16379 },
  swagger: { active: true, exposeRoute: true },
  elasticSearch: { active: true, server: 'localhost:9201', timeout: 0, version: '7.6' },
  logger: { level: 'debug' },
  options: {
    duration: '30d',
    resetDuration: '1d',
    resetDurationInSec: 86400,
    durationInSec: 2592000,
    passwordUpateTokenInSec: 604800,
    cookieExpire: 180,
    isSecure: true,
    sameSite: 'lax'
  },
  basepath,
  mongodb: {
    active: true,
    server: 'localhost',
    port: '37018',
    user: '',
    password: '',
    debug: true,
    databases: [
      {
        name: 'auth',
        db: 'auth',
        options: {}
      }
    ]
  }
}
