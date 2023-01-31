const getSportAuthorization = {
  schema: {
    tags: ['sportsAuthorization', 'details'],
    summary: 'Get Course and Private information based on ownerId and profileId',
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

const addUpdateCourse = {
  schema: {
    tags: ['sportsAuthorization', 'course', 'add'],
    summary: 'Add / update course information for sportAuthorization',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      type: 'object',
      required: ['ownerId', 'profileId', 'interestIds'],
      properties: {
        profileId: {
          description: 'Profile id of the user',
          type: 'string'
        },
        ownerId: {
          description: 'GymId for which details needs to be fetched',
          type: 'string'
        },
        interestIds: {
          type: 'array',
          description: 'Interest id from setting',
          items: {
            type: 'string'
          }
        }
      }
    }
  }
}

const addUpdatePrivate = {
  schema: {
    tags: ['sportsAuthorization', 'private', 'add'],
    summary: 'Add / update private information for sportAuthorization',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      type: 'object',
      required: ['ownerId', 'profileId', 'interestIds'],
      properties: {
        profileId: {
          description: 'Profile id of the user',
          type: 'string'
        },
        ownerId: {
          description: 'GymId for which details needs to be fetched',
          type: 'string'
        },
        interestIds: {
          type: 'array',
          description: 'Interest id from setting',
          items: {
            type: 'string'
          }
        }
      }
    }
  }
}

module.exports = {
  getSportAuthorization,
  addUpdateCourse,
  addUpdatePrivate
}
