const express = require("express");
const authController = require("../controllers/auth");
const adminController = require("../controllers/admin");
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
        res.redirect('/account')
    } else {
        res.render('register')
    }
});

router.get('/login', authController.isLoggedIn, (req, res) => {
    if (req.user) {
        res.redirect('/account')
    } else {
        res.render('login')
    }
});

router.get('/account', authController.isLoggedIn, (req, res) => {
    if (req.user) {
        res.render('account', {
            userId: req.user.id,
            userName: req.user.name,
            userEmail: req.user.email
        })
    }
    else {
        res.redirect('/login')
    }
})

router.get('/account/profile', authController.isLoggedIn, (req, res) => {

    let userDob = req.user.date_of_birth;
    const dateData = userDob.toString().split(" ");
    userDob = dateData[2] + "-" + dateData[1] + "-" + dateData[3];

    if (req.user) {
        res.render('profile', {
            userId: req.user.id,
            userName: req.user.name,
            userEmail: req.user.email,
            userPhone: req.user.mobile_no,
            userDob,
            userAddress: req.user.address
        })
    }
    else {
        res.redirect('/login')
    }
})

router.get('/account/bookings', authController.isLoggedIn, authController.bookings, authController.expiredBookings, (req, res) => {

    const bookingDetails = req.bookings;
    bookingDetails.map(booking => {
        const dateData = booking.date.toString().split(" ");
        booking.date = dateData[2] + "-" + dateData[1] + "-" + dateData[3];
    })

    const expiredBookingDetails = req.expiredBookings;
    expiredBookingDetails.map(expiredBooking => {
        const dateData = expiredBooking.date.toString().split(" ");
        expiredBooking.date = dateData[2] + "-" + dateData[1] + "-" + dateData[3];
    })

    if (req.user) {
        res.render('bookings', {
            bookingDetails,
            expiredBookingDetails
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

router.get('/service', (req, res) => {
    res.render('service')
})

router.get('/pricing', (req, res) => {
    res.render('pricing')
})


//Admin Routs
router.get('/admin/register', adminController.isAdminLoggedIn, (req, res) => {
    if (req.admin) {
        res.redirect('/admin/dashboard')
    } else {
        res.render('adminRegister')
    }
})

router.get('/admin/login', adminController.isAdminLoggedIn, (req, res) => {
    if (req.admin) {
        res.redirect('/admin/dashboard')
    } else {
        res.render('adminLogin')
    }
})

router.get('/admin/dashboard', adminController.isAdminLoggedIn, adminController.adminDashboard, (req, res) => {

    const bookingHistory = req.bookings;
    bookingHistory.map(booking => {
        const dateData = booking.date.toString().split(" ");
        booking.date = dateData[2] + " " + dateData[1] + " " + dateData[3];
    })

    if (req.admin) {
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