# Proyecto Pizarrín
Sergio Díaz Paricio, Miguel Gamboa Sánchez y Roberto Cinos Vega

## 🚀 Requisitos

1. **MySQL**: Asegúrate de tener MySQL instalado en tu máquina.
2. **Node.js**: Versión mínima 14.x.
3. **NPM**: Instalado junto con Node.js.

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

1. **Registro de usuarios:**
   - Crea una nueva cuenta ingresando un correo electrónico, un nombre y una contraseña.
   - Las contraseñas se almacenan encriptadas para mayor seguridad.

2. **Inicio de sesión:**
   - Los usuarios pueden autenticarse con sus credenciales y acceder al sistema.

3. **Validación de contraseñas:**
   - Verificación de contraseñas encriptadas con `bcrypt`.

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
