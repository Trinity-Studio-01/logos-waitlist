import express from 'express';
import { body, validationResult } from 'express-validator';
import crypto from 'crypto';
import adminService from '../services/admin.service.js';
import {
  authenticateToken,
  requireAdmin,
  loginRateLimiter,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  sanitizeUser
} from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/auth/login
 * Login with username and password
 * SECURITY: Rate limited to 5 attempts per 15 minutes
 */
router.post('/login',
  loginRateLimiter,
  [
    body('username')
      .trim()
      .isLength({ min: 3 })
      .withMessage('Username must be at least 3 characters')
      .escape(),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
  ],
  async (req, res) => {
    try {
      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { username, password } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'];

      // Authenticate user
      const admin = await adminService.authenticate(username, password, ipAddress, userAgent);

      // Generate tokens
      const accessToken = generateAccessToken({
        id: admin.id,
        username: admin.username,
        role: admin.role
      });

      const refreshToken = generateRefreshToken({
        id: admin.id,
        username: admin.username
      });

      // Store refresh token in database
      const refreshTokenHash = crypto
        .createHash('sha256')
        .update(refreshToken)
        .digest('hex');

      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      adminService.storeRefreshToken(admin.id, refreshTokenHash, expiresAt.toISOString());

      // Set httpOnly cookies (most secure)
      res.cookie('auth_token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });

      res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      // Return tokens (for non-cookie clients like mobile apps)
      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: sanitizeUser(admin),
          accessToken,
          refreshToken,
          expiresIn: 86400 // 24 hours in seconds
        }
      });
    } catch (error) {
      console.error('Login error:', error);

      // Generic error message to prevent user enumeration
      res.status(401).json({
        success: false,
        error: error.message || 'Invalid credentials'
      });
    }
  }
);

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', async (req, res) => {
  try {
    const refreshToken = req.cookies?.refresh_token || req.body.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: 'Refresh token required',
        code: 'NO_REFRESH_TOKEN'
      });
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return res.status(403).json({
        success: false,
        error: 'Invalid refresh token',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }

    // Check if token exists in database
    const tokenHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    const storedToken = adminService.verifyRefreshToken(tokenHash);
    if (!storedToken) {
      return res.status(403).json({
        success: false,
        error: 'Refresh token expired or revoked',
        code: 'TOKEN_REVOKED'
      });
    }

    // Get admin data
    const admin = adminService.getAdminById(decoded.id);
    if (!admin || !admin.is_active) {
      return res.status(403).json({
        success: false,
        error: 'Account not found or disabled',
        code: 'ACCOUNT_DISABLED'
      });
    }

    // Generate new access token
    const newAccessToken = generateAccessToken({
      id: admin.id,
      username: admin.username,
      role: admin.role
    });

    // Set new cookie
    res.cookie('auth_token', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000
    });

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken: newAccessToken,
        expiresIn: 86400
      }
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to refresh token'
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout and revoke tokens
 */
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const refreshToken = req.cookies?.refresh_token || req.body.refreshToken;

    if (refreshToken) {
      // Revoke refresh token
      const tokenHash = crypto
        .createHash('sha256')
        .update(refreshToken)
        .digest('hex');

      adminService.revokeRefreshToken(tokenHash);
    }

    // Clear cookies
    res.clearCookie('auth_token');
    res.clearCookie('refresh_token');

    // Log audit event
    adminService.logAudit(
      req.user.id,
      'logout',
      req.ip,
      req.headers['user-agent'],
      true
    );

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed'
    });
  }
});

/**
 * POST /api/auth/logout-all
 * Logout from all devices (revoke all refresh tokens)
 */
router.post('/logout-all', authenticateToken, async (req, res) => {
  try {
    adminService.revokeAllRefreshTokens(req.user.id);

    // Clear cookies
    res.clearCookie('auth_token');
    res.clearCookie('refresh_token');

    // Log audit event
    adminService.logAudit(
      req.user.id,
      'logout_all_devices',
      req.ip,
      req.headers['user-agent'],
      true
    );

    res.json({
      success: true,
      message: 'Logged out from all devices'
    });
  } catch (error) {
    console.error('Logout all error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed'
    });
  }
});

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
router.get('/me', authenticateToken, (req, res) => {
  try {
    const admin = adminService.getAdminById(req.user.id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user: sanitizeUser(admin)
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user data'
    });
  }
});

/**
 * POST /api/auth/change-password
 * Change password (requires old password)
 */
router.post('/change-password',
  authenticateToken,
  [
    body('oldPassword').notEmpty().withMessage('Old password is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain uppercase, lowercase, and number')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { oldPassword, newPassword } = req.body;

      await adminService.changePassword(req.user.id, oldPassword, newPassword);

      // Clear cookies (force re-login)
      res.clearCookie('auth_token');
      res.clearCookie('refresh_token');

      res.json({
        success: true,
        message: 'Password changed successfully. Please login again.'
      });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to change password'
      });
    }
  }
);

/**
 * POST /api/auth/create-admin
 * Create new admin user (admin only)
 */
router.post('/create-admin',
  authenticateToken,
  requireAdmin,
  [
    body('username')
      .trim()
      .isLength({ min: 3 })
      .withMessage('Username must be at least 3 characters')
      .escape(),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain uppercase, lowercase, and number'),
    body('email')
      .optional()
      .isEmail()
      .withMessage('Invalid email format')
      .normalizeEmail()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { username, password, email } = req.body;

      const newAdmin = adminService.createAdmin(username, password, email);

      // Log audit event
      adminService.logAudit(
        req.user.id,
        'admin_created',
        req.ip,
        req.headers['user-agent'],
        true,
        `Created admin: ${username}`
      );

      res.status(201).json({
        success: true,
        message: 'Admin created successfully',
        data: {
          admin: newAdmin
        }
      });
    } catch (error) {
      console.error('Create admin error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to create admin'
      });
    }
  }
);

/**
 * GET /api/auth/audit-logs
 * Get audit logs (admin only)
 */
router.get('/audit-logs',
  authenticateToken,
  requireAdmin,
  (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 100;
      const offset = parseInt(req.query.offset) || 0;

      const logs = adminService.getAuditLogs(limit, offset);

      res.json({
        success: true,
        data: {
          logs,
          pagination: {
            limit,
            offset
          }
        }
      });
    } catch (error) {
      console.error('Get audit logs error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get audit logs'
      });
    }
  }
);

export default router;
