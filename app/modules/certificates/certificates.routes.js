const { ctr } = require('@cowellness/cw-micro-service')()

module.exports = async function (fastify, opts, done) {
  fastify.get('/', function (request, reply) {
    ctr.certificates.find().then((list) => {
      reply.send({ result: 'ok', list })
    })
  })
}
