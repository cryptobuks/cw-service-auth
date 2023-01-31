module.exports = {
  createChange: {
    schema: {
      summary: 'Create a AskToChange entry',
      security: [
        {
          authorization: []
        }
      ],
      body: {
        type: 'object',
        required: ['data'],
        properties: {
          data: {
            type: 'object',
            required: ['_id'],
            properties: {
              _id: {
                type: 'string',
                description: 'profile _id'
              }
            }
          }
        }
      }
    }
  },
  getChange: {
    schema: {
      summary: 'Get a AskToChange entry',
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
}
