// server/src/utils/database.js
const { Sequelize } = require('sequelize');
const path = require('path'); 

// Load .env file from the parent directory
require('dotenv').config({ path: path.join(__dirname, '..', '..', '..', '.env') });

// Create Sequelize instance using Render PostgreSQL connection string
const sequelize = new Sequelize(process.env.DATABASE_URL || 'postgresql://manga_market_alberto:7CiLWrQwWbWAjMuvaXyEyE2dMjdhWJv4@dpg-cvqbbgeuk2gs73d1js8g-a.virginia-postgres.render.com/manga_market_db', {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 5,
    min: 0,
    idle: 10000
  }
});

// Test the connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully via database.js.');
  } catch (error) {
    console.error('Unable to connect to the database via database.js:', error);
  }
};

// Uncomment to test connection when module loads
// testConnection();

module.exports = sequelize;