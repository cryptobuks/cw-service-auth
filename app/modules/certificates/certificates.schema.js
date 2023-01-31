const { certificateType, medical, identity } = require('./certificates.enum')

const getCertificatesList = {
  schema: {
    tags: ['certificate', 'list'],
    summary: 'Certificate for a profile',
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
          description: 'Profile id for which certificate is required',
          type: 'string'
        },
        gymId: {
          description: 'Gym id of which certificate is required',
          type: 'string'
        }
      }
    }
  }
}

const approve = {
  schema: {
    tags: ['certificate', 'aprrove'],
    summary: 'Certificate approval',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      type: 'object',
      required: ['id', 'ownerId'],
      properties: {
        id: {
          description: 'Certificate id which needs to be approved',
          type: 'string'
        },
        ownerId: {
          description: 'GymId for which certificate is approved',
          type: 'string'
        }
      }
    }
  }
}

const deleteCertificate = {
  schema: {
    tags: ['certificate', 'aprrove'],
    summary: 'Certificate delete',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      type: 'object',
      required: ['id'],
      properties: {
        id: {
          description: 'Certificate id which needs to be deleted',
          type: 'string'
        },
        ownerId: {
          description: 'GymId for which certificate is deleted',
          type: 'string'
        }
      }
    }
  }
}

const disapprove = {
  schema: {
    tags: ['certificate', 'disapprove'],
    summary: 'Certificate disapprove',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      type: 'object',
      required: ['id', 'ownerId'],
      properties: {
        id: {
          description: 'Certificate id which needs to be approved',
          type: 'string'
        },
        ownerId: {
          description: 'GymId for which certificate is approved',
          type: 'string'
        }
      }
    }
  }
}

const create = {
  schema: {
    tags: ['certificate', 'create'],
    summary: 'Create certificate',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      type: 'object',
      required: ['type', 'profileId', 'name'],
      properties: {
        name: {
          description: 'Name of the certificate',
          type: 'string'
        },
        type: {
          description: 'Type of profile which needs to be created',
          type: 'string',
          enum: certificateType
        },
        subtype: {
          description: 'subtype of profile',
          type: 'string',
          enum: medical.concat(identity)
        },
        sports: {
          description: 'sports interest from setting',
          type: 'array',
          minItems: 1,
          items: {
            type: 'string'
          }
        },
        expiry: {
          description: 'Expiry date in YYYYMMDD format',
          type: 'number',
          maxLength: 8,
          minLength: 8
        },
        fileName: {
          type: 'string',
          description: 'Name of the file which needs to be created'
        },
        file: {
          type: 'string',
          typeof: 'Base64'
        },
        profileId: {
          description: 'Profile Id for which certificate needs to be created',
          type: 'string'
        },
        ownerId: {
          description: 'Gym id of profile which needs to be uploaded',
          type: 'string'
        },
        createdby: {
          description: 'Certificate create by profile id',
          type: 'string'
        }
      }
    }
  }
}

const update = {
  schema: {
    tags: ['certificate', 'update'],
    summary: 'update certificate',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      type: 'object',
      required: ['id', 'profileId', 'name'],
      properties: {
        id: {
          description: 'id which needs to be updated',
          type: 'string'
        },
        name: {
          description: 'Name of the certificate',
          type: 'string'
        },
        sports: {
          description: 'sports interest from setting',
          type: 'array',
          minItems: 1,
          items: {
            type: 'string'
          }
        },
        expiry: {
          description: 'Expiry date in YYYYMMDD format',
          type: 'number',
          maxLength: 8,
          minLength: 8
        },
        fileName: {
          type: 'string',
          description: 'Name of the file which needs to be created'
        },
        file: {
          type: 'string',
          typeof: 'Base64'
        },
        profileId: {
          description: 'Profile Id for which certificate needs to be created',
          type: 'string'
        },
        ownerId: {
          description: 'Gym id of profile which needs to be uploaded',
          type: 'string'
        },
        createdby: {
          description: 'Certificate create by profile id',
          type: 'string'
        }
      }
    }
  }
}

module.exports = {
  getCertificatesList,
  create,
  approve,
  disapprove,
  deleteCertificate,
  update
}
