const express = require('express');
const cors = require('cors'); // Make sure cors is installed (npm install cors)
const dotenv = require('dotenv');
const path = require('path'); // Import the 'path' module

// Load environment variables from .env file in the PARENT directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const sequelize = require('./src/utils/database'); // Import sequelize

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// --- START CORS Configuration ---
const allowedOrigins = [
  'https://manga-markett.netlify.app', // Your deployed frontend URL
  'http://localhost:3000'             // Your local frontend development URL (optional)
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl requests, or server-to-server)
    // or if the origin is in the allowed list
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error(`Origin '${origin}' not allowed by CORS`)); // More specific error
    }
  },
  optionsSuccessStatus: 200 // For legacy browser compatibility
};

// Use configured CORS middleware
app.use(cors(corsOptions));
// --- END CORS Configuration ---


// Middleware
// app.use(cors()); // REMOVE THIS LINE - Replaced by the configuration above
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import route files
const priceRoutes = require('./src/routes/priceRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');
const seriesRoutes = require('./src/routes/seriesRoutes'); // *** ADD THIS LINE ***
// *** Add imports for other routes if needed (volumeRoutes, inventoryRoutes, etc.) ***
// const volumeRoutes = require('./src/routes/volumeRoutes');
// const inventoryRoutes = require('./src/routes/inventoryRoutes');
// const listingRoutes = require('./src/routes/listingRoutes');

// Root route for testing
app.get('/', (req, res) => {
  res.send('Manga Market API is running!');
});

// Apply routes with prefixes
app.use('/api', priceRoutes);
app.use('/api', notificationRoutes);
app.use('/api/series', seriesRoutes);
// *** Add other app.use calls if needed ***
// app.use('/api/volumes', volumeRoutes);
// app.use('/api/inventory', inventoryRoutes);
// app.use('/api/listings', listingRoutes);


// Simple API test route (remove if not needed)
app.get('/api/test', (req, res) => {
    res.json({ success: true, message: 'API test successful' });
});


// Debug route (remove if not needed)
app.get('/hello', (req, res) => {
  res.send('Hello World');
});

// Basic 404 handler for API routes specifically (Optional but good practice)
app.use('/api/*', (req, res, next) => {
    res.status(404).json({ success: false, message: 'API route not found.' });
});


// Start server
app.listen(PORT, async () => { // Make listener async
  console.log(`Server running on port ${PORT}`);
  console.log(`Test the server: http://localhost:${PORT}/hello`);
  console.log(`Root route: http://localhost:${PORT}/`);
  // console.log(`API test route: http://localhost:${PORT}/api/test`);

  // Test DB connection on startup
  try {
      await sequelize.authenticate();
      console.log('Database connection verified successfully on server start.');
      // Optional: Sync models (use with caution in production)
      // await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
      // console.log('Database models synchronized.');
  } catch (error) {
      console.error('Error connecting to or synchronizing the database on server start:', error);
  }
});