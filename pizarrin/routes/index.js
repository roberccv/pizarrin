var express = require('express');
var router = express.Router();

var path = require('path');

//INICIALIZACIÓN DEL HTML DE PIZARRÍN [25/11]
router.get('/', function(req, res, next) {
  res.sendFile(path.join(__dirname, '..', 'public', '01-pizarrin.html')); // Sirve el archivo HTML
});

module.exports = router;
