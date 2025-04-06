const { DataTypes } = require('sequelize');
const sequelize = require('../utils/database');

const Series = sequelize.define('Series', {
  series_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  publisher: {
    type: DataTypes.STRING,
    allowNull: true
  },
  total_volumes: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'ongoing',
    validate: {
      isIn: [['ongoing', 'completed', 'hiatus', 'cancelled']]
    }
  }
}, {
  tableName: 'series',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Series;