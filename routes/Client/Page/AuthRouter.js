const express = require('express');
const router = express.Router();
const uploadProduct = require('../../../server').uploadProduct; 
const AuthController = require("../../../controllers/Client/Page/AuthController"); 

router.get('/login', AuthController.get);

router.post('/resgister', AuthController.create);

module.exports = router;
