const express = require('express');
const router = express.Router();
const battleController = require('../controllers/battleController');

// Ruta para simular un ataque básico.
router.post('/attack', battleController.simulateAttack);

module.exports = router;