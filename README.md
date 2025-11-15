# LogosAI Waitlist & Admin Dashboard

Marketing website with waitlist signup and administrative dashboard for managing early access signups.

## 📁 Repository Structure

```
logos-waitlist/
├── server/              # Backend API server
│   ├── src/
│   │   ├── services/    # Business logic
│   │   ├── routes/      # API routes
│   │   ├── middleware/  # Auth middleware
│   │   └── index.js     # Server entry point
│   ├── data/            # SQLite databases
│   └── package.json
├── landing/             # Landing page (HTML/CSS/JS)
├── admin/               # Admin dashboard (React)
└── images/              # Shared images

```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Server
cd server && npm install

# Admin Dashboard
cd admin && npm install
```

### 2. Configure Environment

**Server Configuration**

Create `server/.env`:
```env
PORT=3000
NODE_ENV=development
JWT_SECRET=your_secure_random_secret_here
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
ADMIN_URL=http://localhost:5173
```

Generate a secure JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Admin Dashboard Configuration** (Optional for Development)

Create `admin/.env` if you need to override the default API URL:
```env
VITE_API_URL=http://localhost:3000/api
```

### 3. Start the System

```bash
# Terminal 1: Start Server
cd server && npm start

# Terminal 2: Start Admin Dashboard
cd admin && npm run dev
```

### 4. Access Applications

- **Landing Page**: http://localhost:3000
- **Admin Dashboard**: http://localhost:5174
- **API**: http://localhost:3000/api

## 🔐 Default Credentials

**First Login:**
- Username: `admin`
- Password: `admin123`

**⚠️ IMPORTANT:** Change the password immediately after first login!

## 📡 API Endpoints

### Public Endpoints

- `POST /api/waitlist/signup` - Add email to waitlist
- `GET /api/waitlist/count` - Get total signups

### Admin Endpoints (Authentication Required)

- `POST /api/auth/login` - Admin login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/change-password` - Change password
- `GET /api/waitlist/all` - Get all signups
- `GET /api/waitlist/export` - Export signups as CSV

## 🗄️ Databases

### waitlist.db
- **Table**: `waitlist`
- **Columns**: id, name, email, church, created_at, ip_address, user_agent

### admin.db
- **Tables**: `admins`, `refresh_tokens`, `admin_audit_log`
- **Purpose**: User authentication and security audit logs

## 🔒 Security Features

- ✅ Bcrypt password hashing (12 rounds)
- ✅ JWT authentication (access + refresh tokens)
- ✅ Rate limiting (5 login attempts per 15 min)
- ✅ Account lockout after failed attempts
- ✅ Audit logging for all security events
- ✅ CORS protection
- ✅ Security headers (Helmet.js)
- ✅ SQL injection prevention

## 📦 Tech Stack

**Backend:**
- Node.js + Express
- SQLite (better-sqlite3)
- JWT authentication
- Bcrypt password hashing
- Helmet.js security

**Frontend:**
- Landing: HTML/CSS/JavaScript
- Admin: React 18 + Vite + Tailwind CSS

## 🚢 Deployment

### Server Options
- **Render**: Free tier available
- **Railway**: $5/month
- **Fly.io**: Free tier
- **Vercel**: Serverless functions
- **Netlify**: Serverless functions

### Frontend Options
- **Vercel**: Free static hosting
- **Netlify**: Free static hosting
- **GitHub Pages**: Free (public repos)

### Environment Variables (Production)

**Server (`server/.env`):**
```env
NODE_ENV=production
PORT=3000
JWT_SECRET=your_production_secret_here
ADMIN_URL=https://admin.yourdomain.com
```

**Admin Dashboard (`admin/.env`):**
```env
VITE_API_URL=https://api.yourdomain.com/api
```

> **Note:** For production deployments, make sure to set `VITE_API_URL` to point to your production API server.

## 📝 Development

### Server Development
```bash
cd server
npm run dev  # Auto-restart on changes
```

### Admin Dashboard Development
```bash
cd admin
npm run dev  # Hot reload
```

### Build for Production
```bash
# Admin Dashboard
cd admin
npm run build
```

## 🔧 Maintenance

### View Audit Logs
```bash
cd server
node -e "const Database = require('better-sqlite3'); const db = new Database('data/admin.db'); const logs = db.prepare('SELECT * FROM admin_audit_log ORDER BY created_at DESC LIMIT 50').all(); console.log(JSON.stringify(logs, null, 2));"
```

### Backup Databases
```bash
cp server/data/waitlist.db backups/waitlist-$(date +%Y%m%d).db
cp server/data/admin.db backups/admin-$(date +%Y%m%d).db
```

## 📄 License

MIT

## 🆘 Support

For issues or questions, check the API documentation or contact support.
