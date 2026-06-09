const Vehicule = require('../models/Vehicule')

// GET /api/vehicules — tous les véhicules
const getAll = async (req, res) => {
  try {
    const vehicules = await Vehicule.findAll({
      order: [['nom', 'ASC']]
    })
    res.json(vehicules)
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', erreur: err.message })
  }
}

// GET /api/vehicules/disponibles — véhicules disponibles seulement
const getDisponibles = async (req, res) => {
  try {
    const vehicules = await Vehicule.findAll({
      where: { statut: 'disponible' },
      order: [['nom', 'ASC']]
    })
    res.json(vehicules)
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', erreur: err.message })
  }
}

// PATCH /api/vehicules/:id/statut — changer le statut d'un véhicule
const updateStatut = async (req, res) => {
  try {
    const vehicule = await Vehicule.findByPk(req.params.id)
    if (!vehicule) {
      return res.status(404).json({ message: 'Véhicule introuvable' })
    }
    await vehicule.update({ statut: req.body.statut })

    // Notifier le dashboard en temps réel
    req.app.get('io').emit('statut_vehicule', vehicule)

    res.json(vehicule)
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', erreur: err.message })
  }
}

module.exports = { getAll, getDisponibles, updateStatut }