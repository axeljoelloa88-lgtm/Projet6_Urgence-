const Appel = require('../models/Appel')

// GET /api/appels — récupérer tous les appels
const getAll = async (req, res) => {
  try {
    const appels = await Appel.findAll({
      order: [['createdAt', 'DESC']]
    })
    res.json(appels)
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', erreur: err.message })
  }
}

// GET /api/appels/:id — récupérer un appel par id
const getById = async (req, res) => {
  try {
    const appel = await Appel.findByPk(req.params.id)
    if (!appel) {
      return res.status(404).json({ message: 'Appel introuvable' })
    }
    res.json(appel)
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', erreur: err.message })
  }
}

// POST /api/appels — créer un nouvel appel
const create = async (req, res) => {
  try {
    const appel = await Appel.create({
      ...req.body,
      operateur_id: req.user.id  // l'opérateur connecté
    })

    // Notifier le dashboard en temps réel
    req.app.get('io').emit('nouvel_appel', appel)

    res.status(201).json(appel)
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', erreur: err.message })
  }
}

// PATCH /api/appels/:id/statut — changer le statut d'un appel
const updateStatut = async (req, res) => {
  try {
    const appel = await Appel.findByPk(req.params.id)
    if (!appel) {
      return res.status(404).json({ message: 'Appel introuvable' })
    }
    await appel.update({ statut: req.body.statut })
    res.json(appel)
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', erreur: err.message })
  }
}

module.exports = { getAll, getById, create, updateStatut }