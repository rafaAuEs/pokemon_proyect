"use strict";

const Battle = require('../models/Battle');
const User = require('../models/User');
const levelsConfig = require('../config/levels');

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

        // 2. Buscamos la vida del equipo del jugador
        const teamResponses = await Promise.all(
            user.pokemonTeam.map(name => fetch(`https://pokeapi.co/api/v2/pokemon/${name}`))
        );
        const teamJsons = await Promise.all(teamResponses.map(r => r.json()));
        const teamState = teamJsons.map((p, i) => ({
            name: user.pokemonTeam[i],
            maxHp: p.stats.find(s => s.stat.name === 'hp').base_stat,
            currentHp: p.stats.find(s => s.stat.name === 'hp').base_stat
        }));

        const starterEntry = teamState.find(p => p.name === playerPokeName);
        const playerHp = starterEntry ? starterEntry.maxHp : 45;

        // 3. Preparar datos del enemigo (boss o salvaje)
        let enemyPokemonData, enemyTeamState = [];
        if (isBossBattle) {
            const levelData = levelsConfig[user.levelProgress];
            if (!levelData || !levelData.bossTeam) {
                return res.status(400).json({ message: "No hay datos del equipo del jefe para este nivel." });
            }
            const bossResponses = await Promise.all(
                levelData.bossTeam.map(name => fetch(`https://pokeapi.co/api/v2/pokemon/${name}`))
            );
            const bossJsons = await Promise.all(bossResponses.map(r => r.json()));
            enemyTeamState = bossJsons.map((p, i) => ({
                name: levelData.bossTeam[i],
                maxHp: p.stats.find(s => s.stat.name === 'hp').base_stat,
                currentHp: p.stats.find(s => s.stat.name === 'hp').base_stat
            }));
            enemyPokemonData = { ...enemyTeamState[0] };
        } else {
            const enemyRes = await fetch(`https://pokeapi.co/api/v2/pokemon/${enemyName.toLowerCase()}`);
            if (!enemyRes.ok) {
                return res.status(404).json({ message: "El Pokémon enemigo no existe." });
            }
            const enemy = await enemyRes.json();
            const enemyHp = enemy.stats.find(s => s.stat.name === 'hp').base_stat;
            enemyPokemonData = { name: enemyName.toLowerCase(), maxHp: enemyHp, currentHp: enemyHp };
        }

        // 4. Creamos el registro del combate
        const newBattle = new Battle({
            userId,
            isBossBattle: isBossBattle || false,
            playerPokemon: { name: playerPokeName, maxHp: playerHp, currentHp: playerHp },
            enemyPokemon: enemyPokemonData,
            teamState,
            enemyTeamState
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

        // --- COMPROBAR RESULTADO ---
        let needsSwitch = false;
        let gameJustCompleted = false;

        // Sincronizar HP del enemigo en enemyTeamState (combate de jefe)
        if (battle.isBossBattle) {
            const enemyTeamEntry = battle.enemyTeamState.find(p => p.name === battle.enemyPokemon.name);
            if (enemyTeamEntry) enemyTeamEntry.currentHp = battle.enemyPokemon.currentHp;
        }

        if (battle.enemyPokemon.currentHp === 0) {
            if (battle.isBossBattle) {
                const nextEnemy = battle.enemyTeamState.find(p => p.currentHp > 0);
                if (nextEnemy) {
                    battleLog.push(`¡${battle.enemyPokemon.name.toUpperCase()} se ha debilitado! El líder saca a ${nextEnemy.name.toUpperCase()}.`);
                    battle.enemyPokemon = { name: nextEnemy.name, maxHp: nextEnemy.maxHp, currentHp: nextEnemy.currentHp };
                } else {
                    battle.status = 'won';
                    const maxLevel = Object.keys(levelsConfig).length;
                    const user = await User.findById(battle.userId);
                    if (user.levelProgress < maxLevel) {
                        await User.findByIdAndUpdate(battle.userId, { $inc: { levelProgress: 1 } });
                        battleLog.push("¡Has derrotado a todos los Pokémon del líder! ¡Nivel desbloqueado!");
                        gameJustCompleted = false;
                    } else {
                        battleLog.push("¡Has completado el juego! ¡Eres el mejor Entrenador Pokémon!");
                        gameJustCompleted = true;
                    }
                }
            } else {
                battle.status = 'won';
            }
        }

        // Sincronizar HP del jugador en teamState
        const teamEntry = battle.teamState.find(p => p.name === battle.playerPokemon.name);
        if (teamEntry) teamEntry.currentHp = battle.playerPokemon.currentHp;

        if (battle.playerPokemon.currentHp === 0 && battle.status === 'ongoing') {
            const hasSurvivor = battle.teamState.some(p => p.currentHp > 0);
            if (hasSurvivor) {
                needsSwitch = true;
            } else {
                battle.status = 'lost';
            }
        }

        battle.markModified('teamState');
        if (battle.isBossBattle) battle.markModified('enemyTeamState');

        battle.turn += 1;
        await battle.save();

        // Devolvemos el registro de todo lo que ha pasado en este turno
        const gameCompleted = gameJustCompleted;

        res.status(200).json({
            log: battleLog,
            estadoCombate: {
                turnoActual: battle.turn,
                estado: battle.status,
                needsSwitch,
                gameCompleted,
                pokemonActual: battle.playerPokemon.name,
                enemyPokemonActual: battle.enemyPokemon.name,
                vidaJugador: `${battle.playerPokemon.currentHp} / ${battle.playerPokemon.maxHp}`,
                vidaEnemigo: `${battle.enemyPokemon.currentHp} / ${battle.enemyPokemon.maxHp}`,
                teamState: battle.teamState,
                enemyTeamState: battle.isBossBattle ? battle.enemyTeamState : undefined
            }
        });

    } catch (error) {
        res.status(500).json({ message: "Error crítico en el turno", error: error.message });
    }
};

