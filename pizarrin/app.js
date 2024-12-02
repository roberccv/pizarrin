let createError = require('http-errors');
let express = require('express');
let path = require('path');
let cookieParser = require('cookie-parser');
let logger = require('morgan');
let sqlite3 = require('sqlite3').verbose();
let bodyParser = require('body-parser');
let bcrypt = require('bcrypt');

const app = express();

const dbFilePath = './db.sqlite'; // Ruta al archivo de la base de datos
const db = new sqlite3.Database(dbFilePath, (err) => {
  if (err) {
    console.error('Error al conectar a la base de datos SQLite:', err.message);
    process.exit(1);
  }
  console.log(`Conectado a la base de datos SQLite en ${dbFilePath}`);
});

// Crear la tabla `users` si no existe
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      rol INT NOT NULL
    )
  `, (err) => {
    if (err) {
      console.error('Error al crear la tabla "users":', err.message);
      process.exit(1);
    }
    console.log('Tabla "users" comprobada o creada con éxito.');
  });
});

// Configuración del motor de vistas
app.set('views', path.join(__dirname, 'views')); // Carpeta donde se encuentran tus vistas
app.set('view engine', 'ejs');

// Middleware
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Rutas para las vistas
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', '05-login.html'));
});

app.get('/solicitar_cuenta', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', '06-solicitarCuenta.html'));
});

app.get('/alumno', (req, res) => {
  res.render('13-alumno' , 
    {nombre: usario.name}); // Renderizar la plantilla EJS
});

app.get('/profesor', (req, res) => {
  res.render('09-profesor', 
    {nombre: usario.name}); // Renderizar la plantilla EJS
});

app.get('/admin', (req, res) => {
  res.render('07-admin'),
  {nombre: usario.name}; // Renderizar la plantilla EJS
});

// Procesar inicio de sesión
app.post('/autentificacion_login', (req, res) => {
  const { email, password } = req.body;

  const query = 'SELECT * FROM users WHERE email = ?';
  db.get(query, [email], async (err, usuario) => {
    if (err) {
      console.error('Error al consultar la base de datos:', err.message);
      return res.status(500).send('Error interno del servidor');
    }

    if (!usuario) {
      console.log('Usuario no encontrado');
      return res.redirect('/login?error=credenciales_invalidas');
    }

    const isMatch = await bcrypt.compare(password, usuario.password);

    if (isMatch) {
      if (usuario.rol === 1) {
        console.log('Redirigiendo al portal de alumno...');
        return res.redirect('/alumno');
      } else if (usuario.rol === 2) {
        console.log('Redirigiendo al portal de profesor...');
        return res.redirect('/profesor');
      } else if (usuario.rol === 3) {
        console.log('Redirigiendo al portal de admin...');
        return res.redirect('/admin');
      } else {
        console.log('Rol no reconocido');
        return res.redirect('/login?error=rol_no_reconocido');
      }
    } else {
      console.log('Contraseña incorrecta');
      return res.redirect('/login?error=credenciales_invalidas');
    }
  });
});

// Procesar registro de usuario
app.post('/registro', async (req, res) => {
  const { nombre, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = 'INSERT INTO users (name, email, password, rol) VALUES (?, ?, ?, ?)';
    const rol = 2; // Rol predeterminado: Profesor
    db.run(query, [nombre, email, hashedPassword, rol], function (err) {
      if (err) {
        console.error('Error al registrar usuario:', err.message);
        return res.status(500).send('Error al registrar usuario');
      }
      console.log('Usuario registrado con éxito con ID:', this.lastID);
      res.status(201).send('Usuario registrado con éxito');
    });
  } catch (error) {
    console.error('Error al procesar la solicitud:', error.message);
    res.status(500).send('Error al procesar la solicitud');
  }
});

// Procesar registro de usuario
app.post('/registroROOT', async (req, res) => {
  const { nombre, email, password, rol} = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = 'INSERT INTO users (name, email, password, rol) VALUES (?, ?, ?, ?)';
    db.run(query, [nombre, email, hashedPassword, rol], function (err) {
      if (err) {
        console.error('Error al registrar usuario:', err.message);
        return res.status(500).send('Error al registrar usuario');
      }
      console.log('Usuario registrado con éxito con ID:', this.lastID);
      res.status(201).send('Usuario registrado con éxito');
    });
  } catch (error) {
    console.error('Error al procesar la solicitud:', error.message);
    res.status(500).send('Error al procesar la solicitud');
  }
});

// Manejo de errores
app.use(function (req, res, next) {
  next(createError(404));
});

app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

// Exportar la app
module.exports = app;
