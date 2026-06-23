const validator = require('@app-core/validator');
const { throwAppError, ERROR_CODE } = require('@app-core/errors');
const { appLogger } = require('@app-core/logger');
const { CreatorCardMessages } = require('@app/messages');
const CreatorCard = require('@app/repository/creator-cards');
const formatCard = require('@app/services/utils/format-card');

const spec = `root {
  title string<trim|minLength:3|maxLength:100>
  description? string<trim|maxLength:500>
  slug? string<trim|minLength:5|maxLength:50>
  creator_reference string<trim|length:20>
  links[]? {
    title string<trim|minLength:1|maxLength:100>
    url string<trim|maxLength:200>
  }
  service_rates? {
    currency string(NGN|USD|GBP|GHS)
    rates[] {
      name string<trim|minLength:3|maxLength:100>
      description? string<trim|maxLength:250>
      amount number<min:1>
    }
  }
  status string(draft|published)
  access_type? string(public|private)
  access_code? string<trim|length:6>
}`;

const parsedSpec = validator.parse(spec);

function deriveSlug(text) {
  const slug = text
    .toLowerCase()
    .split('')
    .reduce((acc, char) => {
      const isAlphanumeric = (char >= 'a' && char <= 'z') || (char >= '0' && char <= '9');
      const isUnderscore = char === '_';
      if (isAlphanumeric || isUnderscore) return `${acc}${char}`;
      if (acc.length > 0 && acc.slice(-1) !== '-') return `${acc}-`;
      return acc;
    }, '');
  const truncated = slug.length > 43 ? slug.slice(0, 43) : slug;
  return truncated.endsWith('-') ? truncated.slice(0, -1) : truncated;
}

function randomSuffix() {
  return Math.random().toString(36).substring(2, 8);
}

function validateExtraFields(data) {
  // VSL can only enforce length on slug — character-set restriction requires manual check
  if (data.slug) {
    const validSlug = data.slug
      .split('')
      .every(
        (c) =>
          (c >= 'a' && c <= 'z') ||
          (c >= 'A' && c <= 'Z') ||
          (c >= '0' && c <= '9') ||
          c === '-' ||
          c === '_'
      );
    if (!validSlug) {
      throwAppError(CreatorCardMessages.SLUG_INVALID, ERROR_CODE.VALIDATIONERR);
    }
  }

  (data.links || []).forEach((link) => {
    if (!link.url.startsWith('http://') && !link.url.startsWith('https://')) {
      throwAppError(CreatorCardMessages.LINK_URL_INVALID, ERROR_CODE.VALIDATIONERR);
    }
  });

  if (data.service_rates) {
    if (!data.service_rates.rates || data.service_rates.rates.length === 0) {
      throwAppError(CreatorCardMessages.SERVICE_RATES_EMPTY, ERROR_CODE.VALIDATIONERR);
    }
    data.service_rates.rates.forEach((rate) => {
      if (!Number.isInteger(rate.amount)) {
        throwAppError(CreatorCardMessages.SERVICE_RATE_AMOUNT_INVALID, ERROR_CODE.VALIDATIONERR);
      }
    });
  }
}

function validateAccessCode(accessType, accessCode) {
  // VSL can only enforce length on access_code — character-set restriction requires manual check
  if (
    accessCode &&
    !accessCode
      .split('')
      .every((c) => (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9'))
  ) {
    throwAppError(CreatorCardMessages.ACCESS_CODE_FORMAT_INVALID, ERROR_CODE.VALIDATIONERR);
  }
  if ((!accessType || accessType === 'public') && accessCode) {
    throwAppError(CreatorCardMessages.ACCESS_CODE_NOT_ALLOWED, ERROR_CODE.CRTRACCPUBLIC);
  }
  if (accessType === 'private' && !accessCode) {
    throwAppError(CreatorCardMessages.ACCESS_CODE_REQUIRED, ERROR_CODE.CRTRNOACCCRT);
  }
}

async function resolveSlug(title, providedSlug) {
  let slug = providedSlug || deriveSlug(title);
  const existing = await CreatorCard.findOne({ query: { slug } });
  if (providedSlug && existing) {
    throwAppError(CreatorCardMessages.SLUG_TAKEN, ERROR_CODE.CRTRSLUGDUPE);
  }
  // append a random suffix if slug is too short or already taken, to guarantee uniqueness and min length
  if (slug.length < 5 || existing) {
    slug = `${slug}-${randomSuffix()}`;
  }
  return slug;
}

async function createCreatorCard(serviceData, options = {}) {
  const data = validator.validate(serviceData, parsedSpec);
  let result;
  const { access_type: accessType, access_code: accessCode, slug, title } = data;

  try {
    validateExtraFields(data);
    validateAccessCode(accessType, accessCode);
    data.slug = await resolveSlug(title, slug);

    const card = await CreatorCard.create(data);

    result = {
      ...formatCard(card),
      access_code: card.access_code ?? null,
      deleted: card.deleted === 0 ? null : card.deleted,
    };
  } catch (error) {
    appLogger.errorX(error, 'create-creator-card-error');
    throw error;
  }

  return result;
}

module.exports = createCreatorCard;
