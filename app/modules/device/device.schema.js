
const { deviceStatus } = require('./device.enum')
const { updateProfile, password, createProfile, acceptAndActivateRelation } = require('../profile/profile.schema')
const { _ } = require('@cowellness/cw-micro-service')()

const { createGym, updateGym } = require('../company/company.schema')

const deviceAdd = {
  schema: {
    tags: ['company', 'device', 'add'],
    summary: 'Add GYM devices',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      type: 'object',
      required: ['name', 'gymId'],
      properties: {
        name: {
          type: 'string',
          description: 'Device Name'
        },
        gymId: {
          type: 'string',
          description: 'gym id for which device needs to be created'
        },
        status: {
          type: 'string',
          enum: deviceStatus,
          description: 'default will be set to toBeActivated if not passed'
        }
      }
    }
  }
}

const deviceEdit = {
  schema: {
    tags: ['company', 'device', 'edit'],
    summary: 'update gym device by id',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      type: 'object',
      required: ['name', 'gymId', '_id'],
      properties: {
        name: {
          type: 'string',
          description: 'Device Name'
        },
        _id: {
          type: 'string',
          description: 'device id for which details needs to be updated'
        },
        gymId: {
          type: 'string',
          description: 'gym id for which device needs to be created'
        },
        status: {
          type: 'string',
          enum: deviceStatus,
          description: 'default will be set to toBeActivated if not passed'
        }
      }
    }
  }
}

const deviceDelete = {
  schema: {
    tags: ['company', 'device', 'delete'],
    summary: 'soft delete device for gym',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      type: 'object',
      required: ['gymId', '_id'],
      properties: {
        _id: {
          type: 'string',
          description: 'device id for which details needs to be updated'
        },
        gymId: {
          type: 'string',
          description: 'gym id for which device needs to be created'
        }
      }
    }
  }
}

const deviceReset = {
  schema: {
    tags: ['company', 'device', 'reset'],
    summary: 'Reset device, this will change status to toBeActivated and make it available for login',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      type: 'object',
      required: ['gymId', '_id'],
      properties: {
        _id: {
          type: 'string',
          description: 'device id for which details needs to be updated'
        },
        gymId: {
          type: 'string',
          description: 'gym id for which device needs to be created'
        }
      }
    }
  }
}

const getDeviceByGymId = {
  schema: {
    tags: ['company', 'device', 'delete'],
    summary: 'Get gym device list',
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
          description: 'gym id for which device needs to be fetched'
        }
      }
    }
  }
}

const deviceLogin = {
  schema: {
    tags: ['device', 'login'],
    summary: 'Login by Device Id',
    params: {
      type: 'object',
      properties: {
        gymId: {
          description: 'Gym for which device belongs too',
          type: 'string',
          minLength: 1
        },
        deviceId: {
          description: 'device id of gym device to login',
          type: 'string',
          minLength: 1
        }
      }
    }
  }
}

const emailSearch = {
  schema: {
    tags: ['device', 'search', 'email'],
    summary: 'Search user by email id',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      type: 'object',
      required: ['emailId'],
      properties: {
        emailId: {
          type: 'string',
          description: 'emailId for search'
        }
      }
    }
  }
}

const phoneSearch = {
  schema: {
    tags: ['device', 'search', 'phone'],
    summary: 'Search user by phone',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      type: 'object',
      required: ['countryCode', 'prefix', 'phoneNo'],
      properties: {
        countryCode: {
          type: 'string',
          description: 'countryCode which needs to be searched'
        },
        prefix: {
          type: 'string',
          description: 'prefix which needs to be searched'
        },
        phoneNo: {
          type: 'string',
          description: 'phoneNo which needs to be searched'
        }
      }
    }
  }
}

const registerProfile = _.cloneDeep(createProfile)

const bookShift = {
  schema: {
    tags: ['device', 'register', 'bookshift'],
    summary: 'Register bookshift request',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      type: 'object',
      required: ['userId'],
      properties: {
        userId: {
          description: 'User id of registered user',
          type: 'string'
        }
      }
    }
  }
}

const cancelShift = {
  schema: {
    tags: ['device', 'register', 'bookshift'],
    summary: 'Register bookshift request',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      type: 'object',
      required: ['userId'],
      properties: {
        userId: {
          description: 'User id of registered user',
          type: 'string'
        }
      }
    }
  }
}

const getQrCodeForDevice = {
  schema: {
    tags: ['device', 'qrcode'],
    summary: 'Get Qrcode for profile',
    security: [
      {
        authorization: []
      }
    ],
    body: {

    }
  }
}

const getUserInfoById = {
  schema: {
    tags: ['device', 'userInfo'],
    summary: 'Get userInfo by Id',
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
          description: 'Id for which details needs to be fetched',
          type: 'string'
        }
      }
    }
  }
}

