const { roles } = require('../profile/profile.enum')

const relationGet = {
  type: 'object',
  required: ['profileId', 'managerId'],
  properties: {
    profileId: { type: 'string', description: 'User id for which we relation needs to be fetched' },
    managerId: { type: 'string', description: 'Business profile id for which we relation needs to be fetched' }
  }
}

const verify = {
  type: 'object',
  required: ['businessId', 'profileId'],
  properties: {
    businessId: { type: 'string', description: 'Business id for which combination needs to be checked' },
    profileId: { type: 'string', description: 'Profile id for which combination needs to be checked' }
  }
}

const businessUserRole = {
  type: 'object',
  required: ['businessId', 'profileId'],
  properties: {
    businessId: { type: 'string', description: 'Business id for which combination needs to be checked' },
    profileId: { type: 'string', description: 'Profile id for which combination needs to be checked' }
  }
}

const assignedProfiles = {
  type: 'object',
  required: ['businessId', 'profileIds'],
  properties: {
    businessId: { type: 'string', description: 'Business id' },
    profileIds: { type: 'array', description: 'Profile ids of managers' }
  }
}

const addGymRole = {
  schema: {
    summary: 'Add gym role relationship',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      type: 'object',
      required: ['gymId', 'userId', 'role', 'status'],
      properties: {
        gymId: {
          type: 'string'
        },
        role: {
          type: 'string',
          enum: roles
        },
        userId: {
          type: 'string'
        },
        status: {
          type: 'string',
          enum: ['draft', 'temporary', 'active', 'suspended']
        },
        startAt: {
          type: 'number',
          maxLength: 8,
          minLength: 8
        },
        endAt: {
          type: 'number',
          maxLength: 8,
          minLength: 8
        }
      }
    }
  }
}

const updateGymRole = {
  schema: {
    summary: 'Update gym role relationship',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      type: 'object',
      required: ['gymId', 'userId', 'role', 'status'],
      properties: {
        gymId: {
          type: 'string'
        },
        userId: {
          type: 'string'
        },
        status: {
          type: 'string',
          enum: ['draft', 'temporary', 'active', 'suspended']
        },
        role: {
          type: 'string',
          enum: roles
        },
        startAt: {
          type: 'number',
          maxLength: 8,
          minLength: 8
        },
        endAt: {
          type: 'number',
          maxLength: 8,
          minLength: 8
        }
      }
    }
  }
}

const deleteGymRole = {
  schema: {
    summary: 'Delete gym role relationship',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      type: 'object',
      required: ['gymId', 'userId', 'role'],
      properties: {
        gymId: {
          type: 'string'
        },
        userId: {
          type: 'string'
        },
        role: {
          type: 'string',
          enum: roles
        }
      }
    }
  }
}

const managedProfileList = {
  schema: {
    tags: ['startAt'],
    summary: 'Get managed profile list',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      type: 'object',
      properties: {
        startAt: {
          type: 'number',
          minLength: 8,
          maxLength: 8,
          description: 'Starting date from'
        },
        endAt: {
          type: 'number',
          minLength: 8,
          maxLength: 8,
          description: 'End date from'
        }
      }
    }
  }
}

const getProfileList = {
  schema: {
    tags: ['relation', 'profilelist', 'postlogin'],
    summary: 'Get list of profile which allowed to user',
    security: [
      {
        authorization: []
      }
    ],
    body: {

    }
  }
}

const getNonGymProfiles = {
  schema: {
    summary: 'get non business profiles associated with profileId',
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
          type: 'string'
        }
      }
    }
  }
}

const addTutor = {
  schema: {
    tags: ['relation', 'addTutor', 'postlogin'],
    summary: 'Add tutor to profile',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      type: 'object',
      required: ['tutorId', 'userId'],
      properties: {
        tutorId: {
          type: 'string',
          description: 'Tutor id of the user'
        },
        userId: {
          type: 'string',
          description: 'User Id which needs to associated with Tutor'
        }
      }
    }
  }
}

