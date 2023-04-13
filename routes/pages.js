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

    const bookingDetails = req.bookings;
    bookingDetails.map(booking => {
        console.log(booking.date);
        const dateData = booking.date.toString().split(" ");
        booking.date = dateData[2] + " " + dateData[1] + " " + dateData[3];
        console.log(booking.date);
    })

    if (req.user) {
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
        res.render('book', {
            visibility: true
        })
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

module.exports = router;