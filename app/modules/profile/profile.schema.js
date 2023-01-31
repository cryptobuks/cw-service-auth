const { gender, supportedLanguage } = require('./profile.enum')
const { _ } = require('@cowellness/cw-micro-service')()
let { updateProfile, createProfile } = require('../company/company.schema')

const password = {
  type: 'string',
  description: 'Password in base64',
  pattern: '^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{4})$'
}

const emailValidation = {
  schema: {
    tags: ['profile', 'company', 'validate'],
    summary: 'Validate email address',
    params: {
      type: 'object',
      properties: {
        emailId: {
          type: 'string',
          description: 'User Email Id for verification'
        }
      }
    }
  }
}

const emailValidationAndRelation = {
  schema: {
    tags: ['profile', 'company', 'validate'],
    summary: 'Validate email address',
    params: {
      type: 'object',
      properties: {
        emailId: {
          type: 'string',
          description: 'User Email Id for verification'
        },
        profileId: {
          type: 'string',
          description: 'Gym profile id'
        }
      }
    }
  }
}

const genderList = {
  schema: {
    tags: ['profile'],
    summary: 'Get gender list'
  }
}

const statusList = {
  schema: {
    tags: ['profile'],
    summary: 'Get status list'
  }
}

const passwordResetVerify = {
  schema: {
    tags: ['profile', 'password-reset'],
    summary: 'verify reset token',
    body: {
      required: ['code', 'userId'],
      properties: {
        userId: {
          description: 'the user id to which the code belongs',
          type: 'string'
        },
        code: {
          description: 'code received in email, sms',
          type: 'string',
          minLength: 6,
          maxLength: 6
        }
      }
    }
  }
}

const passwordUpdate = {
  schema: {
    tags: ['profile', 'password-reset'],
    summary: 'Update password via token',
    body: {
      required: ['cwtoken', 'password'],
      properties: {
        password: password,
        cwtoken: {
          description: 'token for reset',
          type: 'string',
          minLength: 1
        }
      }
    }
  }
}

const tokenLogin = {
  schema: {
    tags: ['profile', 'password-reset'],
    summary: 'Update password via token',
    body: {
      required: ['cwtoken'],
      properties: {
        cwtoken: {
          description: 'token for reset',
          type: 'string',
          minLength: 1
        }
      }
    }
  }
}

const logout = {
  schema: {
    tags: ['profile', 'postlogin'],
    security: [
      {
        authorization: []
      }
    ],
    summary: 'logout user, will remove token cookie'
  }
}

const deviceLogout = {
  schema: {
    tags: ['profile', 'postlogin'],
    security: [
      {
        authorization: []
      }
    ],
    summary: 'logout device, will remove token cookie'
  }
}

const detail = {
  schema: {
    tags: ['profile', 'postlogin'],
    summary: 'will get login user profile',
    security: [
      {
        authorization: []
      }
    ]
  }
}

const refCWProfile = {
  schema: {
    tags: ['profile', 'postlogin'],
    summary: 'will get data of ref cowellness',
    security: [
      {
        authorization: []
      }
    ]
  }
}

const setPwa = {
  schema: {
    tags: ['profile', 'postlogin'],
    summary: 'set pwa installed',
    security: [
      {
        authorization: []
      }
    ]
  }
}

const refusePwa = {
  schema: {
    tags: ['profile', 'postlogin'],
    summary: 'refuse pwa',
    security: [
      {
        authorization: []
      }
    ]
  }
}

const currentProfile = {
  schema: {
    tags: ['profile', 'postlogin'],
    summary: 'will get login user profile and manager detail',
    security: [
      {
        authorization: []
      }
    ]
  }
}

const passwordResetEmail = {
  schema: {
    tags: ['profile', 'password-reset'],
    summary: 'Will allow user to reset password via EMAIL',
    body: {
      required: ['username'],
      properties: {
        username: {
          description: 'username (email) for identifying user',
          type: 'string',
          minLength: 1
        }
      }
    }
  }
}

const passwordResetPin = {
  schema: {
    tags: ['profile', 'password-reset'],
    summary: 'Will allow user to reset password via PIN',
    body: {
      required: ['pin'],
      properties: {
        pin: {
          description: 'user pin which identifies user',
          type: 'string',
          minLength: 1
        }
      }
    }
  }
}

