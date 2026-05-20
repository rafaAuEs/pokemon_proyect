"use strict";

const express = require('express');
const router = express.Router();
const battleController = require('../controllers/battleController');
const auth = require('../middlewares/auth');

// Ruta para comenzar un combate
router.post('/start', battleController.startBattle);
// Ruta para simular un ataque básico.
router.post('/attack', battleController.simulateAttack);
// Ruta para generar un encuentro.
router.post('/encounter', battleController.generateEncounter);
// Ruta para cambiar de Pokémon en combate.
router.post('/switch', battleController.switchPokemon);
// Ruta para huir del combate.
router.post('/flee', battleController.fleeFromBattle);

module.exports = router;