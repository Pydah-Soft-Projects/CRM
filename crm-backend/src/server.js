import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { errorHandler } from './middleware/error.middleware.js';
import { connectDatabase } from './config/database.js';
import authRoutes from './routes/auth.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

// CORS configuration
// Parse CORS_ORIGIN from env (comma-separated) and add production URLs
const corsOrigins = [];
if (process.env.CORS_ORIGIN) {
  // Split comma-separated origins
  corsOrigins.push(...process.env.CORS_ORIGIN.split(',').map(origin => origin.trim()));
} else {
  // Default localhost origins
  corsOrigins.push('http://localhost:5173');
}

// Add production URLs
const productionOrigins = [
  'https://crm.pydah.edu.in',           // Production CRM frontend
  'https://sdms.pydah.edu.in',          // Production student portal Custom Domain
  'https://pydahsdms.vercel.app',        // Production student portal
  'https://admissions.pydah.edu.in', // Development portal application
  'https://hrms.pydah.edu.in',          // HRMS portal (SSO redirect target; may call CRM backend from browser)
  'https://hms.pydahsoft.in',            // Hostel management system (HMS) production
  'http://localhost:3000',               // Local hostel software (and/or student/HRMS portal in dev)
  'http://localhost:5000',               // Local HRMS backend
  'http://localhost:5173',               // Local CRM frontend
  'http://localhost:5175',               // Local Transport frontend
  'http://localhost:5174',               // Local Fee Management frontend               // Local Fee Management backend
  'https://pydah-fee-management.vercel.app', // Production Fee Management
  'https://fees.pydah.edu.in',               // Production Fee Management Custom Domain
  'https://pydah-transport.vercel.app',      // Production Transport
  'https://transport.pydah.edu.in',          // Production Transport Custom Domain
  'https://academic.pydah.edu.in',           // Production Academic Portal
  'https://acad.pydah.edu.in',               // Production Academic Portal (acad.pydah.edu.in)
  'https://ems.pydah.edu.in'                 // Production Examination Management System
];

// Combine and remove duplicates
const allOrigins = [...new Set([...corsOrigins, ...productionOrigins])];

console.log(`[CORS] Allowed origins:`, allOrigins);

app.use(cors({
  origin: allOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Custom request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl || req.url}`);
  next();
});

// Logging middleware (morgan for additional details)
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  // In production, use combined format for more details
  app.use(morgan('combined'));
}

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Handle OPTIONS requests for CORS preflight
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'CRM Authentication Gateway is running',
    timestamp: new Date().toISOString()
  });
});

// Add this route in the CRM Backend server code to redirect old Transport QR scans
app.get('/verify-transport/:id', (req, res) => {
    const transportFrontendUrl = 'https://transport.pydah.edu.in';
    const redirectUrl = `${transportFrontendUrl}/verify-transport/${encodeURIComponent(req.params.id)}`;
    res.redirect(301, redirectUrl);
});


// Test endpoint for verify-token route
app.get('/auth/verify-token/test', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Verify-token endpoint is accessible',
    endpoint: 'POST /auth/verify-token',
    timestamp: new Date().toISOString()
  });
});

// Static CDN assets for cross-portal floating switcher widget
app.use('/cdn', express.static(path.join(__dirname, '../public')));
app.get('/portal-switcher.js', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/portal-switcher.js'));
});

// API Routes
app.use('/auth', authRoutes);

// 404 handler
app.use((req, res) => {
  console.log(`[404] Route not found: ${req.method} ${req.originalUrl || req.url}`);
  console.log(`[404] Headers:`, {
    origin: req.headers.origin,
    'content-type': req.headers['content-type'],
    'user-agent': req.headers['user-agent']
  });
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl || req.url,
    method: req.method
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 CRM Authentication Gateway running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  
  // Connect to database
  try {
    await connectDatabase();
  } catch (error) {
    console.error('⚠️  Database connection failed. Some features may not work.');
    console.error('   Make sure MySQL is running and database credentials are correct.');
  }
});

export default app;
