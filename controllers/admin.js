const mysql = require("mysql");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { promisify } = require("util");
const { request } = require("http");
const { ifError } = require("assert");

const db = mysql.createConnection({
    host: process.env.HOST,
    user: process.env.DATABASE_USER,
    password: process.env.PASSWORD,
    database: process.env.DATABASE
});

exports.adminLogin = async (req, res) => {

    const { admin_email, admin_password } = req.body;

    if (!admin_email || !admin_password) {
        return res.status(400).render('adminLogin', {
            message: "Please Provide an email or password"
        })
    }
    else {
        db.query('SELECT * FROM admin WHERE admin_email = ?', [admin_email], async (err, results) => {

            console.log(results[0]);

            if (err) {
                console.log(err);
            }

            else if (!results[0] || !await bcrypt.compare(admin_password, results[0].admin_password)) {
                return res.status(401).render('adminLogin', {
                    message: 'Email or Password is incorrect'
                })
            }
            else {
                const admin_id = results[0].admin_id;

                const token = jwt.sign({ admin_id }, process.env.JWT_SECRET, {
                    expiresIn: process.env.JWT_EXPIRES_IN,
                });

                console.log("the token is " + token);

                const cookieOptions = {
                    expiresIn: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000),
                    httpOnly: true
                }
                res.cookie('adminSave', token, cookieOptions);
                res.status(200).redirect("/admin/dashboard");
            }
        })
    }
}



exports.adminRegister = (req, res) => {
    console.log(req.body);

    const { admin_name, admin_email, admin_password, passwordConfirm } = req.body;

    if (!admin_name || !admin_email || !admin_password || !passwordConfirm) {
        return res.render("adminRegister", {
            message: 'All fields are mandatory'
        });
    }
    else {

        db.query('SELECT admin_email from admin WHERE admin_email = ?', [admin_email], async (err, results) => {
            console.log(results)
            console.log(results[0])
            if (err) {
                console.log(err);
            }

            else if (Object.keys(results).length > 0) {
                return res.render("adminRegister", {
                    message: 'The email is already in use'
                })
            }
            else if (admin_password != passwordConfirm) {
                return res.render("adminRegister", {
                    message: 'Password don\'t match'
                });
            }

            let hashedPassword = await bcrypt.hash(admin_password, 10);
            console.log(hashedPassword);

            db.query('INSERT INTO admin SET ?', { admin_name: admin_name, admin_email: admin_email, admin_password: hashedPassword }, (err, results) => {
                if (err) {
                    console.log(err);
                } else {
                    return res.render("adminRegister", {
                        message: 'Admin registered'
                    });
                }
            })
        })
    }
}


exports.isAdminLoggedIn = async (req, res, next) => {
    if (req.cookies.adminSave) {
        try {
            // 1. Verify the token
            const decoded = await promisify(jwt.verify)(req.cookies.adminSave,
                process.env.JWT_SECRET
            );
            console.log(decoded);

            // 2. Check if the user still exist
            db.query('SELECT * FROM admin WHERE admin_id = ?', [decoded.admin_id], (err, results) => {
                // console.log(results);
                if (!results) {
                    return next();
                }
                req.admin = results[0];
                return next();
            });
        } catch (err) {
            console.log(err)
            return next();
        }
    } else {
        next();
    }
}


exports.adminLogout = async (req, res) => {
    res.clearCookie('adminSave');
    res.status(200).redirect("/");
}



exports.adminDashboard = async (req, res, next) => {

    db.query('SELECT SUM(amount) AS totalRevenue FROM payments', (err, result) => {
        if (err) {
            console.log(err);
        }
        else {
            const totalRevenue = result[0].totalRevenue;

            db.query('SELECT COUNT(booking_id) AS totalBookings FROM bookings WHERE status = "active"', (err, result) => {
                if (err) {
                    console.log(err);
                }
                else {
                    const totalBookings = result[0].totalBookings;

                    db.query('SELECT COUNT(booking_id) AS totalExpiredBookings FROM bookings WHERE status = "expired"', (err, result) => {
                        if (err) {
                            console.log(err);
                        }
                        else {
                            const totalExpiredBookings = result[0].totalExpiredBookings;

                            db.query('SELECT COUNT(id) AS totalCustomers FROM users', (err, result) => {
                                if (err) {
                                    console.log(err);
                                }
                                else {
                                    const totalCustomers = result[0].totalCustomers;
                                    req.dashboardDetails = {
                                        totalRevenue,
                                        totalBookings,
                                        totalExpiredBookings,
                                        totalCustomers
                                    }
                                    return next();
                                }
                            });
                        }
                    });
                }
            });
        }
    });
}

exports.activeBookings = async (req, res, next) => {

    db.query('SELECT * FROM bookings JOIN users ON bookings.id = users.id WHERE status = "active" ORDER BY date DESC', (err, result) => {
        if (err) {
            console.log(err);
        }
        else {
            req.bookings = result;
            return next();
        }
    })
}

exports.expiredBookings = async (req, res, next) => {

    db.query('SELECT * FROM bookings JOIN users ON bookings.id = users.id WHERE status = "expired" ORDER BY date DESC', (err, result) => {
        if (err) {
            console.log(err);
        }
        else {
            req.expiredBookings = result;
            return next();
        }
    })
}

exports.customers = (req, res, next) => {

    db.query('SELECT * FROM users', (err, result) => {
        if (err) {
            console.log(err);
        }
        else {
            req.customers = result;
            return next();
        }
    })
}

exports.payments = (req, res, next) => {

    db.query('SELECT payments.order_id, payments.payment_id, payments.amount, users.name FROM payments, users WHERE payments.id = users.id', (err, result) => {
        if (err) {
            console.log(err);
        }
        else {
            req.payments = result;

            db.query('SELECT SUM(amount) AS totalAmount, AVG(amount) AS avgAmount, MAX(amount) AS maxAmount FROM payments', (err, result) => {
                if (err) {
                    console.log(err);
                }
                else {
                    req.stats = result[0];
                    return next();
                }
            })
        }
    })
}

exports.deleteBookingHistory = (req, res) => {
    console.log(req.query.booking_id);

    db.query('UPDATE bookings SET status = "expired" WHERE booking_id = ?', [req.query.booking_id], (err, result) => {
        if (err) {
            console.log(err);
        }
        else {
            res.redirect('/admin/dashboard/active-bookings');
        }
    });
}

exports.deleteUser = (req, res) => {
    console.log(req.query.id);

    db.query('DELETE FROM users WHERE id = ?', [req.query.id], (err, result) => {
        if (err) {
            console.log(err);
        }
        else {
            res.redirect('/admin/dashboard/customers');
        }
    });
}