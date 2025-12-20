// init-db.js
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');

// Conexión a la base de datos (usa las mismas variables que server.js)
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

    // 1. Crear tabla de usuarios
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

        // 2. Crear tabla de productos
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

            // 3. Insertar usuario admin (solo si no existe)
            const adminEmail = 'admin@example.com';
            const adminPassword = 'admin123';
            const hashedPassword = bcrypt.hashSync(adminPassword, 10);

            const checkAdmin = 'SELECT id FROM users WHERE email = ?';
            db.query(checkAdmin, [adminEmail], (err, results) => {
                if (err) {
                    console.error('❌ Error al verificar usuario admin:', err);
                } else if (results.length === 0) {
                    // Insertar admin
                    const insertAdmin = `
                        INSERT INTO users (nombre, email, password)
                        VALUES ('Administrador', ?, ?)
                    `;
                    db.query(insertAdmin, [adminEmail, hashedPassword], (err, results) => {
                        if (err) {
                            console.error('❌ Error insertando usuario admin:', err);
                        } else {
                            console.log('✅ Usuario admin creado: admin@example.com / admin123');
                        }
                        finalize();
                    });
                } else {
                    console.log('✅ Usuario admin ya existía');
                    finalize();
                }
            });
        });
    });
});

// Función para cerrar conexión y terminar proceso
function finalize() {
    db.end((err) => {
        if (err) {
            console.error('❌ Error al cerrar conexión:', err);
        } else {
            console.log('🔌 Conexión a base de datos cerrada');
        }
        process.exit(0);
    });
}