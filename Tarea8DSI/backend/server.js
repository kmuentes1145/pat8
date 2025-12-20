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
    origin: ['http://localhost:3000', 'https://pat8.vercel.app'] // ✅ sin espacios
}));
app.use(express.json());

// Ruta de prueba
app.get('/', (req, res) => {
    res.send('Backend funcionando ✅');
});

// Registro de usuario
app.post('/auth/register', async (req, res) => {
    const { nombre, email, password } = req.body;

    if (!nombre || !email || !password) {
        return res.status(400).json({ msg: 'Todos los campos son obligatorios' });
    }

    try {
        const [existing] = await db.promise().query('SELECT * FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ msg: 'El correo ya está registrado' });
        }

        const hashedPassword = await bcrypt.hash(password, saltRounds);
        await db.promise().query(
            'INSERT INTO users (nombre, email, password) VALUES (?, ?, ?)',
            [nombre, email, hashedPassword]
        );

        res.status(201).json({ msg: 'Usuario registrado exitosamente' });
    } catch (err) {
        console.error('Error en registro:', err);
        res.status(500).json({ msg: 'Error al registrar usuario' });
    }
});

// Login
app.post('/auth/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ msg: 'Correo y contraseña son obligatorios' });
    }

    try {
        const [results] = await db.promise().query('SELECT * FROM users WHERE email = ?', [email]);

        if (results.length === 0) {
            return res.status(401).json({ msg: 'Credenciales incorrectas' });
        }

        const user = results[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ msg: 'Credenciales incorrectas' });
        }

        res.json({
            msg: 'Login exitoso',
            usuario: {
                id: user.id,
                nombre: user.nombre,
                email: user.email
            }
        });
    } catch (err) {
        console.error('Error en login:', err);
        res.status(500).json({ msg: 'Error al iniciar sesión' });
    }
});

// GET /productos – Obtener todos los productos
app.get('/productos', async (req, res) => {
    try {
        const [rows] = await db.promise().query('SELECT * FROM productos ORDER BY id DESC');
        res.json(rows);
    } catch (err) {
        console.error('Error al obtener productos:', err);
        res.status(500).json({ msg: 'Error al cargar productos' });
    }
});

// POST /productos – Crear nuevo producto
app.post('/productos', async (req, res) => {
    const { nombre, codigo, categoria, precio, stock, descripcion } = req.body;

    if (!nombre || !codigo || !precio || !stock) {
        return res.status(400).json({ msg: 'Nombre, código, precio y stock son obligatorios' });
    }

    try {
        const [result] = await db.promise().query(
            'INSERT INTO productos (nombre, codigo, categoria, precio, stock, descripcion) VALUES (?, ?, ?, ?, ?, ?)',
            [nombre, codigo, categoria || '', parseFloat(precio), parseInt(stock), descripcion || '']
        );
        res.status(201).json({ msg: 'Producto creado', id: result.insertId });
    } catch (err) {
        console.error('Error al crear producto:', err);
        res.status(500).json({ msg: 'Error al guardar el producto' });
    }
});

// PUT /productos/:id – Actualizar producto
app.put('/productos/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre, codigo, categoria, precio, stock, descripcion } = req.body;

    if (!nombre || !codigo || !precio || !stock) {
        return res.status(400).json({ msg: 'Nombre, código, precio y stock son obligatorios' });
    }

    try {
        const [result] = await db.promise().query(
            'UPDATE productos SET nombre = ?, codigo = ?, categoria = ?, precio = ?, stock = ?, descripcion = ? WHERE id = ?',
            [nombre, codigo, categoria || '', parseFloat(precio), parseInt(stock), descripcion || '', id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ msg: 'Producto no encontrado' });
        }

        res.json({ msg: 'Producto actualizado' });
    } catch (err) {
        console.error('Error al actualizar producto:', err);
        res.status(500).json({ msg: 'Error al actualizar el producto' });
    }
});

// DELETE /productos/:id – Eliminar producto
app.delete('/productos/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const [result] = await db.promise().query('DELETE FROM productos WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ msg: 'Producto no encontrado' });
        }

        res.json({ msg: 'Producto eliminado' });
    } catch (err) {
        console.error('Error al eliminar producto:', err);
        res.status(500).json({ msg: 'Error al eliminar el producto' });
    }
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
});

// Manejo global de errores
process.on('uncaughtException', (err) => {
    console.error('❌ Error no capturado:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason) => {
    console.error('❌ Promesa no manejada:', reason);
    process.exit(1);
});