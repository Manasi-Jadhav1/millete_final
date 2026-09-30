import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { testConnection } from './config/database.js';

// Import routes
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import learningRoutes from './routes/learningRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import chatRoutes    from './routes/chatRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';

// Load environment variables
dotenv.config();

// ES Module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// CORS configuration - allows frontend to communicate with backend
app.use(cors({
  origin: true, // Allow any origin in development
  credentials: true
}));

// Parse JSON request bodies
// Capture raw body for Razorpay webhook HMAC verification
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf.toString();
  }
}));

// Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true }));

// Static files middleware for uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to MilletVerse API',
    version: '1.0.0',
    status: 'running'
  });
});

// API Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// API Routes
// Authentication routes (login, signup, logout)
app.use('/api/auth', authRoutes);

// User routes (profile management)
app.use('/api/users', userRoutes);

// Product routes (CRUD operations, search, filter)
app.use('/api/products', productRoutes);

// Order routes (place order, view orders)
app.use('/api/orders', orderRoutes);

// Learning content routes (millets info, recipes, tutorials)
app.use('/api/learning', learningRoutes);

// Health guidance routes (recommendations)
app.use('/api/health', healthRoutes);

// Cart routes (shopping cart operations)
app.use('/api/cart', cartRoutes);

// Admin routes (admin panel functionality)
app.use('/api/admin', adminRoutes);

// AI Chat Assistant
app.use('/api/chat', chatRoutes);

// Payment & Commission Splitting
app.use('/api/payments', paymentRoutes);

// 404 Handler - Route not found
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  
  // Default error response
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
const startServer = async () => {
  try {
    // Test database connection
    const isDbConnected = await testConnection();
    const dbStatus = isDbConnected ? 'Connected' : 'Offline (Standalone AI Mode)';
    if (!isDbConnected) {
      console.warn('⚠️ Database connection offline. Starting server in Standalone AI & API Mode...');
    }
    
    // Start Express server
    app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════════════════════╗
║           🌾 MilletVerse API Server                    ║
╠════════════════════════════════════════════════════════╣
║  Server running on port: ${PORT}                        
║  Environment: ${process.env.NODE_ENV || 'development'}                          
║  API Base URL: http://localhost:${PORT}/api             
║  Database: ${dbStatus}                                    
╚════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
  }
};

startServer();
