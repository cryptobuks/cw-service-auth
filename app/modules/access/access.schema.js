const getAccess = {
  schema: {
    tags: ['access', 'documents'],
    summary: 'Will create relation if the id already exist and record access information',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      type: 'object',
      required: ['invitedBy', 'invitedTo'],
      properties: {
        invitedBy: {
          description: 'Profile id',
          type: 'string'
        },
        invitedTo: {
          description: 'Profile id',
          type: 'string'
        },
        action: {
          type: 'string'
        },
        assetId: {
          description: 'Object id, this is not verified now but will be verified in future',
          type: 'string'
        }
      }
    }
  }
}

const getCurrentRelationStatus = {
  schema: {
    tags: ['access', 'documents', 'current'],
    summary: 'Will return current status of relation, if relation is not present will return null',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      type: 'object',
      required: ['invitedBy', 'invitedTo'],
      properties: {
        invitedBy: {
          description: 'Profile id',
          type: 'string'
        },
        invitedTo: {
          description: 'Profile id',
          type: 'string'
        }
      }
    }
  }
}

const getAccessLog = {
  schema: {
    tags: ['access', 'documents', 'current'],
    summary: 'Will return access log based on login user and gym profile',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      type: 'object',
      required: ['profileId', 'fromDate', 'toDate', 'fromRecord', 'totalRecord'],
      properties: {
        profileId: {
          description: 'Profile id',
          type: 'string'
        },
        fromDate: {
          description: 'YYYYMMDD From which date access details are required',
          type: 'string',
          minLength: 8,
          maxLength: 8
        },
        toDate: {
          description: 'YYYYMMDD To which date access details are required',
          type: 'string',
          minLength: 8,
          maxLength: 8
        },
        fromRecord: {
          description: 'Record from position',
          type: 'number'
        },
        totalRecord: {
          description: 'Total record to be fetched',
          type: 'number'
        }
      }
    }
  }
}

module.exports = {
  getAccess,
  getCurrentRelationStatus,
  getAccessLog
}
