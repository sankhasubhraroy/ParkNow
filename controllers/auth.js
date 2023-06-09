const db = require("../config/database");
const sendMail = require("../helpers/sendMail");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { promisify } = require("util");
const Razorpay = require("razorpay");
const crypto = require("crypto");

const instance = new Razorpay({
    key_id: process.env.KEY_ID,
    key_secret: process.env.KEY_SECRET
});


exports.login = async (req, res) => {

    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).render('login', {
            message: "Please provide an email or password"
        })
    }
    else {
        db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {

            if (err) {
                console.log(err);
            }

            else if (!results[0] || !await bcrypt.compare(password, results[0].password)) {
                return res.status(401).render('login', {
                    message: 'Email or password is incorrect'
                })
            }
            else {
                const id = results[0].id;

                const token = jwt.sign({ id }, process.env.JWT_SECRET, {
                    expiresIn: process.env.JWT_EXPIRES_IN,
                });

                const cookieOptions = {
                    expiresIn: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000),
                    httpOnly: true
                }
                res.cookie('userSave', token, cookieOptions);
                res.status(200).redirect("/account");
            }
        });
    }
}


exports.register = (req, res) => {
    console.log(req.body);

    const { name, email, mobile_no, date_of_birth, address, password, passwordConfirm } = req.body;

    if (!name || !email || !password || !passwordConfirm) {
        return res.render("register", {
            message: 'All * fields are mandatory'
        });
    }
    else if (password != passwordConfirm) {
        return res.render("register", {
            message: 'Password do not match'
        });
    }
    else if (password.length < 8) {
        return res.render("register", {
            message: 'password must be at least 8 characters'
        });
    }
    else {

        db.query('SELECT email from users WHERE email = ?', [email], async (err, result) => {

            if (err) {
                console.log(err);
            }
            else if (result.length > 0) {
                return res.render("register", {
                    message: 'The email is already registered'
                })
            }
            else {
                const hashedPassword = await bcrypt.hash(password, 8);

                db.query('INSERT INTO users SET ?', { name, email, mobile_no, date_of_birth, address, password: hashedPassword }, (err, result) => {

                    if (err) {
                        console.log(err);
                    }
                    else {
                        const id = result.insertId;

                        const token = jwt.sign({ id }, process.env.JWT_SECRET, {
                            expiresIn: process.env.JWT_EXPIRES_IN,
                        });

                        const cookieOptions = {
                            expiresIn: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000),
                            httpOnly: true
                        }
                        res.cookie('userSave', token, cookieOptions);
                        res.status(200).redirect("/account");
                    }
                });
            }
        });
    }
}


exports.isLoggedIn = async (req, res, next) => {
    if (req.cookies.userSave) {
        try {
            // 1. Verify the token
            const decoded = await promisify(jwt.verify)(req.cookies.userSave,
                process.env.JWT_SECRET
            );
            // console.log(decoded);

            // 2. Check if the user still exist
            db.query('SELECT * FROM users WHERE id = ?', [decoded.id], (err, results) => {

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

exports.changePassword = async (req, res) => {
    console.log(req.body);
    const { old_password, new_password, confirm_password } = req.body;

    if (!old_password || !new_password || !confirm_password) {
        return res.render('settings', {
            message: "Fill all the fields"
        });
    }
    else if (new_password != confirm_password) {
        return res.render('settings', {
            message: "The new password don't match"
        });
    }
    else if (new_password.length < 8) {
        return res.render("settings", {
            message: 'password must be at least 8 characters'
        });
    }
    else if (req.cookies.userSave) {
        // 1. Verify the token
        const decoded = await promisify(jwt.verify)(req.cookies.userSave,
            process.env.JWT_SECRET
        );

        db.query('SELECT password FROM users WHERE id = ?', [decoded.id], async (err, result) => {

            if (err) {
                console.log(err);
            }
            else if (!await bcrypt.compare(old_password, result[0].password)) {
                return res.status(401).render('settings', {
                    message: "The old password is incorrect"
                })
            }
            else {
                let hashedPassword = await bcrypt.hash(new_password, 8);

                db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, decoded.id], (err, result) => {
                    if (err) {
                        console.log(err);
                    }
                    else {
                        return res.status(200).redirect('/account');
                    }
                });
            }
        });
    }
}

exports.book = (req, res, next) => {

    const { vehicleType, vehicleNo, date, time, duration } = req.body;

    const check_in = date + " " + time + ":00";

    const cin_parse = Date.parse(check_in);
    const dura_parse = duration * 3600 * 1000;
    const cout_parse = cin_parse + dura_parse;

    const cout = new Date(cout_parse);
    let day = cout.getDate().toString()
    day = day.length > 1 ? day : '0' + day;
    let month = (1 + cout.getMonth()).toString()
    month = month.length > 1 ? month : '0' + month;
    let year = cout.getFullYear().toString()
    let hour = cout.getHours().toString()
    hour = hour.length > 1 ? hour : '0' + hour;
    let minute = cout.getMinutes().toString()
    minute = minute.length > 1 ? minute : '0' + minute;
    let second = cout.getSeconds().toString()
    second = second.length > 1 ? second : '0' + second;

    const check_out = year + "-" + month + "-" + day + " " + hour + ":" + minute + ":" + second;

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

    if (!vehicleType || !vehicleNo || !date || !time || !duration) {
        return res.render('book', {
            message: 'Fill all the details, Please',
            visibility: true
        });
    }
    else {
        db.query('SELECT COUNT(booking_id) AS occupied FROM bookings WHERE check_out > ? AND check_in < ? AND status = "active"', [check_in, check_out], async (err, result) => {

            const occupied = result[0].occupied;
            // console.log(occupied, " slot has been occupied");

            if (err) {
                console.log(err);
            }
            else if (occupied >= 5) {
                return res.render('book', {
                    message: 'No slots are available in this duration'
                });
            }
            else if (req.cookies.userSave) {
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
                    else {
                        const options = {
                            amount: amount * 100,  // amount in the smallest currency unit
                            currency: "INR",
                            receipt: `order_receipt_id_${id}`
                        }

                        instance.orders.create(options, async (err, order) => {
                            if (err) {
                                console.log(err);
                            }
                            else {
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
                                    duration,
                                    check_in,
                                    check_out
                                });
                            }
                        });
                    }
                });
            }
            else {
                next();
            }
        });
    }
}