const token = {
  schema: {
    tags: ['profile', 'token'],
    summary: 'Will allow user to set token',
    body: {
      required: ['cwtoken'],
      properties: {
        cwtoken: {
          description: 'the cwtoken',
          type: 'string',
          minLength: 1
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
      required: ['gymId', 'deviceId'],
      properties: {
        gymId: {
          description: 'gym for which barcode was scanned',
          type: 'string'
        },
        deviceId: {
          description: 'device id of gym which was scanned',
          type: 'string'
        }
      }
    }
  }
}

const passwordResetMobile = {
  schema: {
    tags: ['profile', 'password-reset'],
    summary: 'Will allow user to reset password via PhoneNo',
    body: {
      required: ['countryCode', 'phoneNumber', 'prefixNumber'],
      properties: {
        countryCode: {
          description: 'Country code of the mobile no',
          type: 'string',
          minLength: 1
        },
        prefixNumber: {
          description: 'Prefix number of the mobile no',
          type: 'string',
          minLength: 1
        },
        phoneNumber: {
          description: 'Mobile no',
          type: 'string',
          minLength: 1
        }
      }
    }
  }
}

const userLogin = {
  schema: {
    tags: ['profile', 'login'],
    summary: 'Login by email | mobile | pin',
    body: {
      required: ['userName', 'password', 'language'],
      properties: {
        userName: {
          description: 'username for login',
          type: 'string',
          minLength: 1
        },
        password: password,
        language: {
          description: 'user language',
          type: 'string',
          enum: supportedLanguage
        }
      }
    }
  }
}

const pinValidation = {
  schema: {
    tags: ['company', 'validate', 'postlogin'],
    summary: 'Validate pin id for uniqueness',
    security: [
      {
        authorization: []
      }
    ],
    params: {
      type: 'object',
      properties: {
        countryCode: {
          type: 'string',
          description: ' Country code of Pin'
        },
        id: {
          type: 'string',
          description: 'Pin id which needs to be validated'
        }
      }
    }
  }
}

const getQrCodeForProfile = {
  schema: {
    tags: ['profile', 'qrcode'],
    summary: 'Get Qrcode for profile',
    security: [
      {
        authorization: []
      }
    ],
    params: {
      type: 'object',
      properties: {
        profileId: {
          type: 'string',
          description: 'profile id of user for fetching QRcode, if not set will be using logged in user id'
        }
      }
    }
  }
}

const tinValidation = {
  schema: {
    tags: ['company', 'validate', 'postlogin'],
    summary: 'Validate tin id for uniqueness',
    security: [
      {
        authorization: []
      }
    ],
    params: {
      type: 'object',
      properties: {
        countryCode: {
          type: 'string',
          description: ' Country code of Tin'
        },
        id: {
          type: 'string',
          description: 'Tin id which needs to be validated'
        }
      }
    }
  }
}

const activateRole = {
  schema: {
    tags: ['profile', 'activaterole'],
    summary: 'used for activating role',
    security: [
      {
        authorization: []
      }
    ],
    params: {
      type: 'object',
      properties: {
        profileId: {
          type: 'string',
          description: 'profile id to which account needs to be switched'
        }
      }
    }
  }
}

const impersonateProfile = {
  schema: {
    tags: ['profile', 'impersonate'],
    summary: 'personate role for a profile',
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
          description: 'profile id to which account needs to be switched'
        }
      }
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

const register = {
  schema: {
    tags: ['profile'],
    summary: 'Register a new user',
    body: {
      type: 'object',
      required: ['person', 'password', 'settings', 'countryCode'],
      properties: {
        invitedBy: {
          description: 'Invited by profile id',
          type: 'string'
        },
        countryCode: {
          description: 'country code',
          type: 'string'
        },
        documents: {
          type: 'array',
          items: {
            required: ['documentId', 'source', 'ownerId', 'isMandatory', 'isAccepted'],
            type: 'object',
            properties: {
              documentId: {
                description: 'Document id for which document is accepted',
                type: 'string'
              },
              source: {
                description: 'Source if the document',
                type: 'string',
                enum: ['contract', 'setting']
              },
              ownerId: {
                description: 'Business owner id for which document was created',
                type: 'string'
              },
              isMandatory: {
                type: 'boolean'
              },
              isAccepted: {
                type: 'boolean',
                description: 'Is the document accepted by user'
              }
            }
          }
        },
        person: {
          type: 'object',
          required: ['birth'],
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
            gender: {
              description: 'Gender of user',
              type: 'string',
              enum: gender
            },
            birth: {
              description: 'Birth date of user',
              type: 'object',
              required: ['date'],
              properties: {
                date: {
                  type: 'number',
                  minLength: 8,
                  maxLength: 8
                }
              }
            },
            mobilePhones: {
              description: "user's Mobile no",
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  countryCode: { type: 'string' },
                  prefixNumber: { type: 'string' },
                  phoneNumber: { type: 'string' }
                }
              }
            }
          }
        },
        settings: {
          type: 'object',
          required: ['language'],
          properties: {
            language: {
              type: 'string',
              minLength: 1,
              maxLength: 3
            }
          }
        },
        password: password
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

const activateRelation = {
  schema: {
    tags: ['profile', 'relation', 'user'],
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

const createRelation = {
  schema: {
    tags: ['PROFILE', 'relation', 'user'],
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

const mobileValidation = {
  schema: {
    tags: ['profile', 'company', 'validate'],
    summary: 'Validate Mobile No',
    body: {
      required: ['countryCode', 'prefixNumber', 'phoneNumber'],
      properties: {
        countryCode: {
          description: 'Country code of the mobile no',
          type: 'string',
          minLength: 1
        },
        prefixNumber: {
          description: 'prefix number of mobile',
          type: 'string',
          minLength: 1
        },
        phoneNumber: {
          description: 'Mobile no',
          type: 'string',
          minLength: 1
        }
      }
    }
  }
}

const mobileValidationAndRelation = {
  schema: {
    tags: ['profile', 'company', 'validate'],
    summary: 'Validate Mobile No',
    params: {
      type: 'object',
      properties: {
        profileId: {
          type: 'string',
          description: 'Gym profile id'
        }
      }
    },
    body: {
      required: ['countryCode', 'prefixNumber', 'phoneNumber'],
      properties: {
        countryCode: {
          description: 'Country code of the mobile no',
          type: 'string',
          minLength: 1
        },
        prefixNumber: {
          description: 'prefix number of mobile',
          type: 'string',
          minLength: 1
        },
        phoneNumber: {
          description: 'Mobile no',
          type: 'string',
          minLength: 1
        }
      }
    }
  }
}

const tokenSchema = {
  type: 'object',
  required: ['token'],
  properties: {
    token: { type: 'string', description: 'token string for verification' }
  }
}

const exportCSV = {
  schema: {
    tags: ['profile', 'company', 'export'],
    summary: 'Export related profiles',
    security: [
      {
        authorization: []
      }
    ]
  }
}

const importCSV = {
  schema: {
    tags: ['profile', 'company', 'export'],
    summary: 'Import profiles',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      required: ['content'],
      properties: {
        content: {
          description: 'csv content',
          type: 'string'
        }
      }
    }
  }
}

const getBackgroundList = {
  schema: {
    tags: ['profile', 'background', 'image'],
    summary: 'Get background image list',
    security: [
      {
        authorization: []
      }
    ],
    body: {

    }
  }
}

const getBackgroundImageById = {
  schema: {
    tags: ['profile', 'background', 'image'],
    summary: 'Get background image by id',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      required: ['id'],
      properties: {
        id: {
          description: 'Id of image you need to fetch',
          type: 'string',
          minLength: 1
        }
      }
    }
  }
}

const setbackground = {
  schema: {
    tags: ['profile', 'background', 'image'],
    summary: 'Set background image',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      required: ['profileId', 'backgroundId'],
      properties: {
        profileId: {
          description: 'profile id of the user',
          type: 'string',
          minLength: 1
        },
        backgroundId: {
          description: 'background image id',
          type: 'string',
          minLength: 1
        }
      }
    }
  }
}

updateProfile = _.cloneDeep(updateProfile)
updateProfile.schema.body.properties.password = password

createProfile = _.cloneDeep(createProfile)
createProfile.schema.body.properties.password = password

const acceptAndActivateRelation = {
  schema: {
    tags: ['contract', 'documents', 'accept', 'activate'],
    summary: 'accept and activate profile',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      type: 'object',
      required: ['profileId', 'documents', 'reAccepted'],
      properties: {
        profileId: {
          description: 'Profile id of the user IN / TU',
          type: 'string'
        },
        deviceId: {
          type: 'string',
          description: 'deviceId on which this was accepted'
        },
        sign: {
          type: 'string',
          typeof: 'Base64',
          description: 'Signed image in base64'
        },
        reAccepted: {
          type: 'array',
          description: 'ids of signed document which were rejected earlier but accepted now',
          items: {
            type: 'string'
          }
        },
        documents: {
          type: 'array',
          items: {
            required: ['documentId', 'source', 'ownerId', 'isMandatory', 'isAccepted'],
            type: 'object',
            properties: {
              documentId: {
                description: 'Document id for which document is accepted',
                type: 'string'
              },
              source: {
                description: 'Source if the document',
                type: 'string',
                enum: ['contract', 'setting']
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
              ownerId: {
                description: 'Business owner id for which document was created',
                type: 'string'
              }
            }
          }
        }
      }
    }
  }
}
const emancipationAge = {
  schema: {
    tags: ['user'],
    summary: 'Get emancipation age',
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
          description: 'country code',
          type: 'string'
        },
        invitedBy: {
          description: 'Invited by profile id',
          type: 'string'
        }
      }
    }
  }
}

const setDistanceFormat = {
  schema: {
    tags: ['profile', 'distance', 'format'],
    summary: 'Set distance format for profile ',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      required: ['value'],
      properties: {
        value: {
          description: 'distance format',
          type: 'string',
          enum: ['km', 'mi']
        }
      }
    }
  }
}

