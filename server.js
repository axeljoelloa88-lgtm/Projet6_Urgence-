const express = require('express')
require('dotenv').config()

const sequelize = require('./backend/config/database')

const app = express()

app.use(express.json())

// Route de test
app.get('/api/ping', (req, res) => {
  res.json({ message: 'Serveur Urgence+ opérationnel', status: 'ok' })
})

// Démarrage
const PORT = process.env.PORT || 3000

app.listen(PORT, async () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`)

  try {
    await sequelize.authenticate()
    console.log('✅ Base de données connectée avec succès')
  } catch (err) {
    console.error('❌ Erreur de connexion BD :', err.message)
  }
})