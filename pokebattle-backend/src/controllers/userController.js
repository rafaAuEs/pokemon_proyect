const User = require('../models/User');

exports.registerUser = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        // Creamos una nueva instancia del modelo User
        const newUser = new User({ username, email, password });
        
        // Lo guardamos en MongoDB Atlas
        await newUser.save();
        
        res.status(201).json({ message: "¡Entrenador registrado con éxito!", user: newUser });
    } catch (error) {
        res.status(400).json({ message: "Error al registrar", error: error.message });
    }
};

exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Buscar al usuario por email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        // 2. Comparar la contraseña enviada con la encriptada
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: "Contraseña incorrecta" });
        }

        // 3. Si todo es correcto, devolvemos éxito
        res.status(200).json({
            message: "¡Login exitoso!",
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                wins: user.wins,
                losses: user.losses
            }
        });

    } catch (error) {
        res.status(500).json({ message: "Error en el servidor", error: error.message });
    }
};

// Añadir un Pokémon al equipo del usuario
exports.addPokemonToTeam = async (req, res) => {
    try {
        // Recibimos el ID del usuario y el nombre del Pokémon desde la petición
        const { userId, pokemonName } = req.body;

        // 1. Buscamos al usuario en la base de datos
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "Entrenador no encontrado" });
        }

        // 2. Comprobamos que el equipo no esté lleno (máximo 6 Pokémon)
        if (user.pokemonTeam.length >= 6) {
            return res.status(400).json({ message: "¡Tu equipo ya tiene 6 Pokémon! Debes liberar uno primero." });
        }

        // 3. Comprobamos que no tenga ya a ese Pokémon en el equipo (opcional, pero recomendado)
        if (user.pokemonTeam.includes(pokemonName.toLowerCase())) {
            return res.status(400).json({ message: "¡Ya tienes a este Pokémon en tu equipo!" });
        }

        // 4. Añadimos el Pokémon al array y guardamos
        user.pokemonTeam.push(pokemonName.toLowerCase());
        await user.save();

        res.status(200).json({ 
            message: `${pokemonName.toUpperCase()} se ha unido a tu equipo.`, 
            team: user.pokemonTeam 
        });

    } catch (error) {
        res.status(500).json({ message: "Error al actualizar el equipo", error: error.message });
    }
};

// Liberar un Pokémon del equipo
exports.removePokemonFromTeam = async (req, res) => {
    try {
        const { userId, pokemonName } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "Entrenador no encontrado" });
        }

        // Filtramos el array: nos quedamos con todos los Pokémon DISTINTOS al que queremos borrar
        const nombreEnMinusculas = pokemonName.toLowerCase();
        user.pokemonTeam = user.pokemonTeam.filter(pokemon => pokemon !== nombreEnMinusculas);

        // Guardamos el usuario actualizado en la base de datos
        await user.save();

        res.status(200).json({ 
            message: `${pokemonName.toUpperCase()} ha sido liberado de tu equipo.`, 
            team: user.pokemonTeam 
        });

    } catch (error) {
        res.status(500).json({ message: "Error al liberar el Pokémon", error: error.message });
    }
};