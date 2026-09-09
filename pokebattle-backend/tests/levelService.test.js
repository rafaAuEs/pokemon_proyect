const test = require('node:test');
const assert = require('node:assert');
const { calculateStats, addExperience } = require('../src/services/levelService');

test('calculateStats should return expected stats for Pikachu level 5', () => {
    const baseStats = { hp: 35, attack: 55, defense: 40, spAttack: 50, spDefense: 50, speed: 90 };
    const stats = calculateStats(baseStats, 5);
    
    // HP = floor((35 * 2 * 5) / 100) + 5 + 10 = floor(350/100) + 15 = 3 + 15 = 18
    assert.strictEqual(stats.hp, 18);
    // Attack = floor((55 * 2 * 5) / 100) + 5 = floor(550/100) + 5 = 5 + 5 = 10
    assert.strictEqual(stats.attack, 10);
});

test('addExperience should level up when enough exp is gained', () => {
    const baseStats = { hp: 35, attack: 55, defense: 40, spAttack: 50, spDefense: 50, speed: 90 };
    let pokemon = {
        level: 1,
        experience: 0,
        stats: calculateStats(baseStats, 1),
        currentHp: 12
    };
    
    // Next level at 2^3 = 8 exp
    const result = addExperience(pokemon, baseStats, 10);
    assert.strictEqual(result.pokemon.level, 2);
    assert.strictEqual(result.leveledUp, true);
    assert.strictEqual(result.pokemon.currentHp, result.pokemon.stats.hp);
});