exports.generateEncounter = async (req, res) => {
    try {
        const { userId, wantBoss } = req.body; // wantBoss será true si el jugador pulsa "Luchar contra el Jefe"

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "Entrenador no encontrado" });

        const currentLevel = user.levelProgress;
        const levelData = levelsConfig[currentLevel];

        // Si el usuario ya se ha pasado el juego (ej: nivel 3 pero solo hay 2)
        if (!levelData) {
            return res.status(200).json({ message: "¡Has completado todos los niveles del juego!" });
        }

        let enemyName = "";
        let isBossBattle = false;

        if (wantBoss) {
            // El jugador ha decidido enfrentarse al jefe del nivel
            enemyName = levelData.boss;
            isBossBattle = true;
        } else {
            // El jugador está explorando: cogemos un Pokémon aleatorio de la lista de su nivel
            const randomIndex = Math.floor(Math.random() * levelData.wildPokemon.length);
            enemyName = levelData.wildPokemon[randomIndex];
        }

        res.status(200).json({
            message: isBossBattle ? `¡Atención! Te enfrentas al líder del nivel: ${enemyName.toUpperCase()}` : `¡Un ${enemyName.toUpperCase()} salvaje ha aparecido en ${levelData.name}!`,
            enemyName: enemyName,
            isBossBattle: isBossBattle
        });

    } catch (error) {
        res.status(500).json({ message: "Error al generar el encuentro", error: error.message });
    }
};

