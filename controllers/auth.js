const mysql = require("mysql");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { promisify } = require("util");
const { request } = require("http");
const Razorpay = require("razorpay");
const crypto = require("crypto");

const db = mysql.createConnection({
    host: process.env.HOST,
    user: process.env.DATABASE_USER,
    password: process.env.PASSWORD,
    database: process.env.DATABASE
});

const instance = new Razorpay({
    key_id: process.env.KEY_ID,
    key_secret: process.env.KEY_SECRET
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
                res.status(200).redirect("/account");
            }
        })
    }
}


exports.register = (req, res) => {
    console.log(req.body);

    const { name, email, mobile_no, date_of_birth, address, password, passwordConfirm } = req.body;

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
                    message: 'Password don\'t match'
                });
            }

            let hashedPassword = await bcrypt.hash(password, 8);
            console.log(hashedPassword);

            db.query('INSERT INTO users SET ?', { name, email, mobile_no, date_of_birth, address, password: hashedPassword }, (err, results) => {
                if (err) {
                    console.log(err);
                } else {
                    return res.render("register", {
                        message: 'User successfully registered'
                    });
                }
            })
        })
    }
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

exports.editDetails = async (req, res, next) => {
    // console.log(req.body);
    const { name, email, mobile_no, date_of_birth, address } = req.body;

    if (req.cookies.userSave) {
        // 1. Verify the token
        const decoded = await promisify(jwt.verify)(req.cookies.userSave,
            process.env.JWT_SECRET
        );

        db.query('UPDATE users SET name = ?, email = ?, mobile_no = ?, date_of_birth = ?, address = ? WHERE id = ?', [name, email, mobile_no, date_of_birth, address, decoded.id], (err, result) => {

            if (err) {
                console.log(err);
            }
            else {
                res.status(200).redirect("/account");
            }
        });
    }
    else {
        return next();
    }
}

exports.book = async (req, res, next) => {
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

    const amount = price * duration;


    if (req.cookies.userSave) {

        const decoded = await promisify(jwt.verify)(req.cookies.userSave,
            process.env.JWT_SECRET
        );


        db.query('SELECT * FROM users WHERE id = ?', [decoded.id], (err, result) => {

            const id = result[0].id;
            const name = result[0].name;
            const email = result[0].email;
            const phoneNo = result[0].phone_no;

            if (err) {
                console.log(err);
            }
            else if (!vehicleType || !vehicleNo || !date || !time || !duration) {
                return res.render('book', {
                    message: 'Fill all the details, Please'
                });
            }
            else {
                const options = {
                    amount: amount * 100,  // amount in the smallest currency unit
                    currency: "INR",
                    receipt: `order_receipt_id_${id}`
                };

                instance.orders.create(options, async (err, order) => {
                    if (err) {
                        console.log(err);
                    }
                    else {
                        // console.log(order);
                        // console.log(order.id);
                        // console.log(typeof (order.id));
                        res.render('payment', {
                            key_id: process.env.KEY_ID,
                            amount: order.amount,
                            orderId: order.id,
                            display_amount: amount,
                            id,
                            name,
                            email,
                            phoneNo,
                            vehicleNo,
                            vehicleType,
                            date,
                            time,
                            duration
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

exports.verify = (req, res) => {
    // console.log('the verify body:', req.body);

    const { id, vehicleType, vehicleNo, date, time, duration, amount, razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
    const key_secret = process.env.KEY_SECRET;

    const hmac = crypto.createHmac('sha256', key_secret);

    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);

    const generated_signature = hmac.digest('hex');

    if (razorpay_signature === generated_signature) {
        console.log('success');

        db.query('INSERT INTO bookings SET ?', { vehicle_type: vehicleType, vehicle_no: vehicleNo, date: date, time: time, duration: duration, amount: amount, payment_id: razorpay_payment_id, id: id }, (err, result) => {

            if (err) {
                console.log(err);
            }
            else {
                // res.render('confirmation');
            }
        });
    }
    else
        console.log('fail');
}

exports.bookings = async (req, res, next) => {

    if (req.cookies.userSave) {
        // 1. Verify the token
        const decoded = await promisify(jwt.verify)(req.cookies.userSave,
            process.env.JWT_SECRET
        );

        db.query('SELECT * FROM bookings WHERE id = ?', [decoded.id], (err, result) => {

            if (err) {
                console.log(err);
            }
            req.bookings = result;
            return next();
        })
    }
    else {
        return next();
    }
}

exports.expiredBookings = async (req, res, next) => {

    if (req.cookies.userSave) {
        // 1. Verify the token
        const decoded = await promisify(jwt.verify)(req.cookies.userSave,
            process.env.JWT_SECRET
        );

        db.query('SELECT * FROM expired_bookings WHERE id = ?', [decoded.id], (err, result) => {

            if (err) {
                console.log(err);
            }
            req.expiredBookings = result;
            return next();
        })
    }
    else {
        return next();
    }
}