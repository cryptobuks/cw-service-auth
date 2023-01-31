module.exports = {
  generic: ['hide', 'read', 'change'],
  wallet: ['hide', 'read', 'pay'],
  chat: ['hide', 'change'],
  profile: ['read', 'change'],
  importExport: ['hide', 'read'],
  contacts: ['limited', 'all'],
  group: ['read', 'change'],
  broadcast: ['hide', 'create']
}
