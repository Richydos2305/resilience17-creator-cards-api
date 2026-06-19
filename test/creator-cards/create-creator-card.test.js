const assert = require('assert');
const createCreatorCard = require('@app/services/creator-cards/create-creator-card');
const { MockModelStubs } = require('@app/mock-models');

const { CreatorCard: CreatorCardStubs } = MockModelStubs;

const BASE_PAYLOAD = {
  title: 'My Creator Card',
  creator_reference: 'crt_8f2k1m9x4p7w3q5z',
  status: 'published',
};

describe('createCreatorCard', () => {
  describe('success', () => {
    let stub;
    beforeEach(() => {
      stub = CreatorCardStubs.configureStubs({ method: 'findOne', mockNull: true });
    });
    afterEach(() => stub.revert());

    it('creates a public card and returns expected fields', async () => {
      const result = await createCreatorCard(BASE_PAYLOAD);
      assert.ok(result.id);
      assert.strictEqual(result.title, 'My Creator Card');
      assert.strictEqual(result.status, 'published');
      assert.strictEqual(result.access_code, null);
      assert.strictEqual(result.deleted, null);
      assert.ok(result.slug);
    });

    it('creates a private card and returns the access_code', async () => {
      const result = await createCreatorCard({
        ...BASE_PAYLOAD,
        access_type: 'private',
        access_code: 'Abc123',
      });
      assert.strictEqual(result.access_type, 'private');
      assert.strictEqual(result.access_code, 'Abc123');
    });

    it('derives a slug from the title when none is provided', async () => {
      const result = await createCreatorCard(BASE_PAYLOAD);
      assert.ok(result.slug.startsWith('my-creator-card'));
    });

    it('uses the provided slug when it is unique', async () => {
      const result = await createCreatorCard({ ...BASE_PAYLOAD, slug: 'custom-slug' });
      assert.strictEqual(result.slug, 'custom-slug');
    });
  });

  describe('field validation', () => {
    it('throws if title is too short', async () => {
      let caughtErr;
      try {
        await createCreatorCard({ ...BASE_PAYLOAD, title: 'Hi' });
      } catch (e) {
        caughtErr = e;
      }
      assert.ok(caughtErr, 'expected an error to be thrown');
      assert.ok(caughtErr.isApplicationError);
    });

    it('throws if creator_reference is not 20 characters', async () => {
      let caughtErr;
      try {
        await createCreatorCard({ ...BASE_PAYLOAD, creator_reference: 'short' });
      } catch (e) {
        caughtErr = e;
      }
      assert.ok(caughtErr, 'expected an error to be thrown');
      assert.ok(caughtErr.isApplicationError);
    });

    it('throws if status is not draft or published', async () => {
      let caughtErr;
      try {
        await createCreatorCard({ ...BASE_PAYLOAD, status: 'pending' });
      } catch (e) {
        caughtErr = e;
      }
      assert.ok(caughtErr, 'expected an error to be thrown');
      assert.ok(caughtErr.isApplicationError);
    });
  });

  describe('access code validation', () => {
    it('throws AC01 if access_type is private with no access_code', async () => {
      let caughtErr;
      try {
        await createCreatorCard({ ...BASE_PAYLOAD, access_type: 'private' });
      } catch (e) {
        caughtErr = e;
      }
      assert.ok(caughtErr, 'expected an error to be thrown');
      assert.strictEqual(caughtErr.errorCode, 'AC01');
    });

    it('throws AC05 if access_code is provided on a public card', async () => {
      let caughtErr;
      try {
        await createCreatorCard({ ...BASE_PAYLOAD, access_code: 'Abc123' });
      } catch (e) {
        caughtErr = e;
      }
      assert.ok(caughtErr, 'expected an error to be thrown');
      assert.strictEqual(caughtErr.errorCode, 'AC05');
    });

    it('throws AC04 if access_code contains non-alphanumeric characters', async () => {
      let caughtErr;
      try {
        await createCreatorCard({ ...BASE_PAYLOAD, access_type: 'private', access_code: 'abc!23' });
      } catch (e) {
        caughtErr = e;
      }
      assert.ok(caughtErr, 'expected an error to be thrown');
      assert.strictEqual(caughtErr.errorCode, 'AC04');
    });
  });

  describe('slug validation', () => {
    it('throws SL02 if the provided slug is already taken', async () => {
      let caughtErr;
      try {
        await createCreatorCard({ ...BASE_PAYLOAD, slug: 'taken-slug' });
      } catch (e) {
        caughtErr = e;
      }
      assert.ok(caughtErr, 'expected an error to be thrown');
      assert.strictEqual(caughtErr.errorCode, 'SL02');
    });
  });

  describe('links validation', () => {
    let stub;
    beforeEach(() => {
      stub = CreatorCardStubs.configureStubs({ method: 'findOne', mockNull: true });
    });
    afterEach(() => stub.revert());

    it('throws if a link URL does not start with http:// or https://', async () => {
      let caughtErr;
      try {
        await createCreatorCard({
          ...BASE_PAYLOAD,
          links: [{ title: 'Bad Link', url: 'ftp://example.com' }],
        });
      } catch (e) {
        caughtErr = e;
      }
      assert.ok(caughtErr, 'expected an error to be thrown');
      assert.ok(caughtErr.isApplicationError);
    });

    it('accepts valid http and https link URLs', async () => {
      const result = await createCreatorCard({
        ...BASE_PAYLOAD,
        links: [
          { title: 'Secure Link', url: 'https://example.com' },
          { title: 'Insecure Link', url: 'http://example.com' },
        ],
      });
      assert.ok(result.id);
    });
  });

  describe('service_rates validation', () => {
    let stub;
    beforeEach(() => {
      stub = CreatorCardStubs.configureStubs({ method: 'findOne', mockNull: true });
    });
    afterEach(() => stub.revert());

    it('throws if service_rates.rates is empty', async () => {
      let caughtErr;
      try {
        await createCreatorCard({
          ...BASE_PAYLOAD,
          service_rates: { currency: 'NGN', rates: [] },
        });
      } catch (e) {
        caughtErr = e;
      }
      assert.ok(caughtErr, 'expected an error to be thrown');
      assert.ok(caughtErr.isApplicationError);
    });

    it('throws if a rate amount is not an integer', async () => {
      let caughtErr;
      try {
        await createCreatorCard({
          ...BASE_PAYLOAD,
          service_rates: {
            currency: 'NGN',
            rates: [{ name: 'Basic Plan', amount: 9.99 }],
          },
        });
      } catch (e) {
        caughtErr = e;
      }
      assert.ok(caughtErr, 'expected an error to be thrown');
      assert.ok(caughtErr.isApplicationError);
    });

    it('accepts valid service_rates with integer amounts', async () => {
      const result = await createCreatorCard({
        ...BASE_PAYLOAD,
        service_rates: {
          currency: 'NGN',
          rates: [{ name: 'Basic Plan', amount: 5000 }],
        },
      });
      assert.ok(result.id);
    });
  });
});
