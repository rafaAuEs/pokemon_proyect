"use strict";

const mongoose = require('mongoose');

const PokemonBattleStateSchema = new mongoose.Schema({
    name: { type: String, required: true },
    maxHp: { type: Number, required: true },
    currentHp: { type: Number, required: true },
    level: Number,
    pokemonId: Number,
    stats: {
        hp: Number,
        attack: Number,
        defense: Number,
        spAttack: Number,
        spDefense: Number,
        speed: Number
    },
    isBoss: Boolean
});

const BattleSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    playerPokemon: { type: PokemonBattleStateSchema, required: true },
    enemyPokemon: { type: PokemonBattleStateSchema, required: true },
    teamState: { type: [PokemonBattleStateSchema], default: [] },
    enemyTeamState: { type: [PokemonBattleStateSchema], default: [] },
    status: {
        type: String,
        enum: ['ongoing', 'won', 'lost', 'fled'],
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
