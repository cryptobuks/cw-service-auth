const { db, ctr, rabbitmq } = require('@cowellness/cw-micro-service')()

/**
 * @class AsktochangeController
 * @classdesc Controller Asktochange
 */
class AsktochangeController {
  constructor () {
    this.Asktochange = db.auth.model('Asktochange')
  }

  /**
   * Creates an Ask to change process
   * @param {*} param0 {data}
   * @returns askToChange model
   */
  async createChange ({ _user, data }) {
    const profile = await ctr.profile.findById(data._id)

    if (profile.status !== 'active') {
      throw new Error('Change only accepted for active profiles')
    }
    const relations = await ctr.relation.findRelation(_user.profileId)
    const isRelated = relations.find(relation => relation.profile._id.toString() === data._id)

    if (!isRelated) {
      throw new Error('Profile not in a relation')
    }

    const askToChange = await this.Asktochange.create({
      ownerId: _user.profileId,
      profileId: data._id,
      data
    })
    this.sendChangeChatMessage(askToChange.ownerId, askToChange.profileId, data)
    return askToChange
  }

  /**
   * get ask to change data for gymId
   * @param {*} param0 {gymId}
   * @returns askToChange model
   */
  getChange ({ _user, gymId }) {
    return this.Asktochange.findOne({
      ownerId: gymId,
      profileId: _user.profileId,
      expiryDate: {
        $gt: Date.now()
      }
    }).sort({ createdAt: -1 }).exec()
  }

  /**
   * Send a chat message
   * @param {*} fromProfileId
   * @param {*} toProfileId
   * @param {*} data
   */
  async sendChangeChatMessage (fromProfileId, toProfileId, data) {
    const { data: messageText } = await rabbitmq.sendAndRead('/settings/messages/get', {
      key: 'm1.asktochange.message',
      type: 'chat'
    })

    rabbitmq.sendAndRead('/chat/message/action/create', {
      frontId: `auth-${Date.now()}`,
      fromProfileId,
      toProfileId,
      content: {
        type: 'action',
        text: messageText,
        contentData: {
          type: 'askToChange',
          data
        },
        actions: [
          {
            label: 'global.manage',
            showTo: ['to'],
            frontend: {},
            backend: {}
          }
        ]
      }
    })
  }
}

module.exports = AsktochangeController
