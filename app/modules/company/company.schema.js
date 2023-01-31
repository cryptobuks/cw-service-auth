const { gender, roles, status, GYM, italianCompanyType, taxRegime, channelSource, channelAdv } = require('../profile/profile.enum')
const { periods, variables, targets, allowedRoles } = require('../payroll/payroll.enum')
const { _ } = require('@cowellness/cw-micro-service')()

const searchCompanyByName = {
  schema: {
    tags: ['company', 'search', 'postlogin'],
    summary: 'Search Company by text',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      type: 'object',
      properties: {
        company: {
          type: 'string',
          description: 'Text search on company name'
        }
      }
    }
  }
}

const manageCountries = {
  schema: {
    tags: ['company', 'manage', 'postlogin'],
    summary: 'Get list of countries based on business profile',
    security: [
      {
        authorization: []
      }
    ]
  }
}

const getGymById = {
  schema: {
    tags: ['company', 'manage', 'postlogin'],
    summary: 'Get GYM by Id',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      type: 'object',
      required: ['_id'],
      properties: {
        _id: {
          type: 'string'
        }
      }
    }
  }
}

const getGymGroup = {
  schema: {
    tags: ['company', 'gym', 'group'],
    summary: 'Get group gym',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      type: 'object',
      required: ['parentId'],
      properties: {
        parentId: {
          type: 'string'
        }
      }
    }
  }
}

const getGymList = {
  schema: {
    tags: ['company', 'manage', 'postlogin'],
    summary: 'Get GYM by Id',
    security: [
      {
        authorization: []
      }
    ],
    body: {

    }
  }
}

const getCompanyDetail = {
  schema: {
    tags: ['company', 'Details', 'postlogin'],
    summary: 'Get company details by ID',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      type: 'object',
      properties: {
        companyId: {
          type: 'string',
          description: 'Company ID for search'
        }
      }
    }
  }
}

const getUserDetail = {
  schema: {
    tags: ['user', 'Details', 'postlogin'],
    summary: 'Get user details by ID',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User ID for search'
        }
      }
    }
  }
}

const getProfileDetail = {
  schema: {
    tags: ['profile', 'Details', 'postlogin'],
    summary: 'Get profile details by ID',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'profile ID for search'
        }
      }
    }
  }
}

const vatValidation = {
  schema: {
    tags: ['company', 'validate', 'postlogin'],
    summary: 'Validate vat id for uniqueness',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      type: 'object',
      required: ['id', 'countryCode'],
      properties: {
        id: {
          type: 'string',
          description: 'Vat id which needs to be validated'
        },
        countryCode: {
          type: 'string',
          description: ' Country code of Vat'
        }
      }
    }
  }
}

const vatGetDetail = {
  schema: {
    tags: ['company', 'Details', 'postlogin'],
    summary: 'Get company detail by vat id',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      type: 'object',
      required: ['id', 'countryCode'],
      properties: {
        id: {
          type: 'string',
          description: 'Vat id which needs to be searched'
        },
        countryCode: {
          type: 'string',
          description: ' Country code of Vat'
        }
      }
    }
  }
}

const vatSearch = {
  schema: {
    tags: ['company', 'search', 'postlogin'],
    summary: 'Get companies detail by vat id wild card search',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      type: 'object',
      required: ['id', 'countryCode'],
      properties: {
        id: {
          type: 'string',
          description: 'Vat id which needs to be searched'
        },
        countryCode: {
          type: 'string',
          description: ' Country code of Vat'
        }
      }
    }
  }
}

const uploadFile = {
  schema: {
    tags: ['company', 'upload', 'postlogin'],
    summary: 'Upload Gym Profile Picture',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      type: 'object',
      required: ['filename', 'base64'],
      properties: {
        filename: {
          type: 'string'
        },
        base64: {
          type: 'string',
          typeof: 'Base64'
        }
      }
    }
  }
}

const uploadUserFile = {
  schema: {
    tags: ['company', 'upload', 'postlogin'],
    summary: 'Upload user specific profile',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      type: 'object',
      required: ['filename', 'base64', 'id'],
      properties: {
        id: {
          type: 'string',
          description: 'User id on which profile needs to be uploaded'
        },
        filename: {
          type: 'string'
        },
        base64: {
          type: 'string',
          typeof: 'Base64'
        }
      }
    }
  }
}

