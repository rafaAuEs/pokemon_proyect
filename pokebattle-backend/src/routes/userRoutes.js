const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Definimos que cuando alguien haga un POST a /register, se ejecute la lógica anterior
router.post('/register', userController.registerUser);

module.exports = router;