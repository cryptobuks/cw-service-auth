process.env.NODE_ENV = 'production'
const config = require('config')
config.fastify.port = 0

const cw = require('@cowellness/cw-micro-service')(config)
cw.autoStart().then(async () => {
  try {
    const items = await cw.ctr.relation.find()
    await Promise.all(items.map(item => item.save()))
  } catch (error) {
    console.log(error)
  }
})
