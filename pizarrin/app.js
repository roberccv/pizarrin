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

// Configurar cookie-parser
app.use(cookieParser());
app.use(express.urlencoded({ extended: true })); // Para manejar datos de formularios

// Crear la tabla `users` si no existe
db.serialize(() => {
  // Crear la tabla `users` si no existe
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      rol INT NOT NULL,
      carrera TEXT
    )
  `, (err) => {
    if (err) {
      console.error('Error al crear la tabla "users":', err.message);
      process.exit(1);
    }
    console.log('Tabla "users" comprobada o creada con éxito.');
  });

  // Crear la tabla `solicitudes_registro` si no existe
  db.run(`
    CREATE TABLE IF NOT EXISTS solicitudes_registro (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      rol INT NOT NULL,
      carrera TEXT
    )
  `, (err) => {
    if (err) {
      console.error('Error al crear la tabla "solicitudes_registro":', err.message);
      process.exit(1);
    }
    console.log('Tabla "solicitudes_registro" comprobada o creada con éxito.');
  });

  //Crear la tabla 'aulas-profesor'
  db.run(`
    CREATE TABLE IF NOT EXISTS aulas_profesor (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      id_profesor INTEGER NOT NULL
    )
  `, (err) => {
    if (err) {
      console.error('Error al crear la tabla "aulas_profesor":', err.message);
      process.exit(1);
    }
    console.log('Tabla "aulas_profesor" comprobada o creada con éxito.');
  });

  //relaciona los alumnos con las aulas
  db.run(
    `CREATE TABLE IF NOT EXISTS aulas_alumnos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_aula INTEGER NOT NULL,
    id_alumno INTEGER NOT NULL
    )
  `, (err) => {
    if (err) {
      console.error('Error al crear la tabla "aulas_alumnos":', err.message);
      process.exit(1);
    }
    console.log('Tabla "aulas_alumnos" comprobada o creada con éxito.');
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
// Rutas para las vistas
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', '01-pizarrin.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', '05-login.html'));
});

app.get('/solicitar_cuenta', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', '06-solicitarCuenta.html'));
});

app.get('/solicitar_cuenta_alumno', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', '12-solicitarCuentaAlumno.html'));
});

app.get('/solicitudes', (req, res) => {
  const query = 'SELECT * FROM solicitudes_registro';

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Error al obtener solicitudes:', err.message);
      return res.status(500).send('Error al obtener solicitudes');
    }

    // Renderiza el archivo EJS y pasa las solicitudes como datos
    res.render('08-solicitudes', { solicitudes: rows });
  });
});

app.get('/dashboard/alumno', authMiddleware, (req, res) => {
  if (req.user.rol !== 1) {
    return res.status(403).send('No tienes permiso para acceder a esta página.');
  }
  res.render('13-alumno', 
    {nombre: req.user.nombre, // Puedes cambiar `nombre` si es necesario
    email: req.user.email,
    rol: req.user.rol,
    carrera:req.user.carrera}); // Renderizar vista del alumno
});

app.get('/dashboard/profesor', authMiddleware, (req, res) => {
  if (req.user.rol !== 2) {
    return res.status(403).send('No tienes permiso para acceder a esta página.');
  }
  
  // Pasa el email a la vista
  res.render('09-profesor', { 
    nombre: req.user.nombre, // Puedes cambiar `nombre` si es necesario
    email: req.user.email,
    rol: req.user.rol,
    carrera:req.user.carrera   // Incluye `email` para evitar el error
  });
});


app.get('/dashboard/admin', authMiddleware, (req, res) => {
  if (req.user.rol !== 3) {
    return res.status(403).send('No tienes permiso para acceder a esta página.');
  }
  res.render('07-admin', {
    nombre: req.user.nombre, // Puedes cambiar `nombre` si es necesario
    email: req.user.email,
    rol: req.user.rol,
    carrera:req.user.carrera}); // Renderizar vista del admin
});


// Sergio
// app.get('/aulas', (req, res) => {
  // const query = 'SELECT * FROM aulas-alumno where email = variable alumno'; // que cargue todas las aulas del alumno


app.post('/aceptar-solicitud', (req, res) => {
  const { id } = req.body;

  const getQuery = 'SELECT * FROM solicitudes_registro WHERE id = ?';
  const insertQuery = 'INSERT INTO users (name, email, password, rol, carrera) VALUES (?, ?, ?, ?, ?)';
  const deleteQuery = 'DELETE FROM solicitudes_registro WHERE id = ?';

  db.get(getQuery, [id], (err, row) => {
    if (err || !row) {
      console.error('Error al obtener la solicitud:', err?.message || 'No se encontró la solicitud');
      return res.status(500).send('Error al aceptar la solicitud');
    }

    console.log('Solicitud encontrada:', row);

    db.run(insertQuery, [row.name, row.email, row.password, row.rol, row.carrera], function (err) {
      if (err) {
        console.error('Error al insertar usuario:', err.message);
        return res.status(500).send('Error al aceptar la solicitud');
      }

      db.run(deleteQuery, [id], (err) => {
        if (err) {
          console.error('Error al eliminar la solicitud:', err.message);
          return res.status(500).send('Error al aceptar la solicitud');
        }
        res.status(200).send('Solicitud aceptada con éxito');
      });
    });
  });
});


app.post('/rechazar-solicitud', (req, res) => {
  const { id } = req.body;

  const query = 'DELETE FROM solicitudes_registro WHERE id = ?';
  db.run(query, [id], function (err) {
    if (err) {
      console.error('Error al rechazar la solicitud:', err.message);
      return res.status(500).send('Error al rechazar la solicitud');
    }
    res.status(200).send('Solicitud rechazada con éxito');
  });
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
      // Configurar cookie con el email y el rol
      res.cookie('user', JSON.stringify({ email: usuario.email, rol: usuario.rol }), {
        maxAge: 24 * 60 * 60 * 1000, // 1 día
        httpOnly: true, // Solo accesible desde el servidor
        sameSite: 'strict', // Protege contra ataques CSRF
      });

      // Redirigir al dashboard correspondiente
      if (usuario.rol === 1) {
        return res.redirect('/dashboard/alumno');
      } else if (usuario.rol === 2) {
        return res.redirect('/dashboard/profesor');
      } else if (usuario.rol === 3) {
        return res.redirect('/dashboard/admin');
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


//Middleware para verificar las coooookiiieees galletitiiiis
function authMiddleware(req, res, next) {
  const userCookie = req.cookies.user;

  if (!userCookie) {
    console.log('No se encontró la cookie de usuario.');
    return res.redirect('/login?error=no_autenticado');
  }

  try {
    const usuario = JSON.parse(userCookie); // Parsear la cookie
    req.user = usuario; // Pasar los datos del usuario al request
    next(); // Continuar con la siguiente función
  } catch (error) {
    console.error('Error al procesar la cookie:', error.message);
    return res.redirect('/login?error=error_cookie');
  }
}

//logout + cookies
app.get('/logout', (req, res) => {
  res.clearCookie('user'); // Eliminar la cookie
  res.redirect('/login'); // Redirigir al login
});



// Procesar registro de usuario
app.post('/registro', async (req, res) => {
  const { nombre, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = 'INSERT INTO solicitudes_registro (name, email, password, rol) VALUES (?, ?, ?, ?)';
    const rol = 2; // Rol predeterminado: Profesor
    db.run(query, [nombre, email, hashedPassword, rol], function (err) {
      if (err) {
        console.error('Error al registrar solicitud:', err.message);
        return res.status(500).send('Error al registrar solicitud');
      }
      console.log('Solicitud de registro creada con ID:', this.lastID);
      // Redirigir al login con un query parameter que indique éxito
      res.redirect(`/login?status=success`);

    });
  } catch (error) {
    console.error('Error al procesar la solicitud:', error.message);
    res.status(500).send('Error al procesar la solicitud');
  }
});

//registro alumno desde profesor
app.post('/registroAlumno', async (req, res) => {
  const { nombre, email, carrera } = req.body;

  // Función para generar una contraseña aleatoria
  function generarContrasena(longitud) {
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+[]{}|;:,.<>?';
    let contrasena = '';
    for (let i = 0; i < longitud; i++) {
      const indiceAleatorio = Math.floor(Math.random() * caracteres.length);
      contrasena += caracteres[indiceAleatorio];
    }
    return contrasena;
  }

  const contrasenaAleatoria = generarContrasena(12);

  try {
    // Encripta la contraseña
    const hashedPassword = await bcrypt.hash(contrasenaAleatoria, 10);

    // Inserta los datos en la tabla `solicitudes_registro`
    const query = 'INSERT INTO solicitudes_registro (name, email, password, rol, carrera) VALUES (?, ?, ?, ?, ?)';
    const rol = 1; // Rol predeterminado para alumnos

    db.run(query, [nombre, email, hashedPassword, rol, carrera], function (err) {
      if (err) {
        console.error('Error al registrar solicitud:', err.message);
        return res.status(500).send('Error al registrar solicitud');
      }

      console.log('Solicitud de registro creada con ID:', this.lastID);

      // Responde con un mensaje y la contraseña generada
      res.status(201).json({
        message: 'Solicitud enviada y pendiente de aprobación.',
        contrasena: contrasenaAleatoria
      });
      // Redirigir al login con un query parameter que indique éxito

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
      res.redirect('/login');
    });
  } catch (error) {
    console.error('Error al procesar la solicitud:', error.message);
    res.status(500).send('Error al procesar la solicitud');
  }
});

// Crear Aulas: 
 app.post('/crear_aulas/:email_profe'), (req, res) => { // cuando cookies, coger de las cookies
  //const { nombre, email } = req.body; //#Opción 1
  const nombre = req.body.nombreAula; //#Opción 2
  const emails_alumnos = req.body.emails.split(',').map(email => email.trim()); //Opción 2
  const email_profe = req.params.email_profe; //Opción 2
  const obtener_id_profesor = 'SELECT ID FROM USERS QHERE EMAIL = ?';
  try {
    db.get(obtener_id_profesor, [email_profe], async (err, usuario) => {
      if (err) {
        console.error('Error al consultar la base de datos:', err.message);
        return res.status(500).send('Error interno del servidor');
      }
      if (!usuario) {
        console.log('Usuario no encontrado');
        return res.redirect('/error');
      }
    });
  } catch (error) {
    console.error('Error al procesar la solicitud:', error.message);
    res.status(500).send('Error al procesar la solicitud');
  }
  


  const query = 'INSERT INTO aulas_profesor (name, id_profesor) VALUES (?, ?)';
  //const profeID = req.params.profeID;

 }

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
