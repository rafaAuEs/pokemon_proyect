"use strict";

const mongoose = require('mongoose');

const SpeciesCacheSchema = new mongoose.Schema({
    pokemonId: {
        type: Number,
        required: true,
        unique: true,
        index: true
    },
    name: {
        type: String,
        required: true
    },
    baseStats: {
        hp: Number,
        attack: Number,
        defense: Number,
        spAttack: Number,
        spDefense: Number,
        speed: Number
    },
    types: [String]
});

module.exports = mongoose.model('SpeciesCache', SpeciesCacheSchema);
