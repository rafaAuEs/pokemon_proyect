exports.simulateAttack = async (req, res) => {
    try {
        // Recibimos quién ataca y a quién ataca desde el cliente (Web/Móvil)
        const { attackerName, defenderName } = req.body;

        // 1. Buscamos a los dos Pokémon a la vez en la PokeAPI
        const [attackerRes, defenderRes] = await Promise.all([
            fetch(`https://pokeapi.co/api/v2/pokemon/${attackerName.toLowerCase()}`),
            fetch(`https://pokeapi.co/api/v2/pokemon/${defenderName.toLowerCase()}`)
        ]);

        if (!attackerRes.ok || !defenderRes.ok) {
            return res.status(404).json({ message: "Uno de los Pokémon no existe." });
        }

        const attacker = await attackerRes.json();
        const defender = await defenderRes.json();

        // 2. Extraemos el Ataque del atacante y la Defensa del defensor
        const attackStat = attacker.stats.find(s => s.stat.name === 'attack').base_stat;
        const defenseStat = defender.stats.find(s => s.stat.name === 'defense').base_stat;

        // 3. Aplicamos la fórmula matemática simplificada de daño
        const level = 50; 
        const movePower = 50; // Asumimos un ataque básico como "Placaje"
        
        let damage = Math.floor((((2 * level / 5 + 2) * movePower * (attackStat / defenseStat)) / 50) + 2);

        // 4. Devolvemos el "Registro de Combate" para que la Web o la App Móvil lo muestre
        res.status(200).json({
            log: `¡${attackerName.toUpperCase()} ataca a ${defenderName.toUpperCase()}!`,
            details: {
                attackerAtaque: attackStat,
                defenderDefensa: defenseStat,
                danioCausado: damage
            }
        });

    } catch (error) {
        res.status(500).json({ message: "Fallo crítico en el motor de combate", error: error.message });
    }
};