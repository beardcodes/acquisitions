import jwt from 'jsonwebtoken';
import logger from '#config/logger.js';
import { getUserById } from '#services/users.service.js';

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Access token is missing',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database to ensure user still exists and get latest info
    const user = await getUserById(decoded.id);

    req.user = user;
    next();
  } catch (error) {
    logger.error('Authentication error:', error.message);

    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({
        error: 'Invalid token',
        message: 'The provided token is invalid',
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(403).json({
        error: 'Token expired',
        message: 'The provided token has expired',
      });
    }

    if (error.message === 'User not found') {
      return res.status(403).json({
        error: 'Invalid token',
        message: 'User associated with token no longer exists',
      });
    }

    return res.status(500).json({
      error: 'Authentication error',
      message: 'Something went wrong during authentication',
    });
  }
};

export const requireRole = allowedRoles => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'User must be authenticated',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn(
        `Access denied for user ${req.user.email} with role ${req.user.role}`,
        {
          requiredRoles: allowedRoles,
          userRole: req.user.role,
          userId: req.user.id,
        }
      );

      return res.status(403).json({
        error: 'Access denied',
        message: `Access restricted to: ${allowedRoles.join(', ')}`,
      });
    }

    next();
  };
};
