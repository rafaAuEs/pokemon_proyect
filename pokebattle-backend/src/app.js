"use strict";

const express = require('express');
const cors = require('cors');

const app = express();

// Middlewares
app.use(express.json());
app.use(cors());

// Rutas de prueba y salud
app.get('/', (req, res) => {
    res.send('¡El motor de PokeBattle está funcionando perfectamente!');
});

app.get('/api/health', (req, res) => {
    res.json({ ok: true, service: 'pokebattle-backend' });
});

// Importamos las rutas
const userRoutes = require('./routes/userRoutes');
const pokemonRoutes = require('./routes/pokemonRoutes');
const battleRoutes = require('./routes/battleRoutes');

// Usamos las rutas
app.use('/api/users', userRoutes);
app.use('/api/pokemon', pokemonRoutes);
app.use('/api/battle', battleRoutes);

module.exports = app;
