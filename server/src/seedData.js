// server/src/seedData.js - Simplified, removed sync call assumption

const path = require('path');

// Ensure dotenv is loaded first for this script execution
try {
    const dotEnvPath = path.join(__dirname, '..', '..', '.env');
    console.log(`[seedData] Attempting to load .env from: ${dotEnvPath}`);
    require('dotenv').config({ path: dotEnvPath });
    console.log(`[seedData] DB_PASSWORD loaded: ${process.env.DB_PASSWORD ? 'Yes (******)' : 'No'}`);
    if (!process.env.DB_PASSWORD) {
        throw new Error("DB_PASSWORD was not found in the .env file!");
    }
} catch (dotenvError) {
     console.error("[seedData] Error loading .env file:", dotenvError);
     process.exit(1);
}

// Require necessary modules AFTER dotenv is loaded
const { sequelize } = require('./models'); // Gets configured sequelize
const seedSalesData = require('./seeders/sampleSalesData'); // Assumes this uses models/sequelize

// Run the seed function
(async () => {
  try {
    // Authenticate connection explicitly here for clarity
    console.log('[seedData] Authenticating database connection...');
    await sequelize.authenticate();
    console.log('[seedData] Database connection successful.');

    console.log('[seedData] Starting to seed data using sampleSalesData...');
    await seedSalesData(); // Run the actual seeding logic
    console.log('[seedData] Data seeding completed successfully.');

  } catch (error) {
    console.error('[seedData] Error during seeding process:', error);
    process.exit(1); // Exit with error code

  } finally {
    // Always close the connection when script finishes or errors
    await sequelize.close();
    console.log('[seedData] Database connection closed.');
  }
})(); // Removed process.exit(0) from try, let finally handle closing