const { expect } = require('chai');
const jwt = require('jsonwebtoken');
const authenticateToken = require('../src/middleware/auth');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-for-tests';

describe('authenticateToken middleware', function () {

  it('returns 401 if no token provided', function () {
    const req = { headers: {} };
    let statusCode;
    const res = { sendStatus: (code) => { statusCode = code; } };

    authenticateToken(req, res, () => {});
    expect(statusCode).to.equal(401);
  });

  it('returns 401 if token format is invalid', function () {
    const req = { headers: { authorization: 'InvalidFormat' } };
    let statusCode;
    const res = { sendStatus: (code) => { statusCode = code; } };

    authenticateToken(req, res, () => {});
    expect(statusCode).to.equal(401);
  });

  it('returns 403 if token is expired or invalid', function () {
    const token = jwt.sign({ name: 'test' }, 'wrong-secret', { expiresIn: '1h' });
    const req = { headers: { authorization: `Bearer ${token}` } };
    let statusCode;
    const res = { sendStatus: (code) => { statusCode = code; } };

    authenticateToken(req, res, () => {});
    expect(statusCode).to.equal(403);
  });

  it('calls next() if token is valid', function () {
    const secret = process.env.JWT_SECRET || 'test-secret';
    const token = jwt.sign({ name: 'admin' }, secret, { expiresIn: '1h' });
    const req = { headers: { authorization: `Bearer ${token}` } };
    let nextCalled = false;

    authenticateToken(req, res = { sendStatus: () => {} }, () => { nextCalled = true; });
    expect(nextCalled).to.be.true;
    expect(req.user.name).to.equal('admin');
  });
});