const fiscalValidation = {
  schema: {
    tags: ['company', 'validate', 'postlogin'],
    summary: 'Validate fiscal id for uniqueness',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      type: 'object',
      required: ['id', 'countryCode'],
      properties: {
        id: {
          type: 'string',
          description: 'Fiscal id which needs to be validated'
        },
        countryCode: {
          type: 'string',
          description: ' Country code of fiscal'
        }
      }
    }
  }
}

const fiscalGetDetail = {
  schema: {
    tags: ['company', 'Details', 'postlogin'],
    summary: 'Get company details by fiscal id',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      type: 'object',
      required: ['id', 'countryCode'],
      properties: {
        id: {
          type: 'string',
          description: 'Fiscal id which needs to be searched'
        },
        countryCode: {
          type: 'string',
          description: ' Country code of fiscal'
        }
      }
    }
  }
}

const userGetDetailByEmail = {
  schema: {
    tags: ['company', 'Details', 'postlogin'],
    summary: 'Get User details by email id',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Email id which needs to be searched'
        }
      }
    }
  }
}

const userGetDetailByPin = {
  schema: {
    tags: ['company', 'Details', 'postlogin'],
    summary: 'Get User details by pin',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      type: 'object',
      required: ['id', 'countryCode'],
      properties: {
        id: {
          type: 'string',
          description: 'Pin which needs to be searched'
        },
        countryCode: {
          type: 'string',
          description: ' Country code of Pin'
        }
      }
    }
  }
}

const userGetDetailByTin = {
  schema: {
    tags: ['company', 'Details', 'postlogin'],
    summary: 'Get User details by Tin',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      type: 'object',
      required: ['id', 'countryCode'],
      properties: {
        id: {
          type: 'string',
          description: 'Tin which needs to be searched'
        },
        countryCode: {
          type: 'string',
          description: ' Country code of Tin'
        }
      }
    }
  }
}

