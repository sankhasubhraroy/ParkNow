const express = require("express");
const authController = require("../controllers/auth");
const adminController = require("../controllers/admin");

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/logout', authController.logout);
router.post('/contact', authController.contact);
router.post('/book', authController.book);
router.post('/book/verify', authController.verify);
router.post('/account/profile/edit-details', authController.editDetails);
router.post('/account/settings/change-password', authController.changePassword);


router.post('/admin/register', adminController.adminRegister);
router.post('/admin/login', adminController.adminLogin);
router.get('/admin/logout', adminController.adminLogout);
router.get('/admin/delete-booking-history', adminController.deleteBookingHistory);
router.get('/admin/delete-user', adminController.deleteUser);

module.exports = router;