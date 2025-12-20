// server.js
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 5000;
const saltRounds = 10;

// Conexión a base de datos
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306
});

db.connect((err) => {
    if (err) {
        console.error('❌ Error de conexión a DB:', err);
        process.exit(1);
    }
    console.log('✅ Conectado a la base de datos');
});

// Middleware
app.use(cors({ 
    origin: ['http://localhost:3000', 'https://pat8.vercel.app'] // ✅ espacios eliminados
}));
app.use(express.json());

// Ruta de prueba
app.get('/', (req, res) => {
    res.send('Backend funcionando ✅');
});

// Ruta de login
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const query = 'SELECT * FROM users WHERE username = ?';
    
    db.query(query, [username], (err, results) => {
        if (err) return res.status(500).json({ error: 'Error en la consulta' });

        if (results.length === 0) {
            return res.status(401).json({ message: 'Usuario no encontrado' });
        }

        const user = results[0];
        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) return res.status(500).json({ error: 'Error al comparar contraseñas' });

            if (!isMatch) {
                return res.status(401).json({ message: 'Contraseña incorrecta' });
            }

            res.json({ message: 'Login exitoso', user: { id: user.id, username: user.username } });
        });
    });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
});

// Manejo de errores globales (FUERA de app.listen)
process.on('uncaughtException', (err) => {
    console.error('❌ Error no capturado:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Promesa no manejada:', reason);
    process.exit(1);
});