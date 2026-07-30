// ملف الخادم الرئيسي

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const passport = require('passport');
const connectDB = require('./config/db');
const path = require('path');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');

dotenv.config();
connectDB();
require('./config/passport');

const app = express();

// Security Middlewares
app.use(helmet({ 
  crossOriginResourcePolicy: false,
  crossOriginOpenerPolicy: false
}));

const corsOptions = {
  origin: function (origin, callback) {
    // تحديد النطاقات المسموح بها (localhost للتطوير، والمتغير FRONTEND_URL للإنتاج)
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://budget-wise-front-end-w7fh.vercel.app',
      process.env.FRONTEND_URL
    ].filter(Boolean);

    // السماح للطلبات بدون origin (مثل Postman أو السيرفر نفسه) أو إذا كان النطاق مسموحاً به
    if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost:')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
});
app.use('/api', limiter);

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(morgan('dev')); // Request logging
app.use(passport.initialize());

// Serve static files from uploads/ folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: Date.now() });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to the BudgetWise API',
    data: {},
  });
});

// المسارات - Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/budget', require('./routes/budget'));
app.use('/api/activities', require('./routes/activity'));
app.use('/api/plan', require('./routes/plan'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/notifications', require('./routes/notificationRoutes'));


const logger = require('./utils/logger');

// Catch-all route for handling 404 API requests
app.use('*', (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `API Route not found: ${req.originalUrl}`
  });
});

// Global error handler must be last
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

// Export app for Vercel Serverless
module.exports = app;

// Only start server and Socket.io if NOT running on Vercel
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  const server = app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
  });

  // Initialize Socket.io (Works locally, disabled on Vercel Serverless)
  const io = require('./utils/socket').init(server);
  io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.id}`);
    
    socket.on('join', (userId) => {
      socket.join(userId);
      logger.info(`User ${userId} joined their notification room`);
    });

    socket.on('disconnect', () => {
      logger.info('Client disconnected');
    });
  });
}

