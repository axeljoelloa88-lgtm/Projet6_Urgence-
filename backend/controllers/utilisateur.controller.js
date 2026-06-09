const Utilisateur = require('../models/Utilisateur')

// GET /api/utilisateurs/:id
const getById = async (req, res) => {
  try {
    const utilisateur = await Utilisateur.findByPk(req.params.id, {
      attributes: ['id', 'nom', 'email', 'role'] // exclure mot_de_passe
    })
    if (!utilisateur) {
      return res.status(404).json({ message: 'Utilisateur introuvable' })
    }
    res.json(utilisateur)
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', erreur: err.message })
  }
}

// GET /api/utilisateurs — tous les utilisateurs (superviseur seulement)
const getAll = async (req, res) => {
  try {
    const utilisateurs = await Utilisateur.findAll({
      attributes: ['id', 'nom', 'email', 'role']
    })
    res.json(utilisateurs)
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', erreur: err.message })
  }
}

module.exports = { getById, getAll }