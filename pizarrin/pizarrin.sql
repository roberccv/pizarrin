-- Crear la base de datos si no existe
CREATE DATABASE IF NOT EXISTS pizarrin_db;
USE pizarrin_db;

-- Configurar la contraseña del usuario root con mysql_native_password
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'contrasena';
FLUSH PRIVILEGES;

-- Crear la tabla de usuarios si no existe
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
);

-- Crear un nuevo usuario para la aplicación
CREATE USER 'app_user'@'localhost' IDENTIFIED BY 'app_password';

-- Dar permisos al nuevo usuario solo para la base de datos pizarrin_db
GRANT ALL PRIVILEGES ON pizarrin_db.* TO 'app_user'@'localhost';

-- Aplicar los cambios
FLUSH PRIVILEGES;
