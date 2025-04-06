const { DataTypes } = require('sequelize');
const sequelize = require('../utils/database');

const CompletedSale = sequelize.define('CompletedSale', {
  sale_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  source: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'ebay'
  },
  source_listing_id: {
    type: DataTypes.STRING,
    allowNull: true
  },
  sale_date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  sale_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  currency: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'USD'
  },
  condition: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'good'
  },
  is_complete_set: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, {
  tableName: 'completed_sales',
  timestamps: true,
  createdAt: 'imported_at',
  updatedAt: false
});

module.exports = CompletedSale;