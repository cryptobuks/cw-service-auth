const { documentType, allowedRole } = require('./contracts.enum')

const findById = {
  schema: {
    tags: ['contract', 'get'],
    summary: 'Get contract by id ',
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
          description: 'Id for which contract needs to be fetched',
          type: 'string'
        }
      }
    }
  }
}

const getDocumentByType = {
  schema: {
    tags: ['contract', 'type', 'ownerid'],
    summary: 'Get contract by OwnerId and Type ',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      type: 'object',
      required: ['ownerId', 'type'],
      properties: {
        ownerId: {
          description: 'Owner id of the document',
          type: 'string'
        },
        type: {
          type: 'string',
          enum: documentType
        },
        role: {
          type: 'string',
          enum: allowedRole,
          description: 'will only be considered when type = role'
        }
      }
    }
  }
}

const createDocument = {
  schema: {
    tags: ['contract', 'create'],
    summary: 'Create contract by OwnerId and Type ',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      type: 'object',
      required: ['ownerId', 'type', 'content'],
      properties: {
        ownerId: {
          description: 'Owner id of the document',
          type: 'string'
        },
        type: {
          type: 'string',
          enum: documentType
        },
        role: {
          type: 'string',
          enum: allowedRole
        },
        content: {
          description: 'Content which needs to be stored',
          type: 'string'
        },
        referenceDoc: {
          type: 'string',
          description: 'cw setting with isDefaultDocument set to true, else document id which is getting  referred'
        },
        isDefaultDocument: {
          type: 'boolean',
          default: false,
          description: 'Should be set to true, if user is referring to document which belongs to cw setting'
        },
        preApproval: {
          type: 'boolean',
          default: false,
          description: 'If previous accepted document needs to accept document'
        },
        activatedAt: {
          type: 'string',
          format: 'date'
        },
        expiredAt: {
          type: 'string',
          format: 'date'
        }
      }
    }
  }
}

const updateDocument = {
  schema: {
    tags: ['contract', 'update'],
    summary: 'Create contract by OwnerId and Type ',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      type: 'object',
      required: ['ownerId', 'id', 'content'],
      properties: {
        ownerId: {
          description: 'Owner id of the document',
          type: 'string'
        },
        id: {
          type: 'string',
          description: 'Contract id which needs to be updated'
        },
        content: {
          description: 'Content which needs to be stored',
          type: 'string'
        },
        referenceDoc: {
          type: 'string',
          description: 'cw setting with isDefaultDocument set to true, else document id which is getting  referred'
        },
        isDefaultDocument: {
          type: 'boolean',
          default: false,
          description: 'Should be set to true, if user is referring to document which belongs to cw setting'
        },
        activatedAt: {
          type: 'string',
          format: 'date',
          description: 'Activation date in YYYY-MM-DD'
        },
        expiredAt: {
          type: 'string',
          format: 'date',
          description: 'Expired date in YYYY-MM-DD'
        }
      }
    }
  }
}

const getProfileWhoSignedDocument = {
  schema: {
    tags: ['contract', 'documents'],
    summary: 'Gives list of profile who have accepted the documents',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      type: 'object',
      required: ['documentId'],
      properties: {
        documentId: {
          description: 'documentId of the document for which details are needed',
          type: 'string'
        }
      }
    }
  }
}

const getProfileWhoNotSignedDocument = {
  schema: {
    tags: ['contract', 'documents'],
    summary: 'Gives list of profile who have not accepted the documents',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      type: 'object',
      required: ['documentId'],
      properties: {
        documentId: {
          description: 'documentId of the document for which details are needed',
          type: 'string'
        }
      }
    }
  }
}

const getDocumentSignedByProfile = {
  schema: {
    tags: ['contract', 'documents'],
    summary: 'Gives list of profile who have acceepted / not accepted the documents',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      type: 'object',
      required: ['ownerId', 'profileId'],
      properties: {
        ownerId: {
          description: 'Business owner id for which document was created',
          type: 'string'
        },
        profileId: {
          description: 'Profile id of the user IN / TU',
          type: 'string'
        }
      }
    }
  }
}

