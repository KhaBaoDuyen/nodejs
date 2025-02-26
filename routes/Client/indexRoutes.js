const express = require('express');
const router = express.Router();
const uploadProduct = require('../../server').uploadProduct; 
const indexController = require("../../controllers/Client/indexController");

console.log(uploadProduct); 

router.get('/', indexController.getClient);

router.get("/about", indexController.getAbout);
router.get("/contact", indexController.getContact);
router.get("/cart", indexController.getCart);
router.get("/checkout", indexController.getCheckout);
router.get("/thank", indexController.getThanks);

module.exports = router;
