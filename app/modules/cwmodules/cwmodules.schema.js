
const getCwModulesByGYMId = {
  schema: {
    tags: ['cwmodules', 'list', 'postlogin'],
    summary: 'Get cwmodule list based on GYMId',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      type: 'object',
      required: ['gymId'],
      properties: {
        gymId: {
          type: 'string',
          description: 'Gym Id for which modules needs to returned'
        }
      }
    }
  }
}

const getCwModulesById = {
  schema: {
    tags: ['cwmodules', 'detail', 'postlogin'],
    summary: 'Get cwmodule by id',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      type: 'object',
      required: ['_id'],
      properties: {
        _id: {
          type: 'string',
          description: 'CW modules id for which details needs to be fetched'
        }
      }
    }
  }
}

const createCWModuleByGymId = {
  schema: {
    tags: ['cwmodules', 'create', 'postlogin'],
    summary: 'Create cwmodules by GymId',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      type: 'object',
      required: ['gymId', 'modules'],
      properties: {
        gymId: {
          type: 'string',
          description: 'Gym id for which modules are created'
        },
        modules: {
          type: 'object',
          required: ['area', 'isActive'],
          properties: {
            area: {
              type: 'string'
            },
            isActive: {
              type: 'boolean'
            },
            paidByGroup: {
              type: 'boolean'
            },
            contactsCount: {
              type: 'number'
            },
            discounts: {
              type: 'array',
              items: {
                type: 'object',
                required: ['discount'],
                properties: {
                  discount: {
                    type: 'number'
                  },
                  startDt: {
                    type: 'number',
                    maxLength: 8,
                    minLength: 8,
                    description: 'Format used here is YYYYMMDD'
                  },
                  endDt: {
                    type: 'number',
                    maxLength: 8,
                    minLength: 8,
                    description: 'Format used here is YYYYMMDD'
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}

const updateCWModuleById = {
  schema: {
    tags: ['cwmodules', 'update', 'postlogin'],
    summary: 'Create cwmodules by GymId',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      type: 'object',
      required: ['_id', 'modules'],
      properties: {
        _id: {
          type: 'string',
          description: 'update cw modules by id'
        },
        modules: {
          type: 'object',
          required: ['area', 'isActive'],
          properties: {
            area: {
              type: 'string'
            },
            isActive: {
              type: 'boolean'
            },
            paidByGroup: {
              type: 'boolean'
            },
            contactsCount: {
              type: 'number'
            },
            discounts: {
              type: 'array',
              items: {
                type: 'object',
                required: ['discount'],
                properties: {
                  discount: {
                    type: 'number'
                  },
                  startDt: {
                    type: 'number',
                    maxLength: 8,
                    minLength: 8,
                    description: 'Format used here is YYYYMMDD'
                  },
                  endDt: {
                    type: 'number',
                    maxLength: 8,
                    minLength: 8,
                    description: 'Format used here is YYYYMMDD'
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}

module.exports = {
  getCwModulesByGYMId,
  getCwModulesById,
  createCWModuleByGymId,
  updateCWModuleById
}
