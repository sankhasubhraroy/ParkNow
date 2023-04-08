const express = require("express");
const authController = require("../controllers/auth");

const router = express.Router();

router.post('/register', authController.register)
router.post('/login', authController.login);
router.get('/logout', authController.logout);
router.post('/book', authController.book);

module.exports = router;