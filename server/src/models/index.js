const sequelize = require('../utils/database');
const Series = require('./Series');
const Volume = require('./Volume');
const PriceHistory = require('./PriceHistory');
const CompletedSale = require('./CompletedSale');
const SaleVolume = require('./SaleVolume');
const Inventory = require('./Inventory');
const Listing = require('./Listing');
const ListingInventory = require('./ListingInventory');

// Define relationships
Series.hasMany(Volume, { foreignKey: 'series_id', as: 'volumes' });
Volume.belongsTo(Series, { foreignKey: 'series_id', as: 'series' });

Series.hasMany(PriceHistory, { foreignKey: 'series_id', as: 'priceHistory' });
PriceHistory.belongsTo(Series, { foreignKey: 'series_id', as: 'series' });

Volume.hasMany(SaleVolume, { foreignKey: 'volume_id', as: 'saleEntries' });
SaleVolume.belongsTo(Volume, { foreignKey: 'volume_id', as: 'volume' });

CompletedSale.hasMany(SaleVolume, { foreignKey: 'sale_id', as: 'includedVolumes' });
SaleVolume.belongsTo(CompletedSale, { foreignKey: 'sale_id', as: 'sale' });

// Inventory relationships
Volume.hasMany(Inventory, { foreignKey: 'volume_id', as: 'inventoryItems' });
Inventory.belongsTo(Volume, { foreignKey: 'volume_id', as: 'volume' });

// Listing relationships
Inventory.belongsToMany(Listing, { through: ListingInventory, foreignKey: 'inventory_id', as: 'listings' });
Listing.belongsToMany(Inventory, { through: ListingInventory, foreignKey: 'listing_id', as: 'inventoryItems' });

// Sync all models with the database
const syncModels = async () => {
  try {
    await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
    console.log('Database models synchronized successfully');
  } catch (error) {
    console.error('Error synchronizing database models:', error);
  }
};

// Call the sync function
syncModels();

module.exports = {
  sequelize,
  Series,
  Volume,
  PriceHistory,
  CompletedSale,
  SaleVolume,
  Inventory,
  Listing,
  ListingInventory
};