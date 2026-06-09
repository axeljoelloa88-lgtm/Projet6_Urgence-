const express        = require('express')
const router         = express.Router()
const ctrl           = require('../controllers/vehicule.controller')
const authMiddleware = require('../middlewares/auth.middleware')

router.use(authMiddleware)

router.get('/',             ctrl.getAll)        // GET  /api/vehicules
router.get('/disponibles',  ctrl.getDisponibles)// GET  /api/vehicules/disponibles
router.patch('/:id/statut', ctrl.updateStatut)  // PATCH /api/vehicules/:id/statut

module.exports = router