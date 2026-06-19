const assert = require('assert');
const deleteCreatorCard = require('@app/services/creator-cards/delete-creator-card');
const { MockModelStubs } = require('@app/mock-models');

const { CreatorCard: CreatorCardStubs } = MockModelStubs;

const CREATOR_REF = 'crt_8f2k1m9x4p7w3q5z';

describe('deleteCreatorCard', () => {
  describe('success', () => {
    it('deletes the card and returns the full card data', async () => {
      const stub = CreatorCardStubs.configureStubs({
        method: 'findOne',
        docConfig: { creator_reference: CREATOR_REF, status: 'published' },
      });

      const before = Date.now();
      const result = await deleteCreatorCard({ slug: 'my-card', creator_reference: CREATOR_REF });
      const after = Date.now();

      assert.ok(result.id);
      assert.ok(result.deleted >= before && result.deleted <= after);
      stub.revert();
    });

    it('sets deleted to a timestamp reflecting the time of deletion', async () => {
      const stub = CreatorCardStubs.configureStubs({
        method: 'findOne',
        docConfig: { creator_reference: CREATOR_REF },
      });

      const result = await deleteCreatorCard({ slug: 'my-card', creator_reference: CREATOR_REF });

      assert.strictEqual(typeof result.deleted, 'number');
      assert.ok(result.deleted > 0);
      stub.revert();
    });
  });

  describe('error cases', () => {
    it('throws NF01 if no card exists with the given slug', async () => {
      const stub = CreatorCardStubs.configureStubs({ method: 'findOne', mockNull: true });

      let caughtErr;
      try {
        await deleteCreatorCard({ slug: 'nonexistent', creator_reference: CREATOR_REF });
      } catch (e) {
        caughtErr = e;
      }
      assert.ok(caughtErr, 'expected an error to be thrown');
      assert.strictEqual(caughtErr.errorCode, 'NF01');

      stub.revert();
    });

    it('throws NF01 if the creator_reference does not match the card', async () => {
      const stub = CreatorCardStubs.configureStubs({
        method: 'findOne',
        docConfig: { creator_reference: 'xxxxxxxxxxxxxxxxxx01' },
      });

      let caughtErr;
      try {
        await deleteCreatorCard({ slug: 'my-card', creator_reference: CREATOR_REF });
      } catch (e) {
        caughtErr = e;
      }
      assert.ok(caughtErr, 'expected an error to be thrown');
      assert.strictEqual(caughtErr.errorCode, 'NF01');

      stub.revert();
    });

    it('throws if creator_reference is missing from the request', async () => {
      let caughtErr;
      try {
        await deleteCreatorCard({ slug: 'my-card' });
      } catch (e) {
        caughtErr = e;
      }
      assert.ok(caughtErr, 'expected an error to be thrown');
      assert.ok(caughtErr.isApplicationError);
    });
  });
});
