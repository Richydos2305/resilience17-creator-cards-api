const validator = require('@app-core/validator');
const { throwAppError, ERROR_CODE } = require('@app-core/errors');
const { appLogger } = require('@app-core/logger');
const { CreatorCardMessages } = require('@app/messages');
const CreatorCard = require('@app/repository/creator-cards');
const formatCard = require('@app/services/utils/format-card');

const spec = `root {
  slug string
  creator_reference string<trim|length:20>
}`;

const parsedSpec = validator.parse(spec);

async function deleteCreatorCard(serviceData, options = {}) {
  const data = validator.validate(serviceData, parsedSpec);
  let result;

  try {
    const card = await CreatorCard.findOne({ query: { slug: data.slug } });

    // return the same NF01 for both missing card and wrong creator_reference — avoids leaking whether a card exists to non-owners
    if (!card || data.creator_reference !== card.creator_reference) {
      throwAppError(CreatorCardMessages.CARD_NOT_FOUND, ERROR_CODE.CRTRNOTFOUND);
    }

    const deletedAt = Date.now();
    await CreatorCard.deleteOne({ query: { _id: card._id } });

    result = { ...formatCard(card), access_code: null, deleted: deletedAt };
  } catch (error) {
    appLogger.errorX(error, 'delete-creator-card-error');
    throw error;
  }

  return result;
}

module.exports = deleteCreatorCard;
