// 1. Importar las dependencias (Librerías)
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config(); // Carga las variables del archivo .env

// 2. Inicializar la aplicación Express
const app = express();

// 3. Middlewares (Configuraciones base)
app.use(express.json()); // Permite que el servidor entienda datos en formato JSON
app.use(cors()); // Permite que tu Web y tu App móvil hagan peticiones

// 4. Ruta de prueba
app.get('/', (req, res) => {
    res.send('¡El motor de PokeBattle está funcionando perfectamente!');
});

// 5. Conexión a MongoDB Atlas y arranque del servidor
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

// Importamos las rutas de usuario y las usamos con el prefijo /api/users
const userRoutes = require('./routes/userRoutes');
app.use('/api/users', userRoutes);
// Alias opcional por si se usa el prefijo singular por error.
app.use('/api/user', userRoutes);

app.get('/api/health', (req, res) => {
    res.json({ ok: true, service: 'pokebattle-backend' });
});

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('✅ Conectado a MongoDB Atlas con éxito');
        // Solo levantamos el servidor si la base de datos responde
        app.listen(PORT, () => {
            console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
        });
    })
    .catch((error) => {
        console.error('❌ Error conectando a la base de datos:', error);
    });