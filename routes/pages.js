const express = require("express");
const authController = require("../controllers/auth");
const adminController = require("../controllers/admin");
const router = express.Router();

router.get('/', authController.isLoggedIn, (req, res) => {
    if (req.user) {
        res.render('index', { visibility: true });
    } else {
        res.render('index', { visibility: false });
    }
});

router.get('/register', authController.isLoggedIn, (req, res) => {
    if (req.user) {
        res.redirect('/account');
    } else {
        res.render('register');
    }
});

router.get('/login', authController.isLoggedIn, (req, res) => {
    if (req.user) {
        res.redirect('/account');
    } else {
        res.render('login');
    }
});

router.get('/account', authController.isLoggedIn, (req, res) => {
    if (req.user) {
        res.render('account', {
            userId: req.user.id,
            userName: req.user.name,
            userEmail: req.user.email,
            visibility: true
        });
    }
    else {
        res.redirect('/login');
    }
})

router.get('/account/profile', authController.isLoggedIn, (req, res) => {
    if (req.user) {
        res.render('profile', {
            userId: req.user.id,
            userName: req.user.name,
            userEmail: req.user.email,
            userPhone: req.user.mobile_no,
            userDob: req.user.date_of_birth,
            userAddress: req.user.address,
            visibility: true
        });
    }
    else {
        res.redirect('/login');
    }
})

router.get('/account/settings', authController.isLoggedIn, (req, res) => {
    if (req.user) {
        res.render('settings', {
            visibility: true
        });
    }
    else {
        res.redirect('/login');
    }
})

router.get('/account/bookings', authController.isLoggedIn, authController.bookings, (req, res) => {

    if (req.user) {
        const bookingDetails = req.activeBookings;

        bookingDetails.map(booking => {
            booking.check_in = booking.check_in.toLocaleString();
            booking.check_out = booking.check_out.toLocaleString();
        });

        const expiredBookingDetails = req.expiredBookings;

        expiredBookingDetails.map(expiredBooking => {
            expiredBooking.check_in = expiredBooking.check_in.toLocaleString();
            expiredBooking.check_out = expiredBooking.check_out.toLocaleString();
        });

        res.render('bookings', {
            bookingDetails,
            expiredBookingDetails,
            visibility: true
        });
    }
    else {
        res.redirect('/login');
    }
})

router.get('/account/bookings/booking-invoice', authController.isLoggedIn, authController.generateInvoice, (req, res) => {
    if (req.user) {
        const today = new Date().toLocaleString();
        const invoiceDetails = req.invoiceDetails;

        invoiceDetails.payment_date = invoiceDetails.payment_date.toLocaleString();
        invoiceDetails.check_in = invoiceDetails.check_in.toLocaleString();
        invoiceDetails.check_out = invoiceDetails.check_out.toLocaleString();

        res.render('invoice', {
            today,
            invoiceDetails,
            visibility: true
        })
    }
    else {
        res.redirect('/login')
    }
})

router.get('/book', authController.isLoggedIn, (req, res) => {
    if (req.user) {
        res.render('book', { visibility: true });
    } else {
        res.redirect('/login');
    }
})

router.get('/contact', authController.isLoggedIn, (req, res) => {
    if (req.user) {
        res.render('contact', { visibility: true });
    } else {
        res.render('contact', { visibility: false });
    }
})

router.get('/about', authController.isLoggedIn, (req, res) => {
    if (req.user) {
        res.render('about', { visibility: true });
    } else {
        res.render('about', { visibility: false });
    }
})

router.get('/service', authController.isLoggedIn, (req, res) => {
    if (req.user) {
        res.render('service', { visibility: true });
    } else {
        res.render('service', { visibility: false });
    }
})

router.get('/pricing', authController.isLoggedIn, (req, res) => {
    if (req.user) {
        res.render('pricing', { visibility: true });
    } else {
        res.render('pricing', { visibility: false });
    }
})


//Admin Routs
router.get('/admin/login', adminController.isAdminLoggedIn, (req, res) => {
    if (req.admin) {
        res.redirect('/admin/dashboard')
    } else {
        res.render('adminLogin');
    }
})

router.get('/admin/dashboard', adminController.isAdminLoggedIn, adminController.adminDashboard, (req, res) => {

    if (req.admin) {

        res.render('adminDashboard', {
            revenue: req.dashboardDetails.totalRevenue,
            bookings: req.dashboardDetails.totalBookings,
            expired_bookings: req.dashboardDetails.totalExpiredBookings,
            customers: req.dashboardDetails.totalCustomers
        })
    } else {
        res.redirect('/admin/login');
    }
})

router.get('/admin/dashboard/active-bookings', adminController.isAdminLoggedIn, adminController.activeBookings, (req, res) => {

    if (req.admin) {
        const bookingHistory = req.activeBookings;

        bookingHistory.map(booking => {
            booking.check_in = booking.check_in.toLocaleString();
            booking.check_out = booking.check_out.toLocaleString();
        })

        res.render('activeBookings', { bookingHistory })
    } else {
        res.redirect('/admin/login');
    }
})

router.get('/admin/dashboard/expired-bookings', adminController.isAdminLoggedIn, adminController.expiredBookings, (req, res) => {

    if (req.admin) {
        const expiredBookingHistory = req.expiredBookings;

        expiredBookingHistory.map(booking => {
            booking.check_in = booking.check_in.toLocaleString();
            booking.check_out = booking.check_out.toLocaleString();
        })

        res.render('expiredBookings', { expiredBookingHistory })
    } else {
        res.redirect('/admin/login');
    }
})

router.get('/admin/dashboard/customers', adminController.isAdminLoggedIn, adminController.customers, (req, res) => {

    if (req.admin) {
        const customerDetails = req.customers;
        res.render('customers', { customerDetails });
    } else {
        res.redirect('/admin/login');
    }
})

router.get('/admin/dashboard/payments', adminController.isAdminLoggedIn, adminController.payments, (req, res) => {

    if (req.admin) {
        const revenues = req.payments;
        const stats = req.stats;
        res.render('revenues', { revenues, stats });
    } else {
        res.redirect('/admin/login');
    }
})

module.exports = router;