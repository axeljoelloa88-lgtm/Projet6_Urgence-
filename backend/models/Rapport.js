const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const Rapport = sequelize.define('Rapport', {
  id: {
    type:          DataTypes.INTEGER,
    primaryKey:    true,
    autoIncrement: true
  },
  titre: {
    type:      DataTypes.STRING,
    allowNull: false
  },
  contenu: {
    type: DataTypes.TEXT
  },
  intervention_id: {
    type: DataTypes.INTEGER
  },
  auteur_id: {
    type: DataTypes.INTEGER
  }
}, {
  tableName:  'rapports',
  timestamps: true
})

module.exports = Rapport