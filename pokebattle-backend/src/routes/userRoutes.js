"use strict";

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/auth');
// Definimos que cuando alguien haga un POST a /register, se ejecute la lógica de userController,registerUser
router.post('/register', userController.registerUser);
// Ruta protegida para recuperar la sesión del usuario autenticado
router.get('/me', authMiddleware, userController.getMe);
// Definimos que cuando alguien haga un GET a /login, se ejecute la lógica de userController,loginUser
router.post('/login', userController.loginUser);
// Ruta para añadir un Pokémon al equipo del usuario
router.post('/team/add', userController.addPokemonToTeam);
// Ruta para liberar un Pokémon del equipo del usuario
router.post('/team/remove', userController.removePokemonFromTeam);
// Ruta para reiniciar el progreso del jugador
router.post('/reset', userController.resetProgress);
// Ruta para reordenar el equipo del jugador
router.post('/team/reorder', authMiddleware, userController.reorderTeam);
// Rutas para el PC de Bill (mover Pokémon entre equipo y caja)
router.post('/team/move-to-box', authMiddleware, userController.moveToBox);
router.post('/team/move-to-team', authMiddleware, userController.moveToTeam);
router.post('/box/release', authMiddleware, userController.releaseFromBox);
module.exports = router;