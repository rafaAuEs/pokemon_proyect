"use strict";

const Battle = require('../models/Battle');

exports.startBattle = async (req, res) => {
    try {
        const { userId, playerName, enemyName } = req.body;

        const [playerRes, enemyRes] = await Promise.all([
            fetch(`https://pokeapi.co/api/v2/pokemon/${playerName.toLowerCase()}`),
            fetch(`https://pokeapi.co/api/v2/pokemon/${enemyName.toLowerCase()}`)
        ]);

        if (!playerRes.ok || !enemyRes.ok) {
            return res.status(404).json({ message: "Uno de los Pokémon no existe." });
        }

        const player = await playerRes.json();
        const enemy = await enemyRes.json();

        const playerHp = player.stats.find(stat => stat.stat.name === 'hp')?.base_stat;
        const enemyHp = enemy.stats.find(stat => stat.stat.name === 'hp')?.base_stat;

        if (!playerHp || !enemyHp) {
            return res.status(400).json({ message: "No se pudo obtener la vida base de los Pokémon." });
        }

        const battle = new Battle({
            userId,
            playerPokemon: {
                name: player.name,
                maxHp: playerHp,
                currentHp: playerHp
            },
            enemyPokemon: {
                name: enemy.name,
                maxHp: enemyHp,
                currentHp: enemyHp
            }
        });

        await battle.save();

        res.status(201).json({
            message: "Combate iniciado con éxito",
            battle
        });
    } catch (error) {
        res.status(500).json({ message: "Error al iniciar el combate", error: error.message });
    }
};

exports.simulateAttack = async (req, res) => {
    try {
        // 1. Recibimos el ID del combate, quién ataca y con qué movimiento
        const { battleId, actor, moveName } = req.body;

        // 2. Buscamos el estado actual del combate en la base de datos
        const battle = await Battle.findById(battleId);
        if (!battle) return res.status(404).json({ message: "Combate no encontrado" });

        // Si el combate ya terminó antes, no dejamos atacar
        if (battle.status !== 'ongoing') {
            return res.status(400).json({ message: `El combate ya ha terminado. Resultado: ${battle.status}` });
        }

        // 3. Determinamos quién ataca y quién defiende en este turno
        let attackerRecord, defenderRecord;
        if (actor === 'player') {
            attackerRecord = battle.playerPokemon;
            defenderRecord = battle.enemyPokemon;
        } else if (actor === 'enemy') {
            attackerRecord = battle.enemyPokemon;
            defenderRecord = battle.playerPokemon;
        } else {
            return res.status(400).json({ message: "El 'actor' debe ser 'player' o 'enemy'" });
        }

        // 4. Buscamos los datos en la PokeAPI (Stats y Movimiento)
        const [attackerRes, defenderRes, moveRes] = await Promise.all([
            fetch(`https://pokeapi.co/api/v2/pokemon/${attackerRecord.name}`),
            fetch(`https://pokeapi.co/api/v2/pokemon/${defenderRecord.name}`),
            fetch(`https://pokeapi.co/api/v2/move/${moveName.replace(/\s+/g, '-').toLowerCase()}`)
        ]);

        if (!attackerRes.ok || !defenderRes.ok || !moveRes.ok) {
            return res.status(400).json({ message: "Error al buscar datos en la PokeAPI. Revisa los nombres." });
        }

        const attacker = await attackerRes.json();
        const defender = await defenderRes.json();
        const move = await moveRes.json();

        // --- CÁLCULO DE DAÑO ---
        const attackStat = attacker.stats.find(s => s.stat.name === 'attack').base_stat;
        const defenseStat = defender.stats.find(s => s.stat.name === 'defense').base_stat;
        const moveType = move.type.name;
        const defenderTypes = defender.types.map(t => t.type.name);

        const typeRes = await fetch(`https://pokeapi.co/api/v2/type/${moveType}`);
        const typeData = await typeRes.json();

        let typeMultiplier = 1;
        const doubleDamageTo = typeData.damage_relations.double_damage_to.map(t => t.name);
        const halfDamageTo = typeData.damage_relations.half_damage_to.map(t => t.name);
        const noDamageTo = typeData.damage_relations.no_damage_to.map(t => t.name);

        defenderTypes.forEach(defType => {
            if (doubleDamageTo.includes(defType)) typeMultiplier *= 2;
            if (halfDamageTo.includes(defType)) typeMultiplier *= 0.5;
            if (noDamageTo.includes(defType)) typeMultiplier *= 0;
        });

        let stabMultiplier = 1;
        if (attacker.types.map(t => t.type.name).includes(moveType)) stabMultiplier = 1.5;

        const level = 50;
        const movePower = move.power || 50;
        
        let baseDamage = Math.floor((((2 * level / 5 + 2) * movePower * (attackStat / defenseStat)) / 50) + 2);
        let finalDamage = Math.floor(baseDamage * typeMultiplier * stabMultiplier);
        // --- FIN DEL CÁLCULO ---

        // 5. APLICAMOS EL DAÑO A LA BASE DE DATOS
        defenderRecord.currentHp -= finalDamage;

        // Evitamos que la vida baje de 0
        if (defenderRecord.currentHp <= 0) {
            defenderRecord.currentHp = 0;
            // Si la vida llega a 0, el combate termina
            battle.status = actor === 'player' ? 'won' : 'lost';
        }

        // Sumamos un turno al contador
        battle.turn += 1;

        // 6. ¡GUARDAMOS LOS CAMBIOS EN MONGODB!
        await battle.save();

        // 7. Devolvemos la "pantalla de resultados" de este turno
        res.status(200).json({
            log: `¡${attackerRecord.name.toUpperCase()} usa ${moveName.toUpperCase()}!`,
            dañoCausado: finalDamage,
            efectividad: typeMultiplier > 1 ? "¡Es muy eficaz!" : (typeMultiplier < 1 && typeMultiplier > 0 ? "No es muy eficaz..." : (typeMultiplier === 0 ? "No hace efecto." : "")),
            estadoCombate: {
                turnoActual: battle.turn,
                estado: battle.status,
                vidaJugador: `${battle.playerPokemon.currentHp} / ${battle.playerPokemon.maxHp}`,
                vidaEnemigo: `${battle.enemyPokemon.currentHp} / ${battle.enemyPokemon.maxHp}`
            }
        });

    } catch (error) {
        res.status(500).json({ message: "Error crítico en el turno", error: error.message });
    }
};