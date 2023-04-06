const express = require("express");
const path = require("path")
const mysql = require("mysql");
const dotenv = require("dotenv");
const exp = require('constants');
const cookieParser = require("cookie-parser");

dotenv.config({ path: './.env' });

const app = express();

const db = mysql.createConnection({
    host: process.env.HOST,
    user: process.env.DATABASE_USER,
    password: process.env.PASSWORD,
    database: process.env.DATABASE
});


const publicDirectory = path.join(__dirname, './public');
app.use(express.static(publicDirectory));
// console.log(__dirname);

// ParseURL-Extended bodie (as sent by HTML Forms)
app.use(express.urlencoded({ extended: false }))
app.use(express.json());
app.use(cookieParser());
app.set('view engine', 'hbs');

db.connect((err) => {
    if (err) {
        console.log(err);
    } else {
        console.log("MYSQL Connected...")
    }
});

// Define Routes
app.use('/', require('./routes/pages'));
app.use('/auth', require('./routes/auth'));

app.listen(5000, () => {
    console.log("Server Started at http://localhost:5000")
});
