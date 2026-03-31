exports.simulateAttack = async (req, res) => {
    try {
        const { attackerName, defenderName, moveName } = req.body; // Recibimos el movimiento

        // 1. Buscamos Atacante, Defensor Y el Movimiento
        const [attackerRes, defenderRes, moveRes] = await Promise.all([
            fetch(`https://pokeapi.co/api/v2/pokemon/${attackerName.toLowerCase()}`),
            fetch(`https://pokeapi.co/api/v2/pokemon/${defenderName.toLowerCase()}`),
            fetch(`https://pokeapi.co/api/v2/move/${moveName.replace(/\s+/g, '-').toLowerCase()}`)
        ]);

        if (!attackerRes.ok || !defenderRes.ok || !moveRes.ok) {
            return res.status(404).json({ message: "Datos no encontrados. Revisa nombres de Pokémon y Movimiento." });
        }

        // Convertimos las respuestas a JSON
        const attacker = await attackerRes.json();
        const defender = await defenderRes.json();
        const move = await moveRes.json();

        // 2. Stats de combate
        const attackStat = attacker.stats.find(s => s.stat.name === 'attack').base_stat;
        const defenseStat = defender.stats.find(s => s.stat.name === 'defense').base_stat;

        // 3. Tipo del Movimiento y Tipos del Defensor
        const moveType = move.type.name;
        const defenderTypes = defender.types.map(t => t.type.name);

        // 4. Relaciones de daño del TIPO DEL MOVIMIENTO
        const typeRes = await fetch(`https://pokeapi.co/api/v2/type/${moveType}`);
        const typeData = await typeRes.json();

        // Calculamos el multiplicador de tipo según las relaciones de daño
        let typeMultiplier = 1;
        const doubleDamageTo = typeData.damage_relations.double_damage_to.map(t => t.name);
        const halfDamageTo = typeData.damage_relations.half_damage_to.map(t => t.name);
        const noDamageTo = typeData.damage_relations.no_damage_to.map(t => t.name);

        defenderTypes.forEach(defType => {
            if (doubleDamageTo.includes(defType)) typeMultiplier *= 2;
            if (halfDamageTo.includes(defType)) typeMultiplier *= 0.5;
            if (noDamageTo.includes(defType)) typeMultiplier *= 0;
        });

        // 5. STAB
        let stabMultiplier = 1;
        const attackerTypes = attacker.types.map(t => t.type.name);
        if (attackerTypes.includes(moveType)) {
            stabMultiplier = 1.5;
        }

        // 6. Cálculo final
        const level = 50;
        const movePower = move.power || 50;
        
        let baseDamage = Math.floor((((2 * level / 5 + 2) * movePower * (attackStat / defenseStat)) / 50) + 2);
        let finalDamage = Math.floor(baseDamage * typeMultiplier * stabMultiplier);

        res.status(200).json({
            log: `¡${attackerName.toUpperCase()} usa ${moveName.toUpperCase()} (${moveType.toUpperCase()}) contra ${defenderName.toUpperCase()}!`,
            stab: stabMultiplier > 1 ? "¡Bonus por afinidad de tipo (STAB)!" : null,
            effectiveness: typeMultiplier > 1 ? "¡Es muy eficaz!" : (typeMultiplier < 1 ? "No es muy eficaz..." : ""),
            damage: finalDamage
        });

    } catch (error) {
        res.status(500).json({ message: "Error en el motor", error: error.message });
    }
};