"use strict";

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
// Definimos que cuando alguien haga un POST a /register, se ejecute la lógica de userController,registerUser
router.post('/register', userController.registerUser);
// Definimos que cuando alguien haga un GET a /login, se ejecute la lógica de userController,loginUser
router.post('/login', userController.loginUser);
// Ruta para añadir un Pokémon al equipo del usuario
router.post('/team/add', userController.addPokemonToTeam);
// Ruta para liberar un Pokémon del equipo del usuario
router.post('/team/remove', userController.removePokemonFromTeam);
// Ruta para reiniciar el progreso del jugador
router.post('/reset', userController.resetProgress);
module.exports = router;