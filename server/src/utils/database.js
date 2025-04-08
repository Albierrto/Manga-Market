// server/src/utils/database.js - CORRECTED dotenv path loading (AGAIN!)

const { Sequelize } = require('sequelize');
const path = require('path'); // Import path module

// **MODIFIED**: Load .env file from the PARENT directory (THREE levels up from src/utils)
require('dotenv').config({ path: path.join(__dirname, '..', '..', '..', '.env') }); // <-- CORRECTED PATH

// Log loaded variables for debugging (optional, remove in production)
// console.log('DB_HOST:', process.env.DB_HOST);
// console.log('DB_PORT:', process.env.DB_PORT);
// console.log('DB_NAME:', process.env.DB_NAME);
// console.log('DB_USER:', process.env.DB_USER);
// console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '******' : 'Not Loaded');

// Create Sequelize instance using environment variables or defaults
const sequelize = new Sequelize(
  process.env.DB_NAME || 'manga_market',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'your_password', // Default fallback if not in .env
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      idle: 10000
    }
  }
);

// Test the connection (Optional - can be removed if done elsewhere)
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully via database.js.');
  } catch (error) {
    console.error('Unable to connect to the database via database.js:', error);
  }
};

// Optional: Call testConnection immediately if desired, e.g., when module loads
// testConnection();

module.exports = sequelize; // Export the configured instance