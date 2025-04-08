// server/index.js - UPDATED to include seriesRoutes

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path'); // Import the 'path' module

// Load environment variables from .env file in the PARENT directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const sequelize = require('./src/utils/database'); // Import sequelize

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
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
// NOTE: Ensure the prefix here matches how you expect to call it from the frontend
// If your api.js uses '/api' as baseURL and fetchSeries calls '/series', then '/api/series' is correct.
app.use('/api', priceRoutes); // Handles routes defined within priceRoutes starting /api/...
app.use('/api', notificationRoutes); // Handles routes defined within notificationRoutes starting /api/...
app.use('/api/series', seriesRoutes); // *** ADD THIS LINE - Handles routes defined in seriesRoutes starting /api/series/... ***
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