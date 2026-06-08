const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const Utilisateur = sequelize.define('Utilisateur', {
  id: {
    type:          DataTypes.INTEGER,
    primaryKey:    true,
    autoIncrement: true
  },
  nom: {
    type:      DataTypes.STRING,
    allowNull: false
  },
  email: {
    type:      DataTypes.STRING,
    allowNull: false,
    unique:    true
  },
  mot_de_passe: {
    type:      DataTypes.STRING,
    allowNull: false
  },
  role: {
    type:         DataTypes.ENUM('operateur', 'superviseur', 'admin'),
    defaultValue: 'operateur'
  }
}, {
  tableName:  'utilisateurs',
  timestamps: true
})

module.exports = Utilisateur