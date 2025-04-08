// server/src/models/index.js - FINAL - REMOVED automatic syncModels() call

const sequelize = require('../utils/database');
const Series = require('./Series');
const Volume = require('./Volume');
const PriceHistory = require('./PriceHistory');
const CompletedSale = require('./CompletedSale');
const SaleVolume = require('./SaleVolume');
const Inventory = require('./Inventory');
const Listing = require('./Listing');
const ListingInventory = require('./ListingInventory');
// const User = require('./User'); // Uncomment if User model exists

// Define relationships (Keep all relationship definitions as they were)
Series.hasMany(Volume, { foreignKey: 'series_id', as: 'volumes' });
Volume.belongsTo(Series, { foreignKey: 'series_id', as: 'series' });

Series.hasMany(PriceHistory, { foreignKey: 'series_id', as: 'priceHistory' });
PriceHistory.belongsTo(Series, { foreignKey: 'series_id', as: 'series' });

Volume.hasMany(SaleVolume, { foreignKey: 'volume_id', as: 'saleEntries' });
SaleVolume.belongsTo(Volume, { foreignKey: 'volume_id', as: 'volume' });

CompletedSale.hasMany(SaleVolume, { foreignKey: 'sale_id', as: 'includedVolumes' });
SaleVolume.belongsTo(CompletedSale, { foreignKey: 'sale_id', as: 'sale' });

Inventory.belongsTo(Volume, { foreignKey: 'volume_id', as: 'volume' });
// Inventory.belongsTo(User, { foreignKey: 'user_id', as: 'owner' }); // Uncomment if User model exists
// User.hasMany(Inventory, { foreignKey: 'user_id', as: 'inventoryItems' }); // Uncomment if User model exists

Inventory.belongsToMany(Listing, { through: ListingInventory, foreignKey: 'inventory_id', as: 'listings' });
Listing.belongsToMany(Inventory, { through: ListingInventory, foreignKey: 'listing_id', as: 'inventoryItems' });
// Listing.belongsTo(User, { foreignKey: 'seller_id', as: 'seller' }); // Uncomment if User model exists
// User.hasMany(Listing, { foreignKey: 'seller_id', as: 'userListings' }); // Uncomment if User model exists


// Function definition kept, but not called automatically
const syncModels = async () => {
  try {
    await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
    console.log('Database models synchronized successfully.');
  } catch (error) {
    console.error('Error synchronizing database models:', error);
     throw error; // Re-throw error if called explicitly and fails
  }
};

// *** The automatic call 'syncModels();' line that was here MUST be removed ***

module.exports = {
  sequelize,
  syncModels, // Export the function so it CAN be called explicitly (e.g., in index.js startup)
  Series,
  Volume,
  PriceHistory,
  CompletedSale,
  SaleVolume,
  Inventory,
  Listing,
  ListingInventory
  // User // Uncomment if User model exists
};