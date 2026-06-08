// Réservé au superviseur uniquement
const superviseurOnly = (req, res, next) => {
  if (req.user.role !== 'superviseur') {
    return res.status(403).json({ message: 'Accès réservé au superviseur' })
  }
  next()
}

// Opérateur ou superviseur
const operateurOuSuperviseur = (req, res, next) => {
  if (!['operateur', 'superviseur'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Accès non autorisé' })
  }
  next()
}

module.exports = { superviseurOnly, operateurOuSuperviseur }