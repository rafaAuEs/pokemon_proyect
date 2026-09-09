"use strict";

/**
 * Calcula los stats de un Pokémon basado en sus stats base y nivel.
 * @param {Object} baseStats - Stats base de la especie.
 * @param {number} level - Nivel actual.
 * @returns {Object} - Stats calculados.
 */
function calculateStats(baseStats, level) {
    const stats = {};
    
    // HP = floor((Base * 2 * Level) / 100) + Level + 10
    stats.hp = Math.floor((baseStats.hp * 2 * level) / 100) + level + 10;
    
    // Otros stats = floor((Base * 2 * Level) / 100) + 5
    stats.attack = Math.floor((baseStats.attack * 2 * level) / 100) + 5;
    stats.defense = Math.floor((baseStats.defense * 2 * level) / 100) + 5;
    stats.spAttack = Math.floor((baseStats.spAttack * 2 * level) / 100) + 5;
    stats.spDefense = Math.floor((baseStats.spDefense * 2 * level) / 100) + 5;
    stats.speed = Math.floor((baseStats.speed * 2 * level) / 100) + 5;
    
    return stats;
}

/**
 * Añade experiencia a un Pokémon y maneja la subida de nivel.
 * @param {Object} pokemonInstance - Instancia del Pokémon en la BD.
 * @param {Object} baseStats - Stats base de la especie.
 * @param {number} expGain - Experiencia ganada.
 * @returns {Object} - Pokémon actualizado.
 */
function addExperience(pokemonInstance, baseStats, expGain) {
    pokemonInstance.experience += expGain;
    
    // Umbral de experiencia simple: level^3
    const nextLevelExp = Math.pow(pokemonInstance.level + 1, 3);
    
    let leveledUp = false;
    while (pokemonInstance.experience >= nextLevelExp) {
        pokemonInstance.level++;
        leveledUp = true;
    }
    
    if (leveledUp) {
        pokemonInstance.stats = calculateStats(baseStats, pokemonInstance.level);
        // Al subir de nivel, se cura completamente
        pokemonInstance.currentHp = pokemonInstance.stats.hp;
    }
    
    return {
        pokemon: pokemonInstance,
        leveledUp
    };
}

module.exports = {
    calculateStats,
    addExperience
};
