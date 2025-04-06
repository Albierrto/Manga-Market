// server/index.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

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

// Root route for testing
app.get('/', (req, res) => {
  res.send('Manga Market API is running!');
});

// Apply routes with prefixes
app.use('/api', priceRoutes);
app.use('/api', notificationRoutes);

// Debug route to test that Express is working
app.get('/hello', (req, res) => {
  res.send('Hello World');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Test the server: http://localhost:${PORT}/hello`);
  console.log(`Root route: http://localhost:${PORT}/`);
  console.log(`API test route: http://localhost:${PORT}/api/test`);
});