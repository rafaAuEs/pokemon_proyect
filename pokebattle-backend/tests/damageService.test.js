const test = require('node:test');
const assert = require('node:assert');
const { calculateDamage } = require('../src/services/damageService');

test('calculateDamage should return a positive number', () => {
    const attacker = { level: 5, stats: { attack: 10 } };
    const defender = { stats: { defense: 10 } };
    const move = { power: 40 };
    
    const result = calculateDamage(attacker, defender, move);
    assert.ok(result.totalDamage > 0);
    assert.strictEqual(typeof result.isCritical, 'boolean');
});
