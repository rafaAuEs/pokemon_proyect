"use strict";

const mongoose = require('mongoose');

const PokemonInstanceSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    pokemonId: {
        type: Number,
        required: true
    },
    nickname: String,
    level: {
        type: Number,
        default: 1
    },
    experience: {
        type: Number,
        default: 0
    },
    currentHp: Number,
    stats: {
        hp: Number,
        attack: Number,
        defense: Number,
        spAttack: Number,
        spDefense: Number,
        speed: Number
    },
    moves: [String],
    inTeam: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('PokemonInstance', PokemonInstanceSchema);
