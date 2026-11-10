"use strict";

const assert = require('node:assert/strict');
const test = require('node:test');
const mongoose = require('mongoose');
const Battle = require('../src/models/Battle');

test('Battle stores embedded Pokémon state used by the battle controller', () => {
    const battle = new Battle({
        userId: new mongoose.Types.ObjectId(),
        isBossBattle: true,
        playerPokemon: { name: 'pikachu', maxHp: 45, currentHp: 45 },
        enemyPokemon: { name: 'onix', maxHp: 70, currentHp: 70 },
        teamState: [{ name: 'pikachu', maxHp: 45, currentHp: 45 }],
        enemyTeamState: [{ name: 'onix', maxHp: 70, currentHp: 70 }]
    });

    assert.equal(battle.validateSync(), undefined);
    assert.equal(battle.playerPokemon.name, 'pikachu');
    assert.equal(battle.playerPokemon.maxHp, 45);
    assert.equal(battle.enemyPokemon.name, 'onix');
    assert.equal(battle.enemyPokemon.maxHp, 70);
    assert.equal(battle.teamState[0].currentHp, 45);
    assert.equal(battle.enemyTeamState[0].currentHp, 70);
});
