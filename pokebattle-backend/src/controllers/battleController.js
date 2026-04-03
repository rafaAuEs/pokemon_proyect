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
        // 1. Recibimos los datos del ataque
        const { battleId, moveName } = req.body;

        const battle = await Battle.findById(battleId);
        if (!battle) return res.status(404).json({ message: "Combate no encontrado" });
        if (battle.status !== 'ongoing') return res.status(400).json({ message: `Combate terminado. Resultado: ${battle.status}` });

        // --- TURNO DEL JUGADOR ---
        const [attackerRes, defenderRes, moveRes] = await Promise.all([
            fetch(`https://pokeapi.co/api/v2/pokemon/${battle.playerPokemon.name}`),
            fetch(`https://pokeapi.co/api/v2/pokemon/${battle.enemyPokemon.name}`),
            fetch(`https://pokeapi.co/api/v2/move/${moveName.toLowerCase()}`)
        ]);

        const attacker = await attackerRes.json();
        const defender = await defenderRes.json();
        const move = await moveRes.json();

        // Cálculo de daño del jugador
        const playerAtk = attacker.stats.find(s => s.stat.name === 'attack').base_stat;
        const enemyDef = defender.stats.find(s => s.stat.name === 'defense').base_stat;
        const playerDamage = Math.floor((((22) * (move.power || 50) * (playerAtk / enemyDef)) / 50) + 2); // Fórmula simplificada
        
        battle.enemyPokemon.currentHp -= playerDamage;
        if (battle.enemyPokemon.currentHp <= 0) battle.enemyPokemon.currentHp = 0;

        let battleLog = [`¡Tu ${battle.playerPokemon.name.toUpperCase()} usa ${moveName.toUpperCase()} y hace ${playerDamage} de daño!`];

        // --- TURNO DEL ENEMIGO (LA IA) ---
        if (battle.enemyPokemon.currentHp > 0) {
            // Buscamos un movimiento básico para el enemigo (Tackle)
            const enemyMoveRes = await fetch(`https://pokeapi.co/api/v2/move/tackle`);
            const enemyMove = await enemyMoveRes.json();

            const enemyAtk = defender.stats.find(s => s.stat.name === 'attack').base_stat;
            const playerDef = attacker.stats.find(s => s.stat.name === 'defense').base_stat;
            const enemyDamage = Math.floor((((22) * (enemyMove.power || 40) * (enemyAtk / playerDef)) / 50) + 2);

            battle.playerPokemon.currentHp -= enemyDamage;
            if (battle.playerPokemon.currentHp <= 0) battle.playerPokemon.currentHp = 0;

            battleLog.push(`¡El ${battle.enemyPokemon.name.toUpperCase()} enemigo contraataca con TACKLE y hace ${enemyDamage} de daño!`);
        }

        // --- COMPROBAR GANADOR ---
        if (battle.enemyPokemon.currentHp === 0) battle.status = 'won';
        else if (battle.playerPokemon.currentHp === 0) battle.status = 'lost';

        battle.turn += 1;
        await battle.save();

        // Devolvemos el registro de todo lo que ha pasado en este turno
        res.status(200).json({
            log: battleLog,
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