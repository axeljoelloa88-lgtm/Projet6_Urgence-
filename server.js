const path      = require('path')
const express   = require('express')
const http      = require('http')
const { Server } = require('socket.io')
require('dotenv').config()

const sequelize = require('./backend/config/database')

const app    = express()
const server = http.createServer(app)
const io     = new Server(server, { cors: { origin: '*' } })

app.use(express.json())
app.use(express.static(path.join(__dirname, 'frontend')))
app.set('io', io)

app.use('/api/auth',   require('./backend/routes/auth.routes'))
app.use('/api/appels', require('./backend/routes/appel.routes'))
app.use('/api/vehicules', require('./backend/routes/vehicule.routes'))
app.use('/api/interventions', require('./backend/routes/intervention.routes'))
app.use('/api/utilisateurs', require('./backend/routes/utilisateur.routes'))

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'htlm', 'index.html'))
})



app.get('/api/geocode', async (req, res) => {
  const query = String(req.query.q || '').trim();
  if (!query) {
    return res.status(400).json({ message: 'Adresse requise pour le géocodage.' });
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'UrgencePlus/1.0 (projet6)',
        Accept: 'application/json'
      }
    });

    if (!response.ok) {
      return res.status(502).json({ message: 'Erreur de géocodage externe.' });
    }

    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) {
      return res.status(404).json({ message: 'Adresse introuvable.' });
    }

    const place = data[0];
    res.json({
      latitude: parseFloat(place.lat),
      longitude: parseFloat(place.lon),
      display_name: place.display_name
    });
  } catch (err) {
    console.error('Erreur géocodeur:', err.message);
    res.status(500).json({ message: 'Impossible de géocoder l adresse.' });
  }
})

io.on('connection', (socket) => {
  console.log('🔌 Client connecté :', socket.id)
})

const PORT = process.env.PORT || 3000

server.listen(PORT, async () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`)
  try {
    await sequelize.authenticate()
    console.log('✅ Base de données connectée avec succès')
  } catch (err) {
    console.error('❌ Erreur de connexion BD :', err.message)
  }
})