exports.switchPokemon = async (req, res) => {
    try {
        const { battleId, newPokemonName, forced = false } = req.body;
        const newName = newPokemonName.toLowerCase();

        const battle = await Battle.findById(battleId);
        if (!battle) return res.status(404).json({ message: "Combate no encontrado" });
        if (battle.status !== 'ongoing') return res.status(400).json({ message: "El combate ya ha terminado" });
        if (battle.playerPokemon.name === newName) return res.status(400).json({ message: "Ese Pokémon ya está en combate" });

        const newEntry = battle.teamState.find(p => p.name === newName);
        if (!newEntry) return res.status(400).json({ message: "Ese Pokémon no está en tu equipo" });
        if (newEntry.currentHp <= 0) return res.status(400).json({ message: `${newName.toUpperCase()} está debilitado y no puede combatir` });

        // Guardar HP del Pokémon saliente en teamState
        const currentEntry = battle.teamState.find(p => p.name === battle.playerPokemon.name);
        if (currentEntry) currentEntry.currentHp = battle.playerPokemon.currentHp;

        // Cambiar al nuevo Pokémon
        battle.playerPokemon = { name: newEntry.name, maxHp: newEntry.maxHp, currentHp: newEntry.currentHp };

        let switchLog = [`¡${newName.toUpperCase()} sal a combatir!`];
        let needsSwitch = false;

        if (!forced) {
            // Cambio voluntario: el enemigo ataca al Pokémon entrante
            const [defenderRes, attackerRes, enemyMoveRes] = await Promise.all([
                fetch(`https://pokeapi.co/api/v2/pokemon/${newEntry.name}`),
                fetch(`https://pokeapi.co/api/v2/pokemon/${battle.enemyPokemon.name}`),
                fetch(`https://pokeapi.co/api/v2/move/tackle`)
            ]);
            const defender = await defenderRes.json();
            const attacker = await attackerRes.json();
            const enemyMove = await enemyMoveRes.json();

            const enemyAtk = attacker.stats.find(s => s.stat.name === 'attack').base_stat;
            const playerDef = defender.stats.find(s => s.stat.name === 'defense').base_stat;
            const enemyDamage = Math.floor((((22) * (enemyMove.power || 40) * (enemyAtk / playerDef)) / 50) + 2);

            battle.playerPokemon.currentHp = Math.max(0, battle.playerPokemon.currentHp - enemyDamage);
            switchLog = [`¡${newName.toUpperCase()} sal a combatir! El enemigo usa TACKLE y hace ${enemyDamage} de daño.`];

            if (battle.playerPokemon.currentHp === 0) {
                const anyAlive = battle.teamState.some(p => p.name !== newName && p.currentHp > 0);
                if (!anyAlive) {
                    battle.status = 'lost';
                } else {
                    needsSwitch = true;
                }
            }
            battle.turn += 1;
        }

        // Sincronizar HP en teamState
        const updatedEntry = battle.teamState.find(p => p.name === newEntry.name);
        if (updatedEntry) updatedEntry.currentHp = battle.playerPokemon.currentHp;

        battle.markModified('teamState');
        await battle.save();

        res.status(200).json({
            log: switchLog,
            estadoCombate: {
                turnoActual: battle.turn,
                estado: battle.status,
                needsSwitch,
                pokemonActual: battle.playerPokemon.name,
                enemyPokemonActual: battle.enemyPokemon.name,
                vidaJugador: `${battle.playerPokemon.currentHp} / ${battle.playerPokemon.maxHp}`,
                vidaEnemigo: `${battle.enemyPokemon.currentHp} / ${battle.enemyPokemon.maxHp}`,
                teamState: battle.teamState,
                enemyTeamState: battle.isBossBattle ? battle.enemyTeamState : undefined
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Error al cambiar de Pokémon", error: error.message });
    }
};

exports.fleeFromBattle = async (req, res) => {
    try {
        const { battleId } = req.body;
        const battle = await Battle.findById(battleId);
        if (!battle) return res.status(404).json({ message: "Combate no encontrado" });
        if (battle.status !== 'ongoing') return res.status(400).json({ message: "El combate ya ha terminado" });

        battle.status = 'fled';
        await battle.save();

        res.status(200).json({ message: "Has huido del combate." });
    } catch (error) {
        res.status(500).json({ message: "Error al huir del combate", error: error.message });
    }
};