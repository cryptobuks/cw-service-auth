const getbio = {
  schema: {
    tags: ['bio', 'get'],
    summary: 'Get bio based on profileId ',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      type: 'object',
      required: ['profileId'],
      properties: {
        profileId: {
          description: 'Profile id for which bio is required',
          type: 'string'
        }
      }
    }
  }
}

const createbio = {
  schema: {
    tags: ['bio', 'get'],
    summary: 'Create Bio for profile ',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      type: 'object',
      required: ['profileId', 'measuredAt'],
      properties: {
        profileId: {
          description: 'Profile id for which bio is required',
          type: 'string'
        },
        height: {
          description: 'Height details, height or weight either or both are required',
          type: 'number'
        },
        weight: {
          description: 'weight details, height or weight either or both are required',
          type: 'number'
        },
        muscle: {
          description: 'muscle details',
          type: 'number'
        },
        fat: {
          description: 'fat details',
          type: 'number'
        },
        tissue: {
          description: 'tissue details',
          type: 'number'
        },
        water: {
          description: 'Water details',
          type: 'number'
        },
        bone: {
          description: 'Bone mass details',
          type: 'number'
        },
        measuredAt: {
          description: 'measuredAt details',
          type: 'string',
          format: 'date'
        }
      }
    }
  }
}

const updatebio = {
  schema: {
    tags: ['bio', 'get'],
    summary: 'Update Bio for profile ',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      type: 'object',
      required: ['profileId', 'id', 'measuredAt'],
      properties: {
        profileId: {
          description: 'Profile id for which bio is required',
          type: 'string'
        },
        id: {
          description: 'id of previous created bio',
          type: 'string'
        },
        height: {
          description: 'Height details, height or weight either or both are required',
          type: 'number'
        },
        weight: {
          description: 'weight details, height or weight either or both are required',
          type: 'number'
        },
        muscle: {
          description: 'muscle details',
          type: 'number'
        },
        fat: {
          description: 'fat details',
          type: 'number'
        },
        tissue: {
          description: 'tissue details',
          type: 'number'
        },
        water: {
          description: 'Water details',
          type: 'number'
        },
        bone: {
          description: 'Bone mass details',
          type: 'number'
        },
        measuredAt: {
          description: 'measuredAt details',
          type: 'string',
          format: 'date'
        }
      }
    }
  }
}

const deletebio = {
  schema: {
    tags: ['bio', 'get'],
    summary: 'Delete Bio for profile ',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      type: 'object',
      required: ['profileId', 'id'],
      properties: {
        profileId: {
          description: 'Profile id for which bio is required',
          type: 'string'
        },
        id: {
          description: 'id of previous created bio',
          type: 'string'
        }
      }
    }
  }
}

module.exports = {
  createbio,
  updatebio,
  getbio,
  deletebio
}
