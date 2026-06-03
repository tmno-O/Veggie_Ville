/**
 * Backend unit tests for auth error handling.
 * No HTTP server needed — handlers and services are tested directly.
 */
'use strict';

// ─── JSON parse error handler ─────────────────────────────────────────────────

const { jsonParseErrorHandler } = require('../app');

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
}

describe('jsonParseErrorHandler', () => {
  test('auth route invalid JSON → 400 AUTH_INVALID_JSON', () => {
    const err = { type: 'entity.parse.failed' };
    const req = { originalUrl: '/api/auth/login' };
    const res = mockRes();
    jsonParseErrorHandler(err, req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      code: 'AUTH_INVALID_JSON',
      message: 'The request body is not valid JSON.'
    });
  });

  test('non-auth route invalid JSON → 400 INVALID_JSON', () => {
    const err = { type: 'entity.parse.failed' };
    const req = { originalUrl: '/api/products' };
    const res = mockRes();
    jsonParseErrorHandler(err, req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      code: 'INVALID_JSON',
      message: 'The request body is not valid JSON.'
    });
  });

  test('non-parse errors are forwarded to next()', () => {
    const err  = new Error('Something else');
    const req  = { originalUrl: '/api/auth/me' };
    const res  = mockRes();
    const next = jest.fn();
    jsonParseErrorHandler(err, req, res, next);
    expect(next).toHaveBeenCalledWith(err);
    expect(res.json).not.toHaveBeenCalled();
  });
});

// ─── Duplicate email — service layer ─────────────────────────────────────────

jest.mock('../config/db', () => ({ query: jest.fn() }));
jest.mock('bcryptjs', () => ({
  hash:    jest.fn().mockResolvedValue('$2b$12$hashed'),
  compare: jest.fn().mockResolvedValue(true)
}));

describe('auth.service register — duplicate email race condition', () => {
  beforeEach(() => jest.clearAllMocks());

  test('ER_DUP_ENTRY from INSERT is re-thrown as "Email already in use"', async () => {
    const pool = require('../config/db');
    pool.query
      .mockResolvedValueOnce([[]])                                                   // SELECT: no existing row
      .mockRejectedValueOnce(Object.assign(new Error('Dup'), { code: 'ER_DUP_ENTRY' })); // INSERT fails

    const { register } = require('../services/auth.service');
    await expect(
      register({ name: 'Test', email: 'dup@test.com', password: 'password123', role: 'buyer' })
    ).rejects.toThrow('Email already in use');
  });
});

// ─── Duplicate email — controller layer ──────────────────────────────────────

describe('auth.controller register — ER_DUP_ENTRY maps to 409', () => {
  beforeEach(() => jest.clearAllMocks());

  test('service throwing ER_DUP_ENTRY returns 409 AUTH_EMAIL_EXISTS', async () => {
    const pool = require('../config/db');
    pool.query
      .mockResolvedValueOnce([[]])
      .mockRejectedValueOnce(Object.assign(new Error('Dup'), { code: 'ER_DUP_ENTRY' }));

    const { register } = require('../controllers/auth.controller');
    const req = { body: { name: 'Test', email: 'dup@test.com', password: 'password123', role: 'buyer' } };
    const res = mockRes();
    await register(req, res);
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'AUTH_EMAIL_EXISTS' }));
  });
});
