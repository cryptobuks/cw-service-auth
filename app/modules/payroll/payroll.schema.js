const { periods, variables, targets, allowedRoles } = require('./payroll.enum')

const payrollDetails = {
  schema: {
    tags: ['payroll', 'details'],
    summary: 'Get Award and payroll related details based on ownerId and profileId',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      type: 'object',
      required: ['ownerId', 'profileId'],
      properties: {
        profileId: {
          description: 'Profile id of the user',
          type: 'string'
        },
        ownerId: {
          description: 'GymId for which details needs to be fetched',
          type: 'string'
        }
      }
    }
  }
}

const addUpdatePayroll = {
  schema: {
    tags: ['payroll', 'add'],
    summary: 'Add payroll information',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      type: 'object',
      required: ['ownerId', 'profileId', 'name', 'role', 'period', 'variable', 'value'],
      properties: {
        name: {
          type: 'string',
          description: 'Name of the payroll',
          minLength: 2
        },
        role: {
          type: 'string',
          enum: allowedRoles
        },
        profileId: {
          description: 'Profile id of the user',
          type: 'string'
        },
        ownerId: {
          description: 'GymId for which details needs to be fetched',
          type: 'string'
        },
        period: {
          type: 'string',
          enum: periods
        },
        variable: {
          type: 'string',
          enum: variables
        },
        value: {
          type: 'number'
        },
        id: {
          type: 'string',
          description: 'Id of record if it needs to updated'
        }
      }
    }
  }
}

const removePayroll = {
  schema: {
    tags: ['payroll', 'remove'],
    summary: 'Remove payroll information',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      type: 'object',
      required: ['ownerId', 'profileId', 'id'],
      properties: {
        profileId: {
          description: 'Profile id of the user',
          type: 'string'
        },
        ownerId: {
          description: 'GymId for which details needs to be fetched',
          type: 'string'
        },
        id: {
          type: 'string',
          description: 'Id of the record to be deleted'
        }
      }
    }
  }
}

const addUpdateAward = {
  schema: {
    tags: ['awards', 'add'],
    summary: 'Add awards information',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      type: 'object',
      required: ['ownerId', 'profileId', 'target', 'quantity', 'end', 'value'],
      properties: {
        profileId: {
          description: 'Profile id of the user',
          type: 'string'
        },
        ownerId: {
          description: 'GymId for which details needs to be fetched',
          type: 'string'
        },
        target: {
          type: 'string',
          enum: targets
        },
        quantity: {
          type: 'number'
        },
        end: {
          type: 'number'
        },
        value: {
          type: 'number'
        },
        id: {
          type: 'string',
          description: 'Id of the record to be updated'
        }
      }
    }
  }
}

const removeAward = {
  schema: {
    tags: ['awards', 'remove'],
    summary: 'Remove awards information',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      type: 'object',
      required: ['ownerId', 'profileId', 'target', 'quantity', 'end'],
      properties: {
        profileId: {
          description: 'Profile id of the user',
          type: 'string'
        },
        ownerId: {
          description: 'GymId for which details needs to be fetched',
          type: 'string'
        },
        id: {
          type: 'string',
          description: 'Id of the record to be deleted'
        }
      }
    }
  }
}

module.exports = {
  payrollDetails,
  addUpdatePayroll,
  removePayroll,
  addUpdateAward,
  removeAward
}
