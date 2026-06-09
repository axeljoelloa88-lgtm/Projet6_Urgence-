const express        = require('express')
const router         = express.Router()
const ctrl           = require('../controllers/utilisateur.controller')
const authMiddleware = require('../middlewares/auth.middleware')
const { superviseurOnly } = require('../middlewares/role.middleware')

router.use(authMiddleware)

router.get('/',    superviseurOnly, ctrl.getAll)  // GET /api/utilisateurs
router.get('/:id', ctrl.getById)                  // GET /api/utilisateurs/:id

module.exports = router