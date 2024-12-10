# Proyecto Pizarrín🤓
👨🏻‍💻Miguel Gamboa Sánchez | **MiguelG7** 

👨🏼‍💻Sergio Díaz Paricio | **sdiazpar** 

👨🏻‍💻Roberto Cinos Vega | **roberccv**

### **Contribuciones**
Cada autor ha contribuido significativamente en distintas áreas del proyecto, incluyendo:
- **Desarrollo del código**
- **Corrección de errores**
- **Mejoras funcionales y optimización**

---

¿Te gustaría personalizarlo aún más o añadir detalles específicos de las contribuciones? 😊

## 🚀 Requisitos

1. **MySQL**: Asegúrate de tener MySQL instalado en tu máquina.
2. **Node.js**: Versión mínima 14.x.
3. **NPM**: Instalado junto con Node.js.
4. **Socket.io**: Servicio de notificaciones

---

## ⚙️ Configuración del Proyecto

### 1. Clonar el repositorio
Clona este proyecto en tu máquina local:
```bash
git clone https://github.com/roberccv/pizarrin.git
```

### 3. Iniciar el servidor
Ejecuta el siguiente comando para iniciar el servidor:
```bash
npm start
```

El servidor estará disponible en [http://localhost:3000](http://localhost:3000).

---

## 🛠️ Funcionalidades

### **1. Registro de usuarios:**
   - Crea una nueva cuenta ingresando un correo electrónico, un nombre y una contraseña.
   - Las contraseñas se almacenan encriptadas para mayor seguridad.
   
### **2. Gestión de Usuarios**
   *Roles disponibles*:
  - **Alumno**: Usuarios que acceden a las aulas asignadas por un profesor.
  - **Profesor**: Usuarios que gestionan aulas y páginas, y asignan alumnos a las aulas. Puede crear solicitudes de cuentas de alumnos.
  - **Admin**: Usuarios con control completo del sistema, encargados de la administración general. Pueden aceptar y rechazar solicitudes de cuentas tanto de profesores como alumnos.
  Los roles determinan los permisos y accesos en el sistema.

### 3. **Inicio de sesión:**
   - Los usuarios pueden autenticarse con sus credenciales y acceder al sistema.

### **4. Validación de contraseñas:**
   - Verificación de contraseñas encriptadas con `bcrypt`.

### **5. Funcionalidades del Profesor**
   *a. Creación de Aulas*
   Los profesores pueden crear aulas personalizadas, cada una con:
  - **Páginas privadas**: Solo accesibles para los alumnos asignados.
  - **Páginas públicas**: Accesibles para usuarios invitados, sin necesidad de registro.

   *b. Gestión de Páginas dentro del Aula*
- Crear, modificar y eliminar páginas con contenido educativo.
- Posibilidad de incluir contenido multimedia (como imágenes) dentro de las páginas.

  *c. Asignación de Aulas a Alumnos*
- Los profesores pueden asignar aulas a alumnos específicos mediante sus correos electrónicos.
- Gestión avanzada de alumnos:
- **Añadir** o **eliminar alumnos** de un aula.
- Modificar permisos de acceso según sea necesario.

### **6. Funcionalidades para los Alumnos**
- Acceso a aulas asignadas por el profesor.
- Recibir notificaciones en tiempo real sobre cambios realizados en las páginas del aula.

### **7. Notificaciones en Tiempo Real**
El sistema utiliza **Sockets (Socket.IO)** para notificar a los alumnos en tiempo real sobre cualquier cambio en las páginas del aula:
- **Notificaciones emitidas**:
  - Creación de nuevas páginas.
  - Modificación del contenido existente.
  - Eliminación de páginas.
- Los alumnos conectados a un aula reciben automáticamente las actualizaciones relevantes.

### **8. Páginas Públicas**
- Las páginas públicas creadas por el profesor son visibles para cualquier usuario invitado, sin necesidad de registro.
- Útil para compartir recursos educativos generales o contenido introductorio.

---

## 📂 Estructura del Proyecto

```
proyecto_pizarrin/
├── public/                 # Archivos estáticos (CSS, JS, imágenes)
├── routes/                 # Rutas de la aplicación
├── views/                  # Vistas del proyecto (HTML/EJS)
├── app.js                  # Archivo principal del servidor
├── setup.sql               # Archivo SQL para crear la base de datos y tablas
├── .env                    # Variables de entorno (no incluido en el repositorio)
├── package.json            # Dependencias y scripts del proyecto
└── README.md               # Documentación del proyecto
```

---

## 🌟 Notas Importantes

- Asegúrate de que el servicio MySQL esté corriendo antes de iniciar el proyecto.
- No compartas el archivo `.env` ni tus credenciales de base de datos públicamente.
- Si necesitas incluir datos iniciales, puedes modificarlos en el archivo `pizarrin.sql`.

---

## 📞 Soporte

Si tienes algún problema, por favor crea un **issue** en este repositorio o contacta al desarrollador.



