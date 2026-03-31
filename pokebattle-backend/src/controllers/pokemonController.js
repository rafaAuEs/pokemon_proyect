exports.getPokemon = async (req, res) => {
    try {
        // Cogemos el nombre del Pokémon que el usuario ponga en la URL
        const { name } = req.params;
        
        // Hacemos la petición a la API oficial
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${name.toLowerCase()}`);
        
        // Si el Pokémon no existe (ej: "Pikachuuu"), la PokeAPI da un error 404
        if (!response.ok) {
            return res.status(404).json({ message: "Ese Pokémon no existe en la Pokedex" });
        }

        const data = await response.json();

        // La PokeAPI devuelve muchísima basura que no necesitamos.
        // Vamos a "limpiar" el objeto para devolverle a nuestro móvil/web solo lo vital:
        const cleanPokemon = {
            id: data.id,
            name: data.name,
            types: data.types.map(t => t.type.name), // Extraemos solo los nombres de los tipos
            sprite: data.sprites.front_default,      // La imagen retro del Pokémon
            stats: data.stats.map(s => ({            // Vida, ataque, defensa...
                stat_name: s.stat.name,
                base_value: s.base_stat
            }))
        };

        // Devolvemos nuestro objeto limpio
        res.status(200).json(cleanPokemon);

    } catch (error) {
        res.status(500).json({ message: "Error de conexión con PokeAPI", error: error.message });
    }
};