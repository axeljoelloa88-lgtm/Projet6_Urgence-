const jwt = require('jsonwebtoken')

const authMiddleware = (req, res, next) => {

  // 1. Récupérer le token dans le header
  const authHeader = req.headers.authorization

  // 2. Vérifier qu'il existe et commence par "Bearer "
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Accès refusé — token manquant' })
  }

  // 3. Extraire le token (enlever "Bearer ")
  const token = authHeader.split(' ')[1]

  // 4. Vérifier et décoder le token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded  // { id, nom, role }
    next()              // continuer vers le controller
  } catch (err) {
    return res.status(401).json({ message: 'Token invalide ou expiré' })
  }

}

module.exports = authMiddleware