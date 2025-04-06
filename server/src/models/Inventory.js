const { DataTypes } = require('sequelize');
const sequelize = require('../utils/database');

const Inventory = sequelize.define('Inventory', {
  inventory_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  volume_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  condition: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'good',
    validate: {
      isIn: [['like_new', 'very_good', 'good', 'acceptable', 'poor']]
    }
  },
  purchase_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  purchase_date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'in_stock',
    validate: {
      isIn: [['in_stock', 'listed', 'sold', 'reserved']]
    }
  }
}, {
  tableName: 'inventory',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Inventory;