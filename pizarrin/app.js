let createError = require('http-errors');
let express = require('express');
let path = require('path');
let cookieParser = require('cookie-parser');
let logger = require('morgan');

let indexRouter = require('./routes/index');
let usersRouter = require('./routes/users');
let sqlite3 = require('sqlite3').verbose();

let app = express();

const bodyParser = require('body-parser');



//hashear contraseñas
const bcrypt = require('bcrypt');

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

// Configura EJS para archivos .html
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

//dirección login
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, '.', 'public', '05-login.html'));
});

app.get("/solicitar_cuenta", (req, res) => {
  res.sendFile(path.join(__dirname, '.', 'public', '06-solicitarCuenta.html'));
});

// Middleware para parsear bodies de tipo JSON
app.use(bodyParser.json());

// Middleware para parsear bodies de tipo URL-encoded. ESTO HACE QUE REQ.BODY FUNCION
app.use(bodyParser.urlencoded({ extended: true }));

// Ruta que procesa los datos del formulario de inicio de sesión
app.post('/autentificacion_login', (req, res) => {
  console.log("entra en autentificacion");
  const { email, password } = req.body; // Extraer email y contraseña del cuerpo de la solicitud REQ.BODY AQUIIIII

  // Verificar si el usuario existe en la base de datos
  const query = 'SELECT * FROM users WHERE email = ?';
  db.get(query, [email], async (err, usuario) => {
    if (err) {
      console.error('Error al consultar la base de datos:', err.message);
      return res.status(500).send('Error interno del servidor');
    }

    // Si no se encuentra el usuario, redirige con un error
    if (!usuario) {
      console.log('Usuario no encontrado');
      return res.redirect('/login?error=credenciales_invalidas');
    }
    console.log("results", usuario);

    // Comparar la contraseña ingresada con la almacenada en la base de datos
    const isMatch = await bcrypt.compare(password, usuario.password);

    if (isMatch) {
      console.log('Inicio de sesión exitoso:', usuario.email);
      res.send('Inicio de sesión exitoso');
    } else {
      console.log('Contraseña incorrecta');
      res.redirect('/login?error=credenciales_invalidas');
    }
  });
});

app.post('/registro', async (req, res) => {
  const { nombre, email, password } = req.body; // Capturar nombre, email y contraseña

  try {
    // Encriptar la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertar el usuario en la base de datos con rol 2
    const query = 'INSERT INTO users (name, email, password, rol) VALUES (?, ?, ?, ?)';
    const rol = 2; // Asignar rol predeterminado (2: profesor)
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






app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// middleware
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


module.exports = app;
