'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Series', { // Using 'Series' matching common model naming
      series_id: {             // Matches screenshot column name
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.DataTypes.INTEGER
      },
      name: {
        type: Sequelize.DataTypes.STRING, // character varying(255) maps to STRING
        allowNull: false,
        unique: true // Assuming series names must be unique
      },
      publisher: {
        type: Sequelize.DataTypes.STRING,
        allowNull: true // Assuming publisher might be optional
      },
      total_volumes: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: false
      },
      status: {
        type: Sequelize.DataTypes.STRING, // Or ENUM if you prefer strict values
        // Example using ENUM:
        // type: Sequelize.DataTypes.ENUM('completed', 'ongoing', 'hiatus'),
        allowNull: false
      },
      // Use Sequelize's standard timestamp column names
      createdAt: {
        allowNull: false,
        type: Sequelize.DataTypes.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') // Optional: Set default
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DataTypes.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') // Optional: Set default
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Series');
  }
};