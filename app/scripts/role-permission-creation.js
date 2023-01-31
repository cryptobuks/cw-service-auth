process.env.NODE_ENV = 'production'
const config = require('config')
config.fastify.port = 0

const fs = require('fs')
const path = require('path')
const yaml = require('js-yaml')

const cw = require('@cowellness/cw-micro-service')(config)

// function trueSwitch (obj, src) {
//   if (!obj && src) return src
//   if (obj && !src) return obj
//   if (typeof obj === 'boolean') return obj || src
//   return cw._.mergeWith(obj, src, trueSwitch)
// }

cw.autoStart().then(async () => {
  try {
    console.log('Started permission creation')
    const folderPath = path.join(config.basepath, 'rules', 'group')
    let masterDoc = {}
    const files = fs.readdirSync(folderPath)
    for (const file of files) {
      const filePath = path.join(folderPath, file)
      const groupJson = yaml.load(fs.readFileSync(filePath, 'utf8'))
      let jsonDoc = {}
      if (groupJson && groupJson.steps && groupJson.steps.files && groupJson.steps.files.length) {
        groupJson.steps.files.forEach((fil) => {
          const filePath = path.join(config.basepath, 'rules', fil)
          const doc = yaml.load(fs.readFileSync(filePath, 'utf8'))
          // jsonDoc = cw._.mergeWith(jsonDoc, doc, trueSwitch)
          jsonDoc = cw._.mergeWith(jsonDoc, doc)
          masterDoc = cw._.mergeWith(masterDoc, doc)
        })
        await cw.ctr.permission.addOrUpdate(groupJson.steps.name, jsonDoc)
      }
    }
    console.log('Final doc')
    console.log(masterDoc)
    console.log('Ended permission creation')
  } catch (error) {
    console.log(error)
  }
})
