const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const Vehicule = sequelize.define('Vehicule', {
  id: {
    type:          DataTypes.INTEGER,
    primaryKey:    true,
    autoIncrement: true
  },
  nom: {
    type:      DataTypes.STRING,
    allowNull: false
  },
  immatriculation: {
    type:      DataTypes.STRING,
    allowNull: false,
    unique:    true
  },
  type: {
    type:      DataTypes.ENUM('ambulance', 'camion_pompier', 'voiture_patrouille'),
    allowNull: false
  },
  statut: {
    type:         DataTypes.ENUM('disponible', 'en_mission', 'hors_service'),
    defaultValue: 'disponible'
  },
  latitude:  { type: DataTypes.FLOAT },
  longitude: { type: DataTypes.FLOAT }
}, {
  tableName:  'vehicules',
  timestamps: true
})

module.exports = Vehicule