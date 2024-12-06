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
      email_profesor TEXT NOT NULL
    )
  `, (err) => {
    if (err) {
      console.error('Error al crear la tabla "aulas_profesor":', err.message);
      process.exit(1);
    }
    console.log('Tabla "aulas_profesor" comprobada o creada con éxito.');
  });

    //Crear la tabla 'aulas-profesor'
    db.run(`
      CREATE TABLE IF NOT EXISTS paginas_aula (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      id_aula INTEGER NOT NULL,
      titulo TEXT NOT NULL,
      texto TEXT NOT NULL,
      foto TEXT, -- Este será el path o URL de la foto
      FOREIGN KEY (id_aula) REFERENCES aulas_profesor (id)
    ) 
    `, (err) => {
      if (err) {
        console.error('Error al crear la tabla "paginas_aula":', err.message);
        process.exit(1);
      }
      console.log('Tabla "paginas_aula" comprobada o creada con éxito.');
    });

  //relaciona los alumnos con las aulas
  db.run(
    `CREATE TABLE IF NOT EXISTS aulas_alumnos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_aula INTEGER NOT NULL,
    email_alumno TEXT NOT NULL
    )
  `, (err) => {
    if (err) {
      console.error('Error al crear la tabla "aulas_alumnos":', err.message);
      process.exit(1);
    }
    console.log('Tabla "aulas_alumnos" comprobada o creada con éxito.');
  });
})
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

app.get('/solicitar_cuenta_alumno', authMiddleware, (req, res) => {
  if (req.user.rol !== 2) {
    return res.status(403).send('No tienes permiso para acceder a esta página.');
  } else{
    res.render('12-solicitarCuentaAlumno');
  }
});



app.get('/solicitudes', authMiddleware, (req, res) => {
  if (req.user.rol !==3) {
    return res.status(403).send('No tienes permiso para acceder a esta página.');
  }
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

  const email_alumno = req.user.email; // Correo del alumno autenticado
  const obtener_aulas = `
    SELECT ap.id, ap.name, ap.email_profesor
    FROM aulas_alumnos aa
    JOIN aulas_profesor ap ON aa.id_aula = ap.id
    WHERE aa.email_alumno = ?`;

  db.all(obtener_aulas, [email_alumno], (err, rows) => {
    if (err) {
      console.error('Error al consultar las aulas:', err.message);
      return res.status(500).send('Error al obtener las aulas');
    }

    console.log('Aulas obtenidas:', rows); // Verificar las aulas obtenidas para depuración

    // Renderizar la vista con las aulas
    res.render('13-alumno', {
      nombre: req.user.nombre, // Nombre del alumno
      email: req.user.email, // Correo del alumno
      rol: req.user.rol, // Rol del usuario
      carrera: req.user.carrera, // Carrera del alumno
      aulas: rows // Lista de aulas obtenida de la base de datos
    });
  });
});


app.get('/dashboard/profesor', authMiddleware, (req, res) => {
  if (req.user.rol !== 2) {
    return res.status(403).send('No tienes permiso para acceder a esta página.');
  }

  const email_profesor = req.user.email; // Email del profesor autenticado

  // Consulta para obtener las aulas del profesor
  const obtener_aulas = `
    SELECT id, name 
    FROM aulas_profesor
    WHERE email_profesor = ?`;

  db.all(obtener_aulas, [email_profesor], (err, rows) => {
    if (err) {
      console.error('Error al consultar las aulas del profesor:', err.message);
    }

    console.log('Aulas del profesor obtenidas:', rows); // Depuración

    // Renderizar la vista del profesor con las aulas
    res.render('09-profesor', { 
      nombre: req.user.nombre, // Nombre del profesor
      email: req.user.email, // Correo del profesor
      rol: req.user.rol, // Rol del usuario
      carrera: req.user.carrera, // Carrera (si aplica)
      aulas: rows // Aulas obtenidas de la base de datos
    });
  });
});


app.get('/crear_aula', authMiddleware, (req, res)=>{
  if (req.user.rol !== 2) {
    return res.status(403).send('No tienes permiso para acceder a esta página.');
  }
  res.render('11-crearAula');
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
      res.cookie('user', JSON.stringify({ email: usuario.email, rol: usuario.rol, carrera: usuario.carrera, nombre: usuario.name, id: usuario.id  }), {
        maxAge: 24 * 60 * 60 * 1000, // 1 día
        httpOnly: true, // Solo accesible desde el servidor
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

app.post('/crear_aulas_profe', authMiddleware, (req, res) => {
  const nombre = req.body.nombreaula;
  const email_profe = req.user.email; // Correo del profesor tomado de las cookies
  const emails_alumnos = req.body.emails_alumnos.split(',').map(email => email.trim()); // Separa y limpia los correos de los alumnos

  // Query para insertar en la tabla `aulas_profesor`
  const insertar_aula = 'INSERT INTO aulas_profesor (name, email_profesor) VALUES (?, ?)';
  // Query para insertar en la tabla `aulas_alumnos`
  const insertar_alumno = 'INSERT INTO aulas_alumnos (id_aula, email_alumno) VALUES (?, ?)';
  // Query para verificar si los correos existen y son alumnos
  const verificar_alumnos = 'SELECT email FROM USERS WHERE email IN (' + emails_alumnos.map(() => '?').join(',') + ') AND rol = 1';

  try {
    // Verificar si los correos pertenecen a alumnos registrados
    db.all(verificar_alumnos, emails_alumnos, (err, rows) => {
      if (err) {
        console.error('Error al consultar la base de datos:', err.message);
        return res.status(500).send('Error interno del servidor al verificar los alumnos');
      }

      const correos_validos = rows.map(row => row.email); // Correos válidos devueltos por la consulta
      const correos_invalidos = emails_alumnos.filter(email => !correos_validos.includes(email)); // Correos que no son válidos

      if (correos_invalidos.length > 0) {
        console.error('Correos no válidos:', correos_invalidos);
        return res.status(400).send(`Los siguientes correos no son válidos o no pertenecen a alumnos: ${correos_invalidos.join(', ')}`);
      }

      // Si todos los correos son válidos, insertar el aula
      db.run(insertar_aula, [nombre, email_profe], function (err) {
        if (err) {
          console.error('Error al registrar el aula:', err.message);
          return res.status(500).send('Error al registrar el aula');
        }

        const idAula = this.lastID; // Obtener el ID del aula recién creada
        console.log('Aula registrada con éxito con ID:', idAula);

        // Insertar cada alumno en la tabla `aulas_alumnos`
        correos_validos.forEach(email_alumno => {
          db.run(insertar_alumno, [idAula, email_alumno], function (err) {
            if (err) {
              console.error(`Error al insertar el alumno (${email_alumno}):`, err.message);
              // No detenemos todo el proceso, pero podrías manejar errores adicionales aquí si es necesario
            } else {
              console.log(`Alumno con correo ${email_alumno} agregado al aula con ID: ${idAula}`);
            }
          });
        });

        // Responder al cliente después de completar los inserts
        res.status(200).send('Aula y alumnos creados con éxito');
      });
    });
  } catch (error) {
    console.error('Error al procesar la solicitud:', error.message);
    res.status(500).send('Error al procesar la solicitud');
  }
});

//-------------------------------------------
//AULAAS

app.get('/aula/:id', authMiddleware, (req, res) => {
  const aulaId = req.params.id;
  const email_usuario = req.user.email;
  const rol_usuario = req.user.rol;

  console.log('Consultando detalles para el aula:', aulaId, 'del usuario:', email_usuario); // Depuración

  let obtener_aula;

  if (rol_usuario === 1) {
    // Validación para alumnos
    obtener_aula = `
      SELECT ap.id, ap.name, ap.email_profesor
      FROM aulas_alumnos aa
      JOIN aulas_profesor ap ON aa.id_aula = ap.id
      WHERE aa.id_aula = ? AND aa.email_alumno = ?`;
  } else if (rol_usuario === 2) {
    // Validación para profesores
    obtener_aula = `
      SELECT id, name, email_profesor
      FROM aulas_profesor
      WHERE id = ? AND email_profesor = ?`;
  } else {
    return res.status(403).send('No tienes permiso para acceder a esta página.');
  }

  const parametros = rol_usuario === 1 ? [aulaId, email_usuario] : [aulaId, email_usuario];

  db.get(obtener_aula, parametros, (err, aula) => {
    if (err || !aula) {
      console.error('Error al consultar el aula:', err?.message);
      return res.status(404).send('Aula no encontrada o no tienes permiso para acceder.');
    }

    // Obtener las páginas del aula
    const obtener_paginas = `
      SELECT id, titulo, texto, foto 
      FROM paginas_aula
      WHERE id_aula = ?`;

    db.all(obtener_paginas, [aulaId], (err, paginas) => {
      if (err) {
        console.error('Error al obtener las páginas:', err.message);
        return res.status(500).send('Error al obtener las páginas.');
      }

      // Renderizar los detalles del aula y sus páginas
      res.render('aulaDetalle', { aula, paginas, });
    });
  });
});



//---------------------
//EDITAR AULAS PARA PROFES

app.get('/aula/:id/editar', authMiddleware, (req, res) => {
  if (req.user.rol !== 2) {
    return res.status(403).send('No tienes permiso para acceder a esta página.');
  }

  const aulaId = req.params.id;
  const email_profesor = req.user.email;

  const obtener_aula = `
    SELECT id, name 
    FROM aulas_profesor
    WHERE id = ? AND email_profesor = ?`;

  db.get(obtener_aula, [aulaId, email_profesor], (err, aula) => {
    if (err) {
      console.error('Error al obtener el aula:', err.message);
      return res.status(500).send('Error al obtener el aula');
    }

    if (!aula) {
      return res.status(404).send('Aula no encontrada o no tienes permiso para editarla.');
    }

    // Renderizar el formulario de edición
    res.render('editar-aula', { aula });
  });
});

app.post('/aula/:id/editar', authMiddleware, (req, res) => {
  if (req.user.rol !== 2) {
    return res.status(403).send('No tienes permiso para realizar esta acción.');
  }

  const aulaId = req.params.id;
  const email_profesor = req.user.email;
  const nuevoNombre = req.body.name;

  const actualizar_aula = `
    UPDATE aulas_profesor
    SET name = ?
    WHERE id = ? AND email_profesor = ?`;

  db.run(actualizar_aula, [nuevoNombre, aulaId, email_profesor], function (err) {
    if (err) {
      console.error('Error al actualizar el aula:', err.message);
      return res.status(500).send('Error al actualizar el aula.');
    }

    if (this.changes === 0) {
      return res.status(404).send('Aula no encontrada o no tienes permiso para editarla.');
    }

    console.log('Aula actualizada con éxito:', aulaId);
    res.redirect('/dashboard/profesor');
  });
});
//----------------------

app.get('/aula/:id/paginas', authMiddleware, (req, res) => {
  if (req.user.rol !== 2) {
    return res.status(403).send('No tienes permiso para acceder a esta página.');
  }

  const aulaId = req.params.id;
  const email_profesor = req.user.email;

  // Verifica que el profesor es el propietario del aula
  const verificar_aula = `
    SELECT id, name 
    FROM aulas_profesor
    WHERE id = ? AND email_profesor = ?`;

  const obtener_paginas = `
    SELECT id, titulo, texto, foto 
    FROM paginas_aula
    WHERE id_aula = ?`;

  db.get(verificar_aula, [aulaId, email_profesor], (err, aula) => {
    if (err || !aula) {
      console.error('Error al verificar el aula:', err?.message);
      return res.status(404).send('Aula no encontrada o no tienes permiso para acceder.');
    }

    db.all(obtener_paginas, [aulaId], (err, paginas) => {
      if (err) {
        console.error('Error al obtener las páginas:', err.message);
        return res.status(500).send('Error al obtener las páginas.');
      }

      res.render('aulaDetalle', { aula, paginas });
    });
  });
});

app.get('/aula/:id/paginas/nueva', authMiddleware, (req, res) => {
  if (req.user.rol !== 2) {
    return res.status(403).send('No tienes permiso para acceder a esta página.');
  }

  const aulaId = req.params.id;
  res.render('crearPagina', { aulaId });
});

app.post('/aula/:id/paginas/nueva', authMiddleware, (req, res) => {
  if (req.user.rol !== 2) {
    return res.status(403).send('No tienes permiso para realizar esta acción.');
  }

  const aulaId = req.params.id;
  const titulo = req.body.titulo;
  const texto = req.body.texto;
  const foto = req.file ? `/uploads/${req.file.filename}` : null; // Manejo de fotos opcionales

  const insertar_pagina = `
    INSERT INTO paginas_aula (id_aula, titulo, texto, foto)
    VALUES (?, ?, ?, ?)`;

  db.run(insertar_pagina, [aulaId, titulo, texto, foto], function (err) {
    if (err) {
      console.error('Error al crear la página:', err.message);
      return res.status(500).send('Error al crear la página.');
    }

    console.log('Página creada con éxito:', this.lastID);
    res.redirect(`/aula/${aulaId}/paginas`);
  });
});

app.get('/aula/:id/paginas/:paginaId/editar', authMiddleware, (req, res) => {
  if (req.user.rol !== 2) {
    return res.status(403).send('No tienes permiso para acceder a esta página.');
  }

  const { id: aulaId, paginaId } = req.params;

  const obtener_pagina = `
    SELECT id, titulo, texto, foto
    FROM paginas_aula
    WHERE id = ? AND id_aula = ?`;

  db.get(obtener_pagina, [paginaId, aulaId], (err, pagina) => {
    if (err || !pagina) {
      console.error('Error al obtener la página:', err?.message);
      return res.status(404).send('Página no encontrada.');
    }

    res.render('editar-pagina', { pagina, aulaId });
  });
});

app.post('/aula/:id/paginas/:paginaId/editar', authMiddleware, (req, res) => {
  if (req.user.rol !== 2) {
    return res.status(403).send('No tienes permiso para realizar esta acción.');
  }

  const { id: aulaId, paginaId } = req.params;
  const titulo = req.body.titulo;
  const texto = req.body.texto;
  
  const actualizar_pagina = `
    UPDATE paginas_aula
    SET titulo = ?, texto = ?
    WHERE id = ? AND id_aula = ?`;

  db.run(actualizar_pagina, [titulo, texto, paginaId, aulaId], function (err) {
    if (err) {
      console.error('Error al actualizar la página:', err.message);
      return res.status(500).send('Error al actualizar la página.');
    }

    console.log('Página actualizada con éxito:', paginaId);
    res.redirect(`/aula/${aulaId}/paginas`);
  });
});


//-----------

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
