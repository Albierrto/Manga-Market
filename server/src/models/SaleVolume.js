const { DataTypes } = require('sequelize');
const sequelize = require('../utils/database');

const SaleVolume = sequelize.define('SaleVolume', {
  sale_volume_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  sale_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  volume_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'sale_volumes',
  timestamps: false
});

module.exports = SaleVolume;