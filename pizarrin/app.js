var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

const bodyParser = require('body-parser');


// Configuración de la conexión a la base de datos
const mysql = require('mysql2');


//hashear contraseñas
const bcrypt = require('bcrypt');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'app_user',
  password: 'app_password',
  database: 'pizarrin_db'
});

db.connect((err) => {
  if (err) {
    console.error('Error al conectar a la base de datos:', err.message);
    return;
  }
  console.log('Conectado a la base de datos MySQL');
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
  db.query(query, [email], async (err, results) => {
    if (err) {
      console.error('Error al consultar la base de datos:', err.message);
      return res.status(500).send('Error interno del servidor');
    }

    // Si no se encuentra el usuario, redirige con un error
    if (results.length === 0) {
      console.log('Usuario no encontrado');
      return res.redirect('/login?error=credenciales_invalidas');
    }

    const user = results[0]; // Tomar el primer resultado (el usuario encontrado)

    // Comparar la contraseña ingresada con la almacenada en la base de datos
    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      console.log('Inicio de sesión exitoso:', user.email);
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

    // Insertar el usuario en la base de datos
    const query = 'INSERT INTO users (email, password) VALUES (?, ?)';
    db.query(query, [email, hashedPassword], (err, result) => {
      if (err) {
        console.error('Error al registrar usuario:', err.message);
        return res.status(500).send('Error al registrar usuario');
      }

      console.log('Usuario registrado con éxito:', result);
      res.status(201).send('Usuario registrado con éxito');
    });
  } catch (error) {
    console.error('Error al procesar la solicitud:', error.message);
    res.status(500).send('Error al procesar la solicitud');
  }
});


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

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
