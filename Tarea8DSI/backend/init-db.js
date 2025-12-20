// init-db.js
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');

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

    // Crear tabla de usuarios
    const createUsersTable = `
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nombre VARCHAR(100) NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB;
    `;

    db.query(createUsersTable, (err, results) => {
        if (err) {
            console.error('❌ Error creando tabla "users":', err);
        } else {
            console.log('✅ Tabla "users" creada o ya existía');
        }

        // Crear tabla de productos
        const createProductosTable = `
            CREATE TABLE IF NOT EXISTS productos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(100) NOT NULL,
                codigo VARCHAR(50) UNIQUE NOT NULL,
                categoria VARCHAR(50),
                precio DECIMAL(10,2) NOT NULL,
                stock INT NOT NULL,
                descripcion TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB;
        `;

        db.query(createProductosTable, (err, results) => {
            if (err) {
                console.error('❌ Error creando tabla "productos":', err);
            } else {
                console.log('✅ Tabla "productos" creada o ya existía');
            }

            // Insertar usuario admin
            const hashedPassword = bcrypt.hashSync('admin123', 10);
            const insertAdmin = `
                INSERT INTO users (nombre, email, password) 
                VALUES ('Admin', 'admin@example.com', ?)
                ON DUPLICATE KEY UPDATE nombre=nombre;
            `;

            db.query(insertAdmin, [hashedPassword], (err, results) => {
                if (err) {
                    console.error('❌ Error insertando usuario admin:', err);
                } else {
                    console.log('✅ Usuario admin creado o ya existía');
                }

                // Cierra la conexión solo si este script se ejecuta manualmente
                db.end(() => {
                    console.log('🔌 Conexión cerrada');
                    process.exit(0); // Termina el proceso
                });
            });
        });
    });
});