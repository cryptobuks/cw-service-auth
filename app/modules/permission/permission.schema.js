
const setOveride = {
  schema: {
    tags: ['permission', 'override', 'save'],
    summary: 'Permission override save',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      type: 'object',
      required: ['ownerId', 'profileId', 'rules'],
      properties: {
        profileId: {
          description: 'Profile id of the user',
          type: 'string'
        },
        ownerId: {
          description: 'Gym id for which override is applied',
          type: 'string'
        },
        rules: {
          type: 'object',
          properties: {
            businessContacts: {
              type: 'object'
            },
            ownBusinessProfile: {
              type: 'object'
            },
            chat: {
              type: 'object'
            }
          },
          additionalProperties: false
        }
      }
    }
  }
}

const getOveride = {
  schema: {
    tags: ['permission', 'override', 'get'],
    summary: 'Override permission of gym',
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

const getDefaultRolePermission = {
  schema: {
    tags: ['permission', 'override', 'default'],
    summary: 'get default permission for roles',
    security: [
      {
        authorization: []
      }
    ],
    body: {

    }
  }
}

module.exports = {
  setOveride,
  getOveride,
  getDefaultRolePermission
}
