const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const Intervention = sequelize.define('Intervention', {
  id: {
    type:          DataTypes.INTEGER,
    primaryKey:    true,
    autoIncrement: true
  },
  statut: {
    type:         DataTypes.ENUM('en_attente', 'en_route', 'sur_place', 'termine'),
    defaultValue: 'en_attente'
  },
  date_debut:  { type: DataTypes.DATE },
  date_fin:    { type: DataTypes.DATE },
  notes:       { type: DataTypes.TEXT },
  appel_id:    { type: DataTypes.INTEGER },
  vehicule_id: { type: DataTypes.INTEGER },
  agent_id:    { type: DataTypes.INTEGER }
}, {
  tableName:  'interventions',
  timestamps: true
})

module.exports = Intervention