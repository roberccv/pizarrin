const multer = require('multer');
const path = require('path');

// Configuración del almacenamiento para las imágenes
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = 'public/upload_images/'; // Carpeta donde se guardarán las fotos
    console.log(`[INFO] Intentando guardar la imagen en: ${uploadPath}`);
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname);
    console.log(`[INFO] Nombre generado para la imagen: ${filename}`);
    cb(null, filename);
  }
});

// Filtro para aceptar solo archivos de imagen
const fileFilter = (req, file, cb) => {
  console.log("LLEGA AQUI");
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
  if (allowedTypes.includes(file.mimetype)) {
    console.log(`[INFO] Tipo de archivo permitido: ${file.mimetype}`);
    cb(null, true);
  } else {
    console.error(`[ERROR] Tipo de archivo no permitido: ${file.mimetype}`);
    cb(new Error('Solo se permiten archivos de imagen (jpeg, png, gif)'), false);
  }
};

// Crear una instancia de Multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // Límite de 5 MB
});

module.exports = upload;
