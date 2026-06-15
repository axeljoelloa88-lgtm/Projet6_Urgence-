const Rapport      = require('../models/Rapport')
const Intervention = require('../models/Intervention')
const Appel        = require('../models/Appel')
const Vehicule     = require('../models/Vehicule')
const Utilisateur  = require('../models/Utilisateur')

// ── GET /api/rapports ────────────────────────────────────────
// Superviseur → tous les rapports
// Opérateur   → seulement les siens
const getAll = async (req, res) => {
  try {
    const where = req.user.role === 'superviseur'
      ? {}
      : { auteur_id: req.user.id }

    const rapports = await Rapport.findAll({
      where,
      order: [['createdAt', 'DESC']]
    })
    res.json(rapports)
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', erreur: err.message })
  }
}

// ── GET /api/rapports/:id ────────────────────────────────────
const getById = async (req, res) => {
  try {
    const rapport = await Rapport.findByPk(req.params.id)
    if (!rapport) {
      return res.status(404).json({ message: 'Rapport introuvable' })
    }
    res.json(rapport)
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', erreur: err.message })
  }
}

// ── GET /api/rapports/intervention/:id ───────────────────────
// Récupérer le rapport lié à une intervention
const getByIntervention = async (req, res) => {
  try {
    const rapport = await Rapport.findOne({
      where: { intervention_id: req.params.id }
    })
    // Pas d'erreur si pas trouvé — juste null
    res.json(rapport || null)
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', erreur: err.message })
  }
}

// ── GET /api/rapports/:id/details ────────────────────────────
// Récupérer toutes les données pour générer le PDF
const getDetails = async (req, res) => {
  try {
    const rapport = await Rapport.findByPk(req.params.id)
    if (!rapport) {
      return res.status(404).json({ message: 'Rapport introuvable' })
    }

    // Récupérer l'intervention liée
    const intervention = rapport.intervention_id
      ? await Intervention.findByPk(rapport.intervention_id)
      : null

    // Récupérer l'appel lié
    const appel = intervention?.appel_id
      ? await Appel.findByPk(intervention.appel_id)
      : null

    // Récupérer le véhicule
    const vehicule = intervention?.vehicule_id
      ? await Vehicule.findByPk(intervention.vehicule_id)
      : null

    // Récupérer l'auteur
    const auteur = rapport.auteur_id
      ? await Utilisateur.findByPk(rapport.auteur_id, {
          attributes: ['id', 'nom', 'role']
        })
      : null

    // Récupérer l'agent de l'intervention
    const agent = intervention?.agent_id
      ? await Utilisateur.findByPk(intervention.agent_id, {
          attributes: ['id', 'nom', 'role']
        })
      : null

    res.json({
      rapport,
      intervention,
      appel,
      vehicule,
      auteur,
      agent
    })
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', erreur: err.message })
  }
}

// ── POST /api/rapports ───────────────────────────────────────
// Créer un nouveau rapport
const create = async (req, res) => {
  try {
    const { titre, contenu, intervention_id } = req.body

    if (!contenu || !intervention_id) {
      return res.status(400).json({
        message: 'Contenu et intervention_id sont requis'
      })
    }

    // Vérifier que l'intervention existe
    const intervention = await Intervention.findByPk(intervention_id)
    if (!intervention) {
      return res.status(404).json({ message: 'Intervention introuvable' })
    }

    // Vérifier qu'un rapport n'existe pas déjà
    const existant = await Rapport.findOne({ where: { intervention_id } })
    if (existant) {
      return res.status(409).json({
        message: 'Un rapport existe déjà pour cette intervention',
        rapport: existant
      })
    }

    // Générer le titre automatiquement si non fourni
    const titreFinal = titre ||
      `Rapport INT-${String(intervention_id).padStart(4,'0')} — ${new Date().toLocaleDateString('fr-CA')}`

    const rapport = await Rapport.create({
      titre:           titreFinal,
      contenu,
      intervention_id,
      auteur_id: req.user.id
    })

    res.status(201).json(rapport)
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', erreur: err.message })
  }
}

// ── PATCH /api/rapports/:id ──────────────────────────────────
// Modifier un rapport existant
const update = async (req, res) => {
  try {
    const rapport = await Rapport.findByPk(req.params.id)
    if (!rapport) {
      return res.status(404).json({ message: 'Rapport introuvable' })
    }

    // Seul l'auteur ou le superviseur peut modifier
    if (rapport.auteur_id !== req.user.id && req.user.role !== 'superviseur') {
      return res.status(403).json({ message: 'Modification non autorisée' })
    }

    await rapport.update({
      titre:   req.body.titre   || rapport.titre,
      contenu: req.body.contenu || rapport.contenu
    })

    res.json(rapport)
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', erreur: err.message })
  }
}

module.exports = { getAll, getById, getByIntervention, getDetails, create, update }