const express        = require('express')
const router         = express.Router()
const ctrl           = require('../controllers/appel.controller')
const authMiddleware = require('../middlewares/auth.middleware')

// Toutes les routes nécessitent un token JWT valide
router.use(authMiddleware)

router.get('/',             ctrl.getAll)       // GET  /api/appels
router.get('/:id',          ctrl.getById)      // GET  /api/appels/:id
router.post('/',            ctrl.create)       // POST /api/appels
router.patch('/:id/statut', ctrl.updateStatut) // PATCH /api/appels/:id/statut

module.exports = router