const setTemperatureFormat = {
  schema: {
    tags: ['profile', 'temperature', 'format'],
    summary: 'Set temperature format for profile ',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      required: ['value'],
      properties: {
        value: {
          description: 'temperature format',
          type: 'string',
          enum: ['C', 'F']
        }
      }
    }
  }
}

const setNumberFormat = {
  schema: {
    tags: ['profile', 'number', 'format'],
    summary: 'Set number format for profile ',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      required: ['value'],
      properties: {
        value: {
          description: 'temperature format',
          type: 'string'
        }
      }
    }
  }
}

const setLanguage = {
  schema: {
    tags: ['profile', 'language'],
    summary: 'Set language ',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      required: ['value'],
      properties: {
        value: {
          description: 'language code',
          type: 'string',
          enum: supportedLanguage
        }
      }
    }
  }
}

const setDateFormat = {
  schema: {
    tags: ['profile', 'date', 'format'],
    summary: 'Set date format for profile ',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      required: ['value'],
      properties: {
        value: {
          description: 'date format',
          type: 'string'
        }
      }
    }
  }
}

const setWeightFormat = {
  schema: {
    tags: ['profile', 'weight', 'format'],
    summary: 'Set weight format for profile ',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      required: ['value'],
      properties: {
        value: {
          description: 'weight format',
          type: 'string',
          enum: ['kg', 'lb']
        }
      }
    }
  }
}

