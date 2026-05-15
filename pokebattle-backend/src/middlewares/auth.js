"use strict";

const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    // 1. Miramos si el token viene en la cabecera 'Authorization'
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // El formato suele ser "Bearer TOKEN"

    if (!token) {
        return res.status(401).json({ message: "Acceso denegado. No hay token." });
    }

    try {
        // 2. Verificamos el token con nuestra "Clave Secreta"
        const verified = jwt.verify(token, 'tu_clave_secreta_super_segura');
        
        // 3. Guardamos los datos del usuario verificado en la petición
        req.user = verified; 
        
        next(); // Dejamos pasar al siguiente paso
    } catch (error) {
        res.status(403).json({ message: "Token no válido o expirado." });
    }
};