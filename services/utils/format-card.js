function formatCard(card) {
  const { _id, ...rest } = card;
  delete rest.__v;
  return { id: _id, ...rest };
}

module.exports = formatCard;
