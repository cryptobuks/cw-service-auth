const { _, es, envPrefix } = require('@cowellness/cw-micro-service')()
const cloneDeep = _.cloneDeep

function serialize (model, mapping) {
  let name

  function _serializeObject (object, mappingData) {
    const serialized = {}
    let field
    let val
    for (field in mappingData.properties) {
      if (Object.prototype.hasOwnProperty.call(mappingData.properties, field)) {
        val = serialize.call(object, object[field], mappingData.properties[field])
        if (val !== undefined) {
          serialized[field] = val
        }
      }
    }
    return serialized
  }

  if (mapping.properties && model) {
    if (Array.isArray(model)) {
      return model.map(object => _serializeObject(object, mapping))
    }

    return _serializeObject(model, mapping)
  }

  if (mapping.cast && typeof mapping.cast !== 'function') {
    throw new Error('es_cast must be a function')
  }

  const outModel = mapping.cast ? mapping.cast.call(this, model) : model
  if (typeof outModel === 'object' && outModel !== null) {
    name = outModel.constructor.name
    if (name === 'ObjectID') {
      return outModel.toString()
    }

    if (name === 'Date') {
      return new Date(outModel).toJSON()
    }
  }

  return outModel
}

//
// Get type from the mongoose schema
//
// Returns the type, so in case none is set, it's the mongoose type.
//
// @param paths
// @param field
// @return the type or false
//
function getTypeFromPaths (paths, field) {
  let type = false

  if (paths[field] && paths[field].options.type === Date) {
    return 'date'
  }

  if (paths[field] && paths[field].options.type === Boolean) {
    return 'boolean'
  }

  if (paths[field]) {
    type = paths[field].instance ? paths[field].instance.toLowerCase() : 'object'
  }

  return type
}

//
// Generates the mapping
//
// Can be called recursively.
//
// @param cleanTree
// @param inPrefix
// @return the mapping
//
function getMapping (cleanTree, inPrefix) {
  const mapping = {}
  let value = []
  let field = []
  let prop = []
  const implicitFields = []
  let hasEsIndex = false
  const prefix = inPrefix !== '' ? `${inPrefix}.` : inPrefix

  for (field in cleanTree) {
    if (!Object.prototype.hasOwnProperty.call(cleanTree, field)) {
      continue
    }
    value = cleanTree[field]
    mapping[field] = {}
    mapping[field].type = value.type

    // Check if field was explicity indexed, if not keep track implicitly
    if (value.es_indexed) {
      hasEsIndex = true
    } else if (value.type) {
      implicitFields.push(field)
    }

    // If there is no type, then it's an object with subfields.
    if (typeof value === 'object' && !value.type) {
      mapping[field].type = 'object'
      mapping[field].properties = getMapping(value, prefix + field)
    }

    // If it is a objectid make it a string.
    if (value.type === 'objectid') {
      if (value.ref && value.es_schema) {
        mapping[field].type = 'object'
        mapping[field].properties = getMapping(value, prefix + field)
        continue
      }
      // do not continue here so we can handle other es_ options
      mapping[field].type = 'string'
    }

    // If indexing a number, and no es_type specified, default to long
    if (value.type === 'number' && value.es_type === undefined) {
      mapping[field].type = 'long'
      continue
    }

    // Else, it has a type and we want to map that!
    for (prop in value) {
      // Map to field if it's an Elasticsearch option
      if (Object.prototype.hasOwnProperty.call(value, prop) && prop.indexOf('es_') === 0 && prop !== 'es_indexed') {
        mapping[field][prop.replace(/^es_/, '')] = value[prop]
      }
    }

    // if type is never mapped, delete mapping
    if (mapping[field].type === undefined) {
      delete mapping[field]
    }

    // Set default string type
    if (mapping[field] && mapping[field].type === 'string') {
      const textType = {
        type: 'text',
        fields: {
          keyword: {
            type: 'keyword',
            ignore_above: 256
          }
        }
      }
      mapping[field] = Object.assign(mapping[field], textType)
    }
  }

  // If one of the fields was explicitly indexed, delete all implicit fields
  if (hasEsIndex) {
    implicitFields.forEach(implicitField => {
      delete mapping[implicitField]
    })
  }

  return mapping
}

