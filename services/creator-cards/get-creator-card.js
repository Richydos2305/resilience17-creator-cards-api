const validator = require('@app-core/validator');
const { throwAppError, ERROR_CODE } = require('@app-core/errors');
const { appLogger } = require('@app-core/logger');
const { CreatorCardMessages } = require('@app/messages');
const CreatorCard = require('@app/repository/creator-cards');
const formatCard = require('@app/services/utils/format-card');

const spec = `root {
  slug string
  access_code? string<length:6>
}`;

const parsedSpec = validator.parse(spec);

function enforceAccessRules(card, accessCode) {
  if (!card) throwAppError(CreatorCardMessages.CARD_NOT_FOUND, ERROR_CODE.CRTRNOTFOUND);
  if (card.status === 'draft')
    throwAppError(CreatorCardMessages.CARD_DRAFT_NOT_FOUND, ERROR_CODE.CRTRDRAFT);
  if (card.access_type === 'private') {
    if (!accessCode)
      throwAppError(CreatorCardMessages.ACCESS_CODE_REQUIRED_VIEW, ERROR_CODE.CRTRNOACCRD);
    if (accessCode !== card.access_code)
      throwAppError(CreatorCardMessages.ACCESS_CODE_INVALID, ERROR_CODE.CRTRINVLDACC);
  }
}

async function getCreatorCard(serviceData, options = {}) {
  const data = validator.validate(serviceData, parsedSpec);
  let result;

  try {
    const card = await CreatorCard.findOne({ query: { slug: data.slug } });
    enforceAccessRules(card, data.access_code);

    const formatted = formatCard(card);
    delete formatted.access_code;
    result = { ...formatted, deleted: formatted.deleted === 0 ? null : formatted.deleted };
  } catch (error) {
    appLogger.errorX(error, 'get-creator-card-error');
    throw error;
  }

  return result;
}

module.exports = getCreatorCard;
