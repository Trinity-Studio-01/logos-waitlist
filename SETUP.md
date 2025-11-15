# LogosAI Waitlist Repository - Setup Guide

## ✅ What Was Created

The waitlist repository has been successfully separated from the main LogosAI app with the following structure:

```
logos-waitlist/
├── server/
│   ├── src/
│   │   ├── services/
│   │   │   ├── waitlist.service.js    # Waitlist business logic
│   │   │   └── admin.service.js        # Admin authentication
│   │   ├── routes/
│   │   │   └── auth.routes.js          # Auth endpoints
│   │   ├── middleware/
│   │   │   └── auth.js                 # JWT authentication
│   │   └── index.js                    # Simplified server (waitlist only)
│   ├── data/
│   │   ├── waitlist.db                 # Waitlist database
│   │   └── admin.db                    # Admin database
│   ├── package.json                     # Minimal dependencies
│   └── .env.example                     # Environment template
├── landing/                             # Landing page (HTML/CSS/JS)
├── admin/                               # Admin dashboard (React)
├── images/                              # Shared images
├── README.md                            # Documentation
├── .gitignore                          # Git ignore rules
└── SETUP.md                            # This file
```

## 🚀 Installation Steps

### Step 1: Navigate to Repository
```bash
cd c:/Users/user/Documents/GitHub/logos-waitlist
```

### Step 2: Install Server Dependencies
```bash
cd server
npm install
```

Expected output:
```
✓ Installed better-sqlite3
✓ Installed bcryptjs
✓ Installed express
✓ Installed jsonwebtoken
✓ Installed helmet
... (9 packages total)
```

### Step 3: Configure Environment
```bash
# Copy example environment file
cp .env.example .env

# Edit .env and add your JWT secret
# Generate secret with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Step 4: Install Admin Dashboard Dependencies
```bash
cd ../admin
npm install
```

### Step 5: Start the Server
```bash
cd ../server
npm start
```

Expected output:
```
============================================================
📧 LogosAI Waitlist Server
============================================================
✓ Server running on http://localhost:3000
✓ Landing page: http://localhost:3000/
✓ Admin dashboard: Configure to point to this server

API Endpoints:
  POST http://localhost:3000/api/auth/login
  POST http://localhost:3000/api/waitlist/signup
  GET  http://localhost:3000/api/waitlist/count
  GET  http://localhost:3000/api/waitlist/all (auth required)
  GET  http://localhost:3000/api/waitlist/export (auth required)

Press Ctrl+C to stop the server
============================================================
```

### Step 6: Start Admin Dashboard
```bash
# In a new terminal
cd admin
npm run dev
```

Expected output:
```
VITE v7.2.2  ready in 507 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

## 🧪 Testing

### Test 1: Landing Page
1. Open http://localhost:3000/
2. Enter an email address
3. Click "Join Waitlist"
4. Should see success message

### Test 2: Admin Login
1. Open http://localhost:5173/
2. Login with:
   - Username: `admin`
   - Password: `admin123`
3. Should redirect to dashboard

### Test 3: View Waitlist
1. In admin dashboard, click "Waitlist" in sidebar
2. Should see all signups
3. Click "Export CSV" to download

## 📊 Current Waitlist Data

Your waitlist already has **1 signup**:
- Email: ibiyemipraisedrum@gmail.com
- Church: Hcc
- Date: 2025-11-13

## 🔒 Security Checklist

- [x] JWT secret is randomized (change in .env!)
- [x] Default admin password must be changed
- [x] Rate limiting enabled (5 attempts per 15 min)
- [x] Bcrypt password hashing (12 rounds)
- [x] Security headers via Helmet.js
- [x] CORS protection enabled
- [x] Audit logging active

## 🚢 Deployment Checklist

### Before Deploying:

1. **Change Default Password**
   - Login to admin dashboard
   - Go to Settings
   - Change password from `admin123`

2. **Generate Production JWT Secret**
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

3. **Update Environment Variables**
   ```env
   NODE_ENV=production
   JWT_SECRET=your_production_secret_here
   ADMIN_URL=https://admin.yourdomain.com
   ```

4. **Database Backups**
   - Backup `server/data/waitlist.db`
   - Backup `server/data/admin.db`

### Deployment Options:

**Server (choose one):**
- Render.com (Free tier)
- Railway.app ($5/month)
- Fly.io (Free tier)
- DigitalOcean ($6/month)

**Admin Dashboard:**
- Vercel (Free)
- Netlify (Free)
- GitHub Pages (Free)

### Build Admin Dashboard:
```bash
cd admin
npm run build
# Upload dist/ folder to hosting
```

## 🔗 API Endpoints

### Public
- `POST /api/waitlist/signup` - Add email
- `GET /api/waitlist/count` - Get count

### Admin (requires auth)
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Current user
- `POST /api/auth/logout` - Logout
- `POST /api/auth/change-password` - Change password
- `GET /api/waitlist/all` - All signups
- `GET /api/waitlist/export` - CSV export

## 📝 Next Steps

1. **Test everything locally** ✅
2. **Change default admin password** ⚠️
3. **Set production JWT secret** ⚠️
4. **Deploy server** 📤
5. **Deploy admin dashboard** 📤
6. **Update CORS settings** 🔒
7. **Set up domain** 🌐
8. **Enable HTTPS** 🔐

## 🆘 Troubleshooting

### Server won't start
- Check if port 3000 is already in use
- Verify .env file exists
- Run `npm install` in server folder

### Admin dashboard can't connect
- Check server is running
- Verify API_URL in admin/.env
- Check CORS settings in server

### Login fails
- Check JWT_SECRET is set
- Verify database exists (server/data/admin.db)
- Check console for errors

## 📞 Support

For issues, check:
1. README.md
2. Server logs
3. Browser console
4. Database files exist

---

**🎉 Your waitlist repository is ready to deploy!**
