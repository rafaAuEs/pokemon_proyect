"use strict";

const SpeciesCache = require('../models/SpeciesCache');

/**
 * Genera un encuentro aleatorio para un nivel dado.
 * @param {number} stage - Nivel de progreso actual.
 * @param {boolean} isBoss - Si es un combate de jefe.
 * @returns {Object} - Datos del enemigo generado.
 */
async function generateEncounter(stage, isBoss = false) {
    // Obtenemos especies disponibles (simulado: todas las cacheadas)
    const species = await SpeciesCache.find();
    
    if (species.length === 0) {
        throw new Error("No hay especies en el caché para generar encuentros");
    }

    const randomSpecies = species[Math.floor(Math.random() * species.length)];
    
    // Nivel del enemigo basado en el stage
    let level = stage * 5 + Math.floor(Math.random() * 3);
    if (isBoss) level += 2;

    // Calculamos stats del enemigo
    const { calculateStats } = require('./levelService');
    const stats = calculateStats(randomSpecies.baseStats, level);

    return {
        pokemonId: randomSpecies.pokemonId,
        name: isBoss ? `JEFE ${randomSpecies.name}` : randomSpecies.name,
        level,
        stats,
        currentHp: stats.hp,
        isBoss
    };
}

module.exports = {
    generateEncounter
};