const userGetDetailByMobile = {
  schema: {
    tags: ['company', 'Details', 'postlogin'],
    summary: 'Get User details by Mobile',
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

const bankAdd = {
  schema: {
    tags: ['company', 'bank', 'save', 'postlogin'],
    summary: 'Save bank details for company',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      type: 'object',
      required: ['details', 'forId'],
      properties: {
        forId: {
          type: 'string'
        },
        details: {
          type: 'object',
          properties: {
            name: {
              description: 'Name of the bank',
              type: 'string'
            },
            countryCode: {
              description: 'Country code for bank',
              type: 'string'
            },
            iban: {
              description: 'IBAN number for bank',
              type: 'string'
            },
            account: {
              description: 'Account of the bank',
              type: 'string'
            },
            bic: {
              description: 'bic for bank',
              type: 'string'
            },
            owner: {
              description: 'owner for bank',
              type: 'string'
            },
            isActive: {
              description: 'Is bank account account',
              type: 'boolean',
              default: true
            },
            routingNumber: {
              type: 'string'
            }
          }
        }
      }
    }
  }
}

const createProfile = {
  schema: {
    tags: ['profile'],
    summary: 'Register a new user with different roles',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      type: 'object',
      required: ['person', 'typeCode'],
      properties: {
        avatar: {
          type: 'object',
          required: ['filename', 'base64'],
          properties: {
            filename: {
              type: 'string'
            },
            base64: {
              type: 'string',
              typeof: 'Base64'
            }
          }
        },
        typeCode: {
          type: 'string',
          enum: ['IN', 'TU']
        },
        shortDescription: {
          type: 'string',
          maxLength: 160
        },
        ids: {
          type: 'array',
          items: {
            type: 'object',
            required: ['countryCode', 'value', 'key'],
            properties: {
              countryCode: { type: 'string' },
              value: { type: 'string' },
              key: { type: 'string', enum: ['pin', 'tin'] }
            }
          }
        },
        interests: {
          type: 'array',
          items: {
            type: 'string',
            description: 'ObjectId of setting service interest'
          }
        },
        suggestedInterest: {
          type: 'array',
          items: {
            type: 'string',
            description: 'ObjectId of setting service interest'
          }
        },
        tutors: {
          type: 'array',
          items: {
            type: 'string',
            description: 'Object id of tutor who needs to be associated'
          }
        },
        cwSalesman: {
          type: 'string'
        },
        notes: {
          type: 'string'
        },
        vatRateId: {
          type: 'string'
        },
        paymentTermId: {
          type: 'string'
        },
        acquisitionChannel: {
          type: 'object',
          required: ['source'],
          properties: {
            source: {
              type: 'string',
              enum: channelSource
            },
            advType: {
              type: 'string',
              enum: channelAdv
            },
            friendId: {
              type: 'string'
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
        person: {
          type: 'object',
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
              properties: {
                date: {
                  type: 'number',
                  minLength: 8,
                  maxLength: 8,
                  description: 'Format used here is YYYYMMDD'
                },
                country: {
                  type: 'string'
                },
                city: {
                  type: 'string'
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
            },
            phones: {
              description: "user's phone no",
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
            },
            onlineLinks: {
              type: 'array',
              items: {
                type: 'object',
                required: ['type', 'link'],
                properties: {
                  type: {
                    type: 'string'
                  },
                  link: {
                    type: 'string'
                  }
                }
              }
            },
            addresses: {
              type: 'array',
              items: {
                type: 'object',
                required: ['addressComponents', 'fulladdress', 'location', 'type'],
                properties: {
                  type: {
                    type: 'string'
                  },
                  addressComponents: {
                    type: 'object'
                  },
                  fulladdress: {
                    type: 'string'
                  },
                  zipcode: {
                    type: 'string'
                  },
                  location: {
                    type: 'object',
                    required: ['lat', 'lng'],
                    properties: {
                      lat: {
                        type: 'number'
                      },
                      lng: {
                        type: 'number'
                      }
                    }
                  }
                }
              }
            },
            banks: {
              type: 'array',
              items: {
                type: 'object',
                properties: bankAdd.schema.body.properties.details.properties
              }
            }
          }
        }
      }
    }
  }
}

const updateProfile = _.cloneDeep(createProfile)
updateProfile.schema.body.required.push('_id')
updateProfile.schema.body.properties._id = { type: 'string' }

const bankClone = _.cloneDeep(bankAdd.schema.body.properties.details.properties)
bankClone.id = {
  type: 'string',
  description: 'parent bank id which was selected, Will only be considered with typeCode GU'
}

const createGym = {
  schema: {
    tags: ['company', 'bank', 'save', 'postlogin'],
    summary: 'Create a gym',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      type: 'object',
      required: ['company', 'status', 'settings', 'typeCode'],
      properties: {
        status: {
          type: 'string',
          enum: ['draft', 'temporary']
        },
        typeCode: {
          type: 'string',
          enum: GYM
        },
        parentId: {
          type: 'string',
          description: 'parentId of the gym created'
        },
        managedCountries: {
          type: 'array',
          description: 'Only required in case of typeCode CW or CU',
          items: {
            type: 'object',
            required: ['countryCode'],
            additionalProperties: false,
            properties: {
              countryCode: {
                type: 'string'
              }
            }
          }
        },
        avatar: {
          type: 'object',
          required: ['filename', 'base64'],
          properties: {
            filename: {
              type: 'string'
            },
            base64: {
              type: 'string',
              typeof: 'Base64'
            }
          }
        },
        ids: {
          type: 'array',
          items: {
            type: 'object',
            required: ['countryCode', 'value', 'key'],
            properties: {
              countryCode: { type: 'string' },
              value: { type: 'string' },
              key: { type: 'string', enum: ['vat', 'fiscal'] }
            }
          }
        },
        shortDescription: {
          type: 'string',
          maxLength: 160
        },
        cwSalesman: {
          type: 'string'
        },
        notes: {
          type: 'string'
        },
        company: {
          type: 'object',
          properties: {
            name: {
              type: 'string'
            },
            sdi: {
              type: 'string'
            },
            roles: {
              type: 'array',
              items: {
                type: 'object',
                required: ['id', 'role'],
                properties: {
                  id: {
                    type: 'string'
                  },
                  startAt: {
                    type: 'number',
                    maxLength: 8,
                    minLength: 8
                  },
                  role: {
                    type: 'string',
                    enum: roles
                  },
                  endAt: {
                    type: 'number',
                    maxLength: 8,
                    minLength: 8
                  }
                }
              }
            },
            countryFields: {
              type: 'object',
              properties: {
                it: {
                  type: 'object',
                  properties: {
                    companyType: {
                      type: 'string',
                      enum: italianCompanyType
                    },
                    codiceAteco: {
                      type: 'array',
                      items: {
                        type: 'string'
                      }
                    },
                    taxRegime: {
                      type: 'string',
                      enum: taxRegime
                    },
                    rea: {
                      type: 'array',
                      items: {
                        type: 'string'
                      }
                    }
                  }
                }
              }
            },
            cwModules: {
              type: 'array',
              items: {
                type: 'object',
                required: ['area', 'isActive'],
                properties: {
                  area: {
                    type: 'string'
                  },
                  isActive: {
                    type: 'boolean'
                  },
                  paidByGroup: {
                    type: 'boolean'
                  },
                  contactsCount: {
                    type: 'number'
                  },
                  discounts: {
                    type: 'array',
                    items: {
                      type: 'object',
                      required: ['discount'],
                      properties: {
                        discount: {
                          type: 'number'
                        },
                        startDt: {
                          type: 'number',
                          maxLength: 8,
                          minLength: 8,
                          description: 'Format used here is YYYYMMDD'
                        },
                        endDt: {
                          type: 'number',
                          maxLength: 8,
                          minLength: 8,
                          description: 'Format used here is YYYYMMDD'
                        }
                      }
                    }
                  }
                }
              }
            },
            pec: {
              type: 'string',
              pattern: '[a-z0-9._%+!$&*=^|~#%{}/-]+@([a-z0-9-]+.){1,}([a-z]{2,22})'
            },
            brand: {
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
              description: 'company Mobile no',
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
            },
            credits: {
              type: 'array',
              items: {
                type: 'object',
                required: ['credit'],
                properties: {
                  credit: {
                    type: 'number'
                  },
                  startDt: {
                    type: 'number',
                    maxLength: 8,
                    minLength: 8,
                    description: 'Format used here is YYYYMMDD'
                  },
                  endDt: {
                    type: 'number',
                    maxLength: 8,
                    minLength: 8,
                    description: 'Format used here is YYYYMMDD'
                  }
                }
              }
            },
            addresses: {
              type: 'array',
              items: {
                type: 'object',
                required: ['addressComponents', 'fulladdress', 'location', 'type'],
                properties: {
                  type: {
                    type: 'string'
                  },
                  addressComponents: {
                    type: 'object'
                  },
                  fulladdress: {
                    type: 'string'
                  },
                  zipcode: {
                    type: 'string'
                  },
                  location: {
                    type: 'object',
                    required: ['lat', 'lng'],
                    properties: {
                      lat: {
                        type: 'number'
                      },
                      lng: {
                        type: 'number'
                      }
                    }
                  }
                }
              }
            },
            landlines: {
              description: 'Company landline',
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
            },
            vatRateId: {
              type: 'string'
            },
            onlineLinks: {
              type: 'array',
              items: {
                type: 'object',
                required: ['type', 'link'],
                properties: {
                  type: {
                    type: 'string'
                  },
                  link: {
                    type: 'string'
                  }
                }
              }
            },
            balanceSheet: {
              type: 'object',
              required: ['startDate'],
              properties: {
                startDate: {
                  type: 'number',
                  maxLength: 8,
                  minLength: 8,
                  description: 'Format used here is YYYYMMDD'
                }
              }
            },
            banks: {
              type: 'array',
              items: {
                type: 'object',
                properties: bankClone
              }
            },
            mailInChat: {
              type: 'object',
              properties: {
                alias: {
                  type: 'string'
                }
              }
            },
            chatPluginSettings: {
              type: 'object'
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
        }
      }
    }
  }
}

const createCompany = {
  schema: {
    tags: ['company', 'gym', 'save', 'postlogin'],
    summary: 'Quick Create a gym',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      type: 'object',
      required: ['company', 'status', 'settings', 'typeCode'],
      properties: {
        status: {
          type: 'string',
          enum: ['draft', 'temporary']
        },
        typeCode: {
          type: 'string',
          enum: ['CO']
        },
        avatar: {
          type: 'object',
          required: ['filename', 'base64'],
          properties: {
            filename: {
              type: 'string'
            },
            base64: {
              type: 'string',
              typeof: 'Base64'
            }
          }
        },
        ids: {
          type: 'array',
          items: {
            type: 'object',
            required: ['countryCode', 'value', 'key'],
            properties: {
              countryCode: { type: 'string' },
              value: { type: 'string' },
              key: { type: 'string', enum: ['vat', 'fiscal'] }
            }
          }
        },
        shortDescription: {
          type: 'string',
          maxLength: 160
        },
        cwSalesman: {
          type: 'string'
        },
        notes: {
          type: 'string'
        },
        paymentTermId: {
          type: 'string'
        },
        company: {
          type: 'object',
          properties: {
            name: {
              type: 'string'
            },
            sdi: {
              type: 'string'
            },
            roles: {
              type: 'array',
              items: {
                type: 'object',
                required: ['id', 'role'],
                properties: {
                  id: {
                    type: 'string'
                  },
                  startAt: {
                    type: 'number',
                    maxLength: 8,
                    minLength: 8
                  },
                  role: {
                    type: 'string',
                    enum: roles
                  },
                  endAt: {
                    type: 'number',
                    maxLength: 8,
                    minLength: 8
                  }
                }
              }
            },
            pec: {
              type: 'string',
              pattern: '[a-z0-9._%+!$&*=^|~#%{}/-]+@([a-z0-9-]+.){1,}([a-z]{2,22})'
            },
            brand: {
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
              description: 'company Mobile no',
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
            },
            addresses: {
              type: 'array',
              items: {
                type: 'object',
                required: ['addressComponents', 'fulladdress', 'location', 'type'],
                properties: {
                  type: {
                    type: 'string'
                  },
                  addressComponents: {
                    type: 'object'
                  },
                  fulladdress: {
                    type: 'string'
                  },
                  zipcode: {
                    type: 'string'
                  },
                  location: {
                    type: 'object',
                    required: ['lat', 'lng'],
                    properties: {
                      lat: {
                        type: 'number'
                      },
                      lng: {
                        type: 'number'
                      }
                    }
                  }
                }
              }
            },
            landlines: {
              description: 'Company landline',
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
            },
            vatRateId: {
              type: 'string'
            },
            onlineLinks: {
              type: 'array',
              items: {
                type: 'object',
                required: ['type', 'link'],
                properties: {
                  type: {
                    type: 'string'
                  },
                  link: {
                    type: 'string'
                  }
                }
              }
            },
            banks: {
              type: 'array',
              items: {
                type: 'object',
                properties: bankClone
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
        }
      }
    }
  }
}

const updateGym = _.cloneDeep(createGym)
updateGym.schema.body.required.push('_id')
updateGym.schema.body.properties._id = { type: 'string' }

const updateCompany = {
  schema: {
    tags: ['company', 'gym', 'save', 'postlogin'],
    summary: 'Update gym with minimum fields',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      type: 'object',
      required: ['company', 'status', 'settings'],
      properties: {
        avatar: {
          type: 'object',
          required: ['filename', 'base64'],
          properties: {
            filename: {
              type: 'string'
            },
            base64: {
              type: 'string',
              typeof: 'Base64'
            }
          }
        },
        ids: {
          type: 'array',
          items: {
            type: 'object',
            required: ['countryCode', 'value', 'key'],
            properties: {
              countryCode: { type: 'string' },
              value: { type: 'string' },
              key: { type: 'string', enum: ['vat', 'fiscal'] }
            }
          }
        },
        shortDescription: {
          type: 'string',
          maxLength: 160
        },
        cwSalesman: {
          type: 'string'
        },
        notes: {
          type: 'string'
        },
        paymentTermId: {
          type: 'string'
        },
        company: {
          type: 'object',
          properties: {
            name: {
              type: 'string'
            },
            sdi: {
              type: 'string'
            },
            pec: {
              type: 'string',
              pattern: '[a-z0-9._%+!$&*=^|~#%{}/-]+@([a-z0-9-]+.){1,}([a-z]{2,22})'
            },
            brand: {
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
              description: 'company Mobile no',
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
            },
            addresses: {
              type: 'array',
              items: {
                type: 'object',
                required: ['addressComponents', 'fulladdress', 'location', 'type'],
                properties: {
                  type: {
                    type: 'string'
                  },
                  addressComponents: {
                    type: 'object'
                  },
                  fulladdress: {
                    type: 'string'
                  },
                  zipcode: {
                    type: 'string'
                  },
                  location: {
                    type: 'object',
                    required: ['lat', 'lng'],
                    properties: {
                      lat: {
                        type: 'number'
                      },
                      lng: {
                        type: 'number'
                      }
                    }
                  }
                }
              }
            },
            landlines: {
              description: 'Company landline',
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
            },
            vatRateId: {
              type: 'string'
            },
            onlineLinks: {
              type: 'array',
              items: {
                type: 'object',
                required: ['type', 'link'],
                properties: {
                  type: {
                    type: 'string'
                  },
                  link: {
                    type: 'string'
                  }
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
        }
      }
    }
  }
}

const bankDelete = {
  schema: {
    tags: ['company', 'bank', 'save', 'postlogin'],
    summary: 'Delete bank details for company',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      type: 'object',
      required: ['id', 'forId'],
      properties: {
        forId: {
          type: 'string'
        },
        id: {
          type: 'string',
          description: 'Bank account id which needs to be deleted'
        }
      }
    }
  }
}

const validInChatAlias = {
  schema: {
    tags: ['company', 'validate', 'postlogin'],
    summary: 'Validate in chat alias',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      type: 'object',
      required: ['text'],
      properties: {
        text: {
          type: 'string',
          description: 'Text which needs to be validated for alias'
        }
      }
    }
  }
}

const getBank = {
  schema: {
    tags: ['company', 'bank', 'postlogin'],
    summary: 'Get all the bank associate to user company',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      type: 'object'
    }
  }
}

const bankEdit = {
  schema: {
    tags: ['company', 'bank', 'save', 'postlogin'],
    summary: 'Save bank details for company',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      type: 'object',
      required: ['forId', 'details'],
      properties: {
        forId: {
          type: 'string'
        },
        details: {
          type: 'object',
          required: ['id'],
          properties: {
            id: {
              type: 'string',
              description: 'Bank account id which needs to be updated'
            },
            name: {
              description: 'Name of the bank',
              type: 'string'
            },
            countryCode: {
              description: 'Country code for bank',
              type: 'string'
            },
            iban: {
              description: 'IBAN number for bank',
              type: 'string'
            },
            account: {
              description: 'Account of the bank',
              type: 'string'
            },
            bic: {
              description: 'bic for bank',
              type: 'string'
            },
            owner: {
              description: 'owner for bank',
              type: 'string'
            },
            isActive: {
              description: 'Is bank account account',
              type: 'boolean'
            },
            routingNumber: {
              type: 'string'
            }
          }
        }

      }
    }
  }
}

const changeCompanyStatus = {
  schema: {
    tags: ['company', 'status', 'postlogin'],
    summary: 'Set status for company',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      type: 'object',
      required: ['id', 'status'],
      properties: {
        id: {
          type: 'string',
          description: 'company id which status needs to be updated'
        },
        status: {
          type: 'string',
          description: 'status which needs to be upated',
          enum: status
        }
      }
    }
  }
}

const deleteGymById = {
  schema: {
    tags: ['company', 'delete', 'postlogin'],
    summary: 'Delete GYM by id',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      type: 'object',
      required: ['_id'],
      properties: {
        _id: {
          type: 'string',
          description: 'GYM id which needs to deleted'
        }
      }
    }
  }
}

const reactivateGym = {
  schema: {
    tags: ['company', 'reactivate', 'postlogin'],
    summary: 'Reactivate GYM by ID',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      type: 'object',
      required: ['_id'],
      properties: {
        _id: {
          type: 'string',
          description: 'GYM id which needs to be activated'
        }
      }
    }
  }
}

const searchUser = {
  schema: {
    tags: ['company', 'search', 'postlogin'],
    summary: 'search user by first name, last name, email, mobile or pin',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      type: 'object',
      required: ['text'],
      properties: {
        text: {
          type: 'string',
          description: 'text which needs to be searched',
          minLength: 2
        }
      }
    }
  }
}

const searchProfile = {
  schema: {
    tags: ['company', 'search', 'postlogin'],
    summary: 'search user / company by first name, last name, email, address, mobile or pin',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      type: 'object',
      required: ['text'],
      properties: {
        text: {
          type: 'string',
          description: 'text which needs to be searched',
          minLength: 2
        }
      }
    }
  }
}