//
// Generates a clean tree
//
// Can be called recursively.
//
// @param tree
// @param paths
// @param prefix
// @return the tree
//
function getCleanTree (tree, paths, inPrefix, isRoot) {
  const cleanTree = {}
  let type = ''
  let value = {}
  let field
  let prop
  let treeNode
  let subTree
  let key
  let geoFound = false
  const prefix = inPrefix !== '' ? `${inPrefix}.` : inPrefix

  tree = cloneDeep(tree)
  paths = cloneDeep(paths)

  for (field in tree) {
    if (prefix === '' && field === '_id' && isRoot) {
      continue
    }

    type = getTypeFromPaths(paths, prefix + field)
    value = tree[field]

    if (value.es_indexed === false) {
      continue
    }

    // Field has some kind of type
    if (type) {
      // If it is an nested schema
      if (value[0] || type === 'embedded') {
        // A nested array can contain complex objects
        nestedSchema(paths, field, cleanTree, value, prefix) // eslint-disable-line no-use-before-define
      } else if (value.type && Array.isArray(value.type)) {
        // An object with a nested array
        nestedSchema(paths, field, cleanTree, value, prefix) // eslint-disable-line no-use-before-define
        // Merge top level es settings
        for (prop in value) {
          // Map to field if it's an Elasticsearch option
          if (Object.prototype.hasOwnProperty.call(value, prop) && prop.indexOf('es_') === 0) {
            cleanTree[field][prop] = value[prop]
          }
        }
      } else if (paths[field] && paths[field].options.es_schema && paths[field].options.es_schema.tree && paths[field].options.es_schema.paths) {
        subTree = paths[field].options.es_schema.tree
        if (paths[field].options.es_select) {
          for (treeNode in subTree) {
            if (!Object.prototype.hasOwnProperty.call(subTree, treeNode)) { continue }
            if (paths[field].options.es_select.split(' ').indexOf(treeNode) === -1) {
              delete subTree[treeNode]
            }
          }
        }
        cleanTree[field] = getCleanTree(subTree, paths[field].options.es_schema.paths, '')
      } else if (value === String || value === Object || value === Date || value === Number || value === Boolean || value === Array) {
        cleanTree[field] = {}
        cleanTree[field].type = type
      } else {
        cleanTree[field] = {}
        for (key in value) {
          if (Object.prototype.hasOwnProperty.call(value, key)) {
            cleanTree[field][key] = value[key]
          }
        }
        cleanTree[field].type = type
      }

      // It has no type for some reason
    } else {
      // Because it is an geo_* object!!
      if (typeof value === 'object') {
        for (key in value) {
          if (Object.prototype.hasOwnProperty.call(value, key) && /^geo_/.test(key)) {
            cleanTree[field] = value[key]
            geoFound = true
          }
        }

        if (geoFound) {
          continue
        }
      }

      // If it's a virtual type, don't map it
      if (typeof value === 'object' && value.getters && value.setters && value.options) {
        continue
      }

      // Because it is some other object!! Or we assumed that it is one.
      if (typeof value === 'object') {
        cleanTree[field] = getCleanTree(value, paths, prefix + field)
      }
    }
  }

  return cleanTree
}

