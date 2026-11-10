"use strict";

const User = require('../models/User');
const jwt = require('jsonwebtoken');

exports.registerUser = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        // Creamos una nueva instancia del modelo User con el equipo inicial
        const starterTeam = ['pikachu', 'mew', 'venusaur', 'snorlax', 'blastoise', 'charizard'];
        const newUser = new User({ username, email, password, pokemonTeam: starterTeam });
        
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

        const token = jwt.sign(
            { id: user._id, email: user.email }, // Datos que guardamos dentro del token
            'tu_clave_secreta_super_segura',     // La misma clave del middleware
            { expiresIn: '24h' }                 // El token caduca en un día
        );

        res.status(200).json({
            message: "¡Login exitoso!",
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                levelProgress: user.levelProgress,
                pokemonTeam: user.pokemonTeam,
                pokemonBox: user.pokemonBox
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
        const nameLower = pokemonName.toLowerCase();

        // 1. VALIDAMOS si existe el Pokémon
        const pokeCheck = await fetch(`https://pokeapi.co/api/v2/pokemon/${nameLower}`);
        if (!pokeCheck.ok) {
            return res.status(404).json({ message: "Ese Pokémon no existe. ¡No puedes añadir un invento!" });
        }

        // 2. Buscamos al usuario en la base de datos
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "Entrenador no encontrado" });
        }

        // 3. Comprobamos que el equipo no esté lleno (máximo 6 Pokémon)
        if (user.pokemonTeam.length >= 6) {
            return res.status(400).json({ message: "¡Tu equipo ya tiene 6 Pokémon! Debes liberar uno primero." });
        }

        // 4. Comprobamos que no tenga ya a ese Pokémon en el equipo
        if (user.pokemonTeam.includes(pokemonName.toLowerCase())) {
            return res.status(400).json({ message: "¡Ya tienes a este Pokémon en tu equipo!" });
        }

        // 5. Añadimos el Pokémon al array usando operación nativa MongoDB
        await User.findByIdAndUpdate(userId, { $addToSet: { pokemonTeam: nameLower } });
        const updated = await User.findById(userId);

        res.status(200).json({ 
            message: `${pokemonName.toUpperCase()} se ha unido a tu equipo.`, 
            team: updated.pokemonTeam || []
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

        // Filtramos el array con operación nativa MongoDB
        const nombreEnMinusculas = pokemonName.toLowerCase();
        await User.findByIdAndUpdate(userId, { $pull: { pokemonTeam: nombreEnMinusculas } });
        const updated = await User.findById(userId);

        res.status(200).json({ 
            message: `${pokemonName.toUpperCase()} ha sido liberado de tu equipo.`, 
            team: updated.pokemonTeam || []
        });

    } catch (error) {
        res.status(500).json({ message: "Error al liberar el Pokémon", error: error.message });
    }
};

// Obtener el usuario autenticado a partir del token
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'Entrenador no encontrado' });
        }
        res.status(200).json({
            id: user._id,
            username: user.username,
            email: user.email,
            levelProgress: user.levelProgress || 1,
            pokemonTeam: user.pokemonTeam || [],
            pokemonBox: user.pokemonBox || []
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener el usuario', error: error.message });
    }
};

// Reiniciar el progreso del jugador (volver al nivel 1)
exports.resetProgress = async (req, res) => {
    try {
        const { userId } = req.body;

        const user = await User.findByIdAndUpdate(
            userId,
            { levelProgress: 1 },
            { new: true }
        );
        if (!user) {
            return res.status(404).json({ message: 'Entrenador no encontrado' });
        }

        res.status(200).json({ message: 'Progreso reiniciado. ¡Nueva aventura!', levelProgress: user.levelProgress });
    } catch (error) {
        res.status(500).json({ message: 'Error al reiniciar progreso', error: error.message });
    }
};

