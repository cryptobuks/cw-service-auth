module.exports = {
  periods: ['week', 'month'], //, 'year'
  variables: ['hour', 'ptHour', 'courseLesson', 'day', 'week', 'month', 'year', 'client', 'newClient', 'contact', 'newContact', 'companyTurnover', 'clientTurnover'], // 'courseHour', 'ptLesson',
  targets: ['client', 'newClient', 'companyTurnover', 'clientTurnover', 'courseParticipation'],
  allowedRoles: ['PT', 'CT', 'DI', 'SA', 'OP', 'SP', 'CL']
}
