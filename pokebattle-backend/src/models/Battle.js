"use strict";

const mongoose = require('mongoose');

const BattleSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', // Lo enlazamos con el entrenador
        required: true 
    },
    playerPokemon: {
        name: String,
        maxHp: Number,
        currentHp: Number
    },
    enemyPokemon: {
        name: String,
        maxHp: Number,
        currentHp: Number
    },
    teamState: [{
        name: { type: String },
        maxHp: { type: Number },
        currentHp: { type: Number }
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