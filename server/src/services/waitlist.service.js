import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class WaitlistService {
  constructor() {
    this.db = null;
    this.init();
  }

  init() {
    try {
      const dbPath = path.join(__dirname, '../..', 'data', 'waitlist.db');
      this.db = new Database(dbPath);

      this.db.exec(`
        CREATE TABLE IF NOT EXISTS waitlist (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          church TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          ip_address TEXT,
          user_agent TEXT
        )
      `);

      this.db.exec(`
        CREATE INDEX IF NOT EXISTS idx_email ON waitlist(email)
      `);

      this.db.exec(`
        CREATE INDEX IF NOT EXISTS idx_created_at ON waitlist(created_at)
      `);

      console.log('Waitlist database initialized');
    } catch (error) {
      console.error('Failed to initialize waitlist database:', error);
      throw error;
    }
  }

  addToWaitlist(data) {
    try {
      const { name, email, church, ipAddress, userAgent } = data;

      const existing = this.db.prepare(
        'SELECT email FROM waitlist WHERE email = ?'
      ).get(email);

      if (existing) {
        return { success: false, message: 'Email already registered' };
      }

      const stmt = this.db.prepare(`
        INSERT INTO waitlist (name, email, church, ip_address, user_agent)
        VALUES (?, ?, ?, ?, ?)
      `);

      const result = stmt.run(name, email, church, ipAddress, userAgent);

      return {
        success: true,
        message: 'Successfully added to waitlist',
        id: result.lastInsertRowid
      };
    } catch (error) {
      console.error('Error adding to waitlist:', error);
      return {
        success: false,
        message: 'Failed to add to waitlist'
      };
    }
  }

  getCount() {
    try {
      const result = this.db.prepare('SELECT COUNT(*) as count FROM waitlist').get();
      return result.count;
    } catch (error) {
      console.error('Error getting waitlist count:', error);
      return 0;
    }
  }

  getAllSignups() {
    try {
      return this.db.prepare(`
        SELECT id, name, email, church, created_at
        FROM waitlist
        ORDER BY created_at DESC
      `).all();
    } catch (error) {
      console.error('Error getting all signups:', error);
      return [];
    }
  }

  exportToCSV() {
    try {
      const signups = this.getAllSignups();
      const headers = ['ID', 'Name', 'Email', 'Church', 'Created At'];
      const rows = signups.map(s => [
        s.id,
        s.name,
        s.email,
        s.church || '',
        s.created_at
      ]);

      let csv = headers.join(',') + '\n';
      rows.forEach(row => {
        csv += row.map(cell => `"${cell}"`).join(',') + '\n';
      });

      return csv;
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      return null;
    }
  }

  close() {
    if (this.db) {
      this.db.close();
    }
  }
}

export default WaitlistService;