const setNotification = {
  schema: {
    tags: ['profile', 'notification'],
    summary: 'Set notification for email and sms ',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      required: ['email', 'sms'],
      properties: {
        email: {
          description: 'email values',
          type: 'boolean'
        },
        sms: {
          description: 'sms value',
          type: 'boolean'
        }
      }
    }
  }
}

module.exports = {
  emailValidation,
  register,
  genderList,
  statusList,
  userLogin,
  logout,
  deviceLogout,
  mobileValidation,
  detail,
  refCWProfile,
  passwordResetEmail,
  passwordResetMobile,
  passwordResetVerify,
  passwordUpdate,
  tokenSchema,
  pinValidation,
  tinValidation,
  activateRole,
  activateRelation,
  getQrCodeForProfile,
  getUserInfoById,
  verifyUserRelation,
  currentProfile,
  deviceScanAccess,
  createRelation,
  updateProfile,
  createProfile,
  password,
  exportCSV,
  importCSV,
  acceptAndActivateRelation,
  emailValidationAndRelation,
  mobileValidationAndRelation,
  getBackgroundList,
  setbackground,
  getBackgroundImageById,
  setPwa,
  token,
  refusePwa,
  emancipationAge,
  setLanguage,
  setDistanceFormat,
  setTemperatureFormat,
  setNumberFormat,
  setDateFormat,
  setWeightFormat,
  setNotification,
  tokenLogin,
  passwordResetPin,
  impersonateProfile
}