const gymBusinessUsers = {
  schema: {
    tags: ['company', 'gym', 'businessUser'],
    summary: 'company business user, only director can access this api',
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
          description: 'gymid for which business user are required',
          minLength: 1
        }
      }
    }
  }
}

const gymUnassignedUser = {
  schema: {
    tags: ['company', 'gym', 'businessUser'],
    summary: 'company business user, only director can access this api',
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
          description: 'gymid for which business user are required',
          minLength: 1
        }
      }
    }
  }
}

const assignProfile = {
  schema: {
    tags: ['company', 'gym', 'assign'],
    summary: 'assign a profile to SA / TR',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      type: 'object',
      required: ['gymId', 'toProfile', 'profileId', 'role'],
      properties: {
        gymId: {
          type: 'string',
          description: 'gymid for which business user are required',
          minLength: 1
        },
        toProfile: {
          type: 'string',
          description: 'SA / TR profile to assign contact',
          minLength: 1
        },
        profileId: {
          type: 'string',
          description: 'IN / TU profile to be assigned',
          minLength: 1
        },
        role: {
          type: 'string',
          description: 'User role TR / SA',
          enum: ['PT', 'CT', 'SA']
        }
      }
    }
  }
}

const unassignProfile = {
  schema: {
    tags: ['company', 'gym', 'businessUser'],
    summary: 'unassign a profile for SA / TR',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      type: 'object',
      required: ['gymId', 'toProfile', 'profileId', 'role'],
      properties: {
        gymId: {
          type: 'string',
          description: 'gymid for which business user are required',
          minLength: 1
        },
        toProfile: {
          type: 'string',
          description: 'SA / TR profile to assign contact',
          minLength: 1
        },
        profileId: {
          type: 'string',
          description: 'IN / TU profile to be assigned',
          minLength: 1
        },
        role: {
          type: 'string',
          description: 'User role PT / CT / SA',
          enum: ['PT', 'CT', 'SA']
        }
      }
    }
  }
}

