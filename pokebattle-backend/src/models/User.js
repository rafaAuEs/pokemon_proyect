const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true, // No puede haber dos entrenadores con el mismo nombre
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    pokemonTeam: {
        type: Array, // Aquí guardaremos los IDs de sus 6 Pokémon favoritos más adelante
        default: []
    },
    wins: {
        type: Number,
        default: 0
    },
    losses: {
        type: Number,
        default: 0
    },
    createdAt: {// Fecha de creación del usuario
        type: Date,
        default: Date.now
    }
});

// Este código se ejecuta JUSTO ANTES de guardar el usuario en la base de datos
UserSchema.pre('save', async function() {
    // Si la contraseña no ha sido cambiada, saltamos este paso
    if (!this.isModified('password')) return;
    
    // Generamos una "salt" (un código aleatorio para complicar el hackeo)
    const salt = await bcrypt.genSalt(10);
    // Encriptamos la contraseña
    this.password = await bcrypt.hash(this.password, salt);

});

// Método para comparar contraseñas
UserSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);