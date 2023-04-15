const express = require("express");
const authController = require("../controllers/auth");

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/logout', authController.logout);
router.post('/book', authController.book);


router.post('/admin/register', authController.adminRegister);
router.post('/admin/login', authController.adminLogin);
router.get('/admin/logout', authController.adminLogout);
router.get('/admin/delete-booking-history', authController.deleteBookingHistory);

module.exports = router;