const sendToDevice = {
  schema: {
    tags: ['company', 'sendTo', 'device'],
    summary: 'Send data to gym device for processing',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      type: 'object',
      required: ['gymId', 'deviceId', 'action', 'data'],
      properties: {
        gymId: {
          type: 'string',
          description: 'Gym id for which information needs to be send'
        },
        deviceId: {
          type: 'string',
          description: 'Device id on which this information needs to send'
        },
        action: {
          type: 'string',
          description: 'Name of the action which needs to executed'
        },
        data: {
          type: 'object',
          description: 'Free object area, data will be forwarded to Device without any processing or validation'
        }
      }
    }
  }
}

const assignParentId = {
  schema: {
    tags: ['company', 'assign', 'parent'],
    summary: 'Assign parent to gyms',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      type: 'object',
      required: ['parentGymId', 'gymIds'],
      properties: {
        parentGymId: {
          type: 'string',
          description: 'parent id of gym which needs to be assigned'
        },
        gymIds: {
          type: 'array',
          items: {
            type: 'string',
            description: 'Gym ids which needs to be mapped'
          },
          minLength: 1
        }
      }
    }
  }
}

const profileDetail = {
  type: 'object',
  required: ['businessId', 'profileId'],
  properties: {
    profileId: { type: 'string', description: 'profile id for which details needs to be checked' },
    fields: { type: 'string', description: 'fields which needs to be returned' }
  }
}

