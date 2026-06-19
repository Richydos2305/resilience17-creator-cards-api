const { createHandler } = require('@app-core/server');
const { appLogger } = require('@app-core/logger');
const deleteCreatorCardService = require('@app/services/creator-cards/delete-creator-card');
const { CreatorCardMessages } = require('@app/messages');

module.exports = createHandler({
  path: '/creator-cards/:slug',
  method: 'delete',
  middlewares: [],
  async onResponseEnd(rc, rs) {
    appLogger.info({ requestContext: rc, response: rs }, 'delete-creator-card-completed');
  },
  async handler(rc, helpers) {
    const { slug } = rc.params;
    const { creator_reference: creatorReference } = rc.body;
    const response = await deleteCreatorCardService({ slug, creator_reference: creatorReference });
    return {
      status: helpers.http_statuses.HTTP_200_OK,
      message: CreatorCardMessages.DELETE_SUCCESS,
      data: response,
    };
  },
});
