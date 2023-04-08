const express = require("express");
const authController = require("../controllers/auth");
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

router.get('/register', (req, res) => {
    res.render('register')
});

router.get('/login', (req, res) => {
    res.render('login')
});

router.get('/profile', authController.isLoggedIn, (req, res) => {
    // console.log(req.user.name)
    if (req.user) {
        res.render('profile', {
            userName: req.user.name,
            userEmail: req.user.email
        })
    } else {
        res.render('login')
    }
})

router.get('/book', authController.isLoggedIn, (req, res) => {
    if (req.user) {
        res.render('book')
    } else {
        res.render('login')
    }
})

module.exports = router;