const getGymUserRole = {
  schema: {
    tags: ['relation', 'gym', 'role'],
    summary: 'Get gym and profile role',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      type: 'object',
      required: ['gymId', 'profileId'],
      properties: {
        gymId: {
          type: 'string',
          description: 'Gym id for which user role is required'
        },
        profileId: {
          type: 'string',
          description: 'Profile id for which gym role are required'
        }
      }
    }
  }
}

const verifyUserRelationShip = {
  schema: {
    tags: ['relation', 'status'],
    summary: 'Get profile relationship',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      type: 'object',
      required: ['leftProfileId', 'rightProfileId'],
      properties: {
        leftProfileId: {
          type: 'string',
          description: 'Profile for which relationship needs to verified'
        },
        rightProfileId: {
          type: 'string',
          description: 'Profile for which relationship needs to verified'
        }
      }
    }
  }
}

const block = {
  schema: {
    tags: ['relation', 'block'],
    summary: 'Block a profile',
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
          type: 'string',
          description: 'Profile for which needs to be blocked'
        }
      }
    }
  }
}

const unblock = {
  schema: {
    tags: ['relation', 'inblock'],
    summary: 'Unblock a profile',
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
          type: 'string',
          description: 'Profile for which needs to be unblocked'
        }
      }
    }
  }
}

const getTutorUsers = {
  schema: {
    tags: ['relation', 'tutor'],
    summary: 'Get Profiles temporay or active user for tutor pass has profileId',
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
          type: 'string',
          description: 'Profile for which tutor information is requried'
        }
      }
    }
  }
}

const getReferentUsers = {
  schema: {
    tags: ['relation', 'referent'],
    summary: 'Get Profiles temporay or active user for referent pass has profileId',
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
          type: 'string',
          description: 'Profile for which referent business profile information is requried'
        }
      }
    }
  }
}

const gymUserGymRelations = {
  schema: {
    tags: ['relation', 'business'],
    summary: 'Get Profiles temporay or active user for gym relations',
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
          type: 'string',
          description: 'Profile for which business relation should be fetched'
        }
      }
    }
  }
}

const getRelationDetail = {
  schema: {
    tags: ['relation', 'business'],
    summary: 'Get gym profile relations detail',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      type: 'object',
      required: ['gymId', 'profileId'],
      properties: {
        gymId: {
          type: 'string',
          description: 'Gym id for which business relation should be fetched'
        },
        profileId: {
          type: 'string',
          description: 'Profile for which business relation should be fetched'
        }
      }
    }
  }
}

const getUserTutor = {
  schema: {
    tags: ['relation', 'tutor'],
    summary: 'Get Tutor temporay or active user for profile pass has profileId',
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
          type: 'string',
          description: 'Profile for which tutor information is requried'
        }
      }
    }
  }
}

const removeTutor = {
  schema: {
    tags: ['relation', 'remove', 'postlogin'],
    summary: 'Remove tutor to profile',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      type: 'object',
      required: ['tutorId', 'userId'],
      properties: {
        tutorId: {
          type: 'string',
          description: 'Tutor id of the user'
        },
        userId: {
          type: 'string',
          description: 'User Id which needs to associated with Tutor'
        }
      }
    }
  }
}

const setIsInteresting = {
  schema: {
    tags: ['relation'],
    summary: 'set isInteresting flag for relation',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      type: 'object',
      required: ['profileId', 'value'],
      properties: {
        profileId: {
          type: 'string',
          description: 'Profile id for the user to change'
        },
        value: {
          type: 'boolean',
          description: 'isInteresting value true/false'
        }
      }
    }
  }
}

module.exports = {
  relationGet,
  managedProfileList,
  addGymRole,
  deleteGymRole,
  updateGymRole,
  getProfileList,
  verify,
  businessUserRole,
  addTutor,
  removeTutor,
  getNonGymProfiles,
  getGymUserRole,
  verifyUserRelationShip,
  block,
  unblock,
  getTutorUsers,
  getReferentUsers,
  gymUserGymRelations,
  getRelationDetail,
  getUserTutor,
  setIsInteresting,
  assignedProfiles
}
