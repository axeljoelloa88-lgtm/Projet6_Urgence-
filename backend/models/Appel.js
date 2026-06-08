const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const Appel = sequelize.define('Appel', {
  id: {
    type:          DataTypes.INTEGER,
    primaryKey:    true,
    autoIncrement: true
  },
  appelant_nom: {
    type:      DataTypes.STRING,
    allowNull: false
  },
  appelant_tel: {
    type:      DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  type_urgence: {
    type:      DataTypes.ENUM('incendie', 'medical', 'accident', 'autre'),
    allowNull: false
  },
  priorite: {
    type:         DataTypes.ENUM('faible', 'moyenne', 'haute', 'critique'),
    defaultValue: 'moyenne'
  },
  latitude: {
    type: DataTypes.FLOAT
  },
  longitude: {
    type: DataTypes.FLOAT
  },
  adresse: {
    type: DataTypes.STRING
  },
  statut: {
    type:         DataTypes.ENUM('recu', 'en_traitement', 'cloture'),
    defaultValue: 'recu'
  },
  operateur_id: {
    type: DataTypes.INTEGER
  }
}, {
  tableName:  'appels',
  timestamps: true
})

module.exports = Appel