const getUserByQrCode = {
  schema: {
    tags: ['device', 'userInfo'],
    summary: 'Get userInfo by qrCode',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      type: 'object',
      required: ['qrCode'],
      properties: {
        qrCode: {
          description: 'qrCode for which user info needs to be fetched',
          type: 'string'
        }
      }
    }
  }
}

const verifyUserRelation = {
  schema: {
    tags: ['device', 'relation', 'user'],
    summary: 'Get relation between two id',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      type: 'object',
      required: ['scanId'],
      properties: {
        scanId: {
          description: 'Id for which barcode was scanned',
          type: 'string'
        }
      }
    }
  }
}

const createRelation = {
  schema: {
    tags: ['device', 'relation', 'user'],
    summary: 'Create relation between two id',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      type: 'object',
      required: ['scanId'],
      properties: {
        scanId: {
          description: 'Id for which barcode was scanned',
          type: 'string'
        }
      }
    }
  }
}

const deviceScanAccess = {
  schema: {
    tags: ['device', 'scan', 'user'],
    summary: 'Scan user for access',
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
          description: 'Profile id for which barcode was scanned on device',
          type: 'string'
        }
      }
    }
  }
}

const activateRelation = {
  schema: {
    tags: ['device', 'relation', 'user'],
    summary: 'Activate relation between two id',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      type: 'object',
      required: ['scanId'],
      properties: {
        scanId: {
          description: 'Id for which barcode was scanned',
          type: 'string'
        }
      }
    }
  }
}

const askInfo = {
  schema: {
    tags: ['device', 'register', 'askinfo'],
    summary: 'Register ask info request',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      type: 'object',
      required: ['userId', 'question'],
      properties: {
        userId: {
          description: 'User id of registered user',
          type: 'string'
        },
        question: {
          description: 'Question which needs to made by GYM',
          type: 'string',
          minLength: 1
        }
      }
    }
  }
}

const passwordReset = {
  schema: {
    tags: ['device', 'password', 'reset'],
    summary: 'Password reset from device',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      type: 'object',
      required: ['profileId', 'password'],
      properties: {
        profileId: {
          description: 'Profile id for which password needs to be reset',
          type: 'string'
        },
        dob: {
          description: 'Date of birth (YYYYMMDD) of user',
          type: 'number',
          minLength: 8,
          maxLength: 8
        },
        password: password
      }
    }
  }
}

const addProfile = {
  schema: {
    tags: ['device', 'register', 'user'],
    summary: 'Register new user with valid email or phone no',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      type: 'object',
      required: ['firstname', 'lastname'],
      oneOf: [{ required: ['emails'] }, { required: ['mobilePhones'] }],
      properties: {
        firstname: {
          description: 'First Name of user',
          type: 'string'
        },
        lastname: {
          description: 'Last Name of user',
          type: 'string'
        },
        emails: {
          description: 'Email IDs of user',
          type: 'array',
          items: {
            type: 'object',
            properties: {
              email: { type: 'string', pattern: '[a-z0-9._%+!$&*=^|~#%{}/-]+@([a-z0-9-]+.){1,}([a-z]{2,22})' }
            }
          }
        },
        mobilePhones: {
          description: "user's Mobile no",
          type: 'array',
          items: {
            type: 'object',
            required: ['countryCode', 'prefixNumber', 'phoneNumber'],
            properties: {
              countryCode: { type: 'string' },
              prefixNumber: { type: 'string' },
              phoneNumber: { type: 'string' }
            }
          }
        }
      }
    }
  }

}

// const getDeviceStatus = {
//   schema: {
//     tags: ['company', 'device', 'status'],
//     summary: 'Get device status',
//     security: [
//       {
//         authorization: []
//       }
//     ],
//     body: {
//       type: 'object',
//       required: ['deviceIds'],
//       properties: {
//         deviceIds: {
//           description: 'Device Ids',
//           type: 'array',
//           minimum: 1,
//           items: {
//             type: 'string'
//           }
//         }
//       }
//     }
//   }
// }

module.exports = {
  deviceEdit,
  deviceAdd,
  deviceDelete,
  deviceReset,
  getDeviceByGymId,
  deviceLogin,
  emailSearch,
  phoneSearch,
  registerProfile,
  bookShift,
  cancelShift,
  askInfo,
  getQrCodeForDevice,
  getUserByQrCode,
  getUserInfoById,
  verifyUserRelation,
  createRelation,
  activateRelation,
  deviceScanAccess,
  updateProfile,
  passwordReset,
  addProfile,
  createGym,
  updateGym,
  acceptAndActivateRelation
  // getDeviceStatus
}
