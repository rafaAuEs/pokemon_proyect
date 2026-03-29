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