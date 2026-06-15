const express        = require('express')
const router         = express.Router()
const ctrl           = require('../controllers/rapport.controller')
const authMiddleware = require('../middlewares/auth.middleware')
const { superviseurOnly } = require('../middlewares/role.middleware')

router.use(authMiddleware)

// GET  /api/rapports
router.get('/', ctrl.getAll)

// GET  /api/rapports/intervention/:id
router.get('/intervention/:id', ctrl.getByIntervention)

// GET  /api/rapports/:id
router.get('/:id', ctrl.getById)

// GET  /api/rapports/:id/details
router.get('/:id/details', ctrl.getDetails)

// POST /api/rapports
router.post('/', ctrl.create)

// PATCH /api/rapports/:id
router.patch('/:id', ctrl.update)

module.exports = router