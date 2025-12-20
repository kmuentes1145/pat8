// init-db.js
const mysql = require('mysql2');

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

    // Crear tabla de usuarios si no existe
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB;
    `;

    db.query(createTableQuery, (err, results) => {
        if (err) {
            console.error('❌ Error creando tabla:', err);
        } else {
            console.log('✅ Tabla "users" creada o ya existía');
        }

        // Insertar usuario admin si no existe
        const insertAdminQuery = `
            INSERT INTO users (username, password) 
            VALUES ('admin', ?)
            ON DUPLICATE KEY UPDATE username=username;
        `;
        const hashedPassword = bcrypt.hashSync('admin123', 10); // ¡Cambia esta contraseña!
        db.query(insertAdminQuery, [hashedPassword], (err, results) => {
            if (err) {
                console.error('❌ Error insertando admin:', err);
            } else {
                console.log('✅ Usuario admin creado o ya existía');
            }
            db.end(); // Cierra conexión después de inicializar
        });
    });
});