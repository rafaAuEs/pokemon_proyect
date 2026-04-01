"use strict";

const express = require('express');
const router = express.Router();
const pokemonController = require('../controllers/pokemonController');

// Cuidado El ":name" es un parámetro dinámico. Puede ser "pikachu", "charizard", "1", "25"...
router.get('/:name', pokemonController.getPokemon);

module.exports = router;