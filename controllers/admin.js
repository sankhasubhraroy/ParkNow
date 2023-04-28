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

    if (req.cookies.adminSave) {
        db.query('SELECT * FROM bookings JOIN users ON bookings.id = users.id;', (err, result) => {
            if (err) {
                console.log(err);
            }
            else {
                req.bookings = result;
                return next();
            }
        })
    }
    else {
        return next();
    }
}

exports.deleteBookingHistory = (req, res) => {
    console.log(req.query.booking_id);

    db.query('SELECT * FROM bookings WHERE booking_id = ?', [req.query.booking_id], (err, result) => {
        if (err) {
            console.log(err);
        }
        else {
            const { booking_id, vehicle_type, vehicle_no, date, time, duration, amount, payment_id, id } = result[0];

            db.query('INSERT INTO expired_bookings SET ?', { booking_id, vehicle_type, vehicle_no, date, time, duration, amount, payment_id, id }, (err, result) => {
                if (err) {
                    console.log(err);
                }
                else {
                    db.query('DELETE FROM bookings WHERE booking_id = ?', [booking_id], (err, result) => {
                        if (err) {
                            console.log(err);
                        }
                        else {
                            res.redirect('/admin/dashboard');
                        }
                    });
                }
            });
        }
    });
}