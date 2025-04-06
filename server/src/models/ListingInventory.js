const { DataTypes } = require('sequelize');
const sequelize = require('../utils/database');

const ListingInventory = sequelize.define('ListingInventory', {
  listing_inventory_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  listing_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  inventory_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'listing_inventory',
  timestamps: false
});

module.exports = ListingInventory;