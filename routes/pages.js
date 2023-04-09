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
        res.render('profile')
    } else {
        res.render('register')
    }
});

router.get('/login', authController.isLoggedIn, (req, res) => {
    if (req.user) {
        res.render('profile')
    } else {
        res.render('login')
    }
});

router.get('/profile', authController.isLoggedIn, authController.profile, (req, res) => {

    if (req.user) {
        res.render('profile', {
            userId: req.user.id,
            userName: req.user.name,
            userEmail: req.user.email,
            bookingDetails: req.bookings,
            visibility: true
        })
    }
    else {
        res.render('login')
    }
})

router.get('/book', authController.isLoggedIn, (req, res) => {
    if (req.user) {
        res.render('book', {
            visibility: true
        })
    } else {
        res.render('login')
    }
})

module.exports = router;