const removeGymParent = {
  schema: {
    tags: ['company', 'remove', 'parent'],
    summary: 'Remove parent for gym',
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
          description: 'Gym id for which parent needs to be removed'
        }
      }
    }
  }
}

const bulkProfileChanges = {
  schema: {
    tags: ['company', 'add', 'update', 'delete', 'profile'],
    summary: 'Bulk add update delete awards payrolls course role private',
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
          description: 'Gym id for which profile needs to added update deleted'
        },
        profileId: {
          type: 'string',
          description: 'Profile id of user who needs to be updated'
        },
        payrolls: {
          type: 'object',
          properties: {
            toDelete: {
              type: 'array',
              description: 'Id of record if it needs to be deleted',
              uniqueItems: true,
              items: {
                type: 'string'
              }
            },
            addUpdates: {
              type: 'array',
              items: {
                type: 'object',
                required: ['name', 'role', 'period', 'variable', 'value'],
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

        },
        awards: {
          type: 'object',
          properties: {
            toDelete: {
              type: 'array',
              description: 'Id of the record to be deleted',
              uniqueItems: true,
              items: {
                type: 'string'
              }
            },
            addUpdates: {
              type: 'array',
              items: {
                type: 'object',
                required: ['target', 'quantity', 'end', 'value'],
                properties: {
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

        },
        roles: {
          type: 'object',
          properties: {
            toDelete: {
              type: 'array',
              description: 'Role which needs to be deleted',
              uniqueItems: true,
              items: {
                type: 'string',
                enum: roles
              }
            },
            addUpdates: {
              type: 'array',
              items: {
                type: 'object',
                required: ['role', 'status'],
                properties: {
                  role: {
                    type: 'string',
                    enum: roles
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

        },
        course: {
          type: 'array',
          description: 'Interest ids from setting',
          uniqueItems: true,
          items: {
            type: 'string'
          }
        },
        private: {
          type: 'array',
          description: 'Interest ids from setting',
          uniqueItems: true,
          items: {
            type: 'string'

          }
        }
      }
    }
  }
}

const availableProfileForSubstitute = {
  schema: {
    tags: ['company', 'search', 'substitute'],
    summary: 'search user by first name, last name, email, mobile or pin',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      type: 'object',
      required: ['text', 'startAt', 'endAt', 'gymId'],
      properties: {
        text: {
          type: 'string',
          description: 'text which needs to be searched',
          minLength: 2
        },
        startAt: {
          type: 'string'
        },
        endAt: {
          type: 'string'
        },
        gymId: {
          type: 'string',
          description: 'Gym id for which substitute needs to be checked'
        }
      }
    }
  }
}

const getProfileCalendar = {
  schema: {
    tags: ['profile', 'calendar', 'substitute', 'support'],
    summary: 'Returns  profile calendar detail',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      type: 'object',
      required: ['profileId', 'startDate'],
      properties: {
        profileId: {
          type: 'string',
          description: 'Profile id for which Calendar details are needed'
        },
        startDate: {
          type: 'string'
        },
        endDate: {
          type: 'string'
        }
      }
    }
  }
}

const getChatPluginSettings = {
  schema: {
    tags: ['profile'],
    summary: 'get chat plugin settings',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      type: 'object'
    }
  }
}

const setChatPluginSettings = {
  schema: {
    tags: ['profile'],
    summary: 'set chat plugin settings',
    security: [
      {
        authorization: []
      }
    ],
    body: {
      type: 'object',
      required: ['chatPluginSettings'],
      properties: {
        chatPluginSettings: {
          type: 'object'
        }
      }
    }
  }
}

module.exports = {
  searchCompanyByName,
  getCompanyDetail,
  getUserDetail,
  vatValidation,
  fiscalGetDetail,
  fiscalValidation,
  manageCountries,
  uploadFile,
  bankDelete,
  bankAdd,
  bankEdit,
  getBank,
  vatGetDetail,
  vatSearch,
  userGetDetailByEmail,
  createProfile,
  updateProfile,
  createGym,
  updateGym,
  userGetDetailByPin,
  userGetDetailByTin,
  userGetDetailByMobile,
  uploadUserFile,
  validInChatAlias,
  getGymById,
  getGymList,
  searchUser,
  searchProfile,
  changeCompanyStatus,
  deleteGymById,
  reactivateGym,
  getProfileDetail,
  sendToDevice,
  profileDetail,
  gymBusinessUsers,
  gymUnassignedUser,
  assignProfile,
  unassignProfile,
  assignParentId,
  getGymGroup,
  removeGymParent,
  createCompany,
  updateCompany,
  bulkProfileChanges,
  getProfileCalendar,
  availableProfileForSubstitute,
  getChatPluginSettings,
  setChatPluginSettings
}
