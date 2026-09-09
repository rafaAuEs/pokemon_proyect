"use strict";

const mongoose = require('mongoose');

const BattleSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', // Lo enlazamos con el entrenador
        required: true 
    },
    playerPokemon: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PokemonInstance'
    },
    enemyPokemon: {
        pokemonId: Number,
        name: String,
        level: Number,
        stats: {
            hp: Number,
            attack: Number,
            defense: Number,
            spAttack: Number,
            spDefense: Number,
            speed: Number
        },
        currentHp: Number,
        isBoss: Boolean
    },
    teamState: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PokemonInstance'
    }],
    enemyTeamState: [{
        name: { type: String },
        maxHp: { type: Number },
        currentHp: { type: Number }
    }],
    status: { 
        type: String, 
        enum: ['ongoing', 'won', 'lost', 'fled'], // ongoing = en curso
        default: 'ongoing' 
    },
    turn: {
        type: Number,
        default: 1
    },
    isBossBattle: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Battle', BattleSchema);