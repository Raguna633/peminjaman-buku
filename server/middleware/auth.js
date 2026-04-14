import jwt from 'jsonwebtoken';
import db from '../models/index.js';

const { User } = db;

export async function auth(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header) return res.status(401).json({ message: 'Unauthorized' });

    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId || decoded.id);
    if (!user) return res.status(401).json({ message: 'Unauthorized' });

    if (user.status !== 'active') {
      return res.status(401).json({ 
        message: 'Akun Anda dinonaktifkan. Silakan hubungi administrator.' 
      });
    }

    req.user = user;
    next();
  } catch (_err) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
}

export function requireRole(roles = []) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
}

export default auth;
