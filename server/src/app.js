const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// Import routes
const seriesRoutes = require('./routes/seriesRoutes');
const volumeRoutes = require('./routes/volumeRoutes');
const priceRoutes = require('./routes/priceRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const listingRoutes = require('./routes/listingRoutes');

// Initialize Express app
const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Mount routes
app.get('/', (req, res) => {
  res.json({ message: 'Manga Market API' });
});

// API routes
app.use('/api/series', seriesRoutes);
app.use('/api/volumes', volumeRoutes);
app.use('/api/price', priceRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/listings', listingRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  res.status(500).json({
    success: false,
    error: err.message || 'Server Error'
  });
});

module.exports = app;