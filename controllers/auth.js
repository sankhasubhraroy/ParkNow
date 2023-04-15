const mysql = require("mysql");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { promisify } = require("util");
const { request } = require("http");

const db = mysql.createConnection({
    host: process.env.HOST,
    user: process.env.DATABASE_USER,
    password: process.env.PASSWORD,
    database: process.env.DATABASE
});


exports.login = async (req, res) => {

    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).render('login', {
            message: "Please Provide an email and password"
        })
    }
    else {
        db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {

            console.log(results[0]);

            if (err) {
                console.log(err);
            }

            else if (!results[0] || !await bcrypt.compare(password, results[0].password)) {
                return res.status(401).render('login', {
                    message: 'Email or Password is incorrect'
                })
            }
            else {
                const id = results[0].id;

                const token = jwt.sign({ id }, process.env.JWT_SECRET, {
                    expiresIn: process.env.JWT_EXPIRES_IN,
                });

                console.log("the token is " + token);

                const cookieOptions = {
                    expiresIn: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000),
                    httpOnly: true
                }
                res.cookie('userSave', token, cookieOptions);
                res.status(200).redirect("/profile");
            }
        })
    }
}


exports.register = (req, res) => {
    console.log(req.body);

    const { name, email, password, passwordConfirm } = req.body;

    if (!name || !email || !password || !passwordConfirm) {
        return res.render("register", {
            message: 'All fields are mandatory'
        });
    }
    else {

        db.query('SELECT email from users WHERE email = ?', [email], async (err, results) => {
            // console.log(results)
            // console.log(results[0])
            if (err) {
                console.log(err);
            }

            else if (Object.keys(results).length > 0) {
                return res.render("register", {
                    message: 'The email is already in use'
                })
            }
            else if (password != passwordConfirm) {
                return res.render("register", {
                    message: 'Password dont match'
                });
            }

            let hashedPassword = await bcrypt.hash(password, 8);
            console.log(hashedPassword);

            db.query('INSERT INTO users SET ?', { name: name, email: email, password: hashedPassword }, (err, results) => {
                if (err) {
                    console.log(err);
                } else {
                    return res.render("register", {
                        message: 'User registered'
                    });
                }
            })
        })
    }

    // res.send("Form submitted");
}


exports.isLoggedIn = async (req, res, next) => {
    if (req.cookies.userSave) {
        try {
            // 1. Verify the token
            const decoded = await promisify(jwt.verify)(req.cookies.userSave,
                process.env.JWT_SECRET
            );
            console.log(decoded);

            // 2. Check if the user still exist
            db.query('SELECT * FROM users WHERE id = ?', [decoded.id], (err, results) => {
                // console.log(results);
                if (!results) {
                    return next();
                }
                req.user = results[0];
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


exports.logout = async (req, res) => {
    res.clearCookie('userSave');
    res.status(200).redirect("/");
}


exports.book = async (req, res) => {
    // console.log(req.body);
    const { vehicleType, vehicleNo, date, time, duration } = req.body;

    if (vehicleType == 'car') {
        var price = 100;
    }
    else if (vehicleType == 'motorcycle') {
        var price = 50;
    }
    else if (vehicleType == 'truck') {
        var price = 200;
    }

    // console.log(price);
    const amount = price * duration;
    // console.log(amount);


    if (req.cookies.userSave) {
        // 1. Verify the token
        const decoded = await promisify(jwt.verify)(req.cookies.userSave,
            process.env.JWT_SECRET
        );
        // console.log(decoded);


        db.query('SELECT * FROM users WHERE id = ?', [decoded.id], (err, result) => {
            // console.log(result);
            // console.log(result[0]);

            const id = result[0].id;
            const name = result[0].name;
            const email = result[0].email;

            if (err) {
                console.log(err);
            }
            else if (!vehicleType || !vehicleNo || !date || !time || !duration) {
                return res.render('book', {
                    message: 'Fill all the details, Please'
                });
            } else {
                db.query('INSERT INTO bookings SET ?', { name: name, email: email, vehicle_type: vehicleType, vehicle_no: vehicleNo, date: date, time: time, duration: duration, id: id }, (err, result) => {

                    if (err) {
                        console.log(err);
                    }
                    else {
                        return res.render('book', {
                            message: 'Booked Successfully',
                            payment: true,
                            amount
                        });
                    }
                });
            }
        });
    }
    else {
        next();
    }
}


exports.profile = async (req, res, next) => {

    if (req.cookies.userSave) {
        // 1. Verify the token
        const decoded = await promisify(jwt.verify)(req.cookies.userSave,
            process.env.JWT_SECRET
        );

        db.query('SELECT * FROM bookings WHERE id = ?', [decoded.id], (err, result) => {

            // console.log(result);
            // let record = result.length;
            req.bookings = result;
            return next();
        })
    }
    else {
        return next();
    }
}


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
        db.query('SELECT * FROM bookings ORDER BY  date ASC', (err, result) => {
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

    console.log(req.query.order_id);
    db.query('DELETE FROM bookings WHERE order_id = ?', [req.query.order_id], (err, result) => {
        if (err) {
            console.log(err);
        }
        else {
            res.redirect('/admin/dashboard');
        }
    })
}