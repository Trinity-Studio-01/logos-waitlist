import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Security constants
const SALT_ROUNDS = 12; // High security (slow but secure)
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

class AdminService {
  constructor() {
    // Ensure data directory exists (important for production/Railway)
    const dataDir = path.join(__dirname, '../../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      console.log('✅ Created data directory');
    }

    const dbPath = path.join(dataDir, 'admin.db');
    this.db = new Database(dbPath);
    this.initDatabase();
    console.log('✅ Admin database initialized');
  }

  /**
   * Initialize database tables
   */
  initDatabase() {
    // Admins table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'admin',
        email TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME,
        login_attempts INTEGER DEFAULT 0,
        locked_until DATETIME,
        is_active INTEGER DEFAULT 1,

        -- Security: ensure username is lowercase and trimmed
        CHECK(username = LOWER(TRIM(username))),
        CHECK(LENGTH(username) >= 3),
        CHECK(LENGTH(password) >= 60)  -- bcrypt hashes are 60 chars
      )
    `);

    // Refresh tokens table (for token rotation)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        admin_id INTEGER NOT NULL,
        token_hash TEXT NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        revoked INTEGER DEFAULT 0,

        FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE
      )
    `);

    // Audit log for security events
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS admin_audit_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        admin_id INTEGER,
        action TEXT NOT NULL,
        ip_address TEXT,
        user_agent TEXT,
        success INTEGER,
        details TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for performance
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_refresh_tokens_admin ON refresh_tokens(admin_id);
      CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash ON refresh_tokens(token_hash);
      CREATE INDEX IF NOT EXISTS idx_audit_log_admin ON admin_audit_log(admin_id);
      CREATE INDEX IF NOT EXISTS idx_audit_log_created ON admin_audit_log(created_at);
    `);

    // Create default admin if none exists
    this.createDefaultAdmin();
  }

  /**
   * Create default admin account (FIRST TIME ONLY)
   * SECURITY: User MUST change this immediately
   */
  createDefaultAdmin() {
    const existingAdmin = this.db.prepare('SELECT id FROM admins LIMIT 1').get();

    if (!existingAdmin) {
      const defaultUsername = 'admin';
      const defaultPassword = 'admin123'; // CHANGE THIS IMMEDIATELY

      const hashedPassword = bcrypt.hashSync(defaultPassword, SALT_ROUNDS);

      this.db.prepare(`
        INSERT INTO admins (username, password, role, email)
        VALUES (?, ?, ?, ?)
      `).run(defaultUsername, hashedPassword, 'admin', null);

      console.warn('⚠️  DEFAULT ADMIN CREATED');
      console.warn('⚠️  Username: admin');
      console.warn('⚠️  Password: admin123');
      console.warn('⚠️  CHANGE THIS PASSWORD IMMEDIATELY!');
    }
  }

  /**
   * Create new admin user
   * SECURITY: Only callable by existing admins
   */
  createAdmin(username, password, email = null) {
    try {
      // Input validation
      username = username.toLowerCase().trim();

      if (username.length < 3) {
        throw new Error('Username must be at least 3 characters');
      }

      if (password.length < 8) {
        throw new Error('Password must be at least 8 characters');
      }

      // Check if username exists
      const existing = this.db.prepare('SELECT id FROM admins WHERE username = ?').get(username);
      if (existing) {
        throw new Error('Username already exists');
      }

      // Hash password
      const hashedPassword = bcrypt.hashSync(password, SALT_ROUNDS);

      // Insert admin
      const result = this.db.prepare(`
        INSERT INTO admins (username, password, email, role)
        VALUES (?, ?, ?, 'admin')
      `).run(username, hashedPassword, email);

      return {
        id: result.lastInsertRowid,
        username,
        email,
        role: 'admin'
      };
    } catch (error) {
      console.error('Error creating admin:', error);
      throw error;
    }
  }

  /**
   * Authenticate admin
   * SECURITY: Includes rate limiting and account lockout
   */
  async authenticate(username, password, ipAddress = null, userAgent = null) {
    try {
      username = username.toLowerCase().trim();

      // Get admin record
      const admin = this.db.prepare(`
        SELECT * FROM admins WHERE username = ?
      `).get(username);

      // SECURITY: Same response for non-existent user (prevent user enumeration)
      if (!admin) {
        this.logAudit(null, 'login_failed', ipAddress, userAgent, false, 'User not found');
        await this.simulateDelay(); // Prevent timing attacks
        throw new Error('Invalid credentials');
      }

      // Check if account is locked
      if (admin.locked_until) {
        const lockUntil = new Date(admin.locked_until);
        if (lockUntil > new Date()) {
          this.logAudit(admin.id, 'login_failed', ipAddress, userAgent, false, 'Account locked');
          const minutesLeft = Math.ceil((lockUntil - new Date()) / 60000);
          throw new Error(`Account locked. Try again in ${minutesLeft} minutes.`);
        } else {
          // Lock expired, reset attempts
          this.db.prepare(`
            UPDATE admins SET login_attempts = 0, locked_until = NULL WHERE id = ?
          `).run(admin.id);
        }
      }

      // Check if account is active
      if (!admin.is_active) {
        this.logAudit(admin.id, 'login_failed', ipAddress, userAgent, false, 'Account disabled');
        throw new Error('Account is disabled');
      }

      // Verify password
      const isValid = await bcrypt.compare(password, admin.password);

      if (!isValid) {
        // Increment login attempts
        const newAttempts = admin.login_attempts + 1;
        const shouldLock = newAttempts >= MAX_LOGIN_ATTEMPTS;

        this.db.prepare(`
          UPDATE admins
          SET login_attempts = ?,
              locked_until = ?
          WHERE id = ?
        `).run(
          newAttempts,
          shouldLock ? new Date(Date.now() + LOCKOUT_DURATION).toISOString() : null,
          admin.id
        );

        this.logAudit(admin.id, 'login_failed', ipAddress, userAgent, false,
          `Invalid password (attempt ${newAttempts}/${MAX_LOGIN_ATTEMPTS})`);

        if (shouldLock) {
          throw new Error('Too many failed attempts. Account locked for 15 minutes.');
        }

        throw new Error('Invalid credentials');
      }

      // SUCCESS: Reset login attempts and update last login
      this.db.prepare(`
        UPDATE admins
        SET login_attempts = 0,
            locked_until = NULL,
            last_login = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(admin.id);

      this.logAudit(admin.id, 'login_success', ipAddress, userAgent, true);

      // Return sanitized user (NO PASSWORD)
      const { password: _, ...safeAdmin } = admin;
      return safeAdmin;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Change admin password
   * SECURITY: Requires old password verification
   */
  async changePassword(adminId, oldPassword, newPassword) {
    try {
      if (newPassword.length < 8) {
        throw new Error('New password must be at least 8 characters');
      }

      const admin = this.db.prepare('SELECT password FROM admins WHERE id = ?').get(adminId);
      if (!admin) {
        throw new Error('Admin not found');
      }

      // Verify old password
      const isValid = await bcrypt.compare(oldPassword, admin.password);
      if (!isValid) {
        this.logAudit(adminId, 'password_change_failed', null, null, false, 'Invalid old password');
        throw new Error('Invalid old password');
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

      // Update password
      this.db.prepare('UPDATE admins SET password = ? WHERE id = ?').run(hashedPassword, adminId);

      // Revoke all refresh tokens (force re-login on all devices)
      this.revokeAllRefreshTokens(adminId);

      this.logAudit(adminId, 'password_changed', null, null, true);

      return true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Store refresh token
   */
  storeRefreshToken(adminId, tokenHash, expiresAt) {
    this.db.prepare(`
      INSERT INTO refresh_tokens (admin_id, token_hash, expires_at)
      VALUES (?, ?, ?)
    `).run(adminId, tokenHash, expiresAt);
  }

  /**
   * Verify refresh token exists and is valid
   */
  verifyRefreshToken(tokenHash) {
    const token = this.db.prepare(`
      SELECT * FROM refresh_tokens
      WHERE token_hash = ?
        AND revoked = 0
        AND expires_at > CURRENT_TIMESTAMP
    `).get(tokenHash);

    return token;
  }

  /**
   * Revoke refresh token
   */
  revokeRefreshToken(tokenHash) {
    this.db.prepare('UPDATE refresh_tokens SET revoked = 1 WHERE token_hash = ?').run(tokenHash);
  }

  /**
   * Revoke all refresh tokens for a user (logout all devices)
   */
  revokeAllRefreshTokens(adminId) {
    this.db.prepare('UPDATE refresh_tokens SET revoked = 1 WHERE admin_id = ?').run(adminId);
  }

  /**
   * Clean up expired tokens (run periodically)
   */
  cleanupExpiredTokens() {
    const result = this.db.prepare(`
      DELETE FROM refresh_tokens
      WHERE expires_at < CURRENT_TIMESTAMP
    `).run();

    return result.changes;
  }

  /**
   * Log audit event
   */
  logAudit(adminId, action, ipAddress, userAgent, success, details = null) {
    this.db.prepare(`
      INSERT INTO admin_audit_log (admin_id, action, ip_address, user_agent, success, details)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(adminId, action, ipAddress, userAgent, success ? 1 : 0, details);
  }

  /**
   * Get audit logs
   */
  getAuditLogs(limit = 100, offset = 0) {
    return this.db.prepare(`
      SELECT
        al.*,
        a.username
      FROM admin_audit_log al
      LEFT JOIN admins a ON al.admin_id = a.id
      ORDER BY al.created_at DESC
      LIMIT ? OFFSET ?
    `).all(limit, offset);
  }

  /**
   * Simulate delay to prevent timing attacks
   * Makes failed login same duration as successful
   */
  simulateDelay() {
    return new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 100));
  }

  /**
   * Get admin by ID (safe - no password)
   */
  getAdminById(id) {
    const admin = this.db.prepare(`
      SELECT id, username, email, role, created_at, last_login, is_active
      FROM admins
      WHERE id = ?
    `).get(id);

    return admin;
  }

  /**
   * List all admins (safe - no passwords)
   */
  getAllAdmins() {
    return this.db.prepare(`
      SELECT id, username, email, role, created_at, last_login, is_active
      FROM admins
      ORDER BY created_at DESC
    `).all();
  }

  /**
   * Deactivate admin
   */
  deactivateAdmin(id) {
    this.db.prepare('UPDATE admins SET is_active = 0 WHERE id = ?').run(id);
    this.revokeAllRefreshTokens(id);
  }

  /**
   * Activate admin
   */
  activateAdmin(id) {
    this.db.prepare('UPDATE admins SET is_active = 1 WHERE id = ?').run(id);
  }
}

export default new AdminService();