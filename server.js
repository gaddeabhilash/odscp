const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');
const { apiLimiter } = require('./middleware/rateLimiter');

// Load environment variables
dotenv.config();

const app = express();

app.use((req, res, next) => {
  console.log(`[Master Trace] ${req.method} ${req.url}`);
  next();
});

// Base Middlewares
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()) 
  : ['http://localhost:5173', 'http://127.0.0.1:5173'];

app.use(cors({
  origin: true, // This will reflect the request origin, effectively allowing all
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan('dev')); // Logging middleware

// Root Route
app.get('/', (req, res) => {
  res.send('ODSCP API is running...');
});

// Mock API Middleware (Intersects requests if USE_MOCK_DB is true)
if (process.env.USE_MOCK_DB === 'true') {
  app.use(require('./middleware/mockApiMiddleware'));
}

app.use(apiLimiter); // Apply rate limiter

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// Map Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/projects', require('./routes/projectRoutes'));
app.use('/api/updates', require('./routes/updateRoutes'));
app.use('/api/files', require('./routes/fileRoutes'));

// Process Errors
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`));
  } catch (error) {
    console.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