exports.verify = (req, res, next) => {

    const { id, name, email, phoneNo, vehicleType, vehicleNo, check_in, check_out, amount, razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

    const key_secret = process.env.KEY_SECRET;

    const hmac = crypto.createHmac('sha256', key_secret);

    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);

    const generated_signature = hmac.digest('hex');

    if (razorpay_signature === generated_signature) {

        db.query('INSERT INTO bookings SET ?', { vehicle_type: vehicleType, vehicle_no: vehicleNo, check_in: check_in, check_out: check_out, id: id }, (err, result) => {

            const booking_id = result.insertId;

            if (err) {
                console.log(err);
            }
            else {
                db.query('INSERT INTO payments SET ?', { order_id: razorpay_order_id, payment_id: razorpay_payment_id, amount: amount, booking_id: booking_id, id: id }, (err, result) => {

                    if (err) {
                        console.log(err);
                    }
                    else {
                        const sub = "Booking Confirmed!";
                        const cont = `<p>Hey there, <b>${name}</b>!</p>
                            <p>We are happy to inform you that your booking for <b>${vehicleType}</b> with Vehicle-No <b>${vehicleNo}</b> is confirmed!</p>
                            <p><b>Booking-Id:</b> ${booking_id}</p>
                            <p><b>Check-In:</b> ${check_in}</p>
                            <p><b>Check-Out:</b> ${check_out}</p><br>
                            <p>We can’t wait to see you!</p><br>
                            <p><b>ParkNow</p>
                            <p>sankha.roy.dev@gmail.com</p>
                            <p>+91 86XXXXX147</p>
                            <p>ParkNow Corporation Main Building, India</b></p>`

                        sendMail(email, sub, cont);
                    }
                });
            }
        });
    }
    else {
        return next();
    }
}

exports.bookings = async (req, res, next) => {

    if (req.cookies.userSave) {
        // 1. Verify the token
        const decoded = await promisify(jwt.verify)(req.cookies.userSave,
            process.env.JWT_SECRET
        );

        db.query('SELECT bookings.booking_id, bookings.vehicle_type, bookings.vehicle_no, bookings.check_in, bookings.check_out, payments.amount FROM bookings, payments WHERE bookings.booking_id = payments.booking_id AND bookings.status = "active" AND bookings.id = ? ORDER BY check_in ASC', [decoded.id], (err, result) => {

            if (err) {
                console.log(err);
            }
            else {
                req.activeBookings = result;

                db.query('SELECT bookings.booking_id, bookings.vehicle_type, bookings.vehicle_no, bookings.check_in, bookings.check_out, payments.amount FROM bookings, payments WHERE bookings.booking_id = payments.booking_id AND bookings.status = "expired" AND bookings.id = ? ORDER BY check_in DESC', [decoded.id], (err, result) => {

                    if (err) {
                        console.log(err);
                    }
                    else {
                        req.expiredBookings = result;
                        return next();
                    }
                });
            }
        });
    }
    else {
        return next();
    }
}

exports.generateInvoice = (req, res, next) => {

    db.query('SELECT * FROM bookings INNER JOIN payments ON bookings.booking_id = payments.booking_id INNER JOIN users ON bookings.id = users.id WHERE bookings.booking_id = ?', [req.query.booking_id], (err, result) => {

        if (err) {
            console.log(err);
        }
        else {
            req.invoiceDetails = result[0];
            return next();
        }
    });
}

exports.contact = (req, res) => {
    const { name, email, subject, message } = req.body;

    const smtp_mail = process.env.SMTP_MAIL;
    const content = `<p><b>Name: </b>${name}</p><p>
        <b>Email: </b>${email}</p>
        <p><b>Message: </b>${message}</p>`

    if (!name || !email || !subject || !message) {
        return res.render('contact', {
            message: "Kindly fill all the Details"
        });
    }
    else if (sendMail(smtp_mail, subject, content)) {
        const sub = "Thanks For Contacting Us";
        const cont = "We have Received your mail, We will contact you ASAP!";

        if (sendMail(email, sub, cont)) {
            return res.render('contact', {
                success_message: "Message sent Successfully"
            });
        }
        else {
            return res.render('contact', {
                message: "Unable to send Message"
            });
        }
    }
    else {
        return res.render('contact', {
            message: "Unable to send Message"
        });
    }
}