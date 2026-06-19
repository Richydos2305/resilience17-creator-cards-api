const { createHandler } = require('@app-core/server');
const { appLogger } = require('@app-core/logger');
const createCreatorCardService = require('@app/services/creator-cards/create-creator-card');
const { CreatorCardMessages } = require('@app/messages');

module.exports = createHandler({
  path: '/creator-cards',
  method: 'post',
  middlewares: [],
  async onResponseEnd(rc, rs) {
    appLogger.info({ requestContext: rc, response: rs }, 'create-creator-card-completed');
  },
  async handler(rc, helpers) {
    const payload = rc.body;
    const response = await createCreatorCardService(payload);
    return {
      status: helpers.http_statuses.HTTP_200_OK,
      message: CreatorCardMessages.CREATE_SUCCESS,
      data: response,
    };
  },
});
