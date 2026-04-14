import { describe, it, expect, vi, beforeEach } from 'vitest';

const jwt = vi.hoisted(() => ({
  verify: vi.fn(),
}));
vi.mock('jsonwebtoken', () => ({ default: jwt }));

const { User } = vi.hoisted(() => ({
  User: {
    findByPk: vi.fn(),
  },
}));
vi.mock('../../models/index.js', () => ({
  default: { User },
}));

import auth, { requireRole } from '../../middleware/auth.js';
import { createMockRes } from '../helpers/httpMocks.js';

describe('auth middleware', () => {
  beforeEach(() => {
    jwt.verify.mockReset();
    User.findByPk.mockReset();
    process.env.JWT_SECRET = 'secret';
  });

  it('should reject when no authorization header', async () => {
    const req = { headers: {} };
    const res = createMockRes();
    const next = vi.fn();

    await auth(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('should accept valid bearer token', async () => {
    jwt.verify.mockReturnValue({ userId: 1 });
    User.findByPk.mockResolvedValue({ id: 1, role: 'admin', status: 'active' });
    const req = { headers: { authorization: 'Bearer token' } };
    const res = createMockRes();
    const next = vi.fn();

    await auth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user.id).toBe(1);
  });
});

describe('requireRole middleware', () => {
  it('should forbid when role not allowed', () => {
    const req = { user: { role: 'user' } };
    const res = createMockRes();
    const next = vi.fn();

    requireRole(['admin'])(req, res, next);

    expect(res.statusCode).toBe(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('should allow when role allowed', () => {
    const req = { user: { role: 'admin' } };
    const res = createMockRes();
    const next = vi.fn();

    requireRole(['admin'])(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
