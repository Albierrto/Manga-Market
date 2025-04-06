const { DataTypes } = require('sequelize');
const sequelize = require('../utils/database');

const PriceHistory = sequelize.define('PriceHistory', {
  price_history_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  series_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  start_volume: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  end_volume: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  avg_price_per_volume: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  set_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  is_complete_set: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  condition: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'good'
  },
  source: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'price_history',
  timestamps: true,
  createdAt: 'record_date',
  updatedAt: false
});

module.exports = PriceHistory;