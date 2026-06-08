const bcrypt      = require('bcryptjs')
const jwt         = require('jsonwebtoken')
const Utilisateur = require('../models/Utilisateur')

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, mot_de_passe } = req.body

    // 1. Vérifier que les champs sont remplis
    if (!email || !mot_de_passe) {
      return res.status(400).json({ message: 'Email et mot de passe requis' })
    }

    // 2. Chercher l'utilisateur par email
    const utilisateur = await Utilisateur.findOne({ where: { email } })
    if (!utilisateur) {
      return res.status(401).json({ message: 'Identifiants incorrects' })
    }

    // 3. Vérifier le mot de passe
    const valide = await bcrypt.compare(mot_de_passe, utilisateur.mot_de_passe)
    if (!valide) {
      return res.status(401).json({ message: 'Identifiants incorrects' })
    }

    // 4. Générer le token JWT
    const token = jwt.sign(
      {
        id:   utilisateur.id,
        nom:  utilisateur.nom,
        role: utilisateur.role
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    )

    // 5. Retourner le token et les infos de l'utilisateur
    res.json({
      token,
      utilisateur: {
        id:   utilisateur.id,
        nom:  utilisateur.nom,
        role: utilisateur.role
      }
    })

  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', erreur: err.message })
  }
}

module.exports = { login }