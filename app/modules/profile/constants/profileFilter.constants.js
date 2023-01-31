module.exports = {
  profileTypes: {
    'profiles.clients': {
      typeCode: ['IN', 'TU']
      // activeSubscription: true
    },
    'profiles.prospects': {
      typeCode: ['IN', 'TU']
      // activeSubscription: true
      // prospect: true
    },
    'profiles.negliageables': {
      typeCode: ['IN', 'TU']
      // activeSubscription: true
      // prospect: false
    },
    'profiles.companies': {
      typeCode: ['CO']
    }
  },
  relationRoles: {
    'roles.directors': {
      role: ['DI']
    },
    'roles.trainers': {
      role: ['PT', 'CT']
    },
    'roles.salesman': {
      role: ['SA']
    },
    'roles.operators': {
      role: ['OP']
    }
  }
}
