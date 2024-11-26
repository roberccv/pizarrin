var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

const bodyParser = require('body-parser');

//hashear contraseñas
const bcrypt = require('bcrypt');

// Configuración de la conexión a la base de datos
const db = mysql.createConnection({
  host: 'localhost',
  user: 'tu_usuario',
  password: 'tu_contraseña',
  database: 'loginSystem'
});

db.connect((err) => {
  if (err) throw err;
  console.log('Conectado a la base de datos MySQL');
});


// Configura EJS para archivos .html
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

//dirección login
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, '.', 'public', '05-login.html'));
});

// Middleware para parsear bodies de tipo JSON
app.use(bodyParser.json());

// Middleware para parsear bodies de tipo URL-encoded. ESTO HACE QUE REQ.BODY FUNCION
app.use(bodyParser.urlencoded({ extended: true }));

// Ruta que procesa los datos del formulario de inicio de sesión
app.post('/autentificacion_login', (req, res) => {
  console.log("entra en autentifiacion")
  const { email, password } = req.body; //<--------------------------------REQ.BODY AQUIII

  if (email === "prueba@correo.com" && password === "contrasenadeprueba") {
      res.send("Inicio de sesión exitoso");
  } else {
      // Redirigir al usuario al login con un mensaje de error
      res.redirect('/login?error=credenciales_invalidas');
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
