const { ModelSchema, SchemaTypes, DatabaseModel } = require('@app-core/mongoose');

const modelName = 'creatorCards';

/**
 * @typedef {Object} ModelSchema
 * @property {String} _id
 * @property {String} title
 * @property {String} description
 * @property {String} slug
 * @property {String} creator_reference
 * @property {Array} links
 * @property {Object} service_rates
 * @property {String} status
 * @property {String} access_type
 * @property {String} access_code
 * @property {Number} created
 * @property {Number} updated
 * @property {Number} deleted
 */

const schemaConfig = {
  _id: { type: SchemaTypes.ULID },
  title: { type: SchemaTypes.String },
  description: { type: SchemaTypes.String },
  slug: { type: SchemaTypes.String, unique: true, index: true },
  creator_reference: { type: SchemaTypes.String },
  links: { type: SchemaTypes.Array, default: undefined },
  service_rates: { type: SchemaTypes.Mixed },
  status: { type: SchemaTypes.String, default: 'draft' },
  access_type: { type: SchemaTypes.String, default: 'public' },
  access_code: { type: SchemaTypes.String },
  created: { type: SchemaTypes.Number },
  updated: { type: SchemaTypes.Number },
  deleted: { type: SchemaTypes.Number },
};

const modelSchema = new ModelSchema(schemaConfig, { collection: modelName });

/** @type {ModelSchema} */
module.exports = DatabaseModel.model(modelName, modelSchema, { paranoid: true });
