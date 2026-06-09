const express        = require('express')
const router         = express.Router()
const ctrl           = require('../controllers/intervention.controller')
const authMiddleware = require('../middlewares/auth.middleware')

router.use(authMiddleware)

router.get('/',               ctrl.getAll)         // GET  /api/interventions
router.get('/:id',            ctrl.getById)        // GET  /api/interventions/:id
router.post('/',              ctrl.create)         // POST /api/interventions
router.patch('/:id/statut',   ctrl.updateStatut)   // PATCH /api/interventions/:id/statut
router.patch('/:id/assign',   ctrl.assignVehicule) // PATCH /api/interventions/:id/assign

module.exports = router
