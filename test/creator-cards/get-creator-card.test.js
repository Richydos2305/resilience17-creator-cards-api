const assert = require('assert');
const getCreatorCard = require('@app/services/creator-cards/get-creator-card');
const { MockModelStubs } = require('@app/mock-models');

const { CreatorCard: CreatorCardStubs } = MockModelStubs;

describe('getCreatorCard', () => {
  describe('success', () => {
    it('returns a public published card', async () => {
      const stub = CreatorCardStubs.configureStubs({
        method: 'findOne',
        docConfig: { status: 'published', access_type: 'public' },
      });

      const result = await getCreatorCard({ slug: 'my-card' });

      assert.ok(result.id);
      assert.strictEqual(result.status, 'published');
      assert.strictEqual(result.deleted, null);
      stub.revert();
    });

    it('returns a private card when the correct access_code is provided', async () => {
      const stub = CreatorCardStubs.configureStubs({
        method: 'findOne',
        docConfig: { status: 'published', access_type: 'private', access_code: 'Abc123' },
      });

      const result = await getCreatorCard({ slug: 'private-card', access_code: 'Abc123' });

      assert.ok(result.id);
      stub.revert();
    });

    it('never returns access_code in the response', async () => {
      const stub = CreatorCardStubs.configureStubs({
        method: 'findOne',
        docConfig: { status: 'published', access_type: 'private', access_code: 'Abc123' },
      });

      const result = await getCreatorCard({ slug: 'private-card', access_code: 'Abc123' });

      assert.strictEqual(result.access_code, undefined);
      stub.revert();
    });
  });

  describe('access rules', () => {
    it('throws NF01 if no card exists with the given slug', async () => {
      const stub = CreatorCardStubs.configureStubs({ method: 'findOne', mockNull: true });

      let caughtErr;
      try {
        await getCreatorCard({ slug: 'nonexistent' });
      } catch (e) {
        caughtErr = e;
      }
      assert.ok(caughtErr, 'expected an error to be thrown');
      assert.strictEqual(caughtErr.errorCode, 'NF01');

      stub.revert();
    });

    it('throws NF02 if the card exists but is a draft', async () => {
      const stub = CreatorCardStubs.configureStubs({
        method: 'findOne',
        docConfig: { status: 'draft' },
      });

      let caughtErr;
      try {
        await getCreatorCard({ slug: 'draft-card' });
      } catch (e) {
        caughtErr = e;
      }
      assert.ok(caughtErr, 'expected an error to be thrown');
      assert.strictEqual(caughtErr.errorCode, 'NF02');

      stub.revert();
    });

    it('throws AC03 if the card is private and no access_code is provided', async () => {
      const stub = CreatorCardStubs.configureStubs({
        method: 'findOne',
        docConfig: { status: 'published', access_type: 'private', access_code: 'Abc123' },
      });

      let caughtErr;
      try {
        await getCreatorCard({ slug: 'private-card' });
      } catch (e) {
        caughtErr = e;
      }
      assert.ok(caughtErr, 'expected an error to be thrown');
      assert.strictEqual(caughtErr.errorCode, 'AC03');

      stub.revert();
    });

    it('throws AC04 if the card is private and the access_code is wrong', async () => {
      const stub = CreatorCardStubs.configureStubs({
        method: 'findOne',
        docConfig: { status: 'published', access_type: 'private', access_code: 'Abc123' },
      });

      let caughtErr;
      try {
        await getCreatorCard({ slug: 'private-card', access_code: 'wrong1' });
      } catch (e) {
        caughtErr = e;
      }
      assert.ok(caughtErr, 'expected an error to be thrown');
      assert.strictEqual(caughtErr.errorCode, 'AC04');

      stub.revert();
    });
  });
});
