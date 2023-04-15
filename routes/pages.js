const express = require("express");
const authController = require("../controllers/auth");
const e = require("express");
const router = express.Router();

router.get('/', authController.isLoggedIn, (req, res) => {
    if (req.user) {
        res.render('index', {
            visibility: true
        })
    } else {
        res.render('index', {
            visibility: false
        })
    }

});

router.get('/register', authController.isLoggedIn, (req, res) => {
    if (req.user) {
        res.redirect('/profile')
    } else {
        res.render('register')
    }
});

router.get('/login', authController.isLoggedIn, (req, res) => {
    if (req.user) {
        res.redirect('/profile')
    } else {
        res.render('login')
    }
});

router.get('/profile', authController.isLoggedIn, authController.profile, (req, res) => {

    if (req.user) {

        const bookingDetails = req.bookings;
        bookingDetails.map(booking => {
            console.log(booking.date);
            const dateData = booking.date.toString().split(" ");
            booking.date = dateData[2] + " " + dateData[1] + " " + dateData[3];
            console.log(booking.date);
        })

        res.render('profile', {
            userId: req.user.id,
            userName: req.user.name,
            userEmail: req.user.email,
            bookingDetails,
            totalBookings: bookingDetails.length,
            visibility: true
        })
    }
    else {
        res.redirect('/login')
    }
})

router.get('/book', authController.isLoggedIn, (req, res) => {
    if (req.user) {
        res.render('book')
    } else {
        res.redirect('/login')
    }
})

router.get('/contact', (req, res) => {
    res.render('contact')
})

router.get('/about', (req, res) => {
    res.render('about')
})

router.get('/services', (req, res) => {
    res.render('services')
})

router.get('/admin/register', authController.isAdminLoggedIn, (req, res) => {
    if (req.admin) {
        res.redirect('/admin/dashboard')
    } else {
        res.render('adminRegister')
    }
})

router.get('/admin/login', authController.isAdminLoggedIn, (req, res) => {
    if (req.admin) {
        res.redirect('/admin/dashboard')
    } else {
        res.render('adminLogin')
    }
})

router.get('/admin/dashboard', authController.isAdminLoggedIn, authController.adminDashboard, (req, res) => {

    if (req.admin) {

        const bookingHistory = req.bookings;
        bookingHistory.map(booking => {
            const dateData = booking.date.toString().split(" ");
            booking.date = dateData[2] + " " + dateData[1] + " " + dateData[3];
        })

        res.render('adminDashboard', {
            adminId: req.admin.admin_id,
            adminName: req.admin.admin_name,
            adminEmail: req.admin.admin_email,
            bookingHistory,
            totalBookings: bookingHistory.length
        })
    } else {
        res.redirect('/admin/login')
    }
})

module.exports = router;