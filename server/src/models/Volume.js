const { DataTypes } = require('sequelize');
const sequelize = require('../utils/database');

const Volume = sequelize.define('Volume', {
  volume_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  volume_number: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  isbn: {
    type: DataTypes.STRING,
    allowNull: true
  },
  retail_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  release_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  cover_image: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'volumes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Volume;