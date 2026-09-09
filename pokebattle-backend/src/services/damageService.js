"use strict";

/**
 * Calcula el daño de un ataque basado en la fórmula simplificada de Pokémon.
 * @param {Object} attacker - Datos del atacante (level, stats).
 * @param {Object} defender - Datos del defensor (stats).
 * @param {Object} move - Datos del movimiento (power, type).
 * @returns {number} - Daño calculado.
 */
function calculateDamage(attacker, defender, move) {
    const level = attacker.level || 1;
    const power = move.power || 40;
    
    // Simplificación: usamos Attack vs Defense para todo por ahora
    const A = attacker.stats.attack;
    const D = defender.stats.defense;

    // Fórmula base
    let damage = (((2 * level / 5 + 2) * power * A / D) / 50 + 2);

    // Modificadores (Simplificados)
    // Crítico (10% de probabilidad)
    const isCritical = Math.random() < 0.1;
    if (isCritical) {
        damage *= 1.5;
    }

    // Variación aleatoria (0.85 a 1.0)
    const random = Math.random() * (1 - 0.85) + 0.85;
    damage *= random;

    return {
        totalDamage: Math.floor(damage),
        isCritical
    };
}

module.exports = {
    calculateDamage
};
