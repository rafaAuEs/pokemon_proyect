"use strict";

const Battle = require('../models/Battle');
const User = require('../models/User');

exports.startBattle = async (req, res) => {
    try {
        const { userId, playerName, enemyName, isBossBattle } = req.body;
        const playerPokeName = playerName.toLowerCase();

        // 1. VERIFICACIÓN DE EQUIPO
        // Buscamos al usuario en la base de datos
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "Entrenador no encontrado." });
        }

        // Comprobamos si el Pokémon está en su array pokemonTeam
        if (!user.pokemonTeam.includes(playerPokeName)) {
            return res.status(400).json({ 
                message: `¡No puedes luchar con ${playerPokeName} porque no está en tu equipo! Captúralo primero.` 
            });
        }

        // 2. Buscamos la vida máxima de ambos Pokémon en la PokeAPI
        const [playerRes, enemyRes] = await Promise.all([
            fetch(`https://pokeapi.co/api/v2/pokemon/${playerPokeName}`),
            fetch(`https://pokeapi.co/api/v2/pokemon/${enemyName.toLowerCase()}`)
        ]);

        if (!playerRes.ok || !enemyRes.ok) {
            return res.status(404).json({ message: "Uno de los Pokémon no existe." });
        }

        const player = await playerRes.json();
        const enemy = await enemyRes.json();

        const playerHp = player.stats.find(s => s.stat.name === 'hp').base_stat;
        const enemyHp = enemy.stats.find(s => s.stat.name === 'hp').base_stat;

        // 3. Creamos el registro del combate
        const newBattle = new Battle({
            userId: userId,
            isBossBattle: isBossBattle || false,
            playerPokemon: {
                name: playerPokeName,
                maxHp: playerHp,
                currentHp: playerHp 
            },
            enemyPokemon: {
                name: enemyName.toLowerCase(),
                maxHp: enemyHp,
                currentHp: enemyHp
            }
        });

        await newBattle.save();

        res.status(201).json({
            message: `¡${playerName.toUpperCase()} sal a luchar contra el ${enemyName.toUpperCase()} salvaje!`,
            battleId: newBattle._id,
            estado: newBattle
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
        if (battle.enemyPokemon.currentHp === 0) {
            battle.status = 'won';
            if (battle.isBossBattle) {
                await User.findByIdAndUpdate(battle.userId, { $inc: { levelProgress: 1 } });
                battleLog.push("¡Has derrotado al jefe! ¡Se ha desbloqueado el siguiente nivel!");
            }
        }
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