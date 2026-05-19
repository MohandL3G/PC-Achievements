const { expect } = require('chai');
const { validate, addGameSchema, updatePlaytimeSchema, bulkDeleteSchema, bulkUpdateSchema, loginSchema } = require('../src/middleware/validate');

describe('Validation Schemas', function () {

  describe('loginSchema', function () {
    it('accepts valid credentials', function () {
      const result = loginSchema.safeParse({ username: 'admin', password: 'secret' });
      expect(result.success).to.be.true;
    });

    it('rejects empty username', function () {
      const result = loginSchema.safeParse({ username: '', password: 'secret' });
      expect(result.success).to.be.false;
    });

    it('rejects empty password', function () {
      const result = loginSchema.safeParse({ username: 'admin', password: '' });
      expect(result.success).to.be.false;
    });
  });

  describe('addGameSchema', function () {
    it('accepts valid game data', function () {
      const result = addGameSchema.safeParse({
        steam_id: '730',
        name: 'CS:GO',
      });
      expect(result.success).to.be.true;
      expect(result.data.playtime_hours).to.equal(0);
    });

    it('accepts full game data', function () {
      const result = addGameSchema.safeParse({
        steam_id: '730',
        name: 'CS:GO',
        playtime_hours: 100,
        playtime_minutes: 30,
        achievement_count: 10,
        total_achievements: 10,
        image_url: 'https://example.com/img.jpg',
        is_steam_playtime: true,
      });
      expect(result.success).to.be.true;
      expect(result.data.playtime_hours).to.equal(100);
    });

    it('rejects missing steam_id', function () {
      const result = addGameSchema.safeParse({ name: 'CS:GO' });
      expect(result.success).to.be.false;
    });

    it('rejects negative playtime', function () {
      const result = addGameSchema.safeParse({ steam_id: '730', name: 'CS:GO', playtime_hours: -1 });
      expect(result.success).to.be.false;
    });
  });

  describe('updatePlaytimeSchema', function () {
    it('accepts valid playtime', function () {
      const result = updatePlaytimeSchema.safeParse({ playtime_hours: 5, playtime_minutes: 30 });
      expect(result.success).to.be.true;
    });

    it('rejects minutes > 59', function () {
      const result = updatePlaytimeSchema.safeParse({ playtime_hours: 5, playtime_minutes: 99 });
      expect(result.success).to.be.false;
    });
  });

  describe('bulkDeleteSchema', function () {
    it('accepts array of steam_ids', function () {
      const result = bulkDeleteSchema.safeParse({ steam_ids: ['730', '570'] });
      expect(result.success).to.be.true;
    });

    it('rejects empty array', function () {
      const result = bulkDeleteSchema.safeParse({ steam_ids: [] });
      expect(result.success).to.be.false;
    });
  });

  describe('bulkUpdateSchema', function () {
    it('accepts valid updates', function () {
      const result = bulkUpdateSchema.safeParse({
        updates: [{ steam_id: '730', playtime_hours: 10, playtime_minutes: 0 }],
      });
      expect(result.success).to.be.true;
    });

    it('rejects empty updates', function () {
      const result = bulkUpdateSchema.safeParse({ updates: [] });
      expect(result.success).to.be.false;
    });
  });
});

describe('validate middleware', function () {
  it('calls next() on valid data', function () {
    const schema = { safeParse: () => ({ success: true, data: { foo: 'bar' } }) };
    const req = { body: { foo: 'bar' } };
    let nextCalled = false;
    const res = { status: () => ({ json: () => {} }) };

    validate(schema)(req, res, () => { nextCalled = true; });
    expect(nextCalled).to.be.true;
    expect(req.body.foo).to.equal('bar');
  });

  it('returns 400 on invalid data', function () {
    const schema = { safeParse: () => ({ success: false, error: { flatten: () => ({ fieldErrors: { name: ['Required'] } }) } }) };
    const req = { body: {} };
    let statusCode;
    const res = {
      status: (code) => { statusCode = code; return { json: () => {} }; },
    };

    validate(schema)(req, res, () => {});
    expect(statusCode).to.equal(400);
  });
});
