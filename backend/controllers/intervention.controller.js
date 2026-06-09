const Intervention = require('../models/Intervention')
const Appel = require('../models/Appel')
const Vehicule = require('../models/Vehicule')

// GET /api/interventions
const getAll = async (req, res) => {
  try {
    const interventions = await Intervention.findAll({
      order: [['createdAt', 'DESC']]
    })
    res.json(interventions)
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', erreur: err.message })
  }
}

// GET /api/interventions/:id
const getById = async (req, res) => {
  try {
    const intervention = await Intervention.findByPk(req.params.id)
    if (!intervention) {
      return res.status(404).json({ message: 'Intervention introuvable' })
    }
    res.json(intervention)
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', erreur: err.message })
  }
}

// POST /api/interventions
const create = async (req, res) => {
  try {
    const intervention = await Intervention.create({
      ...req.body,
      agent_id: req.user.id
    })

    req.app.get('io').emit('nouvelle_intervention', intervention)

    res.status(201).json(intervention)
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', erreur: err.message })
  }
}

// PATCH /api/interventions/:id/statut
const updateStatut = async (req, res) => {
  try {
    const intervention = await Intervention.findByPk(req.params.id)
    if (!intervention) {
      return res.status(404).json({ message: 'Intervention introuvable' })
    }

    const updates = { statut: req.body.statut }

    // Si clôture → date_fin + libérer le véhicule
    if (req.body.statut === 'termine') {
      updates.date_fin = req.body.date_fin || new Date()

      if (intervention.vehicule_id) {
        await Vehicule.update(
          { statut: 'disponible' },
          { where: { id: intervention.vehicule_id } }
        )
      }
    }

    await intervention.update(updates)
    req.app.get('io').emit('statut_intervention', intervention)
    res.json(intervention)

  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', erreur: err.message })
  }
}

// PATCH /api/interventions/:id/assign
const assignVehicule = async (req, res) => {
  try {
    const intervention = await Intervention.findByPk(req.params.id)
    if (!intervention) {
      return res.status(404).json({ message: 'Intervention introuvable' })
    }

    const { vehicule_id, statut } = req.body
    if (vehicule_id) {
        const vehicule = await Vehicule.findByPk(vehicule_id)
        if (!vehicule) {
            return res.status(404).json({ message: 'Véhicule introuvable' })
        }
        await intervention.update({
            vehicule_id,
            date_debut: new Date()  // ← ajout ici
        })
        await vehicule.update({ statut: 'en_mission' })
    }

    if (statut) {
      await intervention.update({ statut })
    }

    const updated = await Intervention.findByPk(req.params.id)
    req.app.get('io').emit('intervention_assignée', updated)
    res.json(updated)
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', erreur: err.message })
  }
}

module.exports = { getAll, getById, create, updateStatut, assignVehicule }
