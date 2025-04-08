const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const apiRoutes = require('./routes/apiRoutes'); // Assuming this includes all your API route logic
const sequelize = require('./src/utils/database'); // *** ADD THIS: Import your Sequelize instance ***

// Load environment variables
// Make sure .env is in the root of your 'server' directory or adjust path
dotenv.config();

// Initialize express app
const app = express();

// --- START CORS Configuration ---
// Using the configuration from earlier - allowing your Netlify site
const allowedOrigins = [
  'https://manga-markett.netlify.app', // Your deployed frontend URL
  'http://localhost:3000'             // Your local frontend development URL (optional)
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error(`Origin '${origin}' not allowed by CORS`));
    }
  },
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
// --- END CORS Configuration ---


// Other Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // If you use form submissions directly to API

// Routes
app.use('/api', apiRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Manga Market API' });
});

// Basic 404 handler for API routes specifically (Good practice)
app.use('/api/*', (req, res, next) => {
    res.status(404).json({ success: false, message: 'API route not found.' });
});

// Start server and sync database
const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => { // *** Make the callback async ***
  console.log(`Server running on port ${PORT}`);
  try {
    // Optional: Test connection first
    await sequelize.authenticate();
    console.log('Database connection verified successfully.');

    // *** ADD THIS: Sync database tables based on models ***
    // Using alter: true is safer than force: true, but still use with caution.
    // It attempts to modify tables to match models without dropping them.
    // force: true WILL DROP tables and delete all data. DO NOT use force: true lightly.
    await sequelize.sync({ alter: true });
    console.log('Database synchronized successfully (alter: true).');

  } catch (error) {
    console.error('Error connecting to or synchronizing the database:', error);
  }
});