const getProfileUnsignedDocuments = {
  schema: {
    tags: ['contract', 'documents', 'unsigned'],
    summary: 'Gives list of documents, which are not signed or not accepted',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      type: 'object',
      required: ['ownerIds'],
      properties: {
        ownerIds: {
          type: 'array',
          items: {
            type: 'string'
          },
          description: 'Business owner ids for which document was created'
        },
        profileId: {
          description: 'Profile id of the user IN / TU',
          type: 'string'
        }
      }
    }
  }
}

const addSignedDocument = {
  schema: {
    tags: ['contract', 'documents'],
    summary: 'Store information about document accepted by user',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      type: 'object',
      required: ['ownerId', 'profileId', 'documentId', 'source', 'isMandatory', 'isAccepted'],
      properties: {
        ownerId: {
          description: 'Business owner id for which document was created',
          type: 'string'
        },
        profileId: {
          description: 'Profile id of the user IN / TU',
          type: 'string'
        },
        documentId: {
          description: 'Document id for which document is accepted',
          type: 'string'
        },
        onBehalf: {
          description: 'Profile id of the user IN / TU',
          type: 'string'
        },
        source: {
          description: 'Source if the document',
          type: 'string',
          enum: ['contract', 'setting']
        },
        isMandatory: {
          type: 'boolean'
        },
        isAccepted: {
          type: 'boolean',
          description: 'Is the document accepted by user'
        },
        deviceId: {
          type: 'string',
          description: 'deviceId on which this was accepted'
        },
        sign: {
          type: 'string',
          typeof: 'Base64',
          description: 'Signed image in base64'
        }
      }
    }
  }
}

const updateSignedDocument = {
  schema: {
    tags: ['contract', 'documents'],
    summary: 'Store information about document accepted by user',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      type: 'object',
      required: ['ownerId', 'id', 'profileId', 'documentId', 'isMandatory', 'isAccepted'],
      properties: {
        ownerId: {
          description: 'Business owner id for which document was created',
          type: 'string'
        },
        id: {
          description: 'id of the entry you wish to save',
          type: 'string'
        },
        profileId: {
          description: 'Profile id of the user IN / TU',
          type: 'string'
        },
        documentId: {
          description: 'Document id for which document is accepted',
          type: 'string'
        },
        onBehalf: {
          description: 'Profile id of the user IN / TU',
          type: 'string'
        },
        isMandatory: {
          type: 'boolean'
        },
        isAccepted: {
          type: 'boolean',
          description: 'Is the document accepted by user'
        },
        deviceId: {
          type: 'string',
          description: 'deviceId on which this was accepted'
        },
        sign: {
          type: 'string',
          typeof: 'Base64',
          description: 'Signed image in base64'
        }
      }
    }
  }
}

const getContractBySourceId = {
  schema: {
    tags: ['contract', 'documents'],
    summary: 'Get contract by Id using source',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      type: 'object',
      required: ['source', 'id'],
      properties: {
        source: {
          description: 'Source of the contract',
          type: 'string',
          enum: ['contract', 'setting']
        },
        id: {
          description: 'Object id of the contract',
          type: 'string'
        }
      }
    }
  }
}

const removeDocument = {
  schema: {
    tags: ['contract', 'documents', 'remove'],
    summary: 'Removes the document',
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
          description: 'Object id of the contract',
          type: 'string'
        }
      }
    }
  }
}

const getCowellnessTermByCountry = {
  schema: {
    tags: ['contract', 'documents', 'terms'],
    summary: 'Get terms document by country code',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      type: 'object',
      required: ['countryCode'],
      properties: {
        countryCode: {
          description: 'Country code for which terms document needs to be fetched',
          type: 'string'
        }
      }
    }
  }
}

module.exports = {
  findById,
  getDocumentByType,
  createDocument,
  updateDocument,
  getProfileWhoSignedDocument,
  getProfileWhoNotSignedDocument,
  getDocumentSignedByProfile,
  addSignedDocument,
  updateSignedDocument,
  getProfileUnsignedDocuments,
  getContractBySourceId,
  removeDocument,
  getCowellnessTermByCountry
}
