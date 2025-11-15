import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import WaitlistService from './services/waitlist.service.js';
import authRoutes from './routes/auth.routes.js';
import { authenticateToken, requireAdmin, apiRateLimiter } from './middleware/auth.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize services
const waitlistService = new WaitlistService();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.ADMIN_URL || 'http://localhost:5173'
    : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
  credentials: true
}));

// Body parsers
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting for API routes
app.use('/api', apiRateLimiter);

// Static files
const landingPath = path.join(__dirname, '../../landing');
const imagesPath = path.join(__dirname, '../../images');
app.use('/', express.static(landingPath));
app.use('/images', express.static(imagesPath));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'LogosAI Waitlist',
    timestamp: new Date().toISOString()
  });
});

// Mount authentication routes
app.use('/api/auth', authRoutes);

// Waitlist signup (public)
app.post('/api/waitlist/signup', (req, res) => {
  try {
    const { name, email, church } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email address'
      });
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    const result = waitlistService.addToWaitlist({
      name: name || 'Anonymous',
      email,
      church,
      ipAddress,
      userAgent
    });

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(409).json(result);
    }
  } catch (error) {
    console.error('Error in waitlist signup:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get waitlist count (public)
app.get('/api/waitlist/count', (req, res) => {
  try {
    const count = waitlistService.getCount();
    res.json({ success: true, count });
  } catch (error) {
    console.error('Error getting waitlist count:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get all signups (admin only)
app.get('/api/waitlist/all', authenticateToken, requireAdmin, (req, res) => {
  try {
    const signups = waitlistService.getAllSignups();
    res.json({ success: true, signups });
  } catch (error) {
    console.error('Error getting all signups:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Export waitlist as CSV (admin only)
app.get('/api/waitlist/export', authenticateToken, requireAdmin, (req, res) => {
  try {
    const csv = waitlistService.exportToCSV();
    if (csv) {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=waitlist.csv');
      res.send(csv);
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to export waitlist'
      });
    }
  } catch (error) {
    console.error('Error exporting waitlist:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log('');
  console.log('='.repeat(60));
  console.log('📧 LogosAI Waitlist Server');
  console.log('='.repeat(60));
  console.log(`✓ Server running on http://localhost:${PORT}`);
  console.log(`✓ Landing page: http://localhost:${PORT}/`);
  console.log(`✓ Admin dashboard: Configure to point to this server`);
  console.log('');
  console.log('API Endpoints:');
  console.log(`  POST http://localhost:${PORT}/api/auth/login`);
  console.log(`  POST http://localhost:${PORT}/api/waitlist/signup`);
  console.log(`  GET  http://localhost:${PORT}/api/waitlist/count`);
  console.log(`  GET  http://localhost:${PORT}/api/waitlist/all (auth required)`);
  console.log(`  GET  http://localhost:${PORT}/api/waitlist/export (auth required)`);
  console.log('');
  console.log('Press Ctrl+C to stop the server');
  console.log('='.repeat(60));
  console.log('');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\nShutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\nShutting down gracefully...');
  process.exit(0);
});