// Mover un Pokémon del equipo al PC de Bill
exports.moveToBox = async (req, res) => {
    try {
        const { userId, pokemonName } = req.body;
        const name = pokemonName.toLowerCase();

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'Entrenador no encontrado' });
        const team = user.pokemonTeam || [];
        const box = user.pokemonBox || [];
        if (!team.includes(name))
            return res.status(400).json({ message: `${name.toUpperCase()} no está en tu equipo.` });
        if (team.length <= 1)
            return res.status(400).json({ message: 'Debes tener al menos un Pokémon en el equipo.' });

        await User.findByIdAndUpdate(userId, {
            $pull: { pokemonTeam: name },
            $addToSet: { pokemonBox: name }
        });
        const refreshed = await User.findById(userId);
        res.status(200).json({
            message: `${name.toUpperCase()} enviado al PC de Bill.`,
            pokemonTeam: refreshed.pokemonTeam || [],
            pokemonBox: refreshed.pokemonBox || []
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al mover al PC', error: error.message });
    }
};

// Mover un Pokémon del PC de Bill al equipo
exports.moveToTeam = async (req, res) => {
    try {
        const { userId, pokemonName } = req.body;
        const name = pokemonName.toLowerCase();

        const user2 = await User.findById(userId);
        if (!user2) return res.status(404).json({ message: 'Entrenador no encontrado' });
        const box2 = user2.pokemonBox || [];
        const team2 = user2.pokemonTeam || [];
        if (!box2.includes(name))
            return res.status(400).json({ message: `${name.toUpperCase()} no está en el PC.` });
        if (team2.length >= 6)
            return res.status(400).json({ message: 'El equipo está lleno. Manda uno al PC primero.' });

        await User.findByIdAndUpdate(userId, {
            $pull: { pokemonBox: name },
            $addToSet: { pokemonTeam: name }
        });
        const refreshed2 = await User.findById(userId);
        res.status(200).json({
            message: `${name.toUpperCase()} se ha unido a tu equipo.`,
            pokemonTeam: refreshed2.pokemonTeam || [],
            pokemonBox: refreshed2.pokemonBox || []
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al mover al equipo', error: error.message });
    }
};

// Soltar un Pokémon del PC (se elimina permanentemente)
exports.releaseFromBox = async (req, res) => {
    try {
        const { userId, pokemonName } = req.body;
        if (!userId || !pokemonName) {
            return res.status(400).json({ message: 'Faltan datos: userId y pokemonName son necesarios.' });
        }
        const name = pokemonName.toLowerCase();

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'Entrenador no encontrado' });
        if (!(user.pokemonBox || []).includes(name))
            return res.status(400).json({ message: `${name.toUpperCase()} no está en el PC.` });

        await User.findByIdAndUpdate(userId, { $pull: { pokemonBox: name } });
        const refreshed = await User.findById(userId);
        res.status(200).json({
            message: `${name.toUpperCase()} ha sido liberado. ¡Adiós para siempre!`,
            pokemonBox: refreshed.pokemonBox || []
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al soltar el Pokémon', error: error.message });
    }
};

// Reordenar el equipo del jugador
exports.reorderTeam = async (req, res) => {
    try {
        const { userId, newOrder } = req.body;

        if (!Array.isArray(newOrder)) {
            return res.status(400).json({ message: 'El nuevo orden debe ser un array de nombres.' });
        }

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'Entrenador no encontrado' });

        // Validar que el nuevo orden contiene exactamente los mismos pokémon
        const currentSet = new Set(user.pokemonTeam);
        const newSet = new Set(newOrder.map(n => n.toLowerCase()));
        const sameContent = currentSet.size === newSet.size && [...currentSet].every(p => newSet.has(p));
        if (!sameContent) {
            return res.status(400).json({ message: 'El nuevo orden debe contener exactamente los mismos Pokémon del equipo.' });
        }

        user.pokemonTeam = newOrder.map(n => n.toLowerCase());
        await user.save();

        res.status(200).json({ message: 'Orden del equipo actualizado.', pokemonTeam: user.pokemonTeam });
    } catch (error) {
        res.status(500).json({ message: 'Error al reordenar el equipo', error: error.message });
    }
};