// TODO complete all rules

const M1FieldsReadInIn = ['name', 'surname', 'picture', 'birth', 'description', 'town?', 'town.birth?']
const M1FieldsReadInCo = ['company', 'brand', 'picture', 'description', 'town?', 'vat']

const rules = {}

// Individual < - > Individual

rules['IN-IN'] = {
  leftRules: {
    permitRoles: [],
    M1: {
      fields: {
        read: M1FieldsReadInIn
      }
    }
  },
  rightRules: {
    M1: {
      fields: {
        read: M1FieldsReadInIn
      }
    }
  }
}

// Individual < - > Tutored

rules['IN-TU'] = {
  leftRules: {
    permitRoles: ['TT'],
    M1: {
      fields: {
        read: M1FieldsReadInIn
      }
    }
  },
  rightRules: {
    M1: {
      fields: {
        read: M1FieldsReadInIn
      }
    }
  }
}

// Individual < - > Company

rules['IN-CO'] = {
  leftRules: {
    permitRoles: ['RE'],
    M1: {
      fields: {
        read: M1FieldsReadInCo
      }
    }
  },
  rightRules: {
    M1: {
      fields: {
        read: M1FieldsReadInIn
      }
    }
  }
}

module.exports = rules