//
// Define a nested schema
//
// @param paths
// @param field
// @param cleanTree
// @param value
// @param prefix
// @return cleanTree modified
//
function nestedSchema (paths, field, cleanTree, value, prefix) {
  let treeNode
  let subTree
  // A nested array can contain complex objects
  if (paths[prefix + field] && paths[prefix + field].schema && paths[prefix + field].schema.tree && paths[prefix + field].schema.paths) {
    cleanTree[field] = getCleanTree(paths[prefix + field].schema.tree, paths[prefix + field].schema.paths, '')
  } else if (paths[prefix + field] && Array.isArray(paths[prefix + field].options.type) && paths[prefix + field].options.type[0].es_schema &&
    paths[prefix + field].options.type[0].es_schema.tree && paths[prefix + field].options.type[0].es_schema.paths) {
    // A nested array of references filtered by the 'es_select' option
    subTree = paths[field].options.type[0].es_schema.tree
    if (paths[field].options.type[0].es_select) {
      for (treeNode in subTree) {
        if (!Object.prototype.hasOwnProperty.call(subTree, treeNode)) {
          continue
        }
        if (paths[field].options.type[0].es_select.split(' ').indexOf(treeNode) === -1) {
          delete subTree[treeNode]
        }
      }
    }
    cleanTree[field] = getCleanTree(subTree, paths[prefix + field].options.type[0].es_schema.paths, '')
  } else if (paths[prefix + field] && paths[prefix + field].caster && paths[prefix + field].caster.instance) {
    // Even for simple types the value can be an object if there is other attributes than type
    if (typeof value[0] === 'object') {
      cleanTree[field] = value[0]
    } else if (typeof value === 'object') {
      cleanTree[field] = value
    } else {
      cleanTree[field] = {}
    }

    cleanTree[field].type = paths[prefix + field].caster.instance.toLowerCase()
  } else if (!paths[field] && prefix) {
    if (paths[prefix + field] && paths[prefix + field].caster && paths[prefix + field].caster.instance) {
      cleanTree[field] = {
        type: paths[prefix + field].caster.instance.toLowerCase()
      }
    }
  } else {
    cleanTree[field] = {
      type: 'object'
    }
  }
}

function Generator () {}

Generator.prototype.generateMapping = function generateMapping (schema) {
  const cleanTree = getCleanTree(schema.tree, schema.paths, '', true)
  delete cleanTree[schema.get('versionKey')]
  const mapping = getMapping(cleanTree, '')
  return { properties: mapping }
}

Generator.prototype.getCleanTree = function (schema) {
  return getCleanTree(schema.tree, schema.paths, '', true)
}

module.exports = function () {
  return {
    /**
     * Updates and insert data in es, does have dependence on wasNew. Please check pre('save' logic in profile
     * @param {object} schema
     * @param {object} model
     * @param {string} schemaName
     */
    async transport (schema, model, schemaName) {
      const generator = new Generator()
      const mapping = generator.generateMapping(schema)
      const data = serialize(model.toObject(), mapping)
      const index = await es.index({
        index: envPrefix + schemaName,
        type: '_doc',
        id: model._id.toString(),
        body: data
      })
      console.log(index)
      // console.log('Data inserted')
      // if (model.wasNew) {
      //   await es.index({
      //     index: envPrefix + schemaName,
      //     type: '_doc',
      //     id: model._id.toString(),
      //     body: data
      //   })
      //   console.log('Data inserted')
      // } else {
      //   await es.update({
      //     index: envPrefix + schemaName,
      //     type: '_doc',
      //     id: model._id.toString(),
      //     body: {
      //       doc: data
      //     }
      //   })
      //   console.log('Data updated')
      // }
      return data
    },
    /**
     * Elastic search for fetching data, user can use hydrate for fetching data from mongoose directly. _id is required to fetch data
     * @param {string} schemaName
     * @param {object} query
     * @param {object} opts
     * @param {object} callback
     * @param {object} Profile
     */
    async search (schemaName, query, opts, callback, Profile) {
      let results = { hits: { hits: [] } }
      if (opts && opts.hydrate) {
        const searchResult = await es.search({
          index: envPrefix + schemaName,
          type: '_doc',
          body: {
            query: query
          }
        })
        if (searchResult && searchResult.hits && searchResult.hits.hits && searchResult.hits.hits.length) {
          const ids = searchResult.hits.hits.map((sear) => {
            return sear._id
          })
          const selectQuery = ((opts.hydrateOptions && opts.hydrateOptions.select) ? opts.hydrateOptions.select : '')
          const result = await Profile.find({ _id: { $in: ids } }, selectQuery).lean().exec()
          results.hits.hits = result
        }
      } else {
        results = await es.search({
          index: envPrefix + schemaName,
          type: '_doc',
          body: {
            query: query
          }
        })
      }
      if (callback) {
        callback(undefined, results)
      }
      return results
    